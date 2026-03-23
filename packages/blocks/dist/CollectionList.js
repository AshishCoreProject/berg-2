import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { DEMO_COLLECTIONS } from './demoData';
import { sanitizeHtml, isHtml } from './sanitizeHtml';
export function CollectionList({ apiBaseUrl, apiEndpoint, title, useDemoData, titleFontFamily, titleTextColor, titleFontSize, titleFontWeight, titleFontStyle, buttonBackgroundColor, buttonColor, buttonFontFamily, buttonFontSize, buttonFontWeight, buttonFontStyle, buttonBorderRadius, buttonPadding }) {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const titleStyle = {};
    if (titleFontFamily)
        titleStyle.fontFamily = titleFontFamily;
    if (titleTextColor)
        titleStyle.color = titleTextColor;
    if (titleFontSize)
        titleStyle.fontSize = titleFontSize;
    if (titleFontWeight)
        titleStyle.fontWeight = titleFontWeight;
    if (titleFontStyle)
        titleStyle.fontStyle = titleFontStyle;
    const linkStyle = {};
    if (buttonBackgroundColor)
        linkStyle.backgroundColor = buttonBackgroundColor;
    if (buttonColor)
        linkStyle.color = buttonColor;
    if (buttonFontFamily)
        linkStyle.fontFamily = buttonFontFamily;
    if (buttonFontSize)
        linkStyle.fontSize = buttonFontSize;
    if (buttonFontWeight)
        linkStyle.fontWeight = buttonFontWeight;
    if (buttonFontStyle)
        linkStyle.fontStyle = buttonFontStyle;
    if (buttonBorderRadius)
        linkStyle.borderRadius = buttonBorderRadius;
    if (buttonPadding)
        linkStyle.padding = buttonPadding;
    useEffect(() => {
        if (useDemoData) {
            setCollections(DEMO_COLLECTIONS);
            setLoading(false);
            return;
        }
        if (!apiBaseUrl) {
            setError('API base URL not configured. Set it in Builder → Website → API Base URL.');
            setLoading(false);
            return;
        }
        const fetchCollections = async () => {
            try {
                setLoading(true);
                const url = new URL(apiEndpoint, apiBaseUrl);
                const res = await fetch(url.toString());
                if (!res.ok)
                    throw new Error(`API error: ${res.status}`);
                const data = await res.json();
                const items = Array.isArray(data) ? data : data.collections || data.items || [];
                setCollections(items);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load collections');
            }
            finally {
                setLoading(false);
            }
        };
        fetchCollections();
    }, [apiBaseUrl, apiEndpoint, useDemoData]);
    if (loading) {
        return (_jsxs("section", { className: "block block-collection-list", children: [_jsx("h2", { className: "block-heading", style: Object.keys(titleStyle).length ? titleStyle : undefined, children: isHtml(title) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(title) } }) : title }), _jsx("div", { className: "collection-list-loading", children: "Loading collections..." })] }));
    }
    if (error) {
        return (_jsxs("section", { className: "block block-collection-list", children: [_jsx("h2", { className: "block-heading", style: Object.keys(titleStyle).length ? titleStyle : undefined, children: isHtml(title) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(title) } }) : title }), _jsx("div", { className: "collection-list-error", children: error })] }));
    }
    if (collections.length === 0) {
        return (_jsxs("section", { className: "block block-collection-list", children: [_jsx("h2", { className: "block-heading", style: Object.keys(titleStyle).length ? titleStyle : undefined, children: isHtml(title) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(title) } }) : title }), _jsx("p", { children: "No collections found." })] }));
    }
    return (_jsxs("section", { className: "block block-collection-list", children: [_jsx("h2", { className: "block-heading", style: Object.keys(titleStyle).length ? titleStyle : undefined, children: isHtml(title) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(title) } }) : title }), _jsx("div", { className: "collection-list", children: collections.map((collection) => (_jsxs("article", { className: "collection-card", children: [collection.image && (_jsx("div", { className: "collection-image", children: _jsx("img", { src: collection.image, alt: collection.title, loading: "lazy" }) })), _jsxs("div", { className: "collection-info", children: [_jsx("h3", { className: "collection-title", children: collection.title }), collection.description && (_jsx("p", { className: "collection-description", children: collection.description })), collection.productCount !== undefined && (_jsxs("p", { className: "collection-count", children: [collection.productCount, " products"] })), collection.handle && (_jsx("a", { href: `/collections/${collection.handle}`, className: "collection-link", style: Object.keys(linkStyle).length ? linkStyle : undefined, children: "View Collection" }))] })] }, collection.id))) })] }));
}
