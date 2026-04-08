import type { HeaderFooterStyle } from "./types";
export interface CartHeaderIconButtonProps {
    headerStyle?: HeaderFooterStyle;
    /** Called when the user activates the cart control (ignored when preview is true). */
    onClick?: () => void;
    /** Builder canvas: show icon but do not navigate. */
    preview?: boolean;
}
/**
 * Header cart control (SVG). Color: cartIconColor → linkColor → color → CSS accent.
 * Visibility: headerStyle.showCartIcon !== false.
 */
export declare function CartHeaderIconButton({ headerStyle, onClick, preview, }: CartHeaderIconButtonProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=CartHeaderIconButton.d.ts.map