/**
 * Grid layout from builder: stored per viewport in `layoutByViewport`, legacy `layout` for old pages.
 */
export type StorefrontViewport = 'desktop' | 'tablet' | 'mobile';
export type GridLayoutSlice = {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
};
/**
 * Resolves grid geometry for storefront: per-field merge viewport → desktop → legacy `layout`.
 */
export declare function resolveGridLayout(attrs: Record<string, unknown> | undefined, viewport: StorefrontViewport): GridLayoutSlice | undefined;
//# sourceMappingURL=blockLayout.d.ts.map