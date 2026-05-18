import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Header account control: custom image or default user SVG.
 * Color: accountIconColor → linkColor → color → CSS accent.
 * Visibility: headerStyle.showAccountIcon !== false.
 */
export function AccountHeaderIconButton({ headerStyle, onClick, preview = false, }) {
    if (headerStyle?.showAccountIcon === false)
        return null;
    const customUrl = headerStyle?.accountIconUrl?.trim();
    const strokeColor = headerStyle?.accountIconColor?.trim();
    const color = strokeColor || headerStyle?.linkColor || headerStyle?.color || undefined;
    const handleClick = (e) => {
        if (preview) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        onClick?.();
    };
    return (_jsx("button", { type: "button", className: "site-header-account-btn", "aria-label": "Account", onClick: handleClick, style: color ? { color } : undefined, children: customUrl ? (_jsx("img", { className: "site-header-account-img", src: customUrl, alt: "", width: 22, height: 22, draggable: false })) : (_jsxs("svg", { className: "site-header-account-svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("circle", { cx: "12", cy: "9", r: "3.5" }), _jsx("path", { d: "M4 19 Q 12 13 20 19" })] })) }));
}
