import { useEffect, useMemo, useState } from "react";
import type { SharedHeaderProps } from "./types";
import { toHeaderFooterCss, toLinkCss, useViewportMatch } from "./utils";

const defaults = {
  root: "site-header",
  row: "",
  inner: "site-header-inner",
  logo: "site-logo",
  nav: "site-nav",
  navLink: "site-nav-link",
  navLinkActive: "active",
  navToggle: "site-nav-toggle",
  navToggleIcon: "site-nav-toggle-icon",
  navBackdrop: "site-nav-backdrop",
  navDrawer: "site-nav-drawer",
  navDrawerHeader: "site-nav-drawer-header",
  navDrawerTitle: "site-nav-drawer-title",
  navClose: "site-nav-close",
  navDrawerLinks: "site-nav-drawer-links",
  navDrawerLink: "site-nav-drawer-link",
  navDrawerLinkActive: "active",
};

export function SharedHeader({
  siteTitle,
  pages,
  currentSlug,
  homeSlug,
  onNavigate,
  headerStyle,
  hiddenFromHeader,
  viewportMode = "auto",
  rightSlot,
  classNames,
}: SharedHeaderProps) {
  const cls = { ...defaults, ...classNames };
  const [navOpen, setNavOpen] = useState(false);
  const isMobile = useViewportMatch(viewportMode, 1024);
  useEffect(() => {
    if (!isMobile) setNavOpen(false);
  }, [isMobile]);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const headerCss = toHeaderFooterCss(headerStyle);
  const linkCss = toLinkCss(headerStyle);
  const navPages = useMemo(
    () =>
      pages.filter(
        (p) => p.slug !== homeSlug && !(hiddenFromHeader ?? []).includes(p.id),
      ),
    [pages, homeSlug, hiddenFromHeader],
  );

  const navTo = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!onNavigate) return;
    e.preventDefault();
    onNavigate(path);
  };

  const desktopLinkClass = (active: boolean) =>
    active ? `${cls.navLink} ${cls.navLinkActive}`.trim() : cls.navLink;
  const drawerLinkClass = (active: boolean) =>
    active
      ? `${cls.navDrawerLink} ${cls.navDrawerLinkActive}`.trim()
      : cls.navDrawerLink;

  const logoUrl = headerStyle?.logoUrl;
  const showTitle = headerStyle?.showTitle !== false;
  const titlePosition = headerStyle?.titlePosition ?? "right";
  const logoTextGap = headerStyle?.logoTextGap ?? "0.125rem";
  const logoWidthPx = headerStyle?.logoWidthPx;
  const logoHeightPx = headerStyle?.logoHeightPx;
  const brandTextStyle = headerStyle?.color
    ? ({ color: headerStyle.color } as React.CSSProperties)
    : undefined;

  const logoImageStyle: React.CSSProperties = {
    ...(logoWidthPx ? { width: `${logoWidthPx}px` } : {}),
    ...(logoHeightPx ? { height: `${logoHeightPx}px` } : {}),
    ...(!logoWidthPx && !logoHeightPx ? { maxHeight: 32, width: "auto" } : {}),
  };

  const navAlign = headerStyle?.navAlign ?? "right";
  const baseRowClass = cls.row || "flex items-center w-full";
  const rowClassName = [baseRowClass, "site-header-row", `site-header-row--nav-${navAlign}`]
    .filter(Boolean)
    .join(" ");

  const logoImage = logoUrl ? (
    <img
      src={logoUrl}
      alt={siteTitle}
      className={`${cls.logo}-image`}
      style={logoImageStyle}
    />
  ) : null;

  const logoText = showTitle ? (
    <span className={`${cls.logo}-text`} style={brandTextStyle}>
      {siteTitle}
    </span>
  ) : null;

  let logoContent: React.ReactNode;

  if (!logoImage) {
    // No logo image configured – fall back to text only.
    logoContent = logoText ?? siteTitle;
  } else if (!logoText) {
    // Logo only, no text.
    logoContent = logoImage;
  } else if (titlePosition === "above" || titlePosition === "below") {
    const items =
      titlePosition === "above"
        ? [logoText, logoImage]
        : [logoImage, logoText];
    logoContent = (
      <span
        className={`${cls.logo}-stack`}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: logoTextGap,
        }}
      >
        {items.map((item, idx) => (
          // eslint-disable-next-line react/no-array-index-key
          <span key={idx}>{item}</span>
        ))}
      </span>
    );
  } else {
    // Default: title to the right of the logo.
    logoContent = (
      <span
        className={`${cls.logo}-inline`}
        style={{ display: "inline-flex", alignItems: "center", gap: logoTextGap }}
      >
        {logoImage}
        {logoText}
      </span>
    );
  }

  return (
    <header
      className={cls.root}
      role="banner"
      style={Object.keys(headerCss).length ? headerCss : undefined}
    >
      <div className={cls.inner}>
        <div className={rowClassName}>
          {isMobile && (
            <button
              type="button"
              className={cls.navToggle}
              aria-label="Open navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <svg
                className={cls.navToggleIcon}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <a
            href="/"
            className={cls.logo}
            onClick={(e) => navTo(e, "/")}
            style={linkCss.color ? linkCss : undefined}
          >
            {logoContent}
          </a>
          {!isMobile && (
            <nav className={cls.nav} aria-label="Main">
              <a
                href="/"
                className={desktopLinkClass(
                  currentSlug === homeSlug || currentSlug === null,
                )}
                onClick={(e) => navTo(e, "/")}
                style={linkCss.color ? linkCss : undefined}
              >
                Home
              </a>
              {navPages.map((p) => (
                <a
                  key={p.id}
                  href={`/${p.slug}`}
                  className={desktopLinkClass(currentSlug === p.slug)}
                  onClick={(e) => navTo(e, `/${p.slug}`)}
                  style={linkCss.color ? linkCss : undefined}
                >
                  {p.document.meta?.title || p.slug}
                </a>
              ))}
            </nav>
          )}
          {rightSlot}
        </div>
      </div>
      {isMobile && navOpen && (
        <div
          className={cls.navBackdrop}
          role="presentation"
          onClick={() => setNavOpen(false)}
        >
          <aside
            className={cls.navDrawer}
            aria-label="Navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cls.navDrawerHeader}>
              <span className={cls.navDrawerTitle}>Menu</span>
              <button
                type="button"
                className={cls.navClose}
                onClick={() => setNavOpen(false)}
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>
            <nav className={cls.navDrawerLinks} aria-label="Navigation links">
              <a
                href="/"
                className={drawerLinkClass(
                  currentSlug === homeSlug || currentSlug === null,
                )}
                onClick={(e) => {
                  navTo(e, "/");
                  setNavOpen(false);
                }}
                style={linkCss.color ? linkCss : undefined}
              >
                Home
              </a>
              {navPages.map((p) => (
                <a
                  key={p.id}
                  href={`/${p.slug}`}
                  className={drawerLinkClass(currentSlug === p.slug)}
                  onClick={(e) => {
                    navTo(e, `/${p.slug}`);
                    setNavOpen(false);
                  }}
                  style={linkCss.color ? linkCss : undefined}
                >
                  {p.document.meta?.title || p.slug}
                </a>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}
