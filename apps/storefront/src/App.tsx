import { useEffect, useRef, useState, type ReactNode } from "react";
import { CartProvider, useCart } from "@storefront-ui-plugin/cart-checkout-plugin";
import type { PageDocument, StoredPage } from "@berg/schema";
import type { AuthFormDefaults } from "@berg/core";
import {
  loadStore,
  saveStore,
  parseHashPayload,
  PAGES_STORAGE_KEY,
  clearSession,
  isAccessTokenValid,
  loadSession,
  refreshSession,
} from "@/lib";
import { applyStoreToDocument } from "@/lib/applyStoreToDocument";
import { SiteHeader, SiteFooter } from "@/components/layout";
import { CartPage } from "@/components/cart/CartPage";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { CheckoutSuccessPage } from "@/components/checkout/CheckoutSuccessPage";
import {
  BlockRenderer,
  ProductDetailPage,
  CollectionDetailPage,
  ProductListingPage,
} from "@/components/blocks";
import { resolveGridLayout, useStorefrontViewport } from "@berg/blocks";
import "./App.css";

function getPathRoute(): {
  slug: string | null;
  productHandle: string | null;
  collectionHandle: string | null;
  system: "cart" | "checkout" | "checkoutSuccess" | null;
  productCatalog: boolean;
} {
  const path = window.location.pathname;
  if (path === "/" || path === "") {
    return {
      slug: null,
      productHandle: null,
      collectionHandle: null,
      system: null,
      productCatalog: false,
    };
  }
  if (path === "/cart" || path === "/cart/") {
    return {
      slug: null,
      productHandle: null,
      collectionHandle: null,
      system: "cart",
      productCatalog: false,
    };
  }
  if (path === "/checkout" || path === "/checkout/") {
    return {
      slug: null,
      productHandle: null,
      collectionHandle: null,
      system: "checkout",
      productCatalog: false,
    };
  }
  if (path === "/checkout/success" || path === "/checkout/success/") {
    return {
      slug: null,
      productHandle: null,
      collectionHandle: null,
      system: "checkoutSuccess",
      productCatalog: false,
    };
  }
  if (path === "/products" || path === "/products/") {
    return {
      slug: null,
      productHandle: null,
      collectionHandle: null,
      system: null,
      productCatalog: true,
    };
  }
  const productsMatch = path.match(/^\/products\/([^/]+)\/?$/);
  if (productsMatch) {
    return {
      slug: null,
      productHandle: productsMatch[1],
      collectionHandle: null,
      system: null,
      productCatalog: false,
    };
  }
  const collectionsMatch = path.match(/^\/collections\/([^/]+)\/?$/);
  if (collectionsMatch) {
    return {
      slug: null,
      productHandle: null,
      collectionHandle: collectionsMatch[1],
      system: null,
      productCatalog: false,
    };
  }
  const slug = path.slice(1).replace(/\/$/, "");
  return {
    slug: slug || null,
    productHandle: null,
    collectionHandle: null,
    system: null,
    productCatalog: false,
  };
}

/** Parse spacing value to px; used for cell height (margin creates gap). */
function parseSpacingToPx(v: string): number {
  const s = String(v ?? "").trim();
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
function getHomePage(
  pages: StoredPage[],
  homeSlug?: string,
): StoredPage | null {
  const published = getPublishedPages(pages);
  if (!published.length) return null;
  if (homeSlug) {
    const found = published.find((p) => p.slug === homeSlug);
    if (found) return found;
  }
  const home = published.find((p) => p.slug === "home");
  if (home) return home;
  return published[0];
}

function StorefrontCartProvider({
  tenantId,
  apiBaseUrl,
  storeId,
  getHeaders,
  children,
}: {
  tenantId: string;
  /** When set, cart-checkout-plugin uses server cart APIs (guest session, view, add, …). */
  apiBaseUrl?: string;
  /** Required for API query params; defaults from store when unset. */
  storeId?: string;
  /** Optional auth headers for user cart operations. */
  getHeaders?: () => Record<string, string>;
  children: ReactNode;
}) {
  return (
    <CartProvider
      tenantId={tenantId}
      apiBaseUrl={apiBaseUrl}
      storeId={storeId}
      getHeaders={getHeaders}
    >
      {children}
    </CartProvider>
  );
}

const CHECKOUT_RETURN_PATH_STORAGE_KEY = "storefront:checkout:return-path";

function buildCartAuthHeaders(): Record<string, string> {
  const session = loadSession();
  const userId = session?.customerId?.trim();
  if (!userId) return {};
  const headers: Record<string, string> = {
    "X-User-Id": userId,
  };
  const token = session?.token?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function CheckoutAuthRedirect({
  onNavigate,
  to = "/checkout",
}: {
  onNavigate: (path: string) => void;
  to?: string;
}) {
  useEffect(() => {
    try {
      window.sessionStorage.setItem(CHECKOUT_RETURN_PATH_STORAGE_KEY, to);
    } catch {
      // ignore storage failures
    }
    onNavigate("/login");
  }, [onNavigate, to]);

  return (
    <main className="storefront storefront-empty" role="main">
      <p>Please sign in to continue checkout.</p>
    </main>
  );
}

function CartAuthSync({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { mergeGuestCart } = useCart();
  const isMergingRef = useRef(false);

  useEffect(() => {
    const mergeAndRedirect = async () => {
      const session = loadSession();
      const userId = session?.customerId?.trim();
      if (!userId || isMergingRef.current) return;
      isMergingRef.current = true;
      try {
        await mergeGuestCart();
        const target = window.sessionStorage.getItem(
          CHECKOUT_RETURN_PATH_STORAGE_KEY,
        );
        if (target) {
          window.sessionStorage.removeItem(CHECKOUT_RETURN_PATH_STORAGE_KEY);
          onNavigate(target);
        }
      } finally {
        isMergingRef.current = false;
      }
    };

    void mergeAndRedirect();
    const onSessionChanged = () => {
      void mergeAndRedirect();
    };
    window.addEventListener(
      "customer-auth-session-changed",
      onSessionChanged as EventListener,
    );
    return () => {
      window.removeEventListener(
        "customer-auth-session-changed",
        onSessionChanged as EventListener,
      );
    };
  }, [mergeGuestCart, onNavigate]);

  return null;
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
        tenantId: payload.tenantId ?? existing.tenantId,
        storeId: payload.storeId ?? existing.storeId,
        theme: payload.theme ?? existing.theme,
        accentColor: payload.accentColor ?? existing.accentColor,
        useDemoData:
          typeof payload.useDemoData === "boolean"
            ? payload.useDemoData
            : false,
        headerStyle: payload.headerStyle ?? existing.headerStyle,
        footerStyle: payload.footerStyle ?? existing.footerStyle,
        footerLinks: payload.footerLinks ?? existing.footerLinks,
        buttonStyle: payload.buttonStyle ?? existing.buttonStyle,
        hiddenFromHeader: payload.hiddenFromHeader ?? existing.hiddenFromHeader,
        authApiBaseUrl: payload.authApiBaseUrl ?? existing.authApiBaseUrl,
        authFormDefaults: payload.authFormDefaults ?? existing.authFormDefaults,
      });
      const updatedStore = loadStore();
      const openSlug = payload.openSlug ?? payload.homeSlug;
      const target =
        openSlug && openSlug !== updatedStore.homeSlug ? `/${openSlug}` : "/";
      // Clear hash immediately
      window.history.replaceState(null, "", target);
      return openSlug && openSlug !== updatedStore.homeSlug
        ? {
            slug: openSlug,
            productHandle: null,
            collectionHandle: null,
            system: null,
            productCatalog: false,
          }
        : {
            slug: null,
            productHandle: null,
            collectionHandle: null,
            system: null,
            productCatalog: false,
          };
    }
    return getPathRoute();
  });
  const [store, setStore] = useState(loadStore);
  const refreshInFlightRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    const onPopState = () => setRoute(getPathRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
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
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    applyStoreToDocument(store);
  }, [store.theme, store.accentColor, store.buttonStyle]);

  const { pages, siteTitle, homeSlug, useDemoData } = store;
  const publishedPages = getPublishedPages(pages);
  const homePage = getHomePage(pages, homeSlug);

  // Current page: from route slug (pathname), or home when at /
  const currentSlug = route.slug ?? null;
  const productHandle = route.productHandle ?? null;
  const collectionHandle = route.collectionHandle ?? null;
  const productCatalog = route.productCatalog ?? false;
  const system = route.system ?? null;
  const headerCurrentSlug = system ? "__system__" : currentSlug;
  const currentPage = currentSlug
    ? (publishedPages.find((p) => p.slug === currentSlug) ?? null)
    : homePage;

  if (pages.length === 0) {
    return (
      <div className="storefront storefront-empty">
        <p>
          No pages yet. Create your website in the <strong>Builder</strong> app.
        </p>
        <p className="muted">Storage key: {PAGES_STORAGE_KEY}</p>
      </div>
    );
  }

  const siteName =
    siteTitle?.trim() || (homePage?.document.meta?.title ?? "Site");
  const cartTenantId = store.tenantId?.trim() || homeSlug || "default";
  const cartApiUrl =
    (
      import.meta as { env?: Record<string, string | undefined> }
    ).env?.VITE_CART_API_BASE_URL?.trim() || undefined;
  const cartStoreId = cartApiUrl
    ? store.storeId?.trim() || homeSlug || "default"
    : undefined;
  const cartApiConfigured = Boolean(cartApiUrl && cartTenantId && cartStoreId);
  const [cartApiEnabled, setCartApiEnabled] = useState(cartApiConfigured);
  const [cartApiFallbackReason, setCartApiFallbackReason] = useState<
    string | null
  >(null);

  useEffect(() => {
    setCartApiEnabled(cartApiConfigured);
    setCartApiFallbackReason(null);
  }, [cartApiConfigured, cartApiUrl, cartTenantId, cartStoreId]);

  const handleCartApiFailure = (reason: string) => {
    if (!cartApiConfigured) return;
    setCartApiEnabled(false);
    setCartApiFallbackReason(reason);
  };

  const handleCartApiRetry = () => {
    if (!cartApiConfigured) return;
    setCartApiFallbackReason(null);
    setCartApiEnabled(true);
  };

  const navigate = (path: string) => {
    window.history.pushState(null, "", path);
    setRoute(getPathRoute());
  };
  const cartAuthHeaders = buildCartAuthHeaders;
  const isCustomerLoggedIn = Boolean(loadSession()?.customerId?.trim());
  const [authSessionNonce, setAuthSessionNonce] = useState(0);
  const [authSessionCustomerId, setAuthSessionCustomerId] = useState(
    () => loadSession()?.customerId?.trim() || "guest",
  );

  const viteAuthBase =
    (
      import.meta as { env?: Record<string, string | undefined> }
    ).env?.VITE_AUTH_API_BASE_URL?.trim() || "";
  const resolvedAuthApiBase = store.authApiBaseUrl?.trim() || viteAuthBase;
  const authRetryAttemptsRef = useRef<Map<string, number>>(new Map());

  const runRefresh = async (clearOnFailure = true): Promise<boolean> => {
    const existing = loadSession();
    if (!existing?.refreshToken || !existing.customerId) return false;
    const refreshed = await refreshSession({
      authApiBaseUrl: resolvedAuthApiBase || undefined,
      storeId: store.storeId,
      customerId: existing.customerId,
      refreshToken: existing.refreshToken,
    });
    if (refreshed) {
      window.dispatchEvent(new Event("customer-auth-session-changed"));
      return true;
    }
    if (clearOnFailure) {
      clearSession();
      window.dispatchEvent(new Event("customer-auth-session-changed"));
    }
    return false;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!resolvedAuthApiBase || !store.storeId) return;
      const existing = loadSession();
      if (!existing) return;
      if (isAccessTokenValid(existing, 60)) return;
      try {
        await runRefresh();
      } finally {
        if (cancelled) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedAuthApiBase, store.storeId]);

  useEffect(() => {
    const triggerRefresh = async () => {
      if (!refreshInFlightRef.current) {
        refreshInFlightRef.current = runRefresh(false).finally(() => {
          refreshInFlightRef.current = null;
        });
      }
      return refreshInFlightRef.current;
    };
    const handler = async (event: Event) => {
      const custom = event as CustomEvent<{ requestKey?: string; authRequired?: boolean }>;
      if (custom.detail && custom.detail.authRequired === false) return;
      const requestKey = custom.detail?.requestKey ?? "global";
      const prev = authRetryAttemptsRef.current.get(requestKey) ?? 0;
      if (prev >= 1) {
        clearSession();
        window.dispatchEvent(new Event("customer-auth-session-changed"));
        return;
      }
      authRetryAttemptsRef.current.set(requestKey, prev + 1);
      const ok = await triggerRefresh();
      if (ok) return;
      clearSession();
      window.dispatchEvent(new Event("customer-auth-session-changed"));
    };
    window.addEventListener("customer-auth-401", handler as EventListener);
    (window as Window & { __customerAuthRefresh?: () => Promise<boolean> }).__customerAuthRefresh = triggerRefresh;
    return () => {
      window.removeEventListener("customer-auth-401", handler as EventListener);
      delete (window as Window & { __customerAuthRefresh?: () => Promise<boolean> }).__customerAuthRefresh;
    };
  }, [resolvedAuthApiBase, store.storeId]);

  useEffect(() => {
    const onSessionChanged = () => {
      setAuthSessionCustomerId(loadSession()?.customerId?.trim() || "guest");
      setAuthSessionNonce((prev) => prev + 1);
    };
    window.addEventListener(
      "customer-auth-session-changed",
      onSessionChanged as EventListener,
    );
    return () => {
      window.removeEventListener(
        "customer-auth-session-changed",
        onSessionChanged as EventListener,
      );
    };
  }, []);

  const cartProviderKey = `${cartTenantId}:${cartStoreId || "default"}:${authSessionCustomerId}:${authSessionNonce}`;

  if (system === "checkout") {
    if (!isCustomerLoggedIn) {
      return <CheckoutAuthRedirect onNavigate={navigate} to="/checkout" />;
    }
    return (
      <StorefrontCartProvider
        key={cartProviderKey}
        tenantId={cartTenantId}
        apiBaseUrl={cartApiEnabled ? cartApiUrl : undefined}
        storeId={cartStoreId}
        getHeaders={cartAuthHeaders}
      >
        <CartAuthSync onNavigate={navigate} />
        <div className="site-wrap">
          <SiteHeader
            siteTitle={siteName}
            pages={publishedPages}
            currentSlug={headerCurrentSlug}
            homeSlug={homePage?.slug ?? ""}
            onNavigate={navigate}
            headerStyle={store.headerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
          />
          <CheckoutPage
            onNavigate={navigate}
            tenantId={cartTenantId}
            storeId={cartStoreId}
          />
          <SiteFooter
            siteTitle={siteName}
            pages={publishedPages}
            homeSlug={homePage?.slug ?? ""}
            onNavigate={navigate}
            footerStyle={store.footerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
            footerLinks={store.footerLinks}
          />
        </div>
      </StorefrontCartProvider>
    );
  }

  if (system === "checkoutSuccess") {
    return (
      <StorefrontCartProvider
        key={cartProviderKey}
        tenantId={cartTenantId}
        apiBaseUrl={cartApiEnabled ? cartApiUrl : undefined}
        storeId={cartStoreId}
        getHeaders={cartAuthHeaders}
      >
        <CartAuthSync onNavigate={navigate} />
        <div className="site-wrap">
          <SiteHeader
            siteTitle={siteName}
            pages={publishedPages}
            currentSlug={headerCurrentSlug}
            homeSlug={homePage?.slug ?? ""}
            onNavigate={navigate}
            headerStyle={store.headerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
          />
          <CheckoutSuccessPage onNavigate={navigate} />
          <SiteFooter
            siteTitle={siteName}
            pages={publishedPages}
            homeSlug={homePage?.slug ?? ""}
            onNavigate={navigate}
            footerStyle={store.footerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
            footerLinks={store.footerLinks}
          />
        </div>
      </StorefrontCartProvider>
    );
  }

  if (system === "cart") {
    return (
      <StorefrontCartProvider
        key={cartProviderKey}
        tenantId={cartTenantId}
        apiBaseUrl={cartApiEnabled ? cartApiUrl : undefined}
        storeId={cartStoreId}
        getHeaders={cartAuthHeaders}
      >
        <CartAuthSync onNavigate={navigate} />
        <div className="site-wrap">
          <SiteHeader
            siteTitle={siteName}
            pages={publishedPages}
            currentSlug={headerCurrentSlug}
            homeSlug={homePage?.slug ?? ""}
            onNavigate={navigate}
            headerStyle={store.headerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
          />
          <CartPage
            onNavigate={navigate}
            cartApiConfigured={cartApiConfigured}
            cartApiEnabled={cartApiEnabled}
            cartApiFallbackReason={cartApiFallbackReason}
            onApiFailure={handleCartApiFailure}
            onRetryApi={handleCartApiRetry}
          />
          <SiteFooter
            siteTitle={siteName}
            pages={publishedPages}
            homeSlug={homePage?.slug ?? ""}
            onNavigate={navigate}
            footerStyle={store.footerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
            footerLinks={store.footerLinks}
          />
        </div>
      </StorefrontCartProvider>
    );
  }

  if (productCatalog) {
    return (
      <StorefrontCartProvider
        key={cartProviderKey}
        tenantId={cartTenantId}
        apiBaseUrl={cartApiEnabled ? cartApiUrl : undefined}
        storeId={cartStoreId}
        getHeaders={cartAuthHeaders}
      >
        <CartAuthSync onNavigate={navigate} />
        <div className="site-wrap">
          <SiteHeader
            siteTitle={siteName}
            pages={publishedPages}
            currentSlug={headerCurrentSlug}
            homeSlug={homePage?.slug ?? ""}
            onNavigate={navigate}
            headerStyle={store.headerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
          />
          <ProductListingPage
            apiBaseUrl={store.apiBaseUrl}
            useDemoData={useDemoData}
            tenantId={store.tenantId}
            storeId={store.storeId}
            onNavigate={navigate}
          />
          <SiteFooter
            siteTitle={siteName}
            pages={publishedPages}
            homeSlug={homePage?.slug ?? ""}
            onNavigate={navigate}
            footerStyle={store.footerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
            footerLinks={store.footerLinks}
          />
        </div>
      </StorefrontCartProvider>
    );
  }

  if (collectionHandle) {
    return (
      <StorefrontCartProvider
        key={cartProviderKey}
        tenantId={cartTenantId}
        apiBaseUrl={cartApiEnabled ? cartApiUrl : undefined}
        storeId={cartStoreId}
        getHeaders={cartAuthHeaders}
      >
        <CartAuthSync onNavigate={navigate} />
        <div className="site-wrap">
          <SiteHeader
            siteTitle={siteName}
            pages={publishedPages}
            currentSlug={headerCurrentSlug}
            homeSlug={homePage?.slug ?? ""}
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
            homeSlug={homePage?.slug ?? ""}
            onNavigate={navigate}
            footerStyle={store.footerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
            footerLinks={store.footerLinks}
          />
        </div>
      </StorefrontCartProvider>
    );
  }

  if (productHandle) {
    return (
      <StorefrontCartProvider
        key={cartProviderKey}
        tenantId={cartTenantId}
        apiBaseUrl={cartApiEnabled ? cartApiUrl : undefined}
        storeId={cartStoreId}
        getHeaders={cartAuthHeaders}
      >
        <CartAuthSync onNavigate={navigate} />
        <div className="site-wrap">
          <SiteHeader
            siteTitle={siteName}
            pages={publishedPages}
            currentSlug={headerCurrentSlug}
            homeSlug={homePage?.slug ?? ""}
            onNavigate={navigate}
            headerStyle={store.headerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
          />
          <ProductDetailPage
            handle={productHandle}
            apiBaseUrl={store.apiBaseUrl}
            useDemoData={useDemoData}
            tenantId={store.tenantId}
            storeId={store.storeId}
            onNavigate={navigate}
          />
          <SiteFooter
            siteTitle={siteName}
            pages={publishedPages}
            homeSlug={homePage?.slug ?? ""}
            onNavigate={navigate}
            footerStyle={store.footerStyle}
            hiddenFromHeader={store.hiddenFromHeader}
            footerLinks={store.footerLinks}
          />
        </div>
      </StorefrontCartProvider>
    );
  }

  return (
    <StorefrontCartProvider
      key={cartProviderKey}
      tenantId={cartTenantId}
      apiBaseUrl={cartApiEnabled ? cartApiUrl : undefined}
      storeId={cartStoreId}
      getHeaders={cartAuthHeaders}
    >
      <CartAuthSync onNavigate={navigate} />
      <div className="site-wrap">
        <SiteHeader
          siteTitle={siteName}
          pages={publishedPages}
          currentSlug={headerCurrentSlug}
          homeSlug={homePage?.slug ?? ""}
          onNavigate={navigate}
          headerStyle={store.headerStyle}
          hiddenFromHeader={store.hiddenFromHeader}
        />
        {!currentPage ? (
          <main className="storefront storefront-empty" role="main">
            <p>Page not found.</p>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
            >
              ← Go to home
            </a>
          </main>
        ) : (
          <PageContent
            page={currentPage}
            apiBaseUrl={store.apiBaseUrl}
            useDemoData={useDemoData}
            tenantId={store.tenantId}
            storeId={store.storeId}
            authApiBaseUrl={resolvedAuthApiBase || undefined}
            authFormDefaults={store.authFormDefaults}
            onNavigate={navigate}
          />
        )}
        <SiteFooter
          siteTitle={siteName}
          pages={publishedPages}
          homeSlug={homePage?.slug ?? ""}
          onNavigate={navigate}
          footerStyle={store.footerStyle}
          hiddenFromHeader={store.hiddenFromHeader}
          footerLinks={store.footerLinks}
        />
      </div>
    </StorefrontCartProvider>
  );
}

function PageContent({
  page,
  apiBaseUrl,
  useDemoData,
  tenantId,
  storeId,
  authApiBaseUrl,
  authFormDefaults,
  onNavigate,
}: {
  page: StoredPage;
  apiBaseUrl?: string;
  useDemoData?: boolean;
  tenantId?: string;
  storeId?: string;
  authApiBaseUrl?: string;
  authFormDefaults?: AuthFormDefaults;
  onNavigate: (path: string) => void;
}) {
  const doc = page.document;
  const { meta, blocks } = doc;
  const layoutViewport = useStorefrontViewport();

  // Match builder order: render blocks sorted by layout position (y then x)
  const sortedBlocks = [...blocks].sort((a, b) => {
    const layoutA = resolveGridLayout(
      a.attributes as Record<string, unknown> | undefined,
      layoutViewport,
    );
    const layoutB = resolveGridLayout(
      b.attributes as Record<string, unknown> | undefined,
      layoutViewport,
    );
    const yA = layoutA && typeof layoutA.y === "number" ? layoutA.y : 0;
    const yB = layoutB && typeof layoutB.y === "number" ? layoutB.y : 0;
    if (yA !== yB) return yA - yB;
    const xA = layoutA && typeof layoutA.x === "number" ? layoutA.x : 0;
    const xB = layoutB && typeof layoutB.x === "number" ? layoutB.x : 0;
    return xA - xB;
  });

  return (
    <>
      <PageHead meta={meta} />
      <main className="storefront" role="main">
        <article className="storefront-article">
          {/* <header className="storefront-header">
            <h1>{meta.title}</h1>
            {meta.description && (
              <p className="storefront-description">{meta.description}</p>
            )}
          </header> */}
          <div className="storefront-blocks storefront-grid-12">
            {sortedBlocks.map((block) => {
              const attrs = block.attributes ?? {};
              const layout = resolveGridLayout(
                attrs as Record<string, unknown>,
                layoutViewport,
              );
              const span = Math.min(
                12,
                Math.max(
                  1,
                  (attrs.gridColumnSpan as number) ?? layout?.w ?? 12,
                ),
              );
              const start = Math.min(
                12,
                Math.max(
                  1,
                  (attrs.gridColumnStart as number) ??
                    (layout?.x != null ? layout.x + 1 : 1),
                ),
              );
              const fullBleed = !!(block.attributes?.fullBleed as boolean);
              /* Match builder ROW_HEIGHT (40px) so resized height in builder = storefront height */
              const rowHeightPx = 40;
              const layoutH =
                layout && typeof layout.h === "number" ? layout.h : null;
              const contentHeightPx =
                layoutH != null ? layoutH * rowHeightPx : undefined;
              const marginTopPx = parseSpacingToPx(
                String(attrs.marginTop ?? "").trim(),
              );
              const marginBottomPx = parseSpacingToPx(
                String(attrs.marginBottom ?? "").trim(),
              );
              const hasMargin = marginTopPx > 0 || marginBottomPx > 0;
              /* Cell height = content + margins so margin creates visible gap */
              const heightPx =
                contentHeightPx != null
                  ? contentHeightPx + marginTopPx + marginBottomPx
                  : undefined;
              const cellStyle: React.CSSProperties = {
                gridColumn: `${start} / span ${span}`,
              };
              const hasHeight = heightPx != null;
              if (hasHeight) {
                cellStyle.height = heightPx;
                cellStyle.minHeight = heightPx;
                if (!fullBleed) cellStyle.overflow = "hidden";
                /* When block has margin, child gets content height so margin extends below */
                if (hasMargin && contentHeightPx != null) {
                  (cellStyle as Record<string, string>)[
                    "--cell-content-height"
                  ] = `${contentHeightPx}px`;
                }
              }
              return (
                <div
                  key={block.id}
                  className={`storefront-block-cell ${fullBleed ? "block-full-bleed" : ""} ${hasHeight ? "storefront-block-cell--height-constrained" : ""} ${hasHeight && hasMargin ? "storefront-block-cell--has-margin" : ""}`}
                  style={cellStyle}
                >
                  {fullBleed ? (
                    <div className="storefront-full-bleed-inner">
                      <BlockRenderer
                        block={block}
                        apiBaseUrl={apiBaseUrl}
                        useDemoData={useDemoData}
                        tenantId={tenantId}
                        storeId={storeId}
                        authApiBaseUrl={authApiBaseUrl}
                        authFormDefaults={authFormDefaults}
                        onNavigate={onNavigate}
                        layoutViewport={layoutViewport}
                      />
                    </div>
                  ) : (
                    <BlockRenderer
                      block={block}
                      apiBaseUrl={apiBaseUrl}
                      useDemoData={useDemoData}
                      tenantId={tenantId}
                      storeId={storeId}
                      authApiBaseUrl={authApiBaseUrl}
                      authFormDefaults={authFormDefaults}
                      onNavigate={onNavigate}
                      layoutViewport={layoutViewport}
                    />
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

function PageHead({ meta }: { meta: PageDocument["meta"] }) {
  useEffect(() => {
    document.title = meta.title;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc && meta.description) {
      desc = document.createElement("meta");
      desc.setAttribute("name", "description");
      document.head.appendChild(desc);
    }
    if (desc) desc.setAttribute("content", meta.description ?? "");
  }, [meta.title, meta.description]);
  return null;
}
