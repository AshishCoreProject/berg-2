/**
 * App configuration – env vars, constants, feature flags.
 * Centralizes all config for consistent behavior across apps.
 */
export declare const config: {
    /** Builder dev port */
    readonly builderPort: 5173;
    /** Storefront dev port */
    readonly storefrontPort: 5174;
    /** Default API base URL placeholder */
    readonly defaultApiBaseUrl: "https://api.example.com";
    /** Default accent color */
    readonly defaultAccentColor: "#3b82f6";
    /** Default theme */
    readonly defaultTheme: "dark";
    /** Max URL hash length (some browsers limit ~2k) */
    readonly maxHashLength: 1900;
};
export type Config = typeof config;
//# sourceMappingURL=config.d.ts.map