/**
 * Logging abstraction – structured, swappable.
 * Replace with Sentry, DataDog, etc. in enterprise deployments.
 */
export declare const logger: {
    debug: (scope: string, message: string, ...args: unknown[]) => void;
    info: (scope: string, message: string, ...args: unknown[]) => void;
    warn: (scope: string, message: string, ...args: unknown[]) => void;
    error: (scope: string, message: string, ...args: unknown[]) => void;
};
//# sourceMappingURL=logger.d.ts.map