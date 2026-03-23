import { useEffect, useState } from 'react';
import { getDemoProductByHandle } from '@berg/blocks';

interface ProductDetailPageProps {
  handle: string;
  apiBaseUrl?: string;
  useDemoData?: boolean;
  onNavigate: (path: string) => void;
}

export function ProductDetailPage({ handle, apiBaseUrl, useDemoData, onNavigate }: ProductDetailPageProps) {
  const [product, setProduct] = useState<{
    id: string;
    title: string;
    description?: string;
    price: number;
    image?: string;
    handle: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const url = `${apiBaseUrl.replace(/\/$/, '')}/products/${encodeURIComponent(handle)}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data) => {
        setProduct({
          id: data.id,
          title: data.title,
          description: data.description,
          price: data.price ?? 0,
          image: data.image,
          handle: data.handle ?? data.id,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [handle, apiBaseUrl, useDemoData]);

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
          {product.image && (
            <div className="product-detail-image">
              <img src={product.image} alt={product.title} />
            </div>
          )}
          <div className="product-detail-info">
            <h1 className="product-detail-title">{product.title}</h1>
            <div className="product-detail-price">${product.price.toFixed(2)}</div>
            {product.description && (
              <p className="product-detail-description">{product.description}</p>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
