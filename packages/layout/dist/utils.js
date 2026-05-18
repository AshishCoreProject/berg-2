import { useEffect, useState } from 'react';
export function toHeaderFooterCss(style) {
    const css = {};
    if (style?.backgroundColor)
        css.backgroundColor = style.backgroundColor;
    if (style?.color)
        css.color = style.color;
    if (style?.fontFamily)
        css.fontFamily = style.fontFamily;
    return css;
}
export function toLinkCss(style) {
    return style?.linkColor ? { color: style.linkColor } : {};
}
export function resolveViewportMatch(mode, maxWidthPx) {
    if (mode === 'mobile')
        return true;
    if (mode === 'desktop')
        return false;
    if (typeof window === 'undefined')
        return false;
    return window.matchMedia(`(max-width: ${maxWidthPx}px)`).matches;
}
export function useViewportMatch(mode, maxWidthPx) {
    const [isMobile, setIsMobile] = useState(() => resolveViewportMatch(mode, maxWidthPx));
    useEffect(() => {
        if (mode && mode !== 'auto') {
            setIsMobile(mode === 'mobile');
            return;
        }
        const mq = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
        const onChange = () => setIsMobile(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [mode, maxWidthPx]);
    return isMobile;
}
export function isInternalUrl(url) {
    return url.startsWith('/') || url.startsWith('#');
}
export function defaultFooterLinkItem(label, url) {
    return { id: `footerlink-${label}-${url}`, label, url };
}
export function buildDefaultFooterLinks(pages, homeSlug) {
    const navPages = pages.filter((p) => p.slug !== homeSlug);
    const colCount = Math.max(1, Math.min(3, navPages.length ? 3 : 1));
    const sliceSize = colCount === 1 ? navPages.length : Math.ceil(navPages.length / colCount);
    const rawColumns = [
        { id: 'col-shop', title: 'Shop', pageItems: navPages.slice(0, sliceSize) },
        { id: 'col-quick', title: 'Quick Links', pageItems: navPages.slice(sliceSize, sliceSize * 2) },
        { id: 'col-touch', title: 'Stay In Touch', pageItems: navPages.slice(sliceSize * 2) },
    ];
    const columns = rawColumns
        .filter((c) => c.pageItems.length > 0 || navPages.length === 0)
        .slice(0, colCount)
        .map((c) => ({
        id: c.id,
        title: c.title,
        links: c.pageItems.map((p) => defaultFooterLinkItem(p.document.meta?.title || p.slug, `/${p.slug}`)),
    }));
    return {
        brand: { subtitle: '', cta: defaultFooterLinkItem('Listen Live', '#') },
        columns: columns.length ? columns : [{ id: 'col-empty', title: 'Shop', links: [] }],
        bottomLinks: [defaultFooterLinkItem('Privacy', '#'), defaultFooterLinkItem('Terms', '#')],
    };
}
export function normalizeFooterConfig(cfg, pages, hiddenFromHeader) {
    const hiddenSet = new Set(hiddenFromHeader ?? []);
    const columns = cfg.columns.map((col) => ({
        ...col,
        links: col.links.filter((l) => {
            if (!l.url.startsWith('/'))
                return true;
            const slug = l.url.replace(/^\//, '').replace(/\/$/, '');
            const matchingPage = pages.find((p) => p.slug === slug);
            return matchingPage ? !hiddenSet.has(matchingPage.id) : true;
        }),
    }));
    return { ...cfg, columns };
}
