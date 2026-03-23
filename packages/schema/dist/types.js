/**
 * @berg/schema – Block-based page schema (Gutenberg-style).
 * Versioned, serializable, SEO-friendly. Builder writes this; Storefront reads it.
 */
export const SCHEMA_VERSION = 1;
/** Type guards */
export function isInnerBlocksBlock(b) {
    return 'innerBlocks' in b && Array.isArray(b.innerBlocks);
}
/** Generate a simple unique id for new blocks. */
export function createBlockId() {
    return `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
/** Generate a unique page id. */
export function createPageId() {
    return `page-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
/** Slugify a string for URL-safe slug (lowercase, hyphens, no special chars). */
export function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'page';
}
/** Ensure slug is unique among existing slugs; append -2, -3, etc. if needed. */
export function uniqueSlug(slug, existingSlugs) {
    let s = slug;
    let n = 1;
    while (existingSlugs.has(s)) {
        s = `${slug}-${++n}`;
    }
    return s;
}
