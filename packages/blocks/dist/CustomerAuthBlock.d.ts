import type { AuthFormDefaults } from '@berg/core';
export interface CustomerAuthBlockProps {
    attrs: Record<string, unknown>;
    authApiBaseUrl?: string;
    authFormDefaults?: AuthFormDefaults;
    storeId?: string;
    onNavigate?: (path: string) => void;
    isBuilderPreview?: boolean;
}
export declare function CustomerAuthBlock({ attrs, authApiBaseUrl, authFormDefaults, storeId, onNavigate, isBuilderPreview, }: CustomerAuthBlockProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CustomerAuthBlock.d.ts.map