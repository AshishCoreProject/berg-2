import { useEffect, useRef, useState } from 'react';
import { useCart } from '@storefront-ui-plugin/cart-checkout-plugin';
import { getDemoProductByHandle, getProductById } from '@berg/blocks';

interface ProductDetailPageProps {
  handle: string;
  apiBaseUrl?: string;
  useDemoData?: boolean;
  tenantId?: string;
  storeId?: string;
  onNavigate: (path: string) => void;
}

type LoadedProduct = {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  images?: string[];
  handle: string;
  variant_id?: string;
};

const MAX_QTY = 99;

function normalizeImages(p: LoadedProduct): string[] {
  if (p.images?.length) return p.images;
  if (p.image) return [p.image];
  return [];
}

export function ProductDetailPage({ handle, apiBaseUrl, useDemoData, tenantId, storeId, onNavigate }: ProductDetailPageProps) {
  const { addItem } = useCart();
  const [addedFeedback, setAddedFeedback] = useState(false);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [product, setProduct] = useState<LoadedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setQuantity(1);
    setSelectedIndex(0);
  }, [handle]);

  useEffect(() => {
    if (useDemoData) {
      const demo = getDemoProductByHandle(handle);
      setProduct(demo ?? null);
      setLoading(false);
      if (!demo) setError('Product not found');
      return;
    }
    if (!apiBaseUrl) {
      setError('API base URL not configured.');
      setLoading(false);
      return;
    }
    getProductById({
      apiBaseUrl,
      productId: handle,
      endpointPrefix: '/v1/products',
      tenantId,
      storeId,
    })
      .then((loaded) => {
        setProduct(loaded);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [handle, apiBaseUrl, useDemoData, tenantId, storeId]);

  if (loading) {
    return (
      <main className="storefront product-detail" role="main">
        <div className="product-detail-loading">Loading...</div>
      </main>
    );
  }
  if (error || !product) {
    return (
      <main className="storefront product-detail" role="main">
        <p>{error ?? 'Product not found.'}</p>
        <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}>← Back to home</a>
      </main>
    );
  }

  const images = normalizeImages(product);
  const safeIndex = Math.min(selectedIndex, Math.max(0, images.length - 1));
  const mainSrc = images[safeIndex];
  const showGalleryStrip = images.length > 1;
  const queryVariantIdRaw =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("variant_id")
      : null;
  const queryVariantId =
    typeof queryVariantIdRaw === "string" ? queryVariantIdRaw.trim() : "";
  const productVariantId =
    typeof product.variant_id === "string" ? product.variant_id.trim() : "";
  const effectiveVariantId = productVariantId || queryVariantId || undefined;
  const variantMissing = !useDemoData && !effectiveVariantId;

  const line = {
    id: String(product.id),
    variant_id: effectiveVariantId,
    name: product.title,
    price: product.price,
  };

  const handleAddToCart = () => {
    if (variantMissing) return;
    addItem(line, quantity);
    setAddedFeedback(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => {
      setAddedFeedback(false);
      addedTimerRef.current = null;
    }, 2000);
  };

  const handleBuyNow = () => {
    if (variantMissing) return;
    addItem(line, quantity);
    onNavigate('/cart');
  };

  const decQty = () => setQuantity((q) => Math.max(1, q - 1));
  const incQty = () => setQuantity((q) => Math.min(MAX_QTY, q + 1));

  return (
    <main className="storefront product-detail" role="main">
      <article className="product-detail-article">
        <a href="/products" onClick={(e) => { e.preventDefault(); onNavigate('/products'); }} className="product-detail-back">← All products</a>
        <div className="product-detail-layout">
          <div className="product-detail-gallery">
            <div className="product-detail-gallery-main product-detail-image">
              {mainSrc ? (
                <img src={mainSrc} alt={product.title} />
              ) : (
                <div className="product-detail-image-placeholder" aria-hidden />
              )}
            </div>
            {showGalleryStrip && (
              <div
                className="product-detail-gallery-thumbs"
                role="tablist"
                aria-label="Product images"
              >
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={i === safeIndex}
                    aria-label={`View image ${i + 1} of ${images.length}`}
                    className={`product-detail-gallery-thumb${i === safeIndex ? ' is-selected' : ''}`}
                    onClick={() => setSelectedIndex(i)}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="product-detail-info">
            <h1 className="product-detail-title">{product.title}</h1>
            <div className="product-detail-price">${product.price.toFixed(2)}</div>
            {product.description && (
              <p className="product-detail-description">{product.description}</p>
            )}
            <div className="product-detail-quantity">
              <span className="product-detail-quantity-label" id="pdp-qty-label">Quantity</span>
              <div className="product-detail-quantity-controls" role="group" aria-labelledby="pdp-qty-label">
                <button type="button" className="product-detail-qty-btn" onClick={decQty} aria-label="Decrease quantity">
                  −
                </button>
                <span className="product-detail-qty-value" aria-live="polite">{quantity}</span>
                <button type="button" className="product-detail-qty-btn" onClick={incQty} aria-label="Increase quantity">
                  +
                </button>
              </div>
            </div>
            <div className="product-detail-actions">
              <button type="button" className="product-detail-btn product-detail-btn-primary" onClick={handleAddToCart} disabled={variantMissing}>
                {addedFeedback ? 'Added' : 'Add to cart'}
              </button>
              <button type="button" className="product-detail-btn product-detail-btn-secondary" onClick={handleBuyNow} disabled={variantMissing}>
                Buy now
              </button>
            </div>
            {variantMissing && (
              <p className="product-grid-error" role="alert">
                Variant unavailable for this product.
              </p>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
