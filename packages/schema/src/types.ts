/**
 * @berg/schema – Block-based page schema (Gutenberg-style).
 * Versioned, serializable, SEO-friendly. Builder writes this; Storefront reads it.
 */

export const SCHEMA_VERSION = 1;

/** Block type identifiers – extend this for new blocks. */
export type BlockType =
  | 'core/paragraph'
  | 'core/heading'
  | 'core/image'
  | 'core/button'
  | 'core/columns'
  | 'core/column'
  | 'core/hero'
  | 'core/spacer'
  | 'core/divider'
  | 'core/list'
  | 'core/quote'
  | 'core/custom'
  | 'core/form'
  | 'core/form-input'
  | 'core/form-select'
  | 'core/form-textarea'
  | 'store/product-grid'
  | 'store/collection-list'
  | 'store/newsletter'
  | 'store/promo-banner'
  | 'store/testimonials'
  | 'store/trust-badges';

/** Base block: every block has id, type, and optional attributes. */
export interface BaseBlock {
  id: string;
  type: BlockType;
  attributes?: Record<string, unknown>;
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
export function isInnerBlocksBlock(b: Block): b is InnerBlocksBlock {
  return 'innerBlocks' in b && Array.isArray((b as InnerBlocksBlock).innerBlocks);
}

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

/** Generate a simple unique id for new blocks. */
export function createBlockId(): string {
  return `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Generate a unique page id. */
export function createPageId(): string {
  return `page-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Slugify a string for URL-safe slug (lowercase, hyphens, no special chars). */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'page';
}

/** Ensure slug is unique among existing slugs; append -2, -3, etc. if needed. */
export function uniqueSlug(slug: string, existingSlugs: Set<string>): string {
  let s = slug;
  let n = 1;
  while (existingSlugs.has(s)) {
    s = `${slug}-${++n}`;
  }
  return s;
}
