import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { buildDefaultFooterLinks, isInternalUrl, normalizeFooterConfig, toHeaderFooterCss, toLinkCss, useViewportMatch, } from "./utils";
function FooterLink({ link, linkCss, onNavigate, className, }) {
    const internal = isInternalUrl(link.url);
    return (_jsx("a", { href: link.url, className: className, style: linkCss.color ? linkCss : undefined, target: link.openInNewTab ? "_blank" : undefined, rel: link.openInNewTab ? "noopener noreferrer" : undefined, onClick: (e) => {
            if (!internal || !onNavigate)
                return;
            if (link.url.startsWith("/")) {
                e.preventDefault();
                onNavigate(link.url);
            }
        }, children: link.label }));
}
export function SharedFooter({ siteTitle, pages, homeSlug, onNavigate, footerStyle, hiddenFromHeader, footerLinks, viewportMode = "auto", className, }) {
    const currentYear = new Date().getFullYear();
    const footerCss = toHeaderFooterCss(footerStyle);
    const linkCss = toLinkCss({
        ...footerStyle,
        linkColor: footerStyle?.footerLinksColor ?? footerStyle?.linkColor,
    });
    const isMobile = useViewportMatch(viewportMode, 900);
    const cfgRaw = footerLinks?.columns?.length
        ? footerLinks
        : buildDefaultFooterLinks(pages, homeSlug);
    const cfg = useMemo(() => normalizeFooterConfig(cfgRaw, pages, hiddenFromHeader), [cfgRaw, pages, hiddenFromHeader]);
    const brandCta = cfg.brand?.cta;
    const [openId, setOpenId] = useState(null);
    useEffect(() => {
        if (!isMobile)
            return;
        const first = cfg.columns[0]?.id ?? null;
        setOpenId((prev) => prev ?? first);
    }, [isMobile, cfg.columns]);
    return (_jsx("footer", { className: className ?? "site-footer", role: "contentinfo", style: Object.keys(footerCss).length ? footerCss : undefined, children: _jsxs("div", { className: "site-footer-inner", children: [_jsxs("div", { className: "site-footer-top", children: [_jsxs("div", { className: "site-footer-brand", children: [_jsx("span", { className: "site-footer-logo", style: footerCss.color ? { color: footerCss.color } : undefined, children: siteTitle }), cfg.brand?.subtitle && (_jsx("p", { className: "site-footer-brand-subtitle", children: cfg.brand.subtitle })), brandCta?.label && brandCta?.url && (_jsx(FooterLink, { link: brandCta, linkCss: linkCss, onNavigate: onNavigate, className: "site-footer-cta" }))] }), !isMobile ? (_jsx("div", { className: "site-footer-columns", "aria-label": "Footer links", children: cfg.columns.map((col) => (_jsxs("nav", { className: "site-footer-col", "aria-label": col.title, children: [_jsx("h4", { className: "site-footer-col-title", style: {
                                            ...(col.titleColor ? { color: col.titleColor } : {}),
                                            ...(col.titleBackgroundColor
                                                ? { backgroundColor: col.titleBackgroundColor }
                                                : {}),
                                        }, children: col.title }), _jsx("div", { className: "site-footer-col-links", children: col.links.map((l) => (_jsx(FooterLink, { link: l, linkCss: linkCss, onNavigate: onNavigate, className: "site-footer-link" }, l.id))) })] }, col.id))) })) : (_jsx("div", { className: "site-footer-accordion", "aria-label": "Footer links", children: cfg.columns.map((col) => {
                                const isOpen = openId === col.id;
                                const panelId = `footer-panel-${col.id}`;
                                const buttonId = `footer-button-${col.id}`;
                                return (_jsxs("div", { className: "site-footer-accordion-item", children: [_jsxs("button", { type: "button", id: buttonId, className: "site-footer-accordion-button", "aria-expanded": isOpen, "aria-controls": panelId, onClick: () => setOpenId((prev) => (prev === col.id ? null : col.id)), style: {
                                                ...(col.titleBackgroundColor
                                                    ? { backgroundColor: col.titleBackgroundColor }
                                                    : {}),
                                                ...(col.titleColor ? { color: col.titleColor } : {}),
                                            }, children: [_jsx("span", { className: "site-footer-accordion-title", children: col.title }), _jsx("span", { className: "site-footer-accordion-icon", "aria-hidden": true, children: isOpen ? "−" : "+" })] }), _jsx("div", { id: panelId, role: "region", "aria-labelledby": buttonId, className: "site-footer-accordion-panel", hidden: !isOpen, children: _jsx("div", { className: "site-footer-accordion-links", children: col.links.map((l) => (_jsx(FooterLink, { link: l, linkCss: linkCss, onNavigate: onNavigate, className: "site-footer-link" }, l.id))) }) })] }, col.id));
                            }) }))] }), _jsxs("div", { className: "site-footer-bottom", children: [_jsxs("p", { className: "site-footer-copy", children: ["\u00A9 ", currentYear, " ", siteTitle, ". All rights reserved."] }), _jsx("div", { className: "site-footer-bottom-links", children: cfg.bottomLinks.map((l) => (_jsx(FooterLink, { link: l, linkCss: linkCss, onNavigate: onNavigate, className: "site-footer-bottom-link" }, l.id))) })] })] }) }));
}
