import type { Block } from '@berg/schema';
import { type StorefrontViewport } from './blockLayout';
interface Props {
    block: Block;
    apiBaseUrl?: string;
    useDemoData?: boolean;
    tenantId?: string;
    storeId?: string;
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
}
export declare function BlockRenderer({ block, apiBaseUrl, useDemoData, tenantId, storeId, renderChildren, layoutViewport }: Props): string | number | boolean | import("react/jsx-runtime").JSX.Element | Iterable<import("react").ReactNode> | null | undefined;
export {};
//# sourceMappingURL=BlockRenderer.d.ts.map