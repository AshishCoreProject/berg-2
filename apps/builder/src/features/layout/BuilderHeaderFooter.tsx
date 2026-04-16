/**
 * Header and footer preview in the builder – visible while editing, click to edit styles.
 */
import { useState, useRef, useEffect } from 'react';
import type { FooterLinkItem, FooterLinksConfig, StoredPage } from '@berg/schema';
import { createFooterLinkId } from '@berg/schema';
import { SharedFooter, SharedHeader, AccountHeaderIconButton, CartHeaderIconButton, buildDefaultFooterLinks, type HeaderFooterStyle } from '@berg/layout';
import { StyleEditor } from '@/components/controls';

interface BuilderHeaderFooterProps {
  siteTitle: string;
  pages: StoredPage[];
  homeSlug: string | undefined;
  headerStyle: HeaderFooterStyle;
  footerStyle: HeaderFooterStyle;
  onHeaderStyleChange: (v: HeaderFooterStyle) => void;
  onFooterStyleChange: (v: HeaderFooterStyle) => void;
}

export function BuilderHeaderFooter({
  siteTitle,
  pages,
  homeSlug,
  headerStyle,
  footerStyle,
  onHeaderStyleChange,
  onFooterStyleChange,
}: BuilderHeaderFooterProps) {
  const [editingHeader, setEditingHeader] = useState(false);
  const [editingFooter, setEditingFooter] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Capture phase: canvas blocks call stopPropagation on click, so bubble listeners on document never run.
    const close = (e: MouseEvent) => {
      if (editingHeader && headerRef.current && !headerRef.current.contains(e.target as Node)) setEditingHeader(false);
      if (editingFooter && footerRef.current && !footerRef.current.contains(e.target as Node)) setEditingFooter(false);
    };
    document.addEventListener('click', close, true);
    return () => document.removeEventListener('click', close, true);
  }, [editingHeader, editingFooter]);

  const headerCss: React.CSSProperties = {
    ...(headerStyle.backgroundColor && { backgroundColor: headerStyle.backgroundColor }),
    ...(headerStyle.color && { color: headerStyle.color }),
    ...(headerStyle.fontFamily && { fontFamily: headerStyle.fontFamily }),
  };
  const headerLinkCss: React.CSSProperties = headerStyle.linkColor ? { color: headerStyle.linkColor } : {};
  const footerCss: React.CSSProperties = {
    ...(footerStyle.backgroundColor && { backgroundColor: footerStyle.backgroundColor }),
    ...(footerStyle.color && { color: footerStyle.color }),
    ...(footerStyle.fontFamily && { fontFamily: footerStyle.fontFamily }),
  };
  const footerLinkCss: React.CSSProperties = footerStyle.linkColor ? { color: footerStyle.linkColor } : {};

  const siteName = siteTitle?.trim() || 'Site';
  const currentYear = new Date().getFullYear();

  return (
    <div className="builder-header-footer">
      <div className="builder-preview-header-wrap" ref={headerRef}>
        <header className="builder-preview-header" style={Object.keys(headerCss).length ? headerCss : undefined}>
          <span className="builder-preview-header-logo" style={headerLinkCss.color ? headerLinkCss : undefined}>{siteName}</span>
          <nav className="builder-preview-header-nav">
            <span className="builder-preview-header-link" style={headerLinkCss.color ? headerLinkCss : undefined}>Home</span>
            {pages.filter((p) => p.slug !== homeSlug).map((p) => (
              <span key={p.id} className="builder-preview-header-link" style={headerLinkCss.color ? headerLinkCss : undefined}>{p.document.meta?.title || p.slug}</span>
            ))}
          </nav>
          <button type="button" className="builder-preview-edit-btn" onClick={(e) => { e.stopPropagation(); setEditingHeader((v) => !v); setEditingFooter(false); }} aria-label="Edit header">Edit header</button>
        </header>
        {editingHeader && (
          <div className="builder-preview-popover" onClick={(e) => e.stopPropagation()}>
            <StyleEditor title="Header" values={headerStyle} onChange={onHeaderStyleChange} variant="header" />
          </div>
        )}
      </div>

      <div className="builder-preview-footer-wrap" ref={footerRef}>
        <footer className="builder-preview-footer" style={Object.keys(footerCss).length ? footerCss : undefined}>
          <span className="builder-preview-footer-logo" style={footerCss.color ? { color: footerCss.color } : undefined}>{siteName}</span>
          <nav className="builder-preview-footer-nav">
            <span className="builder-preview-footer-link" style={footerLinkCss.color ? footerLinkCss : undefined}>Home</span>
            {pages.filter((p) => p.slug !== homeSlug).map((p) => (
              <span key={p.id} className="builder-preview-footer-link" style={footerLinkCss.color ? footerLinkCss : undefined}>{p.document.meta?.title || p.slug}</span>
            ))}
          </nav>
          <span className="builder-preview-footer-copy">© {currentYear} {siteName}</span>
          <button type="button" className="builder-preview-edit-btn" onClick={(e) => { e.stopPropagation(); setEditingFooter((v) => !v); setEditingHeader(false); }} aria-label="Edit footer">Edit footer</button>
        </footer>
        {editingFooter && (
          <div className="builder-preview-popover" onClick={(e) => e.stopPropagation()}>
            <StyleEditor title="Footer" values={footerStyle} onChange={onFooterStyleChange} variant="footer" />
          </div>
        )}
      </div>
    </div>
  );
}

