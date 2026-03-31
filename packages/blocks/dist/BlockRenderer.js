import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { isInnerBlocksBlock } from '@berg/schema';
import { sanitizeHtml, isHtml, sanitizeCustomHtml } from './sanitizeHtml';
import { ProductGrid } from './ProductGrid';
import { CollectionList } from './CollectionList';
/**
 * Renders a single block to semantic HTML for SEO and accessibility.
 * Each block type maps to appropriate tags (section, article, h1–h6, p, figure, etc.).
 */
const SPACING_KEYS = ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'];
/** Normalize value: "12" -> "12px", "1.5rem" -> "24px" (1rem=16px). Always output px for reliability. */
function normalizeSpacingValue(v) {
    const trimmed = v.trim();
    if (!trimmed)
        return '';
    const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/);
    if (numMatch)
        return `${numMatch[1]}px`;
    const remMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*rem$/i);
    if (remMatch)
        return `${Math.round(parseFloat(remMatch[1]) * 16)}px`;
    return trimmed;
}
/** Form container: renders fields + submit button, runs submitScript on mount */
function FormBlock({ title, submitButtonText, submitScript, fields, apiBaseUrl, useDemoData, }) {
    const formRef = useRef(null);
    useEffect(() => {
        if (!formRef.current || !submitScript.trim())
            return;
        try {
            const fn = new Function('formEl', submitScript);
            fn(formRef.current);
        }
        catch (_err) {
            /* ignore parse/runtime errors in user script */
        }
    }, [submitScript]);
    return (_jsxs("section", { className: "block block-form", children: [title && _jsx("h3", { className: "block-form-title", children: title }), _jsxs("form", { ref: formRef, className: "block-form-inner", onSubmit: (e) => e.preventDefault(), children: [fields.map((f) => (_jsx(BlockRenderer, { block: f, apiBaseUrl: apiBaseUrl, useDemoData: useDemoData }, f.id))), _jsx("div", { className: "block-form-actions", children: _jsx("button", { type: "submit", className: "button-link form-submit-btn", children: submitButtonText }) })] })] }));
}
function buildSpacingStyle(attrs) {
    const s = {};
    for (const k of SPACING_KEYS) {
        const v = attrs[k];
        const str = v == null ? '' : typeof v === 'number' ? String(v) : typeof v === 'string' ? v : '';
        if (str) {
            const normalized = normalizeSpacingValue(str);
            if (normalized)
                s[k] = normalized;
        }
    }
    return s;
}
export function BlockRenderer({ block, apiBaseUrl, useDemoData, renderChildren }) {
    const attrs = block.attributes ?? {};
    const spacingStyle = buildSpacingStyle(attrs);
    const textStyle = () => {
        const s = {};
        const font = attrs.fontFamily;
        const color = attrs.textColor;
        const size = attrs.fontSize;
        const weight = attrs.fontWeight;
        const style = attrs.fontStyle;
        if (font)
            s.fontFamily = font;
        if (color)
            s.color = color;
        if (size)
            s.fontSize = size;
        if (weight)
            s.fontWeight = weight;
        if (style)
            s.fontStyle = style;
        return s;
    };
    const wrapWithSpacing = (el) => {
        if (Object.keys(spacingStyle).length === 0)
            return el;
        return (_jsx("div", { style: { ...spacingStyle, width: '100%', boxSizing: 'border-box' }, children: el }));
    };
    let content = null;
    switch (block.type) {
        case 'core/paragraph': {
            const c = attrs.content ?? '';
            if (!c.trim())
                break;
            const style = textStyle();
            content = isHtml(c) ? _jsx("p", { className: "block block-paragraph", style: style, dangerouslySetInnerHTML: { __html: sanitizeHtml(c) } }) : _jsx("p", { className: "block block-paragraph", style: style, children: c });
            break;
        }
        case 'core/heading': {
            const c = attrs.content ?? '';
            const level = Math.min(6, Math.max(1, attrs.level ?? 2));
            const Tag = `h${level}`;
            if (!c.trim())
                break;
            const style = textStyle();
            content = isHtml(c) ? _jsx(Tag, { className: "block block-heading", style: style, dangerouslySetInnerHTML: { __html: sanitizeHtml(c) } }) : _jsx(Tag, { className: "block block-heading", style: style, children: c });
            break;
        }
        case 'core/image': {
            const url = attrs.url ?? '';
            const alt = attrs.alt ?? '';
            const caption = attrs.caption ?? '';
            const width = attrs.width ?? 100;
            const capFont = attrs.captionFontFamily;
            const capColor = attrs.captionTextColor;
            const capSize = attrs.captionFontSize;
            const capWeight = attrs.captionFontWeight;
            const capStyle = attrs.captionFontStyle;
            const captionStyle = {};
            if (capFont)
                captionStyle.fontFamily = capFont;
            if (capColor)
                captionStyle.color = capColor;
            if (capSize)
                captionStyle.fontSize = capSize;
            if (capWeight)
                captionStyle.fontWeight = capWeight;
            if (capStyle)
                captionStyle.fontStyle = capStyle;
            if (url) {
                content = (_jsxs("figure", { className: "block block-image", style: width ? { maxWidth: `${width}%` } : undefined, children: [_jsx("img", { src: url, alt: alt || undefined, loading: "lazy", decoding: "async" }), caption && _jsx("figcaption", { style: Object.keys(captionStyle).length ? captionStyle : undefined, children: isHtml(caption) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(caption) } }) : caption })] }));
            }
            break;
        }
        case 'core/button': {
            const text = attrs.text ?? 'Click me';
            const url = attrs.url ?? '#';
            const openInNewTab = attrs.openInNewTab ?? false;
            const style = { ...textStyle() };
            const bg = attrs.backgroundColor;
            const radius = attrs.borderRadius;
            const pad = attrs.padding;
            if (bg)
                style.backgroundColor = bg;
            if (radius)
                style.borderRadius = radius;
            if (pad)
                style.padding = pad;
            content = (_jsx("p", { className: "block block-button", children: _jsx("a", { href: url, target: openInNewTab ? '_blank' : undefined, rel: openInNewTab ? 'noopener noreferrer' : undefined, className: "button-link", style: Object.keys(style).length ? style : undefined, children: isHtml(text) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(text) } }) : text }) }));
            break;
        }
        case 'core/columns': {
            if (isInnerBlocksBlock(block) && block.innerBlocks?.length) {
                const columns = attrs.columns ?? 2;
                const columnWidths = attrs.columnWidths;
                const gridCols = columnWidths && columnWidths.length === block.innerBlocks.length
                    ? columnWidths.map((p) => `${p}fr`).join(' ')
                    : `repeat(${columns}, 1fr)`;
                content = (_jsx("section", { className: "block block-columns", "aria-label": "Content columns", children: _jsx("div", { className: "columns-inner", style: { gridTemplateColumns: gridCols }, children: block.innerBlocks.map((col) => (_jsx("div", { className: "column", children: _jsx(BlockRenderer, { block: col, apiBaseUrl: apiBaseUrl, useDemoData: useDemoData }) }, col.id))) }) }));
            }
            break;
        }
        case 'core/column':
            content = (_jsx("div", { className: "block block-column" }));
            break;
        case 'core/hero': {
            const title = attrs.title ?? '';
            const subtitle = attrs.subtitle ?? '';
            const backgroundImage = attrs.backgroundImage ?? '';
            const heroBg = attrs.heroBackgroundColor;
            const ctaText = attrs.ctaText ?? '';
            const ctaUrl = attrs.ctaUrl ?? '#';
            const titleFont = attrs.titleFontFamily;
            const titleColor = attrs.titleTextColor;
            const titleSize = attrs.titleFontSize;
            const titleWeight = attrs.titleFontWeight;
            const titleStyleAttr = attrs.titleFontStyle;
            const titleStyle = {};
            if (titleFont)
                titleStyle.fontFamily = titleFont;
            if (titleColor)
                titleStyle.color = titleColor;
            if (titleSize)
                titleStyle.fontSize = titleSize;
            if (titleWeight)
                titleStyle.fontWeight = titleWeight;
            if (titleStyleAttr)
                titleStyle.fontStyle = titleStyleAttr;
            const subtitleFont = attrs.subtitleFontFamily;
            const subtitleColor = attrs.subtitleTextColor;
            const subtitleSize = attrs.subtitleFontSize;
            const subtitleWeight = attrs.subtitleFontWeight;
            const subtitleStyleAttr = attrs.subtitleFontStyle;
            const subtitleStyle = {};
            if (subtitleFont)
                subtitleStyle.fontFamily = subtitleFont;
            if (subtitleColor)
                subtitleStyle.color = subtitleColor;
            if (subtitleSize)
                subtitleStyle.fontSize = subtitleSize;
            if (subtitleWeight)
                subtitleStyle.fontWeight = subtitleWeight;
            if (subtitleStyleAttr)
                subtitleStyle.fontStyle = subtitleStyleAttr;
            const ctaStyle = {};
            const ctaBg = attrs.ctaBackgroundColor;
            const ctaColor = attrs.ctaTextColor;
            const ctaFont = attrs.ctaFontFamily;
            const ctaRadius = attrs.ctaBorderRadius;
            const ctaPad = attrs.ctaPadding;
            const ctaSize = attrs.ctaFontSize;
            const ctaWeight = attrs.ctaFontWeight;
            const ctaStyleAttr = attrs.ctaFontStyle;
            if (ctaBg)
                ctaStyle.backgroundColor = ctaBg;
            if (ctaColor)
                ctaStyle.color = ctaColor;
            if (ctaFont)
                ctaStyle.fontFamily = ctaFont;
            if (ctaRadius)
                ctaStyle.borderRadius = ctaRadius;
            if (ctaPad)
                ctaStyle.padding = ctaPad;
            if (ctaSize)
                ctaStyle.fontSize = ctaSize;
            if (ctaWeight)
                ctaStyle.fontWeight = ctaWeight;
            if (ctaStyleAttr)
                ctaStyle.fontStyle = ctaStyleAttr;
            content = (_jsx("section", { className: "block block-hero", style: {
                    ...(backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}),
                    ...(heroBg ? { backgroundColor: heroBg } : {}),
                }, children: _jsxs("div", { className: "hero-inner", children: [title && _jsx("h2", { className: "hero-title", style: Object.keys(titleStyle).length ? titleStyle : undefined, children: isHtml(title) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(title) } }) : title }), subtitle && _jsx("p", { className: "hero-subtitle", style: Object.keys(subtitleStyle).length ? subtitleStyle : undefined, children: isHtml(subtitle) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(subtitle) } }) : subtitle }), ctaText && (_jsx("p", { className: "hero-cta", children: _jsx("a", { href: ctaUrl, className: "button-link", style: Object.keys(ctaStyle).length ? ctaStyle : undefined, children: isHtml(ctaText) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(ctaText) } }) : ctaText }) }))] }) }));
            break;
        }
        case 'core/spacer': {
            const height = attrs.height ?? 40;
            content = (_jsx("div", { className: "block block-spacer", style: { height: `${height}px` }, "aria-hidden": true }));
            break;
        }
        case 'core/divider':
            content = _jsx("hr", { className: "block block-divider" });
            break;
        case 'core/custom': {
            const html = attrs.html ?? '';
            const css = attrs.css ?? '';
            const script = attrs.script ?? '';
            const wrapperClasses = attrs.wrapperClasses ?? '';
            if (html.trim() || css.trim() || script.trim()) {
                const combinedClasses = ['block', 'block-custom', wrapperClasses.trim()].filter(Boolean).join(' ');
                const isFullDocument = /^\s*(<!DOCTYPE|<html|<!\s*DOCTYPE)/i.test(html.trim());
                const hasStyleOrScript = css.trim().length > 0 || script.trim().length > 0 || isFullDocument;
                if (hasStyleOrScript) {
                    const baseStyles = 'html,body{margin:0;padding:0;box-sizing:border-box;min-height:100%}html{height:100%}';
                    const doc = isFullDocument
                        ? html.trim()
                        : [
                            '<!DOCTYPE html><html><head><meta charset="utf-8">',
                            `<style>${baseStyles}</style>`,
                            css.trim() ? `<style>${css.trim()}</style>` : '',
                            '</head><body>',
                            html.trim() || '<p>Add HTML in block settings.</p>',
                            script.trim() ? `<script>${script.trim()}</script>` : '',
                            '</body></html>',
                        ].join('');
                    content = (_jsx("div", { className: `${combinedClasses} block-custom-with-iframe`, children: _jsx("iframe", { title: "Custom block", sandbox: "allow-scripts", srcDoc: doc, style: { width: '100%', height: '100%', border: 'none', display: 'block' } }) }));
                }
                else {
                    const sanitized = sanitizeCustomHtml(html);
                    content = (_jsx("div", { className: combinedClasses, dangerouslySetInnerHTML: { __html: sanitized } }));
                }
            }
            break;
        }
        case 'core/list': {
            const items = attrs.items ?? [];
            const ordered = attrs.ordered ?? false;
            if (items.length) {
                const ListTag = ordered ? 'ol' : 'ul';
                const style = textStyle();
                content = (_jsx(ListTag, { className: "block block-list", style: style, children: items.map((item, i) => (_jsx("li", { children: isHtml(item) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(item) } }) : item }, i))) }));
            }
            break;
        }
        case 'core/quote': {
            const quoteText = attrs.content ?? '';
            const citation = attrs.citation ?? '';
            const quoteFont = attrs.fontFamily;
            const quoteColor = attrs.textColor;
            const quoteSize = attrs.fontSize;
            const quoteWeight = attrs.fontWeight;
            const quoteStyleAttr = attrs.fontStyle;
            const quoteStyle = {};
            if (quoteFont)
                quoteStyle.fontFamily = quoteFont;
            if (quoteColor)
                quoteStyle.color = quoteColor;
            if (quoteSize)
                quoteStyle.fontSize = quoteSize;
            if (quoteWeight)
                quoteStyle.fontWeight = quoteWeight;
            if (quoteStyleAttr)
                quoteStyle.fontStyle = quoteStyleAttr;
            const citFont = attrs.citationFontFamily;
            const citColor = attrs.citationTextColor;
            const citSize = attrs.citationFontSize;
            const citWeight = attrs.citationFontWeight;
            const citStyleAttr = attrs.citationFontStyle;
            const citeStyle = {};
            if (citFont)
                citeStyle.fontFamily = citFont;
            if (citColor)
                citeStyle.color = citColor;
            if (citSize)
                citeStyle.fontSize = citSize;
            if (citWeight)
                citeStyle.fontWeight = citWeight;
            if (citStyleAttr)
                citeStyle.fontStyle = citStyleAttr;
            if (quoteText.trim()) {
                const citeEl = citation ? _jsx("cite", { style: Object.keys(citeStyle).length ? citeStyle : undefined, children: isHtml(citation) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(citation) } }) : citation }) : null;
                content = isHtml(quoteText) ? (_jsxs("blockquote", { className: "block block-quote", style: Object.keys(quoteStyle).length ? quoteStyle : undefined, children: [_jsx("p", { dangerouslySetInnerHTML: { __html: sanitizeHtml(quoteText) } }), citeEl] })) : (_jsxs("blockquote", { className: "block block-quote", style: Object.keys(quoteStyle).length ? quoteStyle : undefined, children: [_jsx("p", { children: quoteText }), citeEl] }));
            }
            break;
        }
        case 'store/product-grid': {
            content = (_jsx(ProductGrid, { apiBaseUrl: apiBaseUrl, apiEndpoint: attrs.apiEndpoint ?? '/products', title: attrs.title ?? 'Products', limit: attrs.limit ?? 12, collectionId: attrs.collectionId || undefined, useDemoData: useDemoData, titleFontFamily: attrs.fontFamily || undefined, titleTextColor: attrs.textColor || undefined, titleFontSize: attrs.fontSize || attrs.titleFontSize || undefined, titleFontWeight: attrs.fontWeight || attrs.titleFontWeight || undefined, titleFontStyle: attrs.fontStyle || attrs.titleFontStyle || undefined, buttonBackgroundColor: attrs.buttonBackgroundColor || undefined, buttonColor: attrs.buttonColor || undefined, buttonFontFamily: attrs.buttonFontFamily || undefined, buttonFontSize: attrs.buttonFontSize || undefined, buttonFontWeight: attrs.buttonFontWeight || undefined, buttonFontStyle: attrs.buttonFontStyle || undefined, buttonBorderRadius: attrs.buttonBorderRadius || undefined, buttonPadding: attrs.buttonPadding || undefined }));
            break;
        }
        case 'store/collection-list': {
            content = (_jsx(CollectionList, { apiBaseUrl: apiBaseUrl, apiEndpoint: attrs.apiEndpoint ?? '/collections', title: attrs.title ?? 'Collections', useDemoData: useDemoData, titleFontFamily: attrs.fontFamily || undefined, titleTextColor: attrs.textColor || undefined, titleFontSize: attrs.fontSize || attrs.titleFontSize || undefined, titleFontWeight: attrs.fontWeight || attrs.titleFontWeight || undefined, titleFontStyle: attrs.fontStyle || attrs.titleFontStyle || undefined, buttonBackgroundColor: attrs.buttonBackgroundColor || undefined, buttonColor: attrs.buttonColor || undefined, buttonFontFamily: attrs.buttonFontFamily || undefined, buttonFontSize: attrs.buttonFontSize || undefined, buttonFontWeight: attrs.buttonFontWeight || undefined, buttonFontStyle: attrs.buttonFontStyle || undefined, buttonBorderRadius: attrs.buttonBorderRadius || undefined, buttonPadding: attrs.buttonPadding || undefined }));
            break;
        }
        case 'store/newsletter': {
            const title = attrs.title ?? 'Join our newsletter';
            const subtitle = attrs.subtitle ?? 'Get 10% off your first order.';
            const buttonText = attrs.buttonText ?? 'Subscribe';
            const style = {};
            if (attrs.fontFamily)
                style.fontFamily = attrs.fontFamily;
            if (attrs.textColor)
                style.color = attrs.textColor;
            const titleStyle = { ...style };
            if (attrs.titleFontSize)
                titleStyle.fontSize = attrs.titleFontSize;
            if (attrs.titleFontWeight)
                titleStyle.fontWeight = attrs.titleFontWeight;
            const btnStyle = {};
            if (attrs.buttonBackgroundColor)
                btnStyle.backgroundColor = attrs.buttonBackgroundColor;
            if (attrs.buttonColor)
                btnStyle.color = attrs.buttonColor;
            content = (_jsx("section", { className: "block block-newsletter", style: style, children: _jsxs("div", { className: "newsletter-inner", children: [_jsx("h3", { className: "newsletter-title", style: Object.keys(titleStyle).length > 1 ? titleStyle : undefined, children: isHtml(title) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(title) } }) : title }), _jsx("p", { className: "newsletter-subtitle", children: isHtml(subtitle) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(subtitle) } }) : subtitle }), _jsxs("form", { className: "newsletter-form", onSubmit: (e) => e.preventDefault(), children: [_jsx("input", { type: "email", placeholder: "Enter your email", className: "newsletter-input", "aria-label": "Email" }), _jsx("button", { type: "submit", className: "button-link newsletter-btn", style: Object.keys(btnStyle).length ? btnStyle : undefined, children: isHtml(buttonText) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(buttonText) } }) : buttonText })] })] }) }));
            break;
        }
        case 'core/form': {
            if (isInnerBlocksBlock(block) && block.innerBlocks) {
                const title = attrs.title ?? 'Contact us';
                const submitText = attrs.submitButtonText ?? 'Submit';
                const submitScript = attrs.submitScript ?? '';
                content = (_jsx(FormBlock, { title: title, submitButtonText: submitText, submitScript: submitScript, fields: block.innerBlocks, apiBaseUrl: apiBaseUrl, useDemoData: useDemoData }));
            }
            else {
                content = (_jsx("section", { className: "block block-form block-form-empty", children: _jsx("p", { className: "block-form-empty-hint", children: "Add form fields by dragging them from the Form section." }) }));
            }
            break;
        }
        case 'core/form-input': {
            const label = attrs.label ?? 'Field';
            const inputType = attrs.inputType ?? 'text';
            const placeholder = attrs.placeholder ?? '';
            const required = !!attrs.required;
            const name = attrs.name || `field-${block.id}`;
            content = (_jsxs("div", { className: "block block-form-field", children: [_jsxs("label", { className: "form-field-label", children: [label, required && ' *'] }), _jsx("input", { type: inputType, name: name, placeholder: placeholder, required: required, className: "form-input" })] }));
            break;
        }
        case 'core/form-select': {
            const label = attrs.label ?? 'Choose';
            const options = attrs.options ?? [{ value: 'option1', label: 'Option 1' }];
            const required = !!attrs.required;
            const name = attrs.name || `field-${block.id}`;
            content = (_jsxs("div", { className: "block block-form-field", children: [_jsxs("label", { className: "form-field-label", children: [label, required && ' *'] }), _jsxs("select", { name: name, required: required, className: "form-select", children: [_jsx("option", { value: "", children: "Select\u2026" }), options.map((o, i) => (_jsx("option", { value: o.value, children: o.label }, i)))] })] }));
            break;
        }
        case 'core/form-textarea': {
            const label = attrs.label ?? 'Message';
            const placeholder = attrs.placeholder ?? '';
            const required = !!attrs.required;
            const name = attrs.name || `field-${block.id}`;
            const rows = Math.max(2, Math.min(20, attrs.rows ?? 4));
            content = (_jsxs("div", { className: "block block-form-field", children: [_jsxs("label", { className: "form-field-label", children: [label, required && ' *'] }), _jsx("textarea", { name: name, placeholder: placeholder, required: required, rows: rows, className: "form-textarea" })] }));
            break;
        }
        case 'store/promo-banner': {
            const text = attrs.text ?? 'Free shipping on orders over $50';
            const style = {};
            if (attrs.backgroundColor)
                style.backgroundColor = attrs.backgroundColor;
            if (attrs.textColor)
                style.color = attrs.textColor;
            if (attrs.fontFamily)
                style.fontFamily = attrs.fontFamily;
            if (attrs.fontSize)
                style.fontSize = attrs.fontSize;
            content = (_jsx("aside", { className: "block block-promo-banner", style: Object.keys(style).length ? style : undefined, children: _jsx("p", { className: "promo-banner-text", children: _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(text) } }) }) }));
            break;
        }
        case 'store/testimonials': {
            const title = attrs.title ?? 'What our customers say';
            const items = attrs.items ?? [];
            const style = {};
            if (attrs.fontFamily)
                style.fontFamily = attrs.fontFamily;
            if (attrs.textColor)
                style.color = attrs.textColor;
            const titleStyle = { ...style };
            if (attrs.titleFontSize)
                titleStyle.fontSize = attrs.titleFontSize;
            if (items.length) {
                content = (_jsxs("section", { className: "block block-testimonials", style: style, children: [_jsx("h3", { className: "testimonials-title", style: Object.keys(titleStyle).length > 1 ? titleStyle : undefined, children: isHtml(title) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(title) } }) : title }), _jsx("div", { className: "testimonials-grid", children: items.map((item, i) => (_jsxs("blockquote", { className: "testimonial-card", children: [typeof item.rating === 'number' && (_jsx("div", { className: "testimonial-stars", "aria-hidden": true, children: "★".repeat(Math.min(5, item.rating)) })), _jsxs("p", { className: "testimonial-quote", children: ["\"", isHtml(item.quote) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(item.quote) } }) : item.quote, "\""] }), _jsxs("cite", { className: "testimonial-author", children: ["\u2014 ", isHtml(item.author) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(item.author) } }) : item.author] })] }, i))) })] }));
            }
            break;
        }
        case 'store/trust-badges': {
            const items = attrs.items ?? [];
            const style = {};
            if (attrs.fontFamily)
                style.fontFamily = attrs.fontFamily;
            if (attrs.textColor)
                style.color = attrs.textColor;
            if (attrs.fontSize)
                style.fontSize = attrs.fontSize;
            if (items.length) {
                content = (_jsx("section", { className: "block block-trust-badges", style: style, children: _jsx("div", { className: "trust-badges-grid", children: items.map((item, i) => (_jsxs("div", { className: "trust-badge-item", children: [_jsx("span", { className: "trust-badge-icon", "aria-hidden": true, children: item.icon }), _jsx("span", { className: "trust-badge-text", children: isHtml(item.text) ? _jsx("span", { dangerouslySetInnerHTML: { __html: sanitizeHtml(item.text) } }) : item.text })] }, i))) }) }));
            }
            break;
        }
        default:
            break;
    }
    const children = block.children;
    const showChildren = renderChildren !== false && Array.isArray(children) && children.length > 0;
    if (!content && !showChildren)
        return null;
    const base = content ? wrapWithSpacing(content) : null;
    if (!showChildren)
        return base;
    return (_jsxs("div", { style: { position: 'relative', width: '100%', height: '100%', overflow: 'visible' }, children: [base, _jsx("div", { style: { position: 'absolute', inset: 0, pointerEvents: 'auto', overflow: 'visible' }, children: children.map((child) => {
                    const layerLayout = child.attributes?.layerLayout;
                    const xPct = typeof layerLayout?.xPct === 'number' ? layerLayout.xPct : 0;
                    const yPct = typeof layerLayout?.yPct === 'number' ? layerLayout.yPct : 0;
                    const wPct = typeof layerLayout?.wPct === 'number' ? layerLayout.wPct : 25;
                    const hPct = typeof layerLayout?.hPct === 'number' ? layerLayout.hPct : 10;
                    return (_jsx("div", { style: {
                            position: 'absolute',
                            left: `${xPct}%`,
                            top: `${yPct}%`,
                            width: `${wPct}%`,
                            height: `${hPct}%`,
                            overflow: 'visible',
                        }, children: _jsx(BlockRenderer, { block: child, apiBaseUrl: apiBaseUrl, useDemoData: useDemoData, renderChildren: renderChildren }) }, child.id));
                }) })] }));
}
