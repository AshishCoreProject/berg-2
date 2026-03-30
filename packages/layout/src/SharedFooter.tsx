import { useEffect, useMemo, useState } from "react";
import type { FooterLinkItem } from "@berg/schema";
import type { SharedFooterProps } from "./types";
import {
  buildDefaultFooterLinks,
  isInternalUrl,
  normalizeFooterConfig,
  toHeaderFooterCss,
  toLinkCss,
  useViewportMatch,
} from "./utils";

function FooterLink({
  link,
  linkCss,
  onNavigate,
  className,
}: {
  link: FooterLinkItem;
  linkCss: React.CSSProperties;
  onNavigate?: (path: string) => void;
  className: string;
}) {
  const internal = isInternalUrl(link.url);
  const themedFooterClasses = [
    "site-footer-link",
    "site-footer-cta",
    "site-footer-bottom-link",
  ];
  const shouldUseInlineColor = !themedFooterClasses.some((cls) =>
    className.includes(cls),
  );
  return (
    <a
      href={link.url}
      className={className}
      style={shouldUseInlineColor && linkCss.color ? linkCss : undefined}
      target={link.openInNewTab ? "_blank" : undefined}
      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
      onClick={(e) => {
        if (!internal || !onNavigate) return;
        if (link.url.startsWith("/")) {
          e.preventDefault();
          onNavigate(link.url);
        }
      }}
    >
      {link.label}
    </a>
  );
}

export function SharedFooter({
  siteTitle,
  pages,
  homeSlug,
  onNavigate,
  footerStyle,
  hiddenFromHeader,
  footerLinks,
  viewportMode = "auto",
  className,
}: SharedFooterProps) {
  const currentYear = new Date().getFullYear();
  const footerCss = toHeaderFooterCss(footerStyle);
  const linkCss = toLinkCss(footerStyle);
  const isMobile = useViewportMatch(viewportMode, 900);
  const cfgRaw = footerLinks?.columns?.length
    ? footerLinks
    : buildDefaultFooterLinks(pages, homeSlug);
  const cfg = useMemo(
    () => normalizeFooterConfig(cfgRaw, pages, hiddenFromHeader),
    [cfgRaw, pages, hiddenFromHeader],
  );
  const brandCta = cfg.brand?.cta;
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!isMobile) return;
    const first = cfg.columns[0]?.id ?? null;
    setOpenId((prev) => prev ?? first);
  }, [isMobile, cfg.columns]);

  return (
    <footer
      className={className ?? "site-footer"}
      role="contentinfo"
      style={Object.keys(footerCss).length ? footerCss : undefined}
    >
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <div className="site-footer-brand">
            <span
              className="site-footer-logo"
              style={footerCss.color ? { color: footerCss.color } : undefined}
            >
              {siteTitle}
            </span>
            {cfg.brand?.subtitle && (
              <p className="site-footer-brand-subtitle">{cfg.brand.subtitle}</p>
            )}
            {brandCta?.label && brandCta?.url && (
              <FooterLink
                link={brandCta}
                linkCss={linkCss}
                onNavigate={onNavigate}
                className="site-footer-cta"
              />
            )}
          </div>

          {!isMobile ? (
            <div className="site-footer-columns" aria-label="Footer links">
              {cfg.columns.map((col) => (
                <nav
                  key={col.id}
                  className="site-footer-col"
                  aria-label={col.title}
                >
                  <h4
                    className="site-footer-col-title"
                    style={{
                      ...(col.titleColor ? { color: col.titleColor } : {}),
                      ...(col.titleBackgroundColor
                        ? { backgroundColor: col.titleBackgroundColor }
                        : {}),
                    }}
                  >
                    {col.title}
                  </h4>
                  <div className="site-footer-col-links">
                    {col.links.map((l) => (
                      <FooterLink
                        key={l.id}
                        link={l}
                        linkCss={linkCss}
                        onNavigate={onNavigate}
                        className="site-footer-link"
                      />
                    ))}
                  </div>
                </nav>
              ))}
            </div>
          ) : (
            <div className="site-footer-accordion" aria-label="Footer links">
              {cfg.columns.map((col) => {
                const isOpen = openId === col.id;
                const panelId = `footer-panel-${col.id}`;
                const buttonId = `footer-button-${col.id}`;
                return (
                  <div key={col.id} className="site-footer-accordion-item">
                    <button
                      type="button"
                      id={buttonId}
                      className="site-footer-accordion-button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() =>
                        setOpenId((prev) => (prev === col.id ? null : col.id))
                      }
                      style={{
                        ...(col.titleBackgroundColor
                          ? { backgroundColor: col.titleBackgroundColor }
                          : {}),
                        ...(col.titleColor ? { color: col.titleColor } : {}),
                      }}
                    >
                      <span className="site-footer-accordion-title">
                        {col.title}
                      </span>
                      <span className="site-footer-accordion-icon" aria-hidden>
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="site-footer-accordion-panel"
                      hidden={!isOpen}
                    >
                      <div className="site-footer-accordion-links">
                        {col.links.map((l) => (
                          <FooterLink
                            key={l.id}
                            link={l}
                            linkCss={linkCss}
                            onNavigate={onNavigate}
                            className="site-footer-link"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="site-footer-bottom">
          <p className="site-footer-copy">
            © {currentYear} {siteTitle}. All rights reserved.
          </p>
          <div className="site-footer-bottom-links">
            {cfg.bottomLinks.map((l) => (
              <FooterLink
                key={l.id}
                link={l}
                linkCss={linkCss}
                onNavigate={onNavigate}
                className="site-footer-bottom-link"
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
