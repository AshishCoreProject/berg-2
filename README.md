# Berg – Gutenberg-style page builder & storefront

Two-app storefront: **Builder** (create/edit pages) and **Storefront** (read/render pages). Frontend-only for now; designed to be scalable, optimized, and SEO-friendly.

## Overview

- **Builder** (port 5173): Build your **entire website**. Set a **site name** (shown in the storefront header). Create multiple **pages** (add, select, delete, **Set as home**). Each page has its own content (meta + blocks). Slug is derived from page title. Saves to `localStorage` and can open the storefront.
- **Storefront** (port 5174): Your **live website** with **clean URLs**. **`/`** is the **home page** (the page you set as home). **`/about`**, **`/contact`**, etc. are other pages (using their slugs). A **site header** on every page shows the site name and links to all pages (Home, About, …), so visitors can navigate the whole site. No “list of pages” — it behaves like a real website.

## Quick start

```bash
# Install (from repo root)
npm install

# Build shared schema first
npm run build -w @berg/schema

# Run builder
npm run dev:builder

# In another terminal: run storefront
npm run dev:storefront
```

- Open http://localhost:5173 → add pages, build content → click **View storefront** to open the storefront (all pages are passed via URL hash and stored; you land on the current page or the list).

## Project structure

```
berg/
├── packages/
│   └── schema/          # @berg/schema – block types, PageDocument, registry
├── apps/
│   ├── builder/         # Page builder (Gutenberg-like)
│   └── storefront/      # Public page renderer (SEO-friendly)
├── package.json         # Workspace root
└── README.md
```

## Schema (scalable & versioned)

- **`StoredPage`**: `{ id, slug, document: PageDocument }` – one entry per page; slug used in storefront URLs (`/:slug` for pages, `/` for home).
- **`PageDocument`**: `{ version, meta: { title, description?, image? }, blocks: Block[] }`
- **`Block`**: `{ id, type, attributes?, innerBlocks? }`
- **Block types**: `core/paragraph`, `core/heading`, `core/image`, `core/button`, `core/columns`, `core/column`, `core/hero`, `core/spacer`, `core/divider`, `core/list`, `core/quote`
- **`@berg/schema`** exposes types, `createBlockId()`, `getBlockDefinition()`, `BLOCK_REGISTRY`. Adding a new block = add type to `BlockType`, add definition in `block-registry.ts`, then implement editor UI in builder and renderer in storefront.

## SEO

- Storefront uses semantic HTML and heading hierarchy.
- Page title and meta description are set from `meta` (and can be extended to OG/Twitter when you add a backend).
- Image blocks use `alt` and optional caption. Links use `rel="noopener noreferrer"` when opening in a new tab.
- When you add a backend, you can serve the storefront with SSR or static HTML and inject meta tags server-side for crawlers.

## Backend later

- Builder currently writes all pages to `localStorage` under `berg-pages` (and passes them to storefront via hash when opening in another tab/port). For production, replace with API calls that save/load pages (e.g. GET `/api/pages`, GET `/api/pages/:slug`). Storefront would load the list and each page by slug from the URL.
- Keep the same `PageDocument` and block schema so the frontend stays unchanged; only the persistence layer changes.

## Tech

- **Monorepo**: npm workspaces.
- **Shared**: `@berg/schema` (TypeScript, block types + registry).
- **Apps**: Vite + React + TypeScript. Builder and storefront both depend on `@berg/schema`.
