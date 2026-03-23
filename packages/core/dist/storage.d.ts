/**
 * Storage layer – localStorage implementation with adapter interface.
 * Swap implementation for API/IndexedDB in enterprise deployments.
 */
import type { StoreData, StorageAdapter } from './types.js';
export declare const STORAGE_KEY = "berg-pages";
/** Sync load – for backward compatibility. Uses localStorage directly. */
export declare function loadStore(): StoreData;
/** Load pages only */
export declare function loadPages(): StoreData['pages'];
/** Save pages only (merge with existing store) */
export declare function savePages(pages: StoreData['pages']): void;
/** Sync save – for backward compatibility. */
export declare function saveStore(data: StoreData): void;
/** Async adapter for future API/IndexedDB integration */
export declare const localStorageAdapter: StorageAdapter;
//# sourceMappingURL=storage.d.ts.map