/**
 * Re-export from @berg/core. Use lib/pagesStorage for explicit imports.
 * @deprecated Prefer importing from '@berg/core' or './lib/pagesStorage'
 */
export {
  loadStore,
  saveStore,
  loadPages,
  savePages,
  parseHashPayload,
  STORAGE_KEY as PAGES_STORAGE_KEY,
} from '@berg/core';
export type { StoreData, HashPayload } from '@berg/core';
