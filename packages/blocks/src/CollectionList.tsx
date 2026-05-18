import { useEffect, useState } from 'react';
import { DEMO_COLLECTIONS } from './demoData';
import { sanitizeHtml, isHtml } from './sanitizeHtml';

interface Collection {
  id: string;
  title: string;
  description?: string;
  handle?: string;
  image?: string;
  productCount?: number;
  [key: string]: unknown;
}

interface Props {
  apiBaseUrl?: string;
  apiEndpoint: string;
  title: string;
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

export function CollectionList({ apiBaseUrl, apiEndpoint, title, useDemoData, titleFontFamily, titleTextColor, titleFontSize, titleFontWeight, titleFontStyle, buttonBackgroundColor, buttonColor, buttonFontFamily, buttonFontSize, buttonFontWeight, buttonFontStyle, buttonBorderRadius, buttonPadding }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
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
    // Temporary policy: collections are demo-only until collection APIs are finalized.
    void apiBaseUrl;
    void apiEndpoint;
    void useDemoData;
    setError(null);
    setCollections(DEMO_COLLECTIONS as Collection[]);
    setLoading(false);
  }, [apiBaseUrl, apiEndpoint, useDemoData]);

  if (loading) {
    return (
      <section className="block block-collection-list">
        <h2 className="block-heading" style={Object.keys(titleStyle).length ? titleStyle : undefined}>{isHtml(title) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} /> : title}</h2>
        <div className="collection-list-loading">Loading collections...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="block block-collection-list">
        <h2 className="block-heading" style={Object.keys(titleStyle).length ? titleStyle : undefined}>{isHtml(title) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} /> : title}</h2>
        <div className="collection-list-error">{error}</div>
      </section>
    );
  }

  if (collections.length === 0) {
    return (
      <section className="block block-collection-list">
        <h2 className="block-heading" style={Object.keys(titleStyle).length ? titleStyle : undefined}>{isHtml(title) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} /> : title}</h2>
        <p>No collections found.</p>
      </section>
    );
  }

  return (
    <section className="block block-collection-list">
      <h2 className="block-heading" style={Object.keys(titleStyle).length ? titleStyle : undefined}>{isHtml(title) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} /> : title}</h2>
      <div className="collection-list">
        {collections.map((collection) => (
          <article key={collection.id} className="collection-card">
            {collection.image && (
              <div className="collection-image">
                <img src={collection.image} alt={collection.title} loading="lazy" />
              </div>
            )}
            <div className="collection-info">
              <h3 className="collection-title">{collection.title}</h3>
              {collection.description && (
                <p className="collection-description">{collection.description}</p>
              )}
              {collection.productCount !== undefined && (
                <p className="collection-count">{collection.productCount} products</p>
              )}
              {collection.handle && (
                <a href={`/collections/${collection.handle}`} className="collection-link" style={Object.keys(linkStyle).length ? linkStyle : undefined}>
                  View Collection
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
