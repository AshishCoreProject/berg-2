/**
 * App configuration – env vars, constants, feature flags.
 * Centralizes all config for consistent behavior across apps.
 */

export const config = {
  /** Builder dev port */
  builderPort: 5173,
  /** Storefront dev port */
  storefrontPort: 5174,
  /** Default API base URL placeholder */
  defaultApiBaseUrl: 'https://api.example.com',
  /** Default accent color */
  defaultAccentColor: '#3b82f6',
  /** Default theme */
  defaultTheme: 'dark' as const,
  /** Max URL hash length (some browsers limit ~2k) */
  maxHashLength: 1900,
} as const;

export type Config = typeof config;
