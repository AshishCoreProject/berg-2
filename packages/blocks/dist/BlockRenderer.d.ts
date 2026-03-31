import type { Block } from '@berg/schema';
interface Props {
    block: Block;
    apiBaseUrl?: string;
    useDemoData?: boolean;
    /**
     * When false, skip rendering `block.children` overlay.
     * Used by builder to render a clean parent surface and draw children via
     * its own overlay UI.
     */
    renderChildren?: boolean;
}
export declare function BlockRenderer({ block, apiBaseUrl, useDemoData, renderChildren }: Props): string | number | boolean | import("react/jsx-runtime").JSX.Element | Iterable<import("react").ReactNode> | null | undefined;
export {};
//# sourceMappingURL=BlockRenderer.d.ts.map