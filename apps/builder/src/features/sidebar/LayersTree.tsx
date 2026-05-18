import { useMemo, useState, type ReactNode } from 'react';
import { type Block, isInnerBlocksBlock } from '@berg/schema';

interface LayersTreeProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
}

interface LayerNode {
  id: string;
  label: string;
  children: LayerNode[];
}

function toBlockLabel(type: string): string {
  return type.replace('core/', '').replace('store/', '').replace(/-/g, ' ');
}

function buildNode(block: Block): LayerNode {
  const innerBlocks = isInnerBlocksBlock(block) && Array.isArray(block.innerBlocks) ? block.innerBlocks : [];
  const layerChildren = Array.isArray((block as { children?: Block[] }).children)
    ? ((block as { children?: Block[] }).children ?? [])
    : [];

  return {
    id: block.id,
    label: toBlockLabel(block.type),
    children: [...innerBlocks.map(buildNode), ...layerChildren.map(buildNode)],
  };
}

function collectAncestorIds(nodes: LayerNode[], targetId: string): string[] {
  const walk = (node: LayerNode, trail: string[]): string[] | null => {
    if (node.id === targetId) return trail;
    for (const child of node.children) {
      const found = walk(child, [...trail, node.id]);
      if (found) return found;
    }
    return null;
  };

  for (const root of nodes) {
    const found = walk(root, []);
    if (found) return found;
  }

  return [];
}

function ChevronRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronDownIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function LayersTree({ blocks, selectedBlockId, onSelect, onDelete }: LayersTreeProps) {
  const nodes = useMemo(() => blocks.map(buildNode), [blocks]);

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const autoExpandedAncestors = useMemo(() => {
    if (!selectedBlockId) return [];
    return collectAncestorIds(nodes, selectedBlockId);
  }, [nodes, selectedBlockId]);

  const isExpanded = (id: string): boolean => expandedIds[id] ?? autoExpandedAncestors.includes(id);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !isExpanded(id) }));
  };

  const renderNode = (node: LayerNode, depth: number): ReactNode => {
    const hasChildren = node.children.length > 0;
    const expanded = isExpanded(node.id);
    const selected = selectedBlockId === node.id;
    return (
      <li key={node.id} className="layers-tree-item">
        <div
          className={`layers-tree-row ${selected ? 'active' : ''}`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              className="layers-tree-toggle"
              onClick={() => toggleExpanded(node.id)}
              aria-label={expanded ? 'Collapse layer' : 'Expand layer'}
              aria-expanded={expanded}
            >
              {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </button>
          ) : (
            <span className="layers-tree-toggle-placeholder" aria-hidden />
          )}
          <button
            type="button"
            className="layers-tree-select"
            onClick={() => onSelect(node.id)}
            onKeyDown={(e) => {
              if (!onDelete) return;
              if (e.key !== 'Delete' && e.key !== 'Backspace') return;
              e.preventDefault();
              e.stopPropagation();
              onDelete(node.id);
            }}
            title={node.label}
          >
            {node.label}
          </button>
        </div>
        {hasChildren && expanded && (
          <ul className="layers-tree-list">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  if (nodes.length === 0) {
    return <p className="sidebar-empty-hint">No layers yet. Drop blocks on the canvas to populate this tree.</p>;
  }

  return <ul className="layers-tree-list">{nodes.map((node) => renderNode(node, 0))}</ul>;
}
