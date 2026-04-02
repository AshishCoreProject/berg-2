/**
 * @berg/schema – Block-based page schema (Gutenberg-style).
 * Versioned, serializable, SEO-friendly. Builder writes this; Storefront reads it.
 */
export declare const SCHEMA_VERSION = 1;
/** Block type identifiers – extend this for new blocks. */
export type BlockType = 'core/box' | 'core/paragraph' | 'core/heading' | 'core/image' | 'core/button' | 'core/columns' | 'core/column' | 'core/hero' | 'core/spacer' | 'core/divider' | 'core/list' | 'core/quote' | 'core/custom' | 'core/form' | 'core/form-input' | 'core/form-select' | 'core/form-textarea' | 'store/product-grid' | 'store/collection-list' | 'store/newsletter' | 'store/promo-banner' | 'store/testimonials' | 'store/trust-badges';
/** Base block: every block has id, type, and optional attributes. */
export interface BaseBlock {
    id: string;
    type: BlockType;
    attributes?: Record<string, unknown>;
    /**
     * Optional layer-style children (Figma-like). When present, builder can render
     * them as absolutely-positioned overlays inside this block.
     *
     * Note: structural nesting uses `innerBlocks` (e.g. columns/forms) and is handled separately.
     */
    children?: Block[];
}
/** Blocks that can contain other blocks (e.g. columns). */
export interface InnerBlocksBlock extends BaseBlock {
    innerBlocks?: Block[];
}
export type Block = BaseBlock | InnerBlocksBlock;
/** Root page document – SEO meta + ordered blocks. */
export interface PageDocument {
    version: number;
    meta: PageMeta;
    blocks: Block[];
}
export interface PageMeta {
    title: string;
    description?: string;
    /** For OG and Twitter cards (optional). */
    image?: string;
}
/** Type guards */
export declare function isInnerBlocksBlock(b: Block): b is InnerBlocksBlock;
/** A page stored in the app (builder + storefront). Identified by id and slug for URLs. */
export interface StoredPage {
    id: string;
    slug: string;
    document: PageDocument;
    /** When false, page is not visible on storefront. Defaults to true. */
    published?: boolean;
}
/** Multi-page store (localStorage or API). */
export interface PagesStore {
    pages: StoredPage[];
}
/** Site-level settings (entire website). */
export interface SiteSettings {
    /** Display name for the website (e.g. in header). */
    siteTitle?: string;
    /** Slug of the page used as the home page at `/` or `#/`. */
    homeSlug?: string;
    /** Backend API base URL (e.g. 'https://api.example.com' or 'http://localhost:3000/api'). */
    apiBaseUrl?: string;
}
/** Footer link item (label + URL) */
export interface FooterLinkItem {
    id: string;
    label: string;
    url: string;
    /**
     * If true, open in a new tab with `rel="noopener noreferrer"`.
     * For internal links, we normally let the SPA handle navigation.
     */
    openInNewTab?: boolean;
}
/** A column of footer links under a heading (e.g. "Shop"). */
export interface FooterLinkColumn {
    id: string;
    title: string;
    /** Optional color for the column heading (e.g. '#ffffff'). */
    titleColor?: string;
    /** Optional background color for the column heading (e.g. '#111827'). */
    titleBackgroundColor?: string;
    links: FooterLinkItem[];
}
/** Footer brand content on the left side. */
export interface FooterBrand {
    subtitle?: string;
    cta?: FooterLinkItem;
}
/** Config for the footer's multi-column link layout. */
export interface FooterLinksConfig {
    brand?: FooterBrand;
    columns: FooterLinkColumn[];
    /** Links rendered in the bottom right row (e.g. "Privacy", "Terms"). */
    bottomLinks: FooterLinkItem[];
}
/** Generate a simple unique id for new blocks. */
export declare function createBlockId(): string;
/** Generate a unique page id. */
export declare function createPageId(): string;
/** Generate a unique id for footer link items. */
export declare function createFooterLinkId(): string;
/** Slugify a string for URL-safe slug (lowercase, hyphens, no special chars). */
export declare function slugify(text: string): string;
/** Ensure slug is unique among existing slugs; append -2, -3, etc. if needed. */
export declare function uniqueSlug(slug: string, existingSlugs: Set<string>): string;
//# sourceMappingURL=types.d.ts.map