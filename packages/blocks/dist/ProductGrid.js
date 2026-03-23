import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { DEMO_PRODUCTS } from './demoData';
import { sanitizeHtml, isHtml } from './sanitizeHtml';
export function ProductGrid({ apiBaseUrl, apiEndpoint, title, limit = 12, collectionId, useDemoData, titleFontFamily, titleTextColor, titleFontSize, titleFontWeight, titleFontStyle, buttonBackgroundColor, buttonColor, buttonFontFamily, buttonFontSize, buttonFontWeight, buttonFontStyle, buttonBorderRadius, buttonPadding }) {
    const [products, setProducts] = useState([]);
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
            const list = [...DEMO_PRODUCTS];
            setProducts(list.slice(0, limit));
            setLoading(false);
            return;
        }
        if (!apiBaseUrl) {
            setError('API base URL not configured. Set it in Builder → Website → API Base URL.');
            setLoading(false);
            return;
        }
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const url = new URL(apiEndpoint, apiBaseUrl);
                if (collectionId)
                    url.searchParams.set('collection', collectionId);
                if (limit)
                    url.searchParams.set('limit', limit.toString());
                const res = await fetch(url.toString());
                if (!res.ok)
                    throw new Error(`API error: ${res.status}`);
                const data = await res.json();
                const items = Array.isArray(data) ? data : data.products || data.items || [];
                setProducts(items);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load products');
            }
            finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [apiBaseUrl, apiEndpoint, collectionId, limit, useDemoData]);
    if (loading) {
        return (_jsxs("section", { className: "block block-product-grid", children: [_jsx("h2", { className: "block-heading", style: Object.keys(titleStyle).length ? titleStyle : undefined, children: isHtml(title) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(title) } }) : title }), _jsx("div", { className: "product-grid-loading", children: "Loading products..." })] }));
    }
    if (error) {
        return (_jsxs("section", { className: "block block-product-grid", children: [_jsx("h2", { className: "block-heading", style: Object.keys(titleStyle).length ? titleStyle : undefined, children: isHtml(title) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(title) } }) : title }), _jsx("div", { className: "product-grid-error", children: error })] }));
    }
    if (products.length === 0) {
        return (_jsxs("section", { className: "block block-product-grid", children: [_jsx("h2", { className: "block-heading", style: Object.keys(titleStyle).length ? titleStyle : undefined, children: isHtml(title) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(title) } }) : title }), _jsx("p", { children: "No products found." })] }));
    }
    return (_jsxs("section", { className: "block block-product-grid", children: [_jsx("h2", { className: "block-heading", style: Object.keys(titleStyle).length ? titleStyle : undefined, children: isHtml(title) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(title) } }) : title }), _jsx("div", { className: "product-grid", children: products.map((product) => (_jsxs("article", { className: "product-card", children: [product.image && (_jsx("div", { className: "product-image", children: _jsx("img", { src: product.image, alt: product.title, loading: "lazy" }) })), _jsxs("div", { className: "product-info", children: [_jsx("h3", { className: "product-title", children: product.title }), product.description && (_jsx("p", { className: "product-description", children: product.description })), _jsxs("div", { className: "product-price", children: ["$", product.price.toFixed(2)] }), product.handle && (_jsx("a", { href: `/products/${product.handle}`, className: "product-link", style: Object.keys(linkStyle).length ? linkStyle : undefined, children: "View Product" }))] })] }, product.id))) })] }));
}
