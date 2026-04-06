import { useEffect, useState } from 'react';
import type { PageDocument, StoredPage } from '@berg/schema';
import { loadStore, saveStore, parseHashPayload, PAGES_STORAGE_KEY } from '@/lib';
import { SiteHeader, SiteFooter } from '@/components/layout';
import { BlockRenderer, ProductDetailPage, CollectionDetailPage } from '@/components/blocks';
import { resolveGridLayout, useStorefrontViewport } from '@berg/blocks';
import './App.css';

function getPathRoute(): { slug: string | null; productHandle: string | null; collectionHandle: string | null } {
  const path = window.location.pathname;
  if (path === '/' || path === '') return { slug: null, productHandle: null, collectionHandle: null };
  const productsMatch = path.match(/^\/products\/([^/]+)\/?$/);
  if (productsMatch) return { slug: null, productHandle: productsMatch[1], collectionHandle: null };
  const collectionsMatch = path.match(/^\/collections\/([^/]+)\/?$/);
  if (collectionsMatch) return { slug: null, productHandle: null, collectionHandle: collectionsMatch[1] };
  const slug = path.slice(1).replace(/\/$/, '');
  return { slug: slug || null, productHandle: null, collectionHandle: null };
}

/** Parse spacing value to px; used for cell height (margin creates gap). */
function parseSpacingToPx(v: string): number {
  const s = String(v ?? '').trim();
  if (!s) return 0;
  const numMatch = s.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) return parseFloat(numMatch[1]);
  const remMatch = s.match(/^(\d+(?:\.\d+)?)\s*rem$/i);
  if (remMatch) return Math.round(parseFloat(remMatch[1]) * 16);
  return 0;
}

/** Pages visible on storefront (published only). */
function getPublishedPages(pages: StoredPage[]): StoredPage[] {
  return pages.filter((p) => p.published !== false);
}

/** Resolve which page is the home page (must be published). */
function getHomePage(pages: StoredPage[], homeSlug?: string): StoredPage | null {
  const published = getPublishedPages(pages);
  if (!published.length) return null;
  if (homeSlug) {
    const found = published.find((p) => p.slug === homeSlug);
    if (found) return found;
  }
  const home = published.find((p) => p.slug === 'home');
  if (home) return home;
  return published[0];
}

