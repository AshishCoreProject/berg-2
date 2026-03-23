import type { StoredPage } from '@berg/schema';

interface Props {
  siteTitle: string;
  pages: StoredPage[];
  currentSlug: string | null;
  homeSlug: string;
  onNavigate: (path: string) => void;
  headerStyle?: { backgroundColor?: string; color?: string; fontFamily?: string; linkColor?: string };
  hiddenFromHeader?: string[];
}

export function SiteHeader({ siteTitle, pages, currentSlug, homeSlug, onNavigate, headerStyle, hiddenFromHeader }: Props) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  const headerCss: React.CSSProperties = {};
  if (headerStyle?.backgroundColor) headerCss.backgroundColor = headerStyle.backgroundColor;
  if (headerStyle?.color) headerCss.color = headerStyle.color;
  if (headerStyle?.fontFamily) headerCss.fontFamily = headerStyle.fontFamily;
  const linkCss: React.CSSProperties = headerStyle?.linkColor ? { color: headerStyle.linkColor } : {};

  return (
    <header className="site-header" role="banner" style={Object.keys(headerCss).length ? headerCss : undefined}>
      <div className="site-header-inner">
        <a href="/" className="site-logo" onClick={(e) => handleClick(e, '/')} style={linkCss.color ? linkCss : undefined}>
          {siteTitle}
        </a>
        <nav className="site-nav" aria-label="Main">
          <a
            href="/"
            className={currentSlug === homeSlug || currentSlug === null ? 'site-nav-link active' : 'site-nav-link'}
            onClick={(e) => handleClick(e, '/')}
            style={linkCss.color ? linkCss : undefined}
          >
            Home
          </a>
          {pages
            .filter((p) => p.slug !== homeSlug && !(hiddenFromHeader ?? []).includes(p.id))
            .map((p) => (
              <a
                key={p.id}
                href={`/${p.slug}`}
                className={currentSlug === p.slug ? 'site-nav-link active' : 'site-nav-link'}
                onClick={(e) => handleClick(e, `/${p.slug}`)}
                style={linkCss.color ? linkCss : undefined}
              >
                {p.document.meta?.title || p.slug}
              </a>
            ))}
        </nav>
      </div>
    </header>
  );
}
