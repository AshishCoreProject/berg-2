import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
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
export function SharedHeader({ siteTitle, pages, currentSlug, homeSlug, onNavigate, headerStyle, hiddenFromHeader, viewportMode = "auto", rightSlot, classNames, }) {
    const cls = { ...defaults, ...classNames };
    const [navOpen, setNavOpen] = useState(false);
    const isMobile = useViewportMatch(viewportMode, 1024);
    useEffect(() => {
        if (!isMobile)
            setNavOpen(false);
    }, [isMobile]);
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape")
                setNavOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
    const headerCss = toHeaderFooterCss(headerStyle);
    const linkCss = toLinkCss(headerStyle);
    const navPages = useMemo(() => pages.filter((p) => p.slug !== homeSlug && !(hiddenFromHeader ?? []).includes(p.id)), [pages, homeSlug, hiddenFromHeader]);
    const navTo = (e, path) => {
        if (!onNavigate)
            return;
        e.preventDefault();
        onNavigate(path);
    };
    const desktopLinkClass = (active) => active ? `${cls.navLink} ${cls.navLinkActive}`.trim() : cls.navLink;
    const drawerLinkClass = (active) => active
        ? `${cls.navDrawerLink} ${cls.navDrawerLinkActive}`.trim()
        : cls.navDrawerLink;
    const logoUrl = headerStyle?.logoUrl;
    const showTitle = headerStyle?.showTitle !== false;
    const titlePosition = headerStyle?.titlePosition ?? "right";
    const logoTextGap = headerStyle?.logoTextGap ?? "0.125rem";
    const logoWidthPx = headerStyle?.logoWidthPx;
    const logoHeightPx = headerStyle?.logoHeightPx;
    const brandTextStyle = headerStyle?.color
        ? { color: headerStyle.color }
        : undefined;
    const logoImageStyle = {
        ...(logoWidthPx ? { width: `${logoWidthPx}px` } : {}),
        ...(logoHeightPx ? { height: `${logoHeightPx}px` } : {}),
        ...(!logoWidthPx && !logoHeightPx ? { maxHeight: 32, width: "auto" } : {}),
    };
    const navAlign = headerStyle?.navAlign ?? "right";
    const baseRowClass = cls.row || "flex items-center w-full";
    const rowClassName = [baseRowClass, "site-header-row", `site-header-row--nav-${navAlign}`]
        .filter(Boolean)
        .join(" ");
    const logoImage = logoUrl ? (_jsx("img", { src: logoUrl, alt: siteTitle, className: `${cls.logo}-image`, style: logoImageStyle })) : null;
    const logoText = showTitle ? (_jsx("span", { className: `${cls.logo}-text`, style: brandTextStyle, children: siteTitle })) : null;
    let logoContent;
    if (!logoImage) {
        // No logo image configured – fall back to text only.
        logoContent = logoText ?? siteTitle;
    }
    else if (!logoText) {
        // Logo only, no text.
        logoContent = logoImage;
    }
    else if (titlePosition === "above" || titlePosition === "below") {
        const items = titlePosition === "above"
            ? [logoText, logoImage]
            : [logoImage, logoText];
        logoContent = (_jsx("span", { className: `${cls.logo}-stack`, style: {
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: logoTextGap,
            }, children: items.map((item, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            _jsx("span", { children: item }, idx))) }));
    }
    else {
        // Default: title to the right of the logo.
        logoContent = (_jsxs("span", { className: `${cls.logo}-inline`, style: { display: "inline-flex", alignItems: "center", gap: logoTextGap }, children: [logoImage, logoText] }));
    }
    return (_jsxs("header", { className: cls.root, role: "banner", style: Object.keys(headerCss).length ? headerCss : undefined, children: [_jsx("div", { className: cls.inner, children: _jsxs("div", { className: rowClassName, children: [isMobile && (_jsx("button", { type: "button", className: cls.navToggle, "aria-label": "Open navigation", "aria-expanded": navOpen, onClick: () => setNavOpen((v) => !v), children: _jsxs("svg", { className: cls.navToggleIcon, width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": true, children: [_jsx("line", { x1: "3", y1: "6", x2: "21", y2: "6" }), _jsx("line", { x1: "3", y1: "12", x2: "21", y2: "12" }), _jsx("line", { x1: "3", y1: "18", x2: "21", y2: "18" })] }) })), _jsx("a", { href: "/", className: cls.logo, onClick: (e) => navTo(e, "/"), style: linkCss.color ? linkCss : undefined, children: logoContent }), !isMobile && (_jsxs("nav", { className: cls.nav, "aria-label": "Main", children: [_jsx("a", { href: "/", className: desktopLinkClass(currentSlug === homeSlug || currentSlug === null), onClick: (e) => navTo(e, "/"), style: linkCss.color ? linkCss : undefined, children: "Home" }), navPages.map((p) => (_jsx("a", { href: `/${p.slug}`, className: desktopLinkClass(currentSlug === p.slug), onClick: (e) => navTo(e, `/${p.slug}`), style: linkCss.color ? linkCss : undefined, children: p.document.meta?.title || p.slug }, p.id)))] })), rightSlot] }) }), isMobile && navOpen && (_jsx("div", { className: cls.navBackdrop, role: "presentation", onClick: () => setNavOpen(false), children: _jsxs("aside", { className: cls.navDrawer, "aria-label": "Navigation", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: cls.navDrawerHeader, children: [_jsx("span", { className: cls.navDrawerTitle, children: "Menu" }), _jsx("button", { type: "button", className: cls.navClose, onClick: () => setNavOpen(false), "aria-label": "Close navigation", children: "\u2715" })] }), _jsxs("nav", { className: cls.navDrawerLinks, "aria-label": "Navigation links", children: [_jsx("a", { href: "/", className: drawerLinkClass(currentSlug === homeSlug || currentSlug === null), onClick: (e) => {
                                        navTo(e, "/");
                                        setNavOpen(false);
                                    }, style: linkCss.color ? linkCss : undefined, children: "Home" }), navPages.map((p) => (_jsx("a", { href: `/${p.slug}`, className: drawerLinkClass(currentSlug === p.slug), onClick: (e) => {
                                        navTo(e, `/${p.slug}`);
                                        setNavOpen(false);
                                    }, style: linkCss.color ? linkCss : undefined, children: p.document.meta?.title || p.slug }, p.id)))] })] }) }))] }));
}
