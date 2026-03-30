import type { FooterLinksConfig, StoredPage } from '@berg/schema';

export type HeaderFooterStyle = {
  backgroundColor?: string;
  color?: string;
  fontFamily?: string;
  linkColor?: string;
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
