/**
 * Grid canvas – Builder.io-style structured layout.
 * Blocks stack vertically, snap to 12-column grid, no free-form overlap.
 * Resize: height (s), width (e,w), corners (se,sw) for both.
 */
import { useMemo, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import type { Block } from '@berg/schema';
import type { AuthFormDefaults } from '@berg/core';
import { getLayoutItems, getDefaultHeightForType } from '@/lib/autoPlace';
import { BlockEditor } from '@/components/blocks';
import { BLOCK_DRAG_TYPE } from '@/components/blocks';
import type { Viewport } from '@/components/canvas/ViewportSwitcher';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveLayout = WidthProvider(Responsive);

const COLS = 12;
const ROW_HEIGHT = 40;
const DROP_PLACEHOLDER_ID = '__drop__';

interface GridCanvasProps {
  blocks: Block[];
  selectedBlockId: string | null;
  viewport: Viewport;
  onSelectBlock: (id: string) => void;
  onUpdateBlock: (id: string, attrs: Record<string, unknown>) => void;
  onTransientUpdateBlock?: (id: string, attrs: Record<string, unknown>) => void;
  onHistoryTransactionStart?: () => void;
  onHistoryTransactionEnd?: () => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  onLayoutChange: (layouts: { lg: Array<{ i: string; x: number; y: number; w: number; h: number }> }) => void;
  onLayoutCommit?: (layouts: { lg: Array<{ i: string; x: number; y: number; w: number; h: number }> }) => void;
  /** Request a canvas context menu (right click) for a given block id at screen coordinates. */
  onRequestContextMenu?: (id: string, clientX: number, clientY: number) => void;
  /** Called when a block is dropped from sidebar onto the canvas. Receives block type and the dropped layout position. */
  onDropBlock?: (type: import('@berg/schema').BlockType, layout: { x: number; y: number; w: number; h: number }) => void;
  /** Insert a block at the given index (above existing block at that index). */
  onInsertBlock?: (type: import('@berg/schema').BlockType, index: number) => void;
  /** Insert a layer child into a given parent block at % position. */
  onInsertChildBlock?: (parentId: string, type: import('@berg/schema').BlockType, xPct: number, yPct: number) => void;
  /** When true, block toolbar is shown in the right sidebar instead of inline. */
  toolbarInSidebar?: boolean;
  /** Canvas width (matches VIEWPORT_WIDTHS: desktop 1460, tablet 768, mobile 390). */
  canvasWidth?: number;
  apiBaseUrl?: string;
  useDemoData?: boolean;
  tenantId?: string;
  storeId?: string;
  authApiBaseUrl?: string;
  authFormDefaults?: AuthFormDefaults;
}

export function GridCanvas({
  blocks,
  selectedBlockId,
  viewport,
  onSelectBlock,
  onUpdateBlock,
  onTransientUpdateBlock,
  onHistoryTransactionStart,
  onHistoryTransactionEnd,
  onDeleteBlock,
  onMoveBlock,
  onLayoutChange,
  onLayoutCommit,
  onRequestContextMenu,
  onDropBlock,
  onInsertBlock,
  onInsertChildBlock,
  toolbarInSidebar = false,
  canvasWidth = 960,
  apiBaseUrl,
  useDemoData,
  tenantId,
  storeId,
  authApiBaseUrl,
  authFormDefaults,
}: GridCanvasProps) {
  const layout = useMemo(() => getLayoutItems(blocks, viewport), [blocks, viewport]);

  const layouts = useMemo(
    () => ({
      lg: layout,
    }),
    [layout]
  );

  const handleLayoutChange = (_layout: unknown, newLayouts: { lg?: typeof layout }) => {
    const lg = newLayouts.lg;
    if (lg && Array.isArray(lg)) {
      onLayoutChange({ lg });
    }
  };

  const handleLayoutCommit = (nextLayout: unknown) => {
    if (!onLayoutCommit || !Array.isArray(nextLayout)) return;
    onLayoutCommit({
      lg: nextLayout as Array<{ i: string; x: number; y: number; w: number; h: number }>,
    });
  };

  const droppingItem = useMemo(
    () => ({
      i: DROP_PLACEHOLDER_ID,
      x: 0,
      y: 0,
      w: 12,
      h: 4,
      minW: 1,
      minH: 1,
    }),
    []
  );

  const handleDrop = useCallback(
    (_layout: unknown, item: { i: string; x: number; y: number; w: number; h: number } | undefined, e: Event) => {
      if (!item || item.i !== DROP_PLACEHOLDER_ID || !onDropBlock) return;
      const dt = (e as DragEvent).dataTransfer;
      const type = (dt?.getData(BLOCK_DRAG_TYPE) || 'core/paragraph') as import('@berg/schema').BlockType;
      onDropBlock(type, { x: item.x, y: item.y, w: item.w, h: item.h });
    },
    [onDropBlock]
  );

  const handleDropDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer?.types.includes(BLOCK_DRAG_TYPE)) return undefined;
    const t = e.target;
    if (t instanceof Element && t.closest('.block-layer-overlay')) {
      return false;
    }
    const type = e.dataTransfer.getData(BLOCK_DRAG_TYPE) || 'core/paragraph';
    const h = getDefaultHeightForType(type);
    return { w: 12, h };
  }, []);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="grid-canvas-wrap" style={{ maxWidth: canvasWidth, margin: '0 auto' }}>
      <ResponsiveLayout
        className="layout grid-canvas"
        layouts={layouts}
        breakpoints={{ lg: canvasWidth }}
        cols={{ lg: COLS }}
        rowHeight={ROW_HEIGHT}
        margin={[0, 0]}
        containerPadding={[0, 0]}
        isDraggable
        isResizable
        resizeHandles={['s', 'n', 'e', 'w', 'se', 'sw', 'ne', 'nw']}
        draggableHandle=".block-drag-handle, .block-toolbar-minimal-main"
        preventCollision={false}
        compactType="vertical"
        onLayoutChange={handleLayoutChange}
        onDragStop={handleLayoutCommit}
        onResizeStop={handleLayoutCommit}
        isDroppable={!!onDropBlock}
        droppingItem={droppingItem}
        onDrop={handleDrop}
        onDropDragOver={handleDropDragOver}
        style={{
          minHeight: 200,
          overflow: 'visible',
        }}
      >
        {blocks.map((block, index) => (
          <div key={block.id} className="grid-block-cell">
            <BlockEditor
              block={block}
              isSelected={selectedBlockId === block.id}
              viewport={viewport}
              onSelect={() => onSelectBlock(block.id)}
              onSelectNestedBlock={onSelectBlock}
              isNestedSelected={(id) => selectedBlockId === id}
              onUpdate={(attrs) => onUpdateBlock(block.id, attrs)}
              onTransientUpdate={(attrs) => onTransientUpdateBlock?.(block.id, attrs)}
              onHistoryTransactionStart={onHistoryTransactionStart}
              onHistoryTransactionEnd={onHistoryTransactionEnd}
              onDelete={() => onDeleteBlock(block.id)}
              onRequestContextMenu={onRequestContextMenu}
              onMoveUp={index > 0 ? () => onMoveBlock(block.id, 'up') : undefined}
              onMoveDown={index < blocks.length - 1 ? () => onMoveBlock(block.id, 'down') : undefined}
              onInsertAbove={onInsertBlock ? () => onInsertBlock('core/paragraph', index) : undefined}
              onInsertBelow={onInsertBlock ? () => onInsertBlock('core/paragraph', index + 1) : undefined}
              onInsertChild={onInsertChildBlock}
              useGridDrag
              toolbarInSidebar={toolbarInSidebar && selectedBlockId === block.id}
              useStorefrontPreview
              apiBaseUrl={apiBaseUrl}
              useDemoData={useDemoData}
              tenantId={tenantId}
              storeId={storeId}
              authApiBaseUrl={authApiBaseUrl}
              authFormDefaults={authFormDefaults}
              gridColumnSpan={((block.attributes?.layoutByViewport as Record<string, unknown> | undefined)?.[viewport] as { w?: number } | undefined)?.w ?? (block.attributes?.gridColumnSpan as number) ?? 12}
              gridColumnStart={((block.attributes?.layoutByViewport as Record<string, unknown> | undefined)?.[viewport] as { x?: number } | undefined)?.x != null ? ((((block.attributes?.layoutByViewport as Record<string, unknown>)[viewport] as { x: number }).x) + 1) : ((block.attributes?.gridColumnStart as number) ?? 1)}
              onGridChange={(newSpan, newStart) =>
                onUpdateBlock(block.id, {
                  layoutByViewport: {
                    ...((block.attributes?.layoutByViewport as object) || {}),
                    [viewport]: {
                      ...((((block.attributes?.layoutByViewport as Record<string, unknown> | undefined) ?? {})[viewport] as object) || {}),
                      x: newStart - 1,
                      y: (((block.attributes?.layoutByViewport as Record<string, unknown> | undefined)?.[viewport] as { y?: number } | undefined)?.y ?? 0),
                      w: newSpan,
                      h: (((block.attributes?.layoutByViewport as Record<string, unknown> | undefined)?.[viewport] as { h?: number } | undefined)?.h ?? 2),
                    },
                  },
                  gridColumnSpan: newSpan,
                  gridColumnStart: newStart,
                })
              }
            />
          </div>
        ))}
      </ResponsiveLayout>
    </div>
  );
}
