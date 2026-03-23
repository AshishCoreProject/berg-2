import { useEffect, useState } from 'react';
import { getDemoProductsByCollectionHandle, getDemoCollectionByHandle } from '@berg/blocks';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  handle: string;
}

interface CollectionDetailPageProps {
  handle: string;
  apiBaseUrl?: string;
  useDemoData?: boolean;
  onNavigate: (path: string) => void;
}

export function CollectionDetailPage({ handle, apiBaseUrl, useDemoData, onNavigate }: CollectionDetailPageProps) {
  const [collection, setCollection] = useState<{ title: string; description?: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (useDemoData) {
      const demoCollection = getDemoCollectionByHandle(handle);
      const demoProducts = getDemoProductsByCollectionHandle(handle);
      setCollection(demoCollection ? { title: demoCollection.title, description: demoCollection.description } : null);
      setProducts(demoProducts as Product[]);
      setLoading(false);
      if (!demoCollection && demoProducts.length === 0) setError('Collection not found');
      return;
    }
    if (!apiBaseUrl) {
      setError('API base URL not configured.');
      setLoading(false);
      return;
    }
    const fetchCollection = async () => {
      try {
        setLoading(true);
        const url = `${apiBaseUrl.replace(/\/$/, '')}/collections/${encodeURIComponent(handle)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Collection not found');
        const data = await res.json();
        setCollection({ title: data.title, description: data.description });
        const productsUrl = `${apiBaseUrl.replace(/\/$/, '')}/collections/${encodeURIComponent(handle)}/products`;
        const prodRes = await fetch(productsUrl);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const items = Array.isArray(prodData) ? prodData : prodData.products || prodData.items || [];
          setProducts(items.map((p: { id: string; title: string; description?: string; price: number; image?: string; handle?: string }) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            price: p.price ?? 0,
            image: p.image,
            handle: p.handle ?? p.id,
          })));
        } else {
          setProducts([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetchCollection();
  }, [handle, apiBaseUrl, useDemoData]);

  if (loading) {
    return (
      <main className="storefront collection-detail" role="main">
        <div className="product-detail-loading">Loading...</div>
      </main>
    );
  }
  if (error || (!collection && products.length === 0)) {
    return (
      <main className="storefront collection-detail" role="main">
        <p>{error ?? 'Collection not found.'}</p>
        <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} className="product-detail-back">← Go to home</a>
      </main>
    );
  }

  return (
    <main className="storefront collection-detail" role="main">
      <article className="collection-detail-article">
        <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} className="product-detail-back">← All collections</a>
        <header className="storefront-header">
          <h1>{collection?.title ?? handle}</h1>
          {collection?.description && (
            <p className="storefront-description">{collection.description}</p>
          )}
        </header>
        {products.length === 0 ? (
          <p>No products in this collection yet.</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
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
                  {product.handle && (
                    <a
                      href={`/products/${product.handle}`}
                      className="product-link"
                      onClick={(e) => { e.preventDefault(); onNavigate(`/products/${product.handle}`); }}
                    >
                      View Product
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </main>
  );
}
