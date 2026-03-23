/**
 * Logging abstraction – structured, swappable.
 * Replace with Sentry, DataDog, etc. in enterprise deployments.
 */
const prefix = (scope) => `[Berg:${scope}]`;
export const logger = {
    debug: (scope, message, ...args) => console.debug(prefix(scope), message, ...args),
    info: (scope, message, ...args) => console.info(prefix(scope), message, ...args),
    warn: (scope, message, ...args) => console.warn(prefix(scope), message, ...args),
    error: (scope, message, ...args) => console.error(prefix(scope), message, ...args),
};