export default function App() {
  // Initialize: check for hash payload first, then set route
  const [route, setRoute] = useState(() => {
    // Check for hash payload on initial load
    const hash = window.location.hash.slice(1);
    const payload = parseHashPayload(hash);
    if (payload?.pages?.length) {
      const existing = loadStore();
      saveStore({
        ...existing,
        pages: payload.pages,
        siteTitle: payload.siteTitle ?? existing.siteTitle,
        homeSlug: payload.homeSlug ?? existing.homeSlug,
        apiBaseUrl: payload.apiBaseUrl ?? existing.apiBaseUrl,
        theme: payload.theme ?? existing.theme,
        accentColor: payload.accentColor ?? existing.accentColor,
        useDemoData: payload.useDemoData ?? existing.useDemoData,
        headerStyle: payload.headerStyle ?? existing.headerStyle,
        footerStyle: payload.footerStyle ?? existing.footerStyle,
        footerLinks: payload.footerLinks ?? existing.footerLinks,
        buttonStyle: payload.buttonStyle ?? existing.buttonStyle,
        hiddenFromHeader: payload.hiddenFromHeader ?? existing.hiddenFromHeader,
      });
      const updatedStore = loadStore();
      const openSlug = payload.openSlug ?? payload.homeSlug;
      const target = openSlug && openSlug !== updatedStore.homeSlug ? `/${openSlug}` : '/';
      // Clear hash immediately
      window.history.replaceState(null, '', target);
      return openSlug && openSlug !== updatedStore.homeSlug ? { slug: openSlug, productHandle: null, collectionHandle: null } : { slug: null, productHandle: null, collectionHandle: null };
    }
    return getPathRoute();
  });
  const [store, setStore] = useState(loadStore);

  useEffect(() => {
    const onPopState = () => setRoute(getPathRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Sync store when it changes (e.g., from hash payload)
  useEffect(() => {
    setStore(loadStore());
  }, []);

  // Reload store when builder saves changes (another tab)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PAGES_STORAGE_KEY && e.newValue) {
        setStore(loadStore());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Apply theme, accent, and button style to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', store.theme || 'dark');
    if (store.accentColor) root.style.setProperty('--accent', store.accentColor);
    else root.style.removeProperty('--accent');
    const bs = store.buttonStyle;
    if (bs?.backgroundColor) root.style.setProperty('--button-bg', bs.backgroundColor);
    else root.style.removeProperty('--button-bg');
    if (bs?.color) root.style.setProperty('--button-color', bs.color);
    else root.style.removeProperty('--button-color');
    if (bs?.fontFamily) root.style.setProperty('--button-font', bs.fontFamily);
    else root.style.removeProperty('--button-font');
    if (bs?.borderRadius) root.style.setProperty('--button-radius', bs.borderRadius);
    else root.style.removeProperty('--button-radius');
    if (bs?.padding) root.style.setProperty('--button-padding', bs.padding);
    else root.style.removeProperty('--button-padding');
  }, [store.theme, store.accentColor, store.buttonStyle]);

  const { pages, siteTitle, homeSlug, useDemoData } = store;
  const publishedPages = getPublishedPages(pages);
  const homePage = getHomePage(pages, homeSlug);

  // Current page: from route slug (pathname), or home when at /
  const currentSlug = route.slug ?? null;
  const productHandle = route.productHandle ?? null;
  const collectionHandle = route.collectionHandle ?? null;
  const currentPage = currentSlug
    ? publishedPages.find((p) => p.slug === currentSlug) ?? null
    : homePage;

  if (pages.length === 0) {
    return (
      <div className="storefront storefront-empty">
        <p>No pages yet. Create your website in the <strong>Builder</strong> app.</p>
        <p className="muted">Storage key: {PAGES_STORAGE_KEY}</p>
      </div>
    );
  }

  const siteName = siteTitle?.trim() || (homePage?.document.meta?.title ?? 'Site');

  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    setRoute(getPathRoute());
  };

  if (collectionHandle) {
    return (
      <>
        <div className="site-wrap">
          <SiteHeader
            siteTitle={siteName}
            pages={publishedPages}
            currentSlug={null}
            homeSlug={homePage?.slug ?? ''}
            onNavigate={navigate}
            headerStyle={store.headerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
          />
          <CollectionDetailPage
            handle={collectionHandle}
            apiBaseUrl={store.apiBaseUrl}
            useDemoData={useDemoData}
            onNavigate={navigate}
          />
          <SiteFooter
            siteTitle={siteName}
            pages={publishedPages}
            homeSlug={homePage?.slug ?? ''}
            onNavigate={navigate}
            footerStyle={store.footerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
            footerLinks={store.footerLinks}
          />
        </div>
      </>
    );
  }

  if (productHandle) {
    return (
      <>
        <div className="site-wrap">
          <SiteHeader
            siteTitle={siteName}
            pages={publishedPages}
            currentSlug={null}
            homeSlug={homePage?.slug ?? ''}
            onNavigate={navigate}
            headerStyle={store.headerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
          />
          <ProductDetailPage
            handle={productHandle}
            apiBaseUrl={store.apiBaseUrl}
            useDemoData={useDemoData}
            onNavigate={navigate}
          />
          <SiteFooter
            siteTitle={siteName}
            pages={publishedPages}
            homeSlug={homePage?.slug ?? ''}
            onNavigate={navigate}
            footerStyle={store.footerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
            footerLinks={store.footerLinks}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="site-wrap">
        <SiteHeader
          siteTitle={siteName}
          pages={publishedPages}
          currentSlug={currentSlug}
          homeSlug={homePage?.slug ?? ''}
          onNavigate={navigate}
          headerStyle={store.headerStyle}
          hiddenFromHeader={store.hiddenFromHeader}
        />
        {!currentPage ? (
          <main className="storefront storefront-empty" role="main">
            <p>Page not found.</p>
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>← Go to home</a>
          </main>
        ) : (
          <PageContent page={currentPage} apiBaseUrl={store.apiBaseUrl} useDemoData={useDemoData} />
        )}
        <SiteFooter
          siteTitle={siteName}
          pages={publishedPages}
          homeSlug={homePage?.slug ?? ''}
          onNavigate={navigate}
          footerStyle={store.footerStyle}
          hiddenFromHeader={store.hiddenFromHeader}
          footerLinks={store.footerLinks}
        />
      </div>
    </>
  );
}

function PageContent({ page, apiBaseUrl, useDemoData }: { page: StoredPage; apiBaseUrl?: string; useDemoData?: boolean }) {
  const doc = page.document;
  const { meta, blocks } = doc;
  const layoutViewport = useStorefrontViewport();

  // Match builder order: render blocks sorted by layout position (y then x)
  const sortedBlocks = [...blocks].sort((a, b) => {
    const layoutA = resolveGridLayout(a.attributes as Record<string, unknown> | undefined, layoutViewport);
    const layoutB = resolveGridLayout(b.attributes as Record<string, unknown> | undefined, layoutViewport);
    const yA = layoutA && typeof layoutA.y === 'number' ? layoutA.y : 0;
    const yB = layoutB && typeof layoutB.y === 'number' ? layoutB.y : 0;
    if (yA !== yB) return yA - yB;
    const xA = layoutA && typeof layoutA.x === 'number' ? layoutA.x : 0;
    const xB = layoutB && typeof layoutB.x === 'number' ? layoutB.x : 0;
    return xA - xB;
  });

  return (
    <>
      <PageHead meta={meta} />
      <main className="storefront" role="main">
        <article className="storefront-article">
          <header className="storefront-header">
            <h1>{meta.title}</h1>
            {meta.description && (
              <p className="storefront-description">{meta.description}</p>
            )}
          </header>
          <div className="storefront-blocks storefront-grid-12">
            {sortedBlocks.map((block) => {
              const attrs = block.attributes ?? {};
              const layout = resolveGridLayout(attrs as Record<string, unknown>, layoutViewport);
              const span = Math.min(12, Math.max(1, (attrs.gridColumnSpan as number) ?? layout?.w ?? 12));
              const start = Math.min(12, Math.max(1, (attrs.gridColumnStart as number) ?? (layout?.x != null ? layout.x + 1 : 1)));
              const fullBleed = !!(block.attributes?.fullBleed as boolean);
              /* Match builder ROW_HEIGHT (40px) so resized height in builder = storefront height */
              const rowHeightPx = 40;
              const layoutH = layout && typeof layout.h === 'number' ? layout.h : null;
              const contentHeightPx = layoutH != null ? layoutH * rowHeightPx : undefined;
              const marginTopPx = parseSpacingToPx(String(attrs.marginTop ?? '').trim());
              const marginBottomPx = parseSpacingToPx(String(attrs.marginBottom ?? '').trim());
              const hasMargin = marginTopPx > 0 || marginBottomPx > 0;
              /* Cell height = content + margins so margin creates visible gap */
              const heightPx = contentHeightPx != null ? contentHeightPx + marginTopPx + marginBottomPx : undefined;
              const cellStyle: React.CSSProperties = { gridColumn: `${start} / span ${span}` };
              const hasHeight = heightPx != null;
              if (hasHeight) {
                cellStyle.height = heightPx;
                cellStyle.minHeight = heightPx;
                if (!fullBleed) cellStyle.overflow = 'hidden';
                /* When block has margin, child gets content height so margin extends below */
                if (hasMargin && contentHeightPx != null) {
                  (cellStyle as Record<string, string>)['--cell-content-height'] = `${contentHeightPx}px`;
                }
              }
              return (
                <div
                  key={block.id}
                  className={`storefront-block-cell ${fullBleed ? 'block-full-bleed' : ''} ${hasHeight ? 'storefront-block-cell--height-constrained' : ''} ${hasHeight && hasMargin ? 'storefront-block-cell--has-margin' : ''}`}
                  style={cellStyle}
                >
                  {fullBleed ? (
                    <div className="storefront-full-bleed-inner">
                      <BlockRenderer block={block} apiBaseUrl={apiBaseUrl} useDemoData={useDemoData} layoutViewport={layoutViewport} />
                    </div>
                  ) : (
                    <BlockRenderer block={block} apiBaseUrl={apiBaseUrl} useDemoData={useDemoData} layoutViewport={layoutViewport} />
                  )}
                </div>
              );
            })}
          </div>
        </article>
      </main>
    </>
  );
}

function PageHead({ meta }: { meta: PageDocument['meta'] }) {
  useEffect(() => {
    document.title = meta.title;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc && meta.description) {
      desc = document.createElement('meta');
      desc.setAttribute('name', 'description');
      document.head.appendChild(desc);
    }
    if (desc) desc.setAttribute('content', meta.description ?? '');
  }, [meta.title, meta.description]);
  return null;
}
