import type { Block } from '@berg/schema';
import type { AuthFormDefaults } from '@berg/core';
import { type StorefrontViewport } from './blockLayout';
interface Props {
    block: Block;
    apiBaseUrl?: string;
    useDemoData?: boolean;
    tenantId?: string;
    storeId?: string;
    authApiBaseUrl?: string;
    authFormDefaults?: AuthFormDefaults;
    onNavigate?: (path: string) => void;
    isBuilderPreview?: boolean;
    /**
     * Which `layoutByViewport` bucket to use for grid-derived sizing (e.g. core/box min-height).
     * Storefront passes `useStorefrontViewport()`; builder omits (defaults to desktop).
     */
    layoutViewport?: StorefrontViewport;
    /**
     * When false, skip rendering `block.children` overlay.
     * Used by builder to render a clean parent surface and draw children via
     * its own overlay UI.
     */
    renderChildren?: boolean;
    /**
     * When false, margin/padding from attributes are not wrapped in an inner div;
     * the grid/storefront cell (or other host) should apply `buildSpacingStyle(attrs)` instead.
     */
    applySpacingWrapper?: boolean;
}
export declare function BlockRenderer({ block, apiBaseUrl, useDemoData, tenantId, storeId, authApiBaseUrl, authFormDefaults, onNavigate, isBuilderPreview, renderChildren, applySpacingWrapper, layoutViewport, }: Props): string | number | boolean | import("react/jsx-runtime").JSX.Element | Iterable<import("react").ReactNode> | null | undefined;
export {};
//# sourceMappingURL=BlockRenderer.d.ts.map