/**
 * URL hash payload – encode/decode store data for storefront handoff.
 * Used when builder opens storefront and passes data via hash.
 */
import type { HashPayload } from './types.js';
export declare function encodeHashPayload(data: HashPayload): string;
export declare function parseHashPayload(hash: string): HashPayload | null;
//# sourceMappingURL=hash.d.ts.map