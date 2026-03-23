# Berg – Local Setup Guide

Step-by-step guide to set up and run Berg on your machine.

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node.js)

Check your versions:

```bash
node -v   # e.g. v20.x or v22.x
npm -v    # e.g. 10.x
```

---

## 1. Clone & Install

```bash
# Clone the repository (or navigate to the project folder)
cd berg

# Install all dependencies (workspaces: packages + apps)
npm install
```

This installs dependencies for the root, `packages/schema`, `packages/core`, `apps/builder`, and `apps/storefront`.

---

## 2. Build Shared Packages

The apps depend on `@berg/schema` and `@berg/core`. Build them first:

```bash
# Option A: Build schema and core, then all workspaces
npm run build

# Option B: Build only shared packages (if you just want to run dev)
npm run build:schema
npm run build:core
```

For development, `npm run build` is enough. The dev servers use the source via Vite aliases, but a prior build ensures types and any pre-built artifacts are ready.

---

## 3. Run the Apps

### Builder (admin UI)

```bash
npm run dev:builder
```

- Opens at **http://localhost:5173**
- Create pages, add blocks, configure site settings

### Storefront (public site)

```bash
npm run dev:storefront
```

- Opens at **http://localhost:5174**
- Renders the site visitors see

Run both in separate terminals to use the full flow (edit in builder → view in storefront).

---

## 4. Quick Demo Flow

1. Open **http://localhost:5173** (builder)
2. Turn on **Use demo data** (no API needed)
3. Click **Create demo store** (adds Home, Products, Product details pages)
4. Click **View storefront** to open the storefront with all content
5. Browse Home, Products, and product detail pages

---

## 5. Project Structure (for reference)

```
berg/
├── packages/
│   ├── schema/     @berg/schema   – block types, registry
│   └── core/       @berg/core     – storage, config, logging
├── apps/
│   ├── builder/    – Builder at :5173
│   └── storefront/ – Storefront at :5174
├── package.json    – Workspace root
├── setup.md        – This file
└── DOCUMENTATION.md
```

---

## 6. Available Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run build` | Build schema → core → apps |
| `npm run build:schema` | Build only @berg/schema |
| `npm run build:core` | Build only @berg/core |
| `npm run dev:builder` | Start builder dev server (:5173) |
| `npm run dev:storefront` | Start storefront dev server (:5174) |
| `npm run dev` | Alias for `dev:builder` |
| `npm run typecheck` | Type-check all workspaces |

---

## 7. Troubleshooting

### Port already in use

If 5173 or 5174 is taken:

- Stop the process using the port, or
- Change the port in `apps/builder/vite.config.ts` or `apps/storefront/vite.config.ts` (e.g. `server: { port: 5180 }`)

### Build fails with "Cannot find module @berg/schema"

```bash
# Rebuild shared packages
npm run build:schema
npm run build:core
```

### Blank storefront / "No pages yet"

- In the builder, click **Create demo store**
- Click **View storefront** to pass data to the storefront
- Or add pages manually and click **View storefront**

### TypeScript errors after pull

```bash
npm install
npm run build
npm run typecheck
```

---

## 8. Environment Notes

- **No backend** – Builder and storefront are static; data is stored in `localStorage`.
- **Demo data** – When "Use demo data" is on, products and collections come from built-in demo data.
- **API mode** – Set **API Base URL** in the builder and turn off "Use demo data" to use your own API.

---

For more details, see [DOCUMENTATION.md](./DOCUMENTATION.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
