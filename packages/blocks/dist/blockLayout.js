/**
 * Grid layout from builder: stored per viewport in `layoutByViewport`, legacy `layout` for old pages.
 */
function asLayoutSlice(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const o = raw;
    const x = typeof o.x === 'number' ? o.x : undefined;
    const y = typeof o.y === 'number' ? o.y : undefined;
    const w = typeof o.w === 'number' ? o.w : undefined;
    const h = typeof o.h === 'number' ? o.h : undefined;
    if (x === undefined && y === undefined && w === undefined && h === undefined)
        return undefined;
    return { x, y, w, h };
}
/**
 * Resolves grid geometry for storefront: per-field merge viewport → desktop → legacy `layout`.
 */
export function resolveGridLayout(attrs, viewport) {
    if (!attrs)
        return undefined;
    const byVp = attrs.layoutByViewport;
    const legacy = attrs.layout;
    const vp = asLayoutSlice(byVp?.[viewport]);
    const desk = asLayoutSlice(byVp?.desktop);
    const leg = asLayoutSlice(legacy);
    const merged = {
        x: vp?.x ?? desk?.x ?? leg?.x,
        y: vp?.y ?? desk?.y ?? leg?.y,
        w: vp?.w ?? desk?.w ?? leg?.w,
        h: vp?.h ?? desk?.h ?? leg?.h,
    };
    if (merged.x === undefined &&
        merged.y === undefined &&
        merged.w === undefined &&
        merged.h === undefined) {
        return undefined;
    }
    return merged;
}
