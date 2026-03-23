import { useEffect, useState } from 'react';
import { DEMO_PRODUCTS } from './demoData';
import { sanitizeHtml, isHtml } from './sanitizeHtml';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  handle?: string;
  [key: string]: unknown;
}

interface Props {
  apiBaseUrl?: string;
  apiEndpoint: string;
  title: string;
  limit?: number;
  collectionId?: string;
  useDemoData?: boolean;
  titleFontFamily?: string;
  titleTextColor?: string;
  titleFontSize?: string;
  titleFontWeight?: string;
  titleFontStyle?: string;
  buttonBackgroundColor?: string;
  buttonColor?: string;
  buttonFontFamily?: string;
  buttonFontSize?: string;
  buttonFontWeight?: string;
  buttonFontStyle?: string;
  buttonBorderRadius?: string;
  buttonPadding?: string;
}

export function ProductGrid({ apiBaseUrl, apiEndpoint, title, limit = 12, collectionId, useDemoData, titleFontFamily, titleTextColor, titleFontSize, titleFontWeight, titleFontStyle, buttonBackgroundColor, buttonColor, buttonFontFamily, buttonFontSize, buttonFontWeight, buttonFontStyle, buttonBorderRadius, buttonPadding }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const titleStyle: React.CSSProperties = {};
  if (titleFontFamily) titleStyle.fontFamily = titleFontFamily;
  if (titleTextColor) titleStyle.color = titleTextColor;
  if (titleFontSize) titleStyle.fontSize = titleFontSize;
  if (titleFontWeight) titleStyle.fontWeight = titleFontWeight as React.CSSProperties['fontWeight'];
  if (titleFontStyle) titleStyle.fontStyle = titleFontStyle as React.CSSProperties['fontStyle'];

  const linkStyle: React.CSSProperties = {};
  if (buttonBackgroundColor) linkStyle.backgroundColor = buttonBackgroundColor;
  if (buttonColor) linkStyle.color = buttonColor;
  if (buttonFontFamily) linkStyle.fontFamily = buttonFontFamily;
  if (buttonFontSize) linkStyle.fontSize = buttonFontSize;
  if (buttonFontWeight) linkStyle.fontWeight = buttonFontWeight as React.CSSProperties['fontWeight'];
  if (buttonFontStyle) linkStyle.fontStyle = buttonFontStyle as React.CSSProperties['fontStyle'];
  if (buttonBorderRadius) linkStyle.borderRadius = buttonBorderRadius;
  if (buttonPadding) linkStyle.padding = buttonPadding;

  useEffect(() => {
    if (useDemoData) {
      const list = [...DEMO_PRODUCTS];
      setProducts(list.slice(0, limit) as Product[]);
      setLoading(false);
      return;
    }

    if (!apiBaseUrl) {
      setError('API base URL not configured. Set it in Builder → Website → API Base URL.');
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const url = new URL(apiEndpoint, apiBaseUrl);
        if (collectionId) url.searchParams.set('collection', collectionId);
        if (limit) url.searchParams.set('limit', limit.toString());

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();
        const items = Array.isArray(data) ? data : data.products || data.items || [];
        setProducts(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [apiBaseUrl, apiEndpoint, collectionId, limit, useDemoData]);

  if (loading) {
    return (
      <section className="block block-product-grid">
        <h2 className="block-heading" style={Object.keys(titleStyle).length ? titleStyle : undefined}>{isHtml(title) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} /> : title}</h2>
        <div className="product-grid-loading">Loading products...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="block block-product-grid">
        <h2 className="block-heading" style={Object.keys(titleStyle).length ? titleStyle : undefined}>{isHtml(title) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} /> : title}</h2>
        <div className="product-grid-error">{error}</div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="block block-product-grid">
        <h2 className="block-heading" style={Object.keys(titleStyle).length ? titleStyle : undefined}>{isHtml(title) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} /> : title}</h2>
        <p>No products found.</p>
      </section>
    );
  }

  return (
    <section className="block block-product-grid">
      <h2 className="block-heading" style={Object.keys(titleStyle).length ? titleStyle : undefined}>{isHtml(title) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} /> : title}</h2>
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
                <a href={`/products/${product.handle}`} className="product-link" style={Object.keys(linkStyle).length ? linkStyle : undefined}>
                  View Product
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
