import type { FooterLinksConfig, StoredPage } from '@berg/schema';

export type HeaderFooterStyle = {
  backgroundColor?: string;
  color?: string;
  fontFamily?: string;
  linkColor?: string;
  /**
   * Footer-only links color. When set, footer links prefer this over linkColor.
   */
  footerLinksColor?: string;
  /**
   * Optional brand logo image URL for the header/footer.
   */
  logoUrl?: string;
  /**
   * Whether to show the textual site title alongside the logo.
   * Defaults to true when undefined.
   */
  showTitle?: boolean;
  /**
   * Where to place the site title relative to the logo image when both are shown.
   * - "right": title to the right of the logo (default)
   * - "below": title below the logo
   * - "above": title above the logo
   */
  titlePosition?: 'right' | 'below' | 'above';
  /**
   * Spacing between logo image and logo text (for example: "8px", "0.5rem").
   */
  logoTextGap?: string;
  /**
   * Optional logo width in pixels.
   */
  logoWidthPx?: number;
  /**
   * Optional logo height in pixels.
   */
  logoHeightPx?: number;
  /**
   * Show cart icon in the header (storefront + builder preview). Defaults to true when undefined.
   */
  showCartIcon?: boolean;
  /**
   * Cart SVG stroke color. Falls back to linkColor, then color, then theme accent.
   */
  cartIconColor?: string;
  /**
   * Show account icon in the header (storefront + builder preview). Defaults to true when undefined.
   */
  showAccountIcon?: boolean;
  /**
   * Account SVG stroke color when using default icon. Falls back like cartIconColor.
   */
  accountIconColor?: string;
  /**
   * Optional custom account icon image URL (or data URL from upload).
   */
  accountIconUrl?: string;
  /**
   * Desktop main nav link group alignment (drawer unchanged on small screens).
   * Defaults to "right" when undefined (nav grouped toward cart/account).
   */
  navAlign?: 'left' | 'center' | 'right';
};

export type ViewportMode = 'auto' | 'desktop' | 'mobile';

export interface SharedHeaderProps {
  siteTitle: string;
  pages: StoredPage[];
  currentSlug: string | null;
  homeSlug: string;
  onNavigate?: (path: string) => void;
  headerStyle?: HeaderFooterStyle;
  hiddenFromHeader?: string[];
  viewportMode?: ViewportMode;
  rightSlot?: React.ReactNode;
  classNames?: Partial<{
    root: string;
    row: string;
    inner: string;
    logo: string;
    nav: string;
    navLink: string;
    navLinkActive: string;
    navToggle: string;
    navToggleIcon: string;
    navBackdrop: string;
    navDrawer: string;
    navDrawerHeader: string;
    navDrawerTitle: string;
    navClose: string;
    navDrawerLinks: string;
    navDrawerLink: string;
    navDrawerLinkActive: string;
  }>;
}

export interface SharedFooterProps {
  siteTitle: string;
  pages: StoredPage[];
  homeSlug: string;
  onNavigate?: (path: string) => void;
  footerStyle?: HeaderFooterStyle;
  hiddenFromHeader?: string[];
  footerLinks?: FooterLinksConfig;
  viewportMode?: ViewportMode;
  className?: string;
}
