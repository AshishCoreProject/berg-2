import type { StoredPage } from '@berg/schema';

interface Props {
  siteTitle: string;
  pages: StoredPage[];
  homeSlug: string;
  onNavigate: (path: string) => void;
  footerStyle?: { backgroundColor?: string; color?: string; fontFamily?: string; linkColor?: string };
  hiddenFromHeader?: string[];
}

export function SiteFooter({ siteTitle, pages, homeSlug, onNavigate, footerStyle, hiddenFromHeader }: Props) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  const currentYear = new Date().getFullYear();
  const footerCss: React.CSSProperties = {};
  if (footerStyle?.backgroundColor) footerCss.backgroundColor = footerStyle.backgroundColor;
  if (footerStyle?.color) footerCss.color = footerStyle.color;
  if (footerStyle?.fontFamily) footerCss.fontFamily = footerStyle.fontFamily;
  const linkCss: React.CSSProperties = footerStyle?.linkColor ? { color: footerStyle.linkColor } : {};

  return (
    <footer className="site-footer" role="contentinfo" style={Object.keys(footerCss).length ? footerCss : undefined}>
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <span className="site-footer-logo" style={footerCss.color ? { color: footerCss.color } : undefined}>{siteTitle}</span>
          <nav className="site-footer-nav" aria-label="Footer">
            <a href="/" className="site-footer-link" onClick={(e) => handleClick(e, '/')} style={linkCss.color ? linkCss : undefined}>
              Home
            </a>
            {pages
              .filter((p) => p.slug !== homeSlug && !(hiddenFromHeader ?? []).includes(p.id))
              .map((p) => (
                <a
                  key={p.id}
                  href={`/${p.slug}`}
                  className="site-footer-link"
                  onClick={(e) => handleClick(e, `/${p.slug}`)}
                  style={linkCss.color ? linkCss : undefined}
                >
                  {p.document.meta?.title || p.slug}
                </a>
              ))}
          </nav>
        </div>
        <div className="site-footer-bottom">
          <p className="site-footer-copy">
            © {currentYear} {siteTitle}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
