/**
 * Storage layer – localStorage implementation with adapter interface.
 * Swap implementation for API/IndexedDB in enterprise deployments.
 */

import type { StoreData, StorageAdapter } from './types.js';
import type { StoredPage } from '@berg/schema';
import { logger } from './logger.js';

export const STORAGE_KEY = 'berg-pages';

function isStoredPage(p: unknown): p is StoredPage {
  return (
    typeof p === 'object' &&
    p !== null &&
    'id' in p &&
    'slug' in p &&
    'document' in p
  );
}

function parseStore(raw: string): StoreData {
  const data = JSON.parse(raw) as StoreData | { pages?: unknown[] };
  const pages = Array.isArray(data) ? data : (data as StoreData).pages ?? [];
  const store = data as StoreData;
  return {
    pages: Array.isArray(pages) ? pages.filter(isStoredPage) : [],
    siteTitle: store.siteTitle,
    homeSlug: store.homeSlug,
    apiBaseUrl: store.apiBaseUrl,
    theme: store.theme,
    accentColor: store.accentColor,
    useDemoData: store.useDemoData,
    headerStyle: store.headerStyle,
    footerStyle: store.footerStyle,
    buttonStyle: store.buttonStyle,
    hiddenFromHeader: Array.isArray(store.hiddenFromHeader) ? store.hiddenFromHeader : undefined,
  };
}

/** Sync load – for backward compatibility. Uses localStorage directly. */
export function loadStore(): StoreData {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) return parseStore(raw);
  } catch (err) {
    logger.error('storage', 'Failed to load store', err);
  }
  return { pages: [] };
}

/** Load pages only */
export function loadPages(): StoreData['pages'] {
  return loadStore().pages;
}

/** Save pages only (merge with existing store) */
export function savePages(pages: StoreData['pages']): void {
  const prev = loadStore();
  saveStore({ ...prev, pages });
}

/** Sync save – for backward compatibility. */
export function saveStore(data: StoreData): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (err) {
    logger.error('storage', 'Failed to save store', err);
    throw err;
  }
}

/** Async adapter for future API/IndexedDB integration */
export const localStorageAdapter: StorageAdapter = {
  async load(): Promise<StoreData | null> {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      return raw ? parseStore(raw) : null;
    } catch (err) {
      logger.error('storage', 'Failed to load store', err);
      return null;
    }
  },
  async save(data: StoreData): Promise<void> {
    saveStore(data);
  },
};
