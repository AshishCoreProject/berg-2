import type { StoredPage } from '@berg/schema';

/** Eye icon – visible in header nav */
function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Eye-off icon – hidden from header nav */
function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

interface Props {
  pages: StoredPage[];
  currentPageId: string | null;
  homeSlug: string | null;
  hiddenFromHeader?: string[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onSetHome: (slug: string) => void;
  onToggleShowInHeader?: (pageId: string, show: boolean) => void;
  /** When false, the page cannot be removed (e.g. fixed /login and /register). */
  canDeletePage?: (page: StoredPage) => boolean;
}

export function PageList({
  pages,
  currentPageId,
  homeSlug,
  hiddenFromHeader = [],
  onSelect,
  onAdd,
  onDelete,
  onSetHome,
  onToggleShowInHeader,
  canDeletePage,
}: Props) {
  return (
    <section className="page-list">
      <div className="page-list-header">
        <h3 className="sidebar-title">Pages</h3>
        <button type="button" className="btn btn-add-page" onClick={onAdd}>
          + Add page
        </button>
      </div>
      <ul className="page-list-ul">
        {pages.map((p) => (
          <li key={p.id} className="page-list-item">
            <div className="page-list-main">
              <div
                role="button"
                tabIndex={0}
                className={`page-list-btn ${p.id === currentPageId ? 'active' : ''}`}
                onClick={() => onSelect(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(p.id);
                  }
                }}
              >
                <span className="page-list-title">
                  {p.document.meta?.title || 'Untitled'}
                </span>
                <span className="page-list-slug">/{p.slug}</span>
                {p.slug === homeSlug && <span className="page-list-home-badge">Home</span>}
                {(p.slug === 'login' || p.slug === 'register') && <span className="page-list-home-badge">Auth</span>}
                {p.published === false && <span className="page-list-draft-badge">Draft</span>}
              </div>
              {(canDeletePage == null || canDeletePage(p)) && (
              <button
                type="button"
                className="page-list-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(p.id);
                }}
                aria-label="Delete page"
                title="Delete page"
              >
                ×
              </button>
              )}
            </div>
            {p.slug !== homeSlug && (
              <div className="page-list-actions-row">
                <button
                  type="button"
                  className="page-list-set-home"
                  onClick={(e) => { e.stopPropagation(); onSetHome(p.slug); }}
                  title="Set as home page"
                >
                  Set as home
                </button>
                {onToggleShowInHeader && (
                  <button
                    type="button"
                    className={`page-list-show-in-nav ${hiddenFromHeader.includes(p.id) ? 'is-hidden' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleShowInHeader(p.id, hiddenFromHeader.includes(p.id));
                    }}
                    title={hiddenFromHeader.includes(p.id) ? 'Show in header nav' : 'Hide from header nav'}
                    aria-label={hiddenFromHeader.includes(p.id) ? 'Show in header' : 'Hide from header'}
                  >
                    <span className="page-list-nav-icon">
                      {hiddenFromHeader.includes(p.id) ? <IconEyeOff /> : <IconEye />}
                    </span>
                    <span className="page-list-nav-label">
                      {hiddenFromHeader.includes(p.id) ? 'Hidden' : 'In nav'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {pages.length === 0 && (
        <p className="page-list-empty">No pages. Click &quot;Add page&quot; to create one.</p>
      )}
    </section>
  );
}
