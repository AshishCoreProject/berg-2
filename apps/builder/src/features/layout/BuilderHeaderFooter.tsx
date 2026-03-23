/**
 * Header and footer preview in the builder – visible while editing, click to edit styles.
 */
import { useState, useRef, useEffect } from 'react';
import type { StoredPage } from '@berg/schema';
import { StyleEditor } from '@/components/controls';

type HeaderFooterStyle = { backgroundColor?: string; color?: string; fontFamily?: string; linkColor?: string };

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
    const close = (e: MouseEvent) => {
      if (editingHeader && headerRef.current && !headerRef.current.contains(e.target as Node)) setEditingHeader(false);
      if (editingFooter && footerRef.current && !footerRef.current.contains(e.target as Node)) setEditingFooter(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
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
}

export function BuilderHeaderPreview({ siteTitle, pages, homeSlug, hiddenFromHeader, headerStyle, onHeaderStyleChange, onToggleShowInHeader }: BuilderHeaderOnlyProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (editing && ref.current && !ref.current.contains(e.target as Node)) setEditing(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [editing]);
  const headerCss: React.CSSProperties = { ...(headerStyle.backgroundColor && { backgroundColor: headerStyle.backgroundColor }), ...(headerStyle.color && { color: headerStyle.color }), ...(headerStyle.fontFamily && { fontFamily: headerStyle.fontFamily }) };
  const linkCss: React.CSSProperties = headerStyle.linkColor ? { color: headerStyle.linkColor } : {};
  const siteName = siteTitle?.trim() || 'Site';
  const navPages = pages.filter((p) => p.slug !== homeSlug);
  return (
    <div className="builder-preview-header-wrap" ref={ref}>
      <header className="builder-preview-header" style={Object.keys(headerCss).length ? headerCss : undefined}>
        <span className="builder-preview-header-logo" style={linkCss.color ? linkCss : undefined}>{siteName}</span>
        <nav className="builder-preview-header-nav">
          <span className="builder-preview-header-link" style={linkCss.color ? linkCss : undefined}>Home</span>
          {pages.filter((p) => p.slug !== homeSlug && !(hiddenFromHeader ?? []).includes(p.id)).map((p) => (
            <span key={p.id} className="builder-preview-header-link" style={linkCss.color ? linkCss : undefined}>{p.document.meta?.title || p.slug}</span>
          ))}
        </nav>
        <button type="button" className="builder-preview-edit-btn" onClick={(e) => { e.stopPropagation(); setEditing((v) => !v); }} aria-label="Edit header">Edit header</button>
      </header>
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
}

export function BuilderFooterPreview({ siteTitle, pages, homeSlug, hiddenFromHeader, footerStyle, onFooterStyleChange }: BuilderFooterOnlyProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (editing && ref.current && !ref.current.contains(e.target as Node)) setEditing(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [editing]);
  const footerCss: React.CSSProperties = { ...(footerStyle.backgroundColor && { backgroundColor: footerStyle.backgroundColor }), ...(footerStyle.color && { color: footerStyle.color }), ...(footerStyle.fontFamily && { fontFamily: footerStyle.fontFamily }) };
  const linkCss: React.CSSProperties = footerStyle.linkColor ? { color: footerStyle.linkColor } : {};
  const siteName = siteTitle?.trim() || 'Site';
  const currentYear = new Date().getFullYear();
  return (
    <div className="builder-preview-footer-wrap" ref={ref}>
      <footer className="builder-preview-footer" style={Object.keys(footerCss).length ? footerCss : undefined}>
        <span className="builder-preview-footer-logo" style={footerCss.color ? { color: footerCss.color } : undefined}>{siteName}</span>
        <nav className="builder-preview-footer-nav">
          <span className="builder-preview-footer-link" style={linkCss.color ? linkCss : undefined}>Home</span>
          {pages.filter((p) => p.slug !== homeSlug && !(hiddenFromHeader ?? []).includes(p.id)).map((p) => (
            <span key={p.id} className="builder-preview-footer-link" style={linkCss.color ? linkCss : undefined}>{p.document.meta?.title || p.slug}</span>
          ))}
        </nav>
        <span className="builder-preview-footer-copy">© {currentYear} {siteName}</span>
        <button type="button" className="builder-preview-edit-btn" onClick={(e) => { e.stopPropagation(); setEditing((v) => !v); }} aria-label="Edit footer">Edit footer</button>
      </footer>
      {editing && (
        <div className="builder-preview-popover" onClick={(e) => e.stopPropagation()}>
          <StyleEditor title="Footer" values={footerStyle} onChange={onFooterStyleChange} variant="footer" />
        </div>
      )}
    </div>
  );
}
