/** Reserved storefront paths for customer auth; slugs must not be renamed. */
export const FIXED_AUTH_SLUGS = new Set(['login', 'register']);

export function isFixedAuthSlug(slug: string): boolean {
  return FIXED_AUTH_SLUGS.has(slug);
}
