# Berg – How It Works (Simple)

This document explains what Berg is and how everything you have so far works.

---

## What Is Berg?

Berg is a **two-app** setup:

1. **Builder** (http://localhost:5173) – where you **create and edit** your site (pages, blocks, settings).
2. **Storefront** (http://localhost:5174) – the **public site** visitors see (clean URLs, header, footer, product pages).


---

## How the Two Apps Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│  BUILDER (5173)                                                   │
│  • Create pages (Home, Products, Product details, etc.)           │
│  • Add blocks (hero, paragraph, product grid, collections)      │
│  • Set site name, theme, accent color, API URL, “Use demo data”   │
│  • Click “Create demo store” → pre-built Home + Products + info   │
│  • Click “View storefront” → opens storefront with current data   │
└───────────────────────────────┬─────────────────────────────────┘
                                 │
                    Data passed in URL hash (pages, settings)
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  STOREFRONT (5174)                                                │
│  • Reads data from hash (or from localStorage if already saved)   │
│  • Shows header (site name + nav), main content, footer           │
│  • Routes: / = home, /products = products page,                   │
│            /products/:handle = single product page                 │
│  • Product/collection blocks use API or built-in demo data        │
└─────────────────────────────────────────────────────────────────┘
```

- **Builder** is the “admin” side: you edit pages and site settings.
- **Storefront** is the “front” side: it only reads and displays; no editing there.

---

## Architecture & Tech

**Monorepo:** Berg is one repo with multiple packages (npm workspaces). Root `package.json` defines `packages/*` and `apps/*`. You run scripts from the root (e.g. `npm run dev:builder`).

**Layout:**
- `packages/schema/` – shared library `@berg/schema` (block types, page document, registry).
- `packages/core/` – shared library `@berg/core` (storage, config, logging, hash utilities).
- `apps/builder/` – builder app (port 5173).
- `apps/storefront/` – storefront app (port 5174).

**Tech stack:**
- **TypeScript** – all code; types shared via `@berg/schema`; runtime layer via `@berg/core`.
- **Vite** – dev server and production build for both apps.
- **React 18** – UI for builder (editors, grid canvas) and storefront (header, footer, blocks).
- **Routing** – no React Router; storefront uses `window.location.pathname` and `history.pushState`.
- **Storage** – localStorage (key `berg-pages`) + URL hash when opening storefront from builder.
- **Builder layout** – react-grid-layout for drag-and-drop block canvas.

**No backend:** No server or database. Builder and storefront are static frontends; persistence is localStorage (and hash). A future backend would replace that with API calls or SSR.

---

## Packages – What They Are and Why

**What is a package?** A folder with its own `package.json` that can be imported by other apps or packages. The root declares workspaces so `npm install` installs everything and you can build/run each part.

**`@berg/schema` (packages/schema)**  
- **Purpose:** Single source of truth for page and block structure so builder and storefront stay in sync.
- **Contains:** TypeScript types (`BlockType`, `Block`, `PageDocument`, `StoredPage`), `SCHEMA_VERSION`, `BLOCK_REGISTRY` (label, category, default attributes per block type), `getBlockDefinition()`, `createBlockId()`, `createPageId()`.
- **Why separate:** Both builder and storefront `import from '@berg/schema'`. Add a new block in one place (schema), then add editor in builder and renderer in storefront. No duplicated types or defaults.
- **Build:** `npm run build -w @berg/schema` compiles to `dist/`; apps depend on this package and use the compiled output.

**Apps (builder, storefront)**  
- They are **apps** (UIs you run/deploy), not libraries. They depend on `@berg/schema` and React; builder also uses react-grid-layout. They don’t publish a package; they consume the schema package.

---

## Main Features (What’s Been Created)

### 1. Builder

- **Website settings** (sidebar): Site name, Theme (light/dark), Accent color, API Base URL.
- **Use demo data** (checkbox): When ON, the storefront does **not** need an API; it uses built-in demo products and collections.
- **Create demo store** (button): One click creates:
  - **Home** page: hero (“Welcome to our store”), short paragraph, product grid (featured).
  - **Products** page: “All products” heading + full product grid.
  - **Product details** page: short text explaining that product pages live at `/products/[handle]`.
- **Pages**: Add, delete, set home. Each page has a title, description, and a list of **blocks** (paragraph, heading, hero, product grid, etc.).
- **View storefront**: Opens the storefront in a new tab and sends the current site (pages + settings) in the URL hash. The storefront saves that into its own localStorage and shows the right page.

### 2. Storefront

- **Header**: Site name (logo) + nav links (Home, and one link per other page).
- **Routes**:
  - **`/`** → Home page (the page you set as “home” in the builder).
  - **`/products`** → Products page (or whatever slug that page has).
  - **`/products/:handle`** → Single product page (e.g. `/products/classic-white-tee`). Product is loaded from **demo data** (if “Use demo data” is on) or from the **API** (if you set API Base URL).
  - **`/product-details`** → The “Product details” info page from the demo store.
- **Blocks**: Each block type is rendered (paragraphs, headings, hero, product grid, collection list, etc.). Product grid and collection list either call your API or use **demo data** when “Use demo data” is enabled.
- **Footer**: Site name, same nav links as header, and a copyright line (e.g. “© 2025 Demo Store. All rights reserved.”).
- **Full-width hero**: The hero block spans the full width of the screen; the rest of the content stays in a centered column (max-width 960px).

### 3. Demo Data (No API Needed)

When **Use demo data** is enabled in the builder:

- **Product grid** and **collection list** blocks do **not** call the API. They use:
  - **Demo products**: 6 sample products (e.g. Classic White Tee, Denim Jacket, Wireless Headphones) with title, price, image, description, and `handle` for the product URL.
  - **Demo collections**: 3 sample collections (e.g. Apparel, Electronics, Accessories).
- **Product detail page** (`/products/:handle`) loads the product from the same demo list by `handle`.

So you can run and demo the whole flow (home → products → product detail) without configuring any backend.

### 4. When You Use a Real API

- In the builder you set **API Base URL** (e.g. `https://api.example.com`).
- You turn **off** “Use demo data”.
- Product grid and collection list blocks request:
  - Products: e.g. `{apiBaseUrl}/products` (with optional `limit`, `collection`).
  - Collections: e.g. `{apiBaseUrl}/collections`.
- Product detail page requests: `{apiBaseUrl}/products/{handle}`.
- Your API must return JSON in a shape the storefront expects (id, title, description, price, image, handle for products; id, title, description, handle, productCount for collections).

---

## Data Flow (Simple)

1. **Builder** stores everything in **localStorage** under the key `berg-pages` (pages + site title, home slug, theme, accent color, API URL, useDemoData).
2. When you click **View storefront**, the builder builds a JSON payload (same data), puts it in the **URL hash**, and opens the storefront (e.g. `http://localhost:5174/#encoded-payload`).
3. **Storefront** on load:
   - If there is a hash payload, it **parses** it, **saves** it to its own localStorage, then **removes** the hash and shows the right path (e.g. `/` or `/products`).
   - If there is no hash, it **loads** from its localStorage (e.g. from a previous “View storefront”).
4. **Routing**: The storefront looks at the pathname (`/`, `/products`, `/products/classic-white-tee`, etc.). It either shows a **page** (from the builder’s pages) or the **product detail** view for `/products/:handle`.
5. **Blocks**: Each block is rendered by **BlockRenderer**. Product grid and collection list get **useDemoData** from the store; when true they use **demo data**, when false they use **apiBaseUrl** to fetch from your API.

---

## Important Files (Quick Reference)

For **architecture and tech stack**, see the sections **Architecture & Tech** and **Packages – What They Are and Why** above.

| Where        | File / folder           | Purpose |
|-------------|-------------------------|--------|
| Root        | `README.md`             | Project overview and quick start. |
| Schema      | `packages/schema/`      | Block types, `PageDocument`, block registry. Shared by builder and storefront. |
| Core        | `packages/core/`        | Storage, config, logging. Shared runtime layer. |
| Builder     | `apps/builder/src/`     | `components/` (blocks, controls, canvas), `features/` (pages, settings, layout), `lib/`. |
| Storefront  | `apps/storefront/src/`  | `components/` (layout, blocks), `data/` (demoData), `lib/`. |

- **Block types** are defined in `packages/schema` (e.g. `block-registry.ts`). Builder and storefront both use these types; the builder lets you add/edit blocks, the storefront only renders them.
- **Demo data** lives in `apps/storefront/src/data/demoData.ts` (products and collections + helpers).
- **Create demo store** logic is in `apps/builder/src/lib/createDemoStore.ts` (creates the three pages and their blocks).

---

## Run It

```bash
npm install
npm run build              # Builds schema → core → apps (or: build:schema, build:core, then apps)
npm run dev:builder        # Builder at http://localhost:5173
npm run dev:storefront    # Storefront at http://localhost:5174
npm run typecheck         # Type-check all workspaces
```

In the builder: turn on **Use demo data**, click **Create demo store**, then **View storefront**. You’ll see Home, Products, product links, and product detail pages, all using demo data and no API.

That’s how everything created so far works in simple terms.
