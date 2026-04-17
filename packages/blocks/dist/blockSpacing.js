const SPACING_KEYS = ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'];
/** Normalize value: "12" -> "12px", "1.5rem" -> "24px" (1rem=16px). Other strings pass through (e.g. auto). */
export function normalizeSpacingValue(v) {
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
export function buildSpacingStyle(attrs) {
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
