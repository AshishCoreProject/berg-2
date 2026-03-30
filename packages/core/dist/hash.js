/**
 * URL hash payload – encode/decode store data for storefront handoff.
 * Used when builder opens storefront and passes data via hash.
 */
import { logger } from './logger.js';
import { config } from './config.js';
export function encodeHashPayload(data) {
    try {
        const json = JSON.stringify(data);
        const encoded = encodeURIComponent(json);
        if (encoded.length > config.maxHashLength) {
            logger.warn('hash', 'Payload exceeds safe hash length', { length: encoded.length });
        }
        return encoded;
    }
    catch (err) {
        logger.error('hash', 'Failed to encode hash payload', err);
        throw err;
    }
}
export function parseHashPayload(hash) {
    try {
        if (!hash || typeof hash !== 'string')
            return null;
        const decoded = decodeURIComponent(hash.replace(/^#/, ''));
        const data = JSON.parse(decoded);
        if (!data || !Array.isArray(data.pages))
            return null;
        return {
            pages: data.pages,
            siteTitle: data.siteTitle,
            homeSlug: data.homeSlug,
            apiBaseUrl: data.apiBaseUrl,
            theme: data.theme,
            accentColor: data.accentColor,
            useDemoData: data.useDemoData,
            openSlug: data.openSlug,
            headerStyle: data.headerStyle,
            footerStyle: data.footerStyle,
            footerLinks: data.footerLinks,
            buttonStyle: data.buttonStyle,
            hiddenFromHeader: Array.isArray(data.hiddenFromHeader) ? data.hiddenFromHeader : undefined,
        };
    }
    catch {
        return null;
    }
}
