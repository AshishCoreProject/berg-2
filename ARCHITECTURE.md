# Berg – Enterprise Architecture

This document describes the scalable, enterprise-grade architecture of Berg.

## Package Structure

```
berg/
├── packages/
│   ├── schema/     @berg/schema   – Block types, registry, page document (data contract)
│   └── core/       @berg/core     – Storage, config, logging, hash utilities (runtime)
├── apps/
│   ├── builder/    – Admin UI for creating/editing pages
│   └── storefront/ – Public-facing site
└── package.json    – Workspace root, orchestration scripts
```

## App Folder Structure

Both apps follow a feature-based layout with `@/` path alias:

**Builder:**
```
src/
├── components/       # Reusable UI
│   ├── blocks/       # BlockEditor, BlockToolbarSidebar, BlockInserter, BlockDragHandle
│   ├── controls/     # TypographyControls, ButtonStyleControls, StyleEditor, TextEditor
│   └── canvas/       # GridCanvas, ResizableSpacer
├── features/         # Domain-specific
│   ├── pages/        # PageList, PageMetaEditor
│   ├── settings/     # SiteSettings
│   └── layout/       # BuilderHeaderPreview, BuilderFooterPreview
├── lib/              # Utilities
│   ├── storage.ts    # Re-export from @berg/core
│   ├── createDemoStore.ts
│   └── autoPlace.ts
├── App.tsx, main.tsx, ErrorBoundary.tsx
└── *.css
```

**Storefront:**
```
src/
├── components/
│   ├── layout/       # SiteHeader, SiteFooter
│   └── blocks/       # BlockRenderer, ProductGrid, CollectionList, ProductDetailPage
├── data/             # demoData.ts (products, collections)
├── lib/
│   ├── storage.ts
│   └── sanitizeHtml.ts
├── App.tsx, main.tsx, ErrorBoundary.tsx
└── *.css
```

## Layers

| Layer | Package | Responsibility |
|-------|---------|----------------|
| **Schema** | @berg/schema | Types, block registry, document structure. Zero runtime deps. |
| **Core** | @berg/core | Storage adapter, config, logger, hash encode/decode. Swap for API/IndexedDB. |
| **Apps** | builder, storefront | UI only. Import from schema + core. |

## Extensibility Points

### 1. Storage Adapter

`@berg/core` exposes `StorageAdapter`:

```ts
interface StorageAdapter {
  load(): Promise<StoreData | null>;
  save(data: StoreData): Promise<void>;
}
```

Default: `localStorageAdapter` (sync wrappers: `loadStore`, `saveStore`).  
Enterprise: Implement `StorageAdapter` backed by REST API, GraphQL, or IndexedDB.

### 2. Logging

`logger` in `@berg/core` is a simple console abstraction. Replace with Sentry, DataDog, or custom backend by wrapping/replacing the module.

### 3. Config

`config` in `@berg/core` holds constants. Extend or override for env-specific values (API URLs, feature flags).

## Error Handling

- **ErrorBoundary**: Both apps wrap root in `ErrorBoundary`. Catches React render errors and logs via `logger`.
- **Storage errors**: Caught in `loadStore`/`saveStore`; logged; return safe defaults.

## Build & CI

```bash
npm run build       # schema → core → apps (order enforced)
npm run typecheck   # Type-check all workspaces
```

Recommended CI: `npm run build && npm run typecheck`.

## Adding a New Block

1. **Schema**: Add type to `BlockType`, entry in `BLOCK_REGISTRY`.
2. **Builder**: Add case in `BlockEditor` + `BlockToolbarSidebar`.
3. **Storefront**: Add case in `BlockRenderer`.

Single source of truth: `@berg/schema`.
