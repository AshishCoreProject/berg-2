/**
 * Storage layer – localStorage implementation with adapter interface.
 * Swap implementation for API/IndexedDB in enterprise deployments.
 */
import { logger } from './logger.js';
export const STORAGE_KEY = 'berg-pages';
function isStoredPage(p) {
    return (typeof p === 'object' &&
        p !== null &&
        'id' in p &&
        'slug' in p &&
        'document' in p);
}
function isFooterLinksConfig(v) {
    if (typeof v !== 'object' || v === null)
        return false;
    const o = v;
    return Array.isArray(o.columns) && Array.isArray(o.bottomLinks);
}
function parseStore(raw) {
    const data = JSON.parse(raw);
    const pages = Array.isArray(data) ? data : data.pages ?? [];
    const store = data;
    return {
        pages: Array.isArray(pages) ? pages.filter(isStoredPage) : [],
        siteTitle: store.siteTitle,
        homeSlug: store.homeSlug,
        apiBaseUrl: store.apiBaseUrl,
        tenantId: store.tenantId,
        storeId: store.storeId,
        theme: store.theme,
        accentColor: store.accentColor,
        useDemoData: store.useDemoData,
        headerStyle: store.headerStyle,
        footerStyle: store.footerStyle,
        buttonStyle: store.buttonStyle,
        footerLinks: isFooterLinksConfig(store.footerLinks) ? store.footerLinks : undefined,
        hiddenFromHeader: Array.isArray(store.hiddenFromHeader) ? store.hiddenFromHeader : undefined,
    };
}
/** Sync load – for backward compatibility. Uses localStorage directly. */
export function loadStore() {
    try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        if (raw)
            return parseStore(raw);
    }
    catch (err) {
        logger.error('storage', 'Failed to load store', err);
    }
    return { pages: [] };
}
/** Load pages only */
export function loadPages() {
    return loadStore().pages;
}
/** Save pages only (merge with existing store) */
export function savePages(pages) {
    const prev = loadStore();
    saveStore({ ...prev, pages });
}
/** Sync save – for backward compatibility. */
export function saveStore(data) {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    }
    catch (err) {
        logger.error('storage', 'Failed to save store', err);
        throw err;
    }
}
/** Async adapter for future API/IndexedDB integration */
export const localStorageAdapter = {
    async load() {
        try {
            const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
            return raw ? parseStore(raw) : null;
        }
        catch (err) {
            logger.error('storage', 'Failed to load store', err);
            return null;
        }
    },
    async save(data) {
        saveStore(data);
    },
};
