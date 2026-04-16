import type { HeaderFooterStyle } from "./types";
export interface AccountHeaderIconButtonProps {
    headerStyle?: HeaderFooterStyle;
    onClick?: () => void;
    preview?: boolean;
}
/**
 * Header account control: custom image or default user SVG.
 * Color: accountIconColor → linkColor → color → CSS accent.
 * Visibility: headerStyle.showAccountIcon !== false.
 */
export declare function AccountHeaderIconButton({ headerStyle, onClick, preview, }: AccountHeaderIconButtonProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=AccountHeaderIconButton.d.ts.map