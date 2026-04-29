import { useEffect, useMemo, useRef, useState } from 'react';
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
  variants?: LoadedVariant[];
  options?: LoadedOption[];
};

type LoadedVariant = {
  id: string;
  title?: string;
  price?: number;
  image?: string;
  stock?: number;
  option_values?: Record<string, string>;
};

type LoadedOption = {
  position: number;
  name: string;
  values: string[];
};

const MAX_QTY = 99;

function normalizeImages(p: LoadedProduct): string[] {
  if (p.images?.length) return p.images;
  if (p.image) return [p.image];
  return [];
}

function normalizeVariantId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setQuantity(1);
    setSelectedIndex(0);
    setSelectedOptions({});
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

  const images = product ? normalizeImages(product) : [];
  const queryVariantIdRaw =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("variant_id")
      : null;
  const queryVariantId = normalizeVariantId(queryVariantIdRaw);
  const productVariantId = normalizeVariantId(product?.variant_id);
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  const optionGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    const productOptions = Array.isArray(product?.options) ? product.options : [];
    for (const option of productOptions) {
      if (!option?.name || !Array.isArray(option.values)) continue;
      groups[option.name] = [...option.values];
    }
    for (const variant of variants) {
      if (!variant.option_values) continue;
      for (const [name, value] of Object.entries(variant.option_values)) {
        if (!name || !value) continue;
        if (!groups[name]) groups[name] = [];
        if (!groups[name].includes(value)) groups[name].push(value);
      }
    }
    return groups;
  }, [variants, product?.options]);

  const optionNames = useMemo(() => Object.keys(optionGroups), [optionGroups]);

  const variantById = useMemo(() => {
    const entries = variants
      .map((v) => [normalizeVariantId(v.id), v] as const)
      .filter(([id]): id is string => Boolean(id));
    return new Map(entries);
  }, [variants]);

  const defaultVariant =
    (queryVariantId ? variantById.get(queryVariantId) : undefined) ??
    (productVariantId ? variantById.get(productVariantId) : undefined) ??
    variants[0];

  useEffect(() => {
    if (!defaultVariant?.option_values) {
      setSelectedOptions({});
      return;
    }
    setSelectedOptions((prev) => {
      if (Object.keys(prev).length) return prev;
      return { ...defaultVariant.option_values };
    });
  }, [defaultVariant]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return undefined;
    if (!optionNames.length) {
      return defaultVariant ?? variants[0];
    }
    const selectedNames = Object.keys(selectedOptions);
    if (!selectedNames.length) return defaultVariant ?? variants[0];
    const exact = variants.find((variant) => {
      if (!variant.option_values) return false;
      return optionNames.every((name) => {
        const expected = selectedOptions[name];
        if (!expected) return false;
        return variant.option_values?.[name] === expected;
      });
    });
    return exact;
  }, [variants, optionNames, selectedOptions, defaultVariant]);

  const selectedVariantId = normalizeVariantId(selectedVariant?.id);
  const fallbackVariantId = productVariantId || queryVariantId;
  const effectiveVariantId = selectedVariantId || fallbackVariantId || undefined;
  const variantMissing = !useDemoData && !effectiveVariantId;
  const hasVariantOptions = optionNames.length > 0;
  const activePrice =
    typeof selectedVariant?.price === "number" ? selectedVariant.price : (product?.price ?? 0);
  const displayImage = selectedVariant?.image || images[0];
  const galleryImages = useMemo(() => {
    if (displayImage && !images.includes(displayImage)) return [displayImage, ...images];
    return images;
  }, [images, displayImage]);
  const safeIndex = Math.min(selectedIndex, Math.max(0, galleryImages.length - 1));
  const mainSrc = galleryImages[safeIndex];
  const showGalleryStrip = galleryImages.length > 1;

  const line = {
    id: String(product?.id ?? ""),
    variant_id: effectiveVariantId,
    name: product?.title ?? "Product",
    price: activePrice,
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
  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
  };
  const isVariantAvailable = (variant: LoadedVariant): boolean =>
    typeof variant.stock === "number" ? variant.stock > 0 : true;
  const canSelectOptionValue = (optionName: string, value: string): boolean => {
    if (!variants.length) return true;
    return variants.some((variant) => {
      if (!isVariantAvailable(variant)) return false;
      if (variant.option_values?.[optionName] !== value) return false;
      return optionNames.every((name) => {
        if (name === optionName) return true;
        const selected = selectedOptions[name];
        if (!selected) return true;
        return variant.option_values?.[name] === selected;
      });
    });
  };

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
                {galleryImages.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={i === safeIndex}
                    aria-label={`View image ${i + 1} of ${galleryImages.length}`}
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
            <div className="product-detail-price">${activePrice.toFixed(2)}</div>
            {product.description && (
              <p className="product-detail-description">{product.description}</p>
            )}
            {hasVariantOptions && (
              <div className="product-detail-variants">
                {optionNames.map((optionName) => (
                  <div
                    key={optionName}
                    className={`product-detail-option product-detail-option--${optionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  >
                    <span className="product-detail-option-label">{optionName}</span>
                    <div className="product-detail-option-values" role="group" aria-label={optionName}>
                      {optionGroups[optionName].map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`product-detail-option-chip${selectedOptions[optionName] === value ? ' is-selected' : ''}`}
                          onClick={() => handleOptionChange(optionName, value)}
                          disabled={!canSelectOptionValue(optionName, value)}
                          aria-pressed={selectedOptions[optionName] === value}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {selectedVariant?.title && (
                  <p className="product-detail-variant-title">Variant: {selectedVariant.title}</p>
                )}
              </div>
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
                {hasVariantOptions ? 'Please select a valid variant combination.' : 'Variant unavailable for this product.'}
              </p>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
