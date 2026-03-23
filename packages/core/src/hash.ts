/**
 * URL hash payload – encode/decode store data for storefront handoff.
 * Used when builder opens storefront and passes data via hash.
 */

import type { HashPayload } from './types.js';
import { logger } from './logger.js';
import { config } from './config.js';

export function encodeHashPayload(data: HashPayload): string {
  try {
    const json = JSON.stringify(data);
    const encoded = encodeURIComponent(json);
    if (encoded.length > config.maxHashLength) {
      logger.warn('hash', 'Payload exceeds safe hash length', { length: encoded.length });
    }
    return encoded;
  } catch (err) {
    logger.error('hash', 'Failed to encode hash payload', err);
    throw err;
  }
}

export function parseHashPayload(hash: string): HashPayload | null {
  try {
    if (!hash || typeof hash !== 'string') return null;
    const decoded = decodeURIComponent(hash.replace(/^#/, ''));
    const data = JSON.parse(decoded) as Record<string, unknown>;
    if (!data || !Array.isArray(data.pages)) return null;

    return {
      pages: data.pages,
      siteTitle: data.siteTitle as string | undefined,
      homeSlug: data.homeSlug as string | undefined,
      apiBaseUrl: data.apiBaseUrl as string | undefined,
      theme: data.theme as HashPayload['theme'],
      accentColor: data.accentColor as string | undefined,
      useDemoData: data.useDemoData as boolean | undefined,
      openSlug: data.openSlug as string | undefined,
      headerStyle: data.headerStyle as HashPayload['headerStyle'],
      footerStyle: data.footerStyle as HashPayload['footerStyle'],
      buttonStyle: data.buttonStyle as HashPayload['buttonStyle'],
      hiddenFromHeader: Array.isArray(data.hiddenFromHeader) ? data.hiddenFromHeader : undefined,
    };
  } catch {
    return null;
  }
}
