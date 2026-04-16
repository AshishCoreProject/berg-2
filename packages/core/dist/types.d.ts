/**
 * @berg/core – Shared types for storage, config, and store data.
 * Single source of truth for runtime data structures used across builder and storefront.
 */
import type { FooterLinksConfig, PagesStore } from '@berg/schema';
/** Site-wide defaults for customer auth forms (login/register blocks merge these when attrs are empty). */
export interface AuthFormDefaults {
    emailLabel?: string;
    emailPlaceholder?: string;
    passwordLabel?: string;
    passwordPlaceholder?: string;
    loginSubmitText?: string;
    registerSubmitText?: string;
}
/** Style overrides for header, footer, or default buttons */
export interface StyleOverrides {
    backgroundColor?: string;
    color?: string;
    fontFamily?: string;
    linkColor?: string;
    borderRadius?: string;
    padding?: string;
    /** Header cart icon visibility (default true). */
    showCartIcon?: boolean;
    /** Cart icon stroke color (optional; falls back to link color). */
    cartIconColor?: string;
    /** Header account icon visibility (default true). */
    showAccountIcon?: boolean;
    /** Account icon color for default SVG (optional; falls back like cart). */
    accountIconColor?: string;
    /** Custom account icon image URL or data URL. */
    accountIconUrl?: string;
}
/** Full store data: pages + site settings. Persisted to localStorage or API. */
export interface StoreData extends PagesStore {
    siteTitle?: string;
    homeSlug?: string;
    apiBaseUrl?: string;
    /** Cart/checkout API tenant id (sent as tenant_id query param). */
    tenantId?: string;
    /** Cart/checkout API: sent as store_id query param when using cart-checkout-plugin API mode. */
    storeId?: string;
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
    /** BaaS customer auth API origin (no trailing path). */
    authApiBaseUrl?: string;
    /** Default labels/placeholders/submit copy for store/customer-auth blocks. */
    authFormDefaults?: AuthFormDefaults;
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
//# sourceMappingURL=types.d.ts.map