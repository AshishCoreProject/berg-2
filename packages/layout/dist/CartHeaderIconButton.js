import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Header cart control (SVG). Color: cartIconColor → linkColor → color → CSS accent.
 * Visibility: headerStyle.showCartIcon !== false.
 */
export function CartHeaderIconButton({ headerStyle, onClick, preview = false, }) {
    if (headerStyle?.showCartIcon === false)
        return null;
    const cartColor = headerStyle?.cartIconColor?.trim();
    const color = cartColor || headerStyle?.linkColor || headerStyle?.color || undefined;
    const handleClick = (e) => {
        if (preview) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        onClick?.();
    };
    return (_jsx("button", { type: "button", className: "site-header-cart-btn", "aria-label": "Shopping cart", onClick: handleClick, style: color ? { color } : undefined, children: _jsxs("svg", { className: "site-header-cart-svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, children: [_jsx("circle", { cx: "9", cy: "21", r: "1" }), _jsx("circle", { cx: "20", cy: "21", r: "1" }), _jsx("path", { d: "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" })] }) }));
}
