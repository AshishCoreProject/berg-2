import type { FooterLinkItem, FooterLinksConfig, StoredPage } from '@berg/schema';
import type { HeaderFooterStyle, ViewportMode } from './types';
export declare function toHeaderFooterCss(style?: HeaderFooterStyle): React.CSSProperties;
export declare function toLinkCss(style?: HeaderFooterStyle): React.CSSProperties;
export declare function resolveViewportMatch(mode: ViewportMode | undefined, maxWidthPx: number): boolean;
export declare function useViewportMatch(mode: ViewportMode | undefined, maxWidthPx: number): boolean;
export declare function isInternalUrl(url: string): boolean;
export declare function defaultFooterLinkItem(label: string, url: string): FooterLinkItem;
export declare function buildDefaultFooterLinks(pages: StoredPage[], homeSlug: string): FooterLinksConfig;
export declare function normalizeFooterConfig(cfg: FooterLinksConfig, pages: StoredPage[], hiddenFromHeader?: string[]): {
    columns: {
        links: FooterLinkItem[];
        id: string;
        title: string;
        titleColor?: string;
        titleBackgroundColor?: string;
    }[];
    brand?: import("@berg/schema").FooterBrand;
    bottomLinks: FooterLinkItem[];
};
//# sourceMappingURL=utils.d.ts.map