import { useEffect, useMemo, useState } from "react";
import { DEMO_PRODUCTS, listProducts, type ProductApiPagination, type NormalizedProduct } from "@berg/blocks";

const PAGE_SIZE = 10;

interface ProductListingPageProps {
  apiBaseUrl?: string;
  useDemoData?: boolean;
  tenantId?: string;
  storeId?: string;
  onNavigate: (path: string) => void;
}

export function ProductListingPage({
  apiBaseUrl,
  useDemoData,
  tenantId,
  storeId,
  onNavigate,
}: ProductListingPageProps) {
  const [page, setPage] = useState(1);
  const [liveProducts, setLiveProducts] = useState<NormalizedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [livePagination, setLivePagination] = useState<ProductApiPagination | null>(null);

  const total = useDemoData ? DEMO_PRODUCTS.length : (livePagination?.total ?? liveProducts.length);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageProducts = useMemo(() => {
    if (!useDemoData) return liveProducts;
    const start = (page - 1) * PAGE_SIZE;
    return DEMO_PRODUCTS.slice(start, start + PAGE_SIZE);
  }, [page, useDemoData, liveProducts]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    if (useDemoData) return;
    if (!apiBaseUrl?.trim()) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listProducts({
      apiBaseUrl,
      endpoint: "/v1/products",
      page,
      limit: PAGE_SIZE,
      tenantId,
      storeId,
      signal: controller.signal,
    })
      .then((result) => {
        setLiveProducts(result.data);
        setLivePagination(result.pagination);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load products");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [apiBaseUrl, page, storeId, tenantId, useDemoData]);

  useEffect(() => {
    document.title = "All products";
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement("meta");
      desc.setAttribute("name", "description");
      document.head.appendChild(desc);
    }
    desc.setAttribute("content", "Browse all products in the store.");
  }, []);

  if (!useDemoData && !apiBaseUrl?.trim()) {
    return (
      <main
        className="storefront collection-detail product-listing"
        role="main"
      >
        <article className="collection-detail-article">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/");
            }}
            className="product-detail-back"
          >
            ← Home
          </a>
          <header className="storefront-header">
            <h1>All products</h1>
          </header>
          <p className="product-grid-error">
            {!apiBaseUrl?.trim()
              ? "API base URL not configured. Set it in Builder → Website → API Base URL, or enable demo data to preview the catalog."
              : "Live catalog will load from your store API when this connection is ready."}
          </p>
        </article>
      </main>
    );
  }

  if (!useDemoData && loading) {
    return (
      <main className="storefront collection-detail product-listing" role="main">
        <article className="collection-detail-article">
          <header className="storefront-header">
            <h1>All products</h1>
          </header>
          <p className="product-grid-loading">Loading products...</p>
        </article>
      </main>
    );
  }

  if (!useDemoData && error) {
    return (
      <main className="storefront collection-detail product-listing" role="main">
        <article className="collection-detail-article">
          <header className="storefront-header">
            <h1>All products</h1>
          </header>
          <p className="product-grid-error">{error}</p>
        </article>
      </main>
    );
  }

  if (!useDemoData && !loading && !error && pageProducts.length === 0) {
    return (
      <main className="storefront collection-detail product-listing" role="main">
        <article className="collection-detail-article">
          <header className="storefront-header">
            <h1>All products</h1>
          </header>
          <p className="product-grid-error">
            No products found for this tenant/store. Verify Tenant ID, Store ID, and API data.
          </p>
        </article>
      </main>
    );
  }

  return (
    <main className="storefront collection-detail product-listing" role="main">
      <article className="collection-detail-article">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("/");
          }}
          className="product-detail-back"
        >
          ← Home
        </a>
        <header className="storefront-header">
          <h1>All products</h1>
          <p className="storefront-description">Browse the full catalog.</p>
        </header>
        <p className="product-listing-count" aria-live="polite">
          Showing {(page - 1) * PAGE_SIZE + 1}–
          {Math.min(page * PAGE_SIZE, total)} of {total}
        </p>
        <div className="product-grid">
          {pageProducts.map((product) => (
            <article key={product.id} className="product-card">
              {product.image && (
                <div className="product-image">
                  <img src={product.image} alt={product.title} loading="lazy" />
                </div>
              )}
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                {product.description && (
                  <p className="product-description">{product.description}</p>
                )}
                <div className="product-price">${product.price.toFixed(2)}</div>
                {(useDemoData ? product.handle : product.id) && (
                  <a
                    href={`/products/${encodeURIComponent(useDemoData ? product.handle : product.id)}`}
                    className="product-link"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/products/${encodeURIComponent(useDemoData ? product.handle : product.id)}`);
                    }}
                  >
                    View Product
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
        {totalPages > 1 && (
          <nav
            className="product-listing-pagination"
            aria-label="Product list pages"
          >
            <button
              type="button"
              className="product-listing-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <div className="product-listing-page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`product-listing-page-num${n === page ? " is-active" : ""}`}
                  aria-current={n === page ? "page" : undefined}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="product-listing-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </nav>
        )}
      </article>
    </main>
  );
}
