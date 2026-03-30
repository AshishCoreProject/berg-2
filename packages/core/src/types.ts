/**
 * @berg/core – Shared types for storage, config, and store data.
 * Single source of truth for runtime data structures used across builder and storefront.
 */

import type { FooterLinksConfig, PagesStore } from '@berg/schema';

/** Style overrides for header, footer, or default buttons */
export interface StyleOverrides {
  backgroundColor?: string;
  color?: string;
  fontFamily?: string;
  linkColor?: string;
  borderRadius?: string;
  padding?: string;
}

/** Full store data: pages + site settings. Persisted to localStorage or API. */
export interface StoreData extends PagesStore {
  siteTitle?: string;
  homeSlug?: string;
  apiBaseUrl?: string;
  theme?: 'light' | 'dark';
  accentColor?: string;
  useDemoData?: boolean;
  headerStyle?: StyleOverrides;
  footerStyle?: StyleOverrides;
  buttonStyle?: StyleOverrides;
  /**
   * Footer links configuration (multi-column + bottom row).
   * This is footer-only UI/config and does not affect block data.
   */
  footerLinks?: FooterLinksConfig;
  /** Page IDs to hide from header/footer navigation */
  hiddenFromHeader?: string[];
}

/** Payload passed via URL hash when opening storefront from builder */
export interface HashPayload extends StoreData {
  openSlug?: string;
}

/** Storage adapter interface – allows swapping localStorage for API/IndexedDB */
export interface StorageAdapter {
  load(): Promise<StoreData | null>;
  save(data: StoreData): Promise<void>;
}