interface BuilderHeaderOnlyProps {
  siteTitle: string;
  pages: StoredPage[];
  homeSlug: string | undefined;
  hiddenFromHeader?: string[];
  headerStyle: HeaderFooterStyle;
  onHeaderStyleChange: (v: HeaderFooterStyle) => void;
  onToggleShowInHeader?: (pageId: string, show: boolean) => void;
  viewport?: 'desktop' | 'tablet' | 'mobile';
}

export function BuilderHeaderPreview({
  siteTitle,
  pages,
  homeSlug,
  hiddenFromHeader,
  headerStyle,
  onHeaderStyleChange,
  onToggleShowInHeader,
  viewport = 'desktop',
}: BuilderHeaderOnlyProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (editing && ref.current && !ref.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener('click', close, true);
    return () => document.removeEventListener('click', close, true);
  }, [editing]);
  const navPages = pages.filter((p) => p.slug !== homeSlug);
  return (
    <div className="builder-preview-header-wrap" ref={ref}>
      <SharedHeader
        siteTitle={siteTitle?.trim() || 'Site'}
        pages={pages}
        currentSlug={null}
        homeSlug={homeSlug ?? ''}
        onNavigate={() => {}}
        headerStyle={headerStyle}
        hiddenFromHeader={hiddenFromHeader}
        viewportMode={viewport === 'desktop' ? 'desktop' : 'mobile'}
        classNames={{
          root: `site-header builder-preview-header ${viewport !== 'desktop' ? 'builder-preview-header--collapsed' : ''}`,
          row: 'builder-preview-header-row',
          inner: 'site-header-inner',
          logo: 'site-logo builder-preview-header-logo',
          nav: 'site-nav builder-preview-header-nav',
          navLink: 'site-nav-link builder-preview-header-link',
          navToggle: 'site-nav-toggle builder-preview-nav-toggle',
          navToggleIcon: 'site-nav-toggle-icon builder-preview-nav-toggle-icon',
          navBackdrop: 'builder-preview-nav-backdrop',
          navDrawer: 'builder-preview-nav-drawer',
          navDrawerHeader: 'builder-preview-nav-drawer-header',
          navDrawerTitle: 'builder-preview-nav-drawer-title',
          navClose: 'builder-preview-nav-close',
          navDrawerLinks: 'builder-preview-nav-links',
          navDrawerLink: 'site-nav-drawer-link builder-preview-nav-link',
          navLinkActive: 'active',
          navDrawerLinkActive: 'active',
        }}
        rightSlot={(
          <div
            className="builder-header-right-slot"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
          >
            <AccountHeaderIconButton headerStyle={headerStyle} preview />
            <CartHeaderIconButton headerStyle={headerStyle} preview />
            <button type="button" className="builder-preview-edit-btn" onClick={(e) => { e.stopPropagation(); setEditing((v) => !v); }} aria-label="Edit header">
              Edit header
            </button>
          </div>
        )}
      />
      {editing && (
        <div className="builder-preview-popover" onClick={(e) => e.stopPropagation()}>
          <StyleEditor title="Header" values={headerStyle} onChange={onHeaderStyleChange} variant="header" />
          {onToggleShowInHeader && navPages.length > 0 && (
            <div className="header-nav-pages">
              <span className="header-nav-pages-label">Pages in navigation</span>
              {navPages.map((p) => {
                const show = !(hiddenFromHeader ?? []).includes(p.id);
                return (
                  <label key={p.id} className="header-nav-pages-item">
                    <input
                      type="checkbox"
                      checked={show}
                      onChange={(e) => onToggleShowInHeader(p.id, e.target.checked)}
                    />
                    <span>{p.document.meta?.title || p.slug}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface BuilderFooterOnlyProps {
  siteTitle: string;
  pages: StoredPage[];
  homeSlug: string | undefined;
  hiddenFromHeader?: string[];
  footerStyle: HeaderFooterStyle;
  onFooterStyleChange: (v: HeaderFooterStyle) => void;
  footerLinks?: FooterLinksConfig;
  onFooterLinksChange: (v: FooterLinksConfig | undefined) => void;
  viewport?: 'desktop' | 'tablet' | 'mobile';
}

export function BuilderFooterPreview({
  siteTitle,
  pages,
  homeSlug,
  hiddenFromHeader,
  footerStyle,
  onFooterStyleChange,
  footerLinks,
  onFooterLinksChange,
  viewport = 'desktop',
}: BuilderFooterOnlyProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (editing && ref.current && !ref.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener('click', close, true);
    return () => document.removeEventListener('click', close, true);
  }, [editing]);
  const cfg = footerLinks ?? buildDefaultFooterLinks(pages, homeSlug ?? '');
  const isMobilePreview = viewport === 'mobile';

  return (
    <div className="builder-preview-footer-wrap" ref={ref}>
      <div className={`builder-preview-footer ${isMobilePreview ? 'builder-preview-footer--mobile' : ''}`}>
        <SharedFooter
          siteTitle={siteTitle?.trim() || 'Site'}
          pages={pages}
          homeSlug={homeSlug ?? ''}
          onNavigate={() => {}}
          footerStyle={footerStyle}
          hiddenFromHeader={hiddenFromHeader}
          footerLinks={cfg}
          viewportMode={isMobilePreview ? 'mobile' : 'desktop'}
          className="site-footer"
        />
        <button
          type="button"
          className="builder-preview-edit-btn"
          onClick={(e) => { e.stopPropagation(); setEditing((v) => !v); }}
          aria-label="Edit footer"
        >
          Edit footer
        </button>
      </div>
      {editing && (
        <div className="builder-preview-popover" onClick={(e) => e.stopPropagation()}>
          <StyleEditor title="Footer" values={footerStyle} onChange={onFooterStyleChange} variant="footer" />
          <div style={{ marginTop: '1rem' }}>
            <div className="sidebar-title" style={{ marginBottom: '0.5rem' }}>Footer Links</div>
            <FooterLinksEditor cfg={cfg} onChange={(next) => onFooterLinksChange(next)} />
          </div>
        </div>
      )}
    </div>
  );
}

function FooterLinksEditor({ cfg, onChange }: { cfg: FooterLinksConfig; onChange: (v: FooterLinksConfig) => void }) {
  const updateCfg = (next: FooterLinksConfig) => onChange(next);

  const updateBrand = (patch: Partial<NonNullable<FooterLinksConfig['brand']>>) => {
    updateCfg({
      ...cfg,
      brand: { ...(cfg.brand ?? {}), ...patch },
    });
  };

  const updateColumnTitle = (colIndex: number, title: string) => {
    updateCfg({
      ...cfg,
      columns: cfg.columns.map((c, i) => (i === colIndex ? { ...c, title } : c)),
    });
  };

  const updateColumnLink = (colIndex: number, linkIndex: number, patch: Partial<FooterLinkItem>) => {
    updateCfg({
      ...cfg,
      columns: cfg.columns.map((c, i) => {
        if (i !== colIndex) return c;
        const nextLinks = c.links.map((l, li) => (li === linkIndex ? { ...l, ...patch } : l));
        return { ...c, links: nextLinks };
      }),
    });
  };

  const addColumnLink = (colIndex: number) => {
    updateCfg({
      ...cfg,
      columns: cfg.columns.map((c, i) => {
        if (i !== colIndex) return c;
        return {
          ...c,
          links: [...c.links, { id: createFooterLinkId(), label: 'Link', url: '#', openInNewTab: false }],
        };
      }),
    });
  };

  const removeColumnLink = (colIndex: number, linkIndex: number) => {
    updateCfg({
      ...cfg,
      columns: cfg.columns.map((c, i) => {
        if (i !== colIndex) return c;
        return { ...c, links: c.links.filter((_, li) => li !== linkIndex) };
      }),
    });
  };

  const updateBottomLink = (linkIndex: number, patch: Partial<FooterLinkItem>) => {
    updateCfg({
      ...cfg,
      bottomLinks: cfg.bottomLinks.map((l, i) => (i === linkIndex ? { ...l, ...patch } : l)),
    });
  };

  const addBottomLink = () => {
    updateCfg({
      ...cfg,
      bottomLinks: [...cfg.bottomLinks, { id: createFooterLinkId(), label: 'Link', url: '#', openInNewTab: false }],
    });
  };

  const removeBottomLink = (linkIndex: number) => {
    updateCfg({
      ...cfg,
      bottomLinks: cfg.bottomLinks.filter((_, i) => i !== linkIndex),
    });
  };

  const brandSubtitle = cfg.brand?.subtitle ?? '';
  const brandCta = cfg.brand?.cta;

  return (
    <div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Brand subtitle</span>
          <input
            type="text"
            value={brandSubtitle}
            onChange={(e) => updateBrand({ subtitle: e.target.value })}
          />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>CTA label</span>
            <input
              type="text"
              value={brandCta?.label ?? ''}
              onChange={(e) => updateBrand({ cta: { id: brandCta?.id ?? 'footer-cta', label: e.target.value, url: brandCta?.url ?? '#' } })}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>CTA URL</span>
            <input
              type="url"
              value={brandCta?.url ?? ''}
              onChange={(e) => updateBrand({ cta: { id: brandCta?.id ?? 'footer-cta', label: brandCta?.label ?? '', url: e.target.value } })}
            />
          </label>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
        {cfg.columns.map((col, colIndex) => (
          <div key={col.id} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Column title</span>
              <input type="text" value={col.title} onChange={(e) => updateColumnTitle(colIndex, e.target.value)} />
            </label>

                <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Column title color</span>
                  <input
                    type="color"
                    value={col.titleColor ?? '#ffffff'}
                    onChange={(e) => updateCfg({
                      ...cfg,
                      columns: cfg.columns.map((c, i) => (i === colIndex ? { ...c, titleColor: e.target.value } : c)),
                    })}
                    style={{ width: '100%', height: '40px', padding: 0, border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)' }}
                    aria-label="Column title color"
                  />
                </label>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {col.links.map((l, linkIndex) => (
                <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={l.label}
                    onChange={(e) => updateColumnLink(colIndex, linkIndex, { label: e.target.value })}
                    placeholder="Label"
                  />
                  <input
                    type="url"
                    value={l.url}
                    onChange={(e) => updateColumnLink(colIndex, linkIndex, { url: e.target.value })}
                    placeholder="/path or https://..."
                  />
                  <button type="button" className="btn btn-secondary" onClick={() => removeColumnLink(colIndex, linkIndex)} style={{ padding: '0.25rem 0.5rem' }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-secondary btn-block" onClick={() => addColumnLink(colIndex)} style={{ marginTop: '0.5rem' }}>
              Add link
            </button>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
          Bottom links
        </div>
        <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {cfg.bottomLinks.map((l, linkIndex) => (
            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <input type="text" value={l.label} onChange={(e) => updateBottomLink(linkIndex, { label: e.target.value })} placeholder="Label" />
              <input type="url" value={l.url} onChange={(e) => updateBottomLink(linkIndex, { url: e.target.value })} placeholder="/path or https://..." />
              <button type="button" className="btn btn-secondary" onClick={() => removeBottomLink(linkIndex)} style={{ padding: '0.25rem 0.5rem' }}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-secondary btn-block" onClick={addBottomLink}>
          Add bottom link
        </button>
      </div>
    </div>
  );
}
