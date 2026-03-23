/**
 * Logging abstraction – structured, swappable.
 * Replace with Sentry, DataDog, etc. in enterprise deployments.
 */

const prefix = (scope: string) => `[Berg:${scope}]`;

export const logger = {
  debug: (scope: string, message: string, ...args: unknown[]) =>
    console.debug(prefix(scope), message, ...args),
  info: (scope: string, message: string, ...args: unknown[]) =>
    console.info(prefix(scope), message, ...args),
  warn: (scope: string, message: string, ...args: unknown[]) =>
    console.warn(prefix(scope), message, ...args),
  error: (scope: string, message: string, ...args: unknown[]) =>
    console.error(prefix(scope), message, ...args),
};
