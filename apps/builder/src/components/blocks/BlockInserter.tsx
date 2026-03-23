import { useState } from 'react';
import type { BlockDefinition } from '@berg/schema';

interface Props {
  blocks: BlockDefinition[];
  onInsert: (type: BlockDefinition['type'], index?: number) => void;
}

export const BLOCK_DRAG_TYPE = 'application/x-berg-block-type';

function DraggableBlockCard({
  block,
  onInsert,
}: {
  block: BlockDefinition;
  onInsert: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="inserter-block-card inserter-block-card-draggable"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(BLOCK_DRAG_TYPE, block.type);
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => onInsert()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onInsert();
        }
      }}
      aria-label={`Add ${block.label} block. Drag to canvas or click to add.`}
    >
      <BlockIcon type={block.type} />
      <span className="inserter-block-label">{block.label}</span>
    </div>
  );
}

const CATEGORIES = [
  { id: 'text' as const, label: 'Text', icon: 'T' },
  { id: 'media' as const, label: 'Media', icon: 'M' },
  { id: 'design' as const, label: 'Design', icon: 'D' },
  { id: 'layout' as const, label: 'Layout', icon: 'L' },
  { id: 'form' as const, label: 'Form', icon: '📋' },
  { id: 'store' as const, label: 'Store', icon: 'S' },
] as const;

/** Simple icon per block type for Builder.io-style visual identification */
function BlockIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    'core/paragraph': '¶',
    'core/heading': 'H',
    'core/list': '≡',
    'core/quote': '„',
    'core/image': '🖼',
    'core/button': '▣',
    'core/hero': '◈',
    'core/spacer': '⇕',
    'core/divider': '—',
    'core/custom': '</>',
    'core/columns': '⊞',
    'core/column': '▢',
    'store/product-grid': '⊟',
    'store/collection-list': '📂',
    'store/newsletter': '✉',
    'store/promo-banner': '▤',
    'store/testimonials': '★',
    'store/trust-badges': '✓',
    'core/form': '📋',
    'core/form-input': '⎆',
    'core/form-select': '▾',
    'core/form-textarea': '¶',
  };
  return <span className="block-inserter-icon" aria-hidden>{icons[type] ?? '•'}</span>;
}

export function BlockInserter({ blocks, onInsert }: Props) {
  const [search, setSearch] = useState('');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIES.map((c) => c.id)));

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const searchLower = search.trim().toLowerCase();
  const filteredBlocks = searchLower
    ? blocks.filter((b) => b.label.toLowerCase().includes(searchLower) || b.category.includes(searchLower))
    : null;

  return (
    <section className="block-inserter block-inserter-builderio">
      <div className="block-inserter-search">
        <input
          type="search"
          placeholder="Search blocks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block-inserter-search-input"
          aria-label="Search blocks"
        />
      </div>
      <div className="block-inserter-hint-slim">
        Drag or click to add blocks to the page
      </div>
      <div className="inserter-grid">
        {filteredBlocks ? (
          <div className="inserter-category inserter-category-search-results">
            <span className="inserter-cat-label">
              {filteredBlocks.length} result{filteredBlocks.length !== 1 ? 's' : ''}
            </span>
            <div className="inserter-blocks-grid">
              {filteredBlocks.map((b) => (
                <DraggableBlockCard key={b.type} block={b} onInsert={() => onInsert(b.type)} />
              ))}
            </div>
          </div>
        ) : (
          CATEGORIES.map((cat) => {
            const catBlocks = blocks.filter((b) => b.category === cat.id);
            if (catBlocks.length === 0) return null;
            const isExpanded = expandedCats.has(cat.id);
            return (
              <div key={cat.id} className="inserter-category inserter-category-collapsible">
                <button
                  type="button"
                  className="inserter-cat-header"
                  onClick={() => toggleCategory(cat.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="inserter-cat-icon">{cat.icon}</span>
                  <span className="inserter-cat-label">{cat.label}</span>
                  <svg
                    className={`inserter-cat-chevron ${isExpanded ? 'expanded' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    {/* Right-pointing ▶ when collapsed; rotates to ▼ when expanded */}
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="inserter-blocks-grid">
                    {catBlocks.map((b) => (
                      <DraggableBlockCard key={b.type} block={b} onInsert={() => onInsert(b.type)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
