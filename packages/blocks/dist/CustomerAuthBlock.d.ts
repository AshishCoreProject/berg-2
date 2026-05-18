import type { AuthFormDefaults } from '@berg/core';
export interface CustomerAuthBlockProps {
    attrs: Record<string, unknown>;
    authApiBaseUrl?: string;
    authFormDefaults?: AuthFormDefaults;
    /** Store id sent in login/register JSON body. */
    storeId?: string;
    /** Fallback tenant segment for guest cart key when cartGuestStorageTenantId is omitted. */
    tenantId?: string;
    /**
     * Tenant segment for reading cart guest id from localStorage (should match CartProvider).
     */
    cartGuestStorageTenantId?: string;
    /**
     * Store segment for reading cart guest id from localStorage (should match CartProvider storeId).
     */
    cartGuestStorageStoreId?: string;
    onNavigate?: (path: string) => void;
    isBuilderPreview?: boolean;
    /**
     * When true (storefront with API cart + non-empty guest cart), login requires a guest id in
     * localStorage; otherwise the form shows an error and does not call the auth API.
     */
    requireGuestCartIdForLogin?: boolean;
}
export declare function CustomerAuthBlock({ attrs, authApiBaseUrl, authFormDefaults, storeId, tenantId, cartGuestStorageTenantId, cartGuestStorageStoreId, onNavigate, isBuilderPreview, requireGuestCartIdForLogin, }: CustomerAuthBlockProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CustomerAuthBlock.d.ts.map