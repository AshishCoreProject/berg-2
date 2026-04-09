import { useRef, useEffect } from 'react';
import type { Block } from '@berg/schema';
import { isInnerBlocksBlock } from '@berg/schema';
import { sanitizeHtml, isHtml, sanitizeCustomHtml } from './sanitizeHtml';
import { ProductGrid } from './ProductGrid';
import { CollectionList } from './CollectionList';
import { resolveGridLayout, type StorefrontViewport } from './blockLayout';

interface Props {
  block: Block;
  apiBaseUrl?: string;
  useDemoData?: boolean;
  tenantId?: string;
  storeId?: string;
  /**
   * Which `layoutByViewport` bucket to use for grid-derived sizing (e.g. core/box min-height).
   * Storefront passes `useStorefrontViewport()`; builder omits (defaults to desktop).
   */
  layoutViewport?: StorefrontViewport;
  /**
   * When false, skip rendering `block.children` overlay.
   * Used by builder to render a clean parent surface and draw children via
   * its own overlay UI.
   */
  renderChildren?: boolean;
}

/**
 * Renders a single block to semantic HTML for SEO and accessibility.
 * Each block type maps to appropriate tags (section, article, h1–h6, p, figure, etc.).
 */
const SPACING_KEYS = ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'] as const;

/** Normalize value: "12" -> "12px", "1.5rem" -> "24px" (1rem=16px). Always output px for reliability. */
function normalizeSpacingValue(v: string): string {
  const trimmed = v.trim();
  if (!trimmed) return '';
  const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) return `${numMatch[1]}px`;
  const remMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*rem$/i);
  if (remMatch) return `${Math.round(parseFloat(remMatch[1]) * 16)}px`;
  return trimmed;
}

/** Form container: renders fields + submit button, runs submitScript on mount */
function FormBlock({
  title,
  submitButtonText,
  submitScript,
  fields,
  apiBaseUrl,
  useDemoData,
  tenantId,
  storeId,
  layoutViewport,
}: {
  title: string;
  submitButtonText: string;
  submitScript: string;
  fields: Block[];
  apiBaseUrl?: string;
  useDemoData?: boolean;
  tenantId?: string;
  storeId?: string;
  layoutViewport?: StorefrontViewport;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!formRef.current || !submitScript.trim()) return;
    try {
      const fn = new Function('formEl', submitScript);
      fn(formRef.current);
    } catch (_err) {
      /* ignore parse/runtime errors in user script */
    }
  }, [submitScript]);
  return (
    <section className="block block-form">
      {title && <h3 className="block-form-title">{title}</h3>}
      <form ref={formRef} className="block-form-inner" onSubmit={(e) => e.preventDefault()}>
        {fields.map((f) => (
          <BlockRenderer key={f.id} block={f} apiBaseUrl={apiBaseUrl} useDemoData={useDemoData} tenantId={tenantId} storeId={storeId} layoutViewport={layoutViewport} />
        ))}
        <div className="block-form-actions">
          <button type="submit" className="button-link form-submit-btn">
            {submitButtonText}
          </button>
        </div>
      </form>
    </section>
  );
}

function buildSpacingStyle(attrs: Record<string, unknown>): React.CSSProperties {
  const s: React.CSSProperties = {};
  for (const k of SPACING_KEYS) {
    const v = attrs[k];
    const str = v == null ? '' : typeof v === 'number' ? String(v) : typeof v === 'string' ? v : '';
    if (str) {
      const normalized = normalizeSpacingValue(str);
      if (normalized) (s as Record<string, string>)[k] = normalized;
    }
  }
  return s;
}

export function BlockRenderer({ block, apiBaseUrl, useDemoData, tenantId, storeId, renderChildren, layoutViewport = 'desktop' }: Props) {
  const attrs = block.attributes ?? {};
  const spacingStyle = buildSpacingStyle(attrs);
  const textAlign = (attrs.textAlign as string | undefined) ?? 'left';
  const verticalAlign = (attrs.verticalAlign as string | undefined) ?? 'center';
  const normalizedTextAlign =
    textAlign === 'center' || textAlign === 'right' || textAlign === 'left' ? textAlign : 'left';
  const normalizedVerticalAlign =
    verticalAlign === 'top' || verticalAlign === 'center' || verticalAlign === 'bottom' ? verticalAlign : 'center';
  const verticalJustifyContent: React.CSSProperties['justifyContent'] =
    normalizedVerticalAlign === 'top' ? 'flex-start' : normalizedVerticalAlign === 'bottom' ? 'flex-end' : 'center';

  const textStyle = (): React.CSSProperties => {
    const s: React.CSSProperties = {};
    const font = attrs.fontFamily as string | undefined;
    const color = attrs.textColor as string | undefined;
    const size = attrs.fontSize as string | undefined;
    const weight = attrs.fontWeight as string | undefined;
    const style = attrs.fontStyle as string | undefined;
    if (font) s.fontFamily = font;
    if (color) s.color = color;
    if (size) s.fontSize = size;
    if (weight) s.fontWeight = weight as React.CSSProperties['fontWeight'];
    if (style) s.fontStyle = style as React.CSSProperties['fontStyle'];
    return s;
  };

  const wrapWithSpacing = (el: React.ReactNode) => {
    if (Object.keys(spacingStyle).length === 0) return el;
    return (
      <div style={{ ...spacingStyle, width: '100%', height: '100%', boxSizing: 'border-box' }}>
        {el}
      </div>
    );
  };

  let content: React.ReactNode = null;

  switch (block.type) {
    case 'core/box': {
      // On storefront, an empty Box has no intrinsic height. Use builder layout rows (40px)
      // as a sensible default so background/border/shadow are visible.
      const layout = resolveGridLayout(attrs as Record<string, unknown>, layoutViewport);
      const minHeightPx = `${Math.max(1, (layout?.h ?? 1)) * 40}px`;
      const style: React.CSSProperties = { minHeight: minHeightPx, width: '100%', boxSizing: 'border-box' };
      const bg = attrs.backgroundColor as string | undefined;
      const radius = attrs.borderRadius as string | undefined;
      const pad = attrs.padding as string | undefined;
      const boxShadow = attrs.boxShadow as string | undefined;
      const border = attrs.border as string | undefined;
      if (bg) style.backgroundColor = bg;
      if (radius) style.borderRadius = radius;
      if (pad) style.padding = pad;
      if (boxShadow) style.boxShadow = boxShadow;
      if (border) style.border = border;
      content = (
        <div className="block block-box" style={style} />
      );
      break;
    }

    case 'core/paragraph': {
      const c = (attrs.content as string) ?? '';
      if (!c.trim()) break;
      const style = textStyle();
      style.textAlign = normalizedTextAlign;
      const nodeStyle: React.CSSProperties = { ...style, flex: '0 0 auto' };
      content = (
        <div
          className="block-vertical-align-wrap"
          style={{ display: 'flex', flexDirection: 'column', justifyContent: verticalJustifyContent, minHeight: '100%', height: '100%' }}
        >
          {isHtml(c) ? <p className="block block-paragraph" style={nodeStyle} dangerouslySetInnerHTML={{ __html: sanitizeHtml(c) }} /> : <p className="block block-paragraph" style={nodeStyle}>{c}</p>}
        </div>
      );
      break;
    }

    case 'core/heading': {
      const c = (attrs.content as string) ?? '';
      const level = Math.min(6, Math.max(1, (attrs.level as number) ?? 2));
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      if (!c.trim()) break;
      const style = textStyle();
      style.textAlign = normalizedTextAlign;
      const nodeStyle: React.CSSProperties = { ...style, flex: '0 0 auto' };
      content = (
        <div
          className="block-vertical-align-wrap"
          style={{ display: 'flex', flexDirection: 'column', justifyContent: verticalJustifyContent, minHeight: '100%', height: '100%' }}
        >
          {isHtml(c) ? <Tag className="block block-heading" style={nodeStyle} dangerouslySetInnerHTML={{ __html: sanitizeHtml(c) }} /> : <Tag className="block block-heading" style={nodeStyle}>{c}</Tag>}
        </div>
      );
      break;
    }

    case 'core/image': {
      const url = (attrs.url as string) ?? '';
      const alt = (attrs.alt as string) ?? '';
      const caption = (attrs.caption as string) ?? '';
      const width = (attrs.width as number) ?? 100;
      const capFont = attrs.captionFontFamily as string | undefined;
      const capColor = attrs.captionTextColor as string | undefined;
      const capSize = attrs.captionFontSize as string | undefined;
      const capWeight = attrs.captionFontWeight as string | undefined;
      const capStyle = attrs.captionFontStyle as string | undefined;
      const captionStyle: React.CSSProperties = {};
      if (capFont) captionStyle.fontFamily = capFont;
      if (capColor) captionStyle.color = capColor;
      if (capSize) captionStyle.fontSize = capSize;
      if (capWeight) captionStyle.fontWeight = capWeight as React.CSSProperties['fontWeight'];
      if (capStyle) captionStyle.fontStyle = capStyle as React.CSSProperties['fontStyle'];
      if (url) {
        content = (
          <figure className="block block-image" style={width ? { maxWidth: `${width}%` } : undefined}>
            <img src={url} alt={alt || undefined} loading="lazy" decoding="async" />
            {caption && <figcaption style={Object.keys(captionStyle).length ? captionStyle : undefined}>{isHtml(caption) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(caption) }} /> : caption}</figcaption>}
          </figure>
        );
      }
      break;
    }

    case 'core/button': {
      const text = (attrs.text as string) ?? 'Click me';
      const url = (attrs.url as string) ?? '#';
      const openInNewTab = (attrs.openInNewTab as boolean) ?? false;
      const style: React.CSSProperties = { ...textStyle() };
      const bg = attrs.backgroundColor as string | undefined;
      const radius = attrs.borderRadius as string | undefined;
      const pad = attrs.padding as string | undefined;
      if (bg) style.backgroundColor = bg;
      if (radius) style.borderRadius = radius;
      if (pad) style.padding = pad;
      content = (
        <p className="block block-button">
          <a
            href={url}
            target={openInNewTab ? '_blank' : undefined}
            rel={openInNewTab ? 'noopener noreferrer' : undefined}
            className="button-link"
            style={Object.keys(style).length ? style : undefined}
          >
            {isHtml(text) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} /> : text}
          </a>
        </p>
      );
      break;
    }

    case 'core/columns': {
      if (isInnerBlocksBlock(block) && block.innerBlocks?.length) {
        const columns = (attrs.columns as number) ?? 2;
        const columnWidths = (attrs.columnWidths as number[] | undefined);
        const gridCols = columnWidths && columnWidths.length === block.innerBlocks.length
          ? columnWidths.map((p) => `${p}fr`).join(' ')
          : `repeat(${columns}, 1fr)`;
        content = (
          <section className="block block-columns" aria-label="Content columns">
            <div
              className="columns-inner"
              style={{ gridTemplateColumns: gridCols }}
            >
              {block.innerBlocks.map((col) => (
                <div key={col.id} className="column">
                  <BlockRenderer block={col} apiBaseUrl={apiBaseUrl} useDemoData={useDemoData} tenantId={tenantId} storeId={storeId} layoutViewport={layoutViewport} />
                </div>
              ))}
            </div>
          </section>
        );
      }
      break;
    }

    case 'core/column':
      content = (
        <div className="block block-column">
          {/* Column content would be nested blocks in a full implementation */}
        </div>
      );
      break;

    case 'core/hero': {
      const title = (attrs.title as string) ?? '';
      const subtitle = (attrs.subtitle as string) ?? '';
      const backgroundImage = (attrs.backgroundImage as string) ?? '';
      const heroBg = attrs.heroBackgroundColor as string | undefined;
      const ctaText = (attrs.ctaText as string) ?? '';
      const ctaUrl = (attrs.ctaUrl as string) ?? '#';
      const titleFont = attrs.titleFontFamily as string | undefined;
      const titleColor = attrs.titleTextColor as string | undefined;
      const titleSize = attrs.titleFontSize as string | undefined;
      const titleWeight = attrs.titleFontWeight as string | undefined;
      const titleStyleAttr = attrs.titleFontStyle as string | undefined;
      const titleStyle: React.CSSProperties = {};
      if (titleFont) titleStyle.fontFamily = titleFont;
      if (titleColor) titleStyle.color = titleColor;
      if (titleSize) titleStyle.fontSize = titleSize;
      if (titleWeight) titleStyle.fontWeight = titleWeight as React.CSSProperties['fontWeight'];
      if (titleStyleAttr) titleStyle.fontStyle = titleStyleAttr as React.CSSProperties['fontStyle'];
      const subtitleFont = attrs.subtitleFontFamily as string | undefined;
      const subtitleColor = attrs.subtitleTextColor as string | undefined;
      const subtitleSize = attrs.subtitleFontSize as string | undefined;
      const subtitleWeight = attrs.subtitleFontWeight as string | undefined;
      const subtitleStyleAttr = attrs.subtitleFontStyle as string | undefined;
      const subtitleStyle: React.CSSProperties = {};
      if (subtitleFont) subtitleStyle.fontFamily = subtitleFont;
      if (subtitleColor) subtitleStyle.color = subtitleColor;
      if (subtitleSize) subtitleStyle.fontSize = subtitleSize;
      if (subtitleWeight) subtitleStyle.fontWeight = subtitleWeight as React.CSSProperties['fontWeight'];
      if (subtitleStyleAttr) subtitleStyle.fontStyle = subtitleStyleAttr as React.CSSProperties['fontStyle'];
      const ctaStyle: React.CSSProperties = {};
      const ctaBg = attrs.ctaBackgroundColor as string | undefined;
      const ctaColor = attrs.ctaTextColor as string | undefined;
      const ctaFont = attrs.ctaFontFamily as string | undefined;
      const ctaRadius = attrs.ctaBorderRadius as string | undefined;
      const ctaPad = attrs.ctaPadding as string | undefined;
      const ctaSize = attrs.ctaFontSize as string | undefined;
      const ctaWeight = attrs.ctaFontWeight as string | undefined;
      const ctaStyleAttr = attrs.ctaFontStyle as string | undefined;
      if (ctaBg) ctaStyle.backgroundColor = ctaBg;
      if (ctaColor) ctaStyle.color = ctaColor;
      if (ctaFont) ctaStyle.fontFamily = ctaFont;
      if (ctaRadius) ctaStyle.borderRadius = ctaRadius;
      if (ctaPad) ctaStyle.padding = ctaPad;
      if (ctaSize) ctaStyle.fontSize = ctaSize;
      if (ctaWeight) ctaStyle.fontWeight = ctaWeight as React.CSSProperties['fontWeight'];
      if (ctaStyleAttr) ctaStyle.fontStyle = ctaStyleAttr as React.CSSProperties['fontStyle'];
      content = (
        <section
          className="block block-hero"
          style={{
            ...(backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}),
            ...(heroBg ? { backgroundColor: heroBg } : {}),
          }}
        >
          <div className="hero-inner">
            {title && <h2 className="hero-title" style={Object.keys(titleStyle).length ? titleStyle : undefined}>{isHtml(title) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} /> : title}</h2>}
            {subtitle && <p className="hero-subtitle" style={Object.keys(subtitleStyle).length ? subtitleStyle : undefined}>{isHtml(subtitle) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(subtitle) }} /> : subtitle}</p>}
            {ctaText && (
              <p className="hero-cta">
                <a href={ctaUrl} className="button-link" style={Object.keys(ctaStyle).length ? ctaStyle : undefined}>
                  {isHtml(ctaText) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(ctaText) }} /> : ctaText}
                </a>
              </p>
            )}
          </div>
        </section>
      );
      break;
    }

    case 'core/spacer': {
      const height = (attrs.height as number) ?? 40;
      content = (
        <div
          className="block block-spacer"
          style={{ height: `${height}px` }}
          aria-hidden
        />
      );
      break;
    }

    case 'core/divider':
      content = <hr className="block block-divider" />;
      break;

    case 'core/custom': {
      const html = (attrs.html as string) ?? '';
      const css = (attrs.css as string) ?? '';
      const script = (attrs.script as string) ?? '';
      const wrapperClasses = (attrs.wrapperClasses as string) ?? '';
      if (html.trim() || css.trim() || script.trim()) {
        const combinedClasses = ['block', 'block-custom', wrapperClasses.trim()].filter(Boolean).join(' ');
        const isFullDocument = /^\s*(<!DOCTYPE|<html|<!\s*DOCTYPE)/i.test(html.trim());
        const hasStyleOrScript = css.trim().length > 0 || script.trim().length > 0 || isFullDocument;
        if (hasStyleOrScript) {
          const baseStyles =
            'html,body{margin:0;padding:0;box-sizing:border-box;min-height:100%}html{height:100%}';
          const doc = isFullDocument
            ? html.trim()
            : [
                '<!DOCTYPE html><html><head><meta charset="utf-8">',
                `<style>${baseStyles}</style>`,
                css.trim() ? `<style>${css.trim()}</style>` : '',
                '</head><body>',
                html.trim() || '<p>Add HTML in block settings.</p>',
                script.trim() ? `<script>${script.trim()}</script>` : '',
                '</body></html>',
              ].join('');
          content = (
            <div className={`${combinedClasses} block-custom-with-iframe`}>
              <iframe
                title="Custom block"
                sandbox="allow-scripts"
                srcDoc={doc}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            </div>
          );
        } else {
          const sanitized = sanitizeCustomHtml(html);
          content = (
            <div
              className={combinedClasses}
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />
          );
        }
      }
      break;
    }

    case 'core/list': {
      const items = (attrs.items as string[]) ?? [];
      const ordered = (attrs.ordered as boolean) ?? false;
      if (items.length) {
        const ListTag = ordered ? 'ol' : 'ul';
        const style = textStyle();
        content = (
          <ListTag className="block block-list" style={style}>
            {items.map((item, i) => (
              <li key={i}>{isHtml(item) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }} /> : item}</li>
            ))}
          </ListTag>
        );
      }
      break;
    }

    case 'core/quote': {
      const quoteText = (attrs.content as string) ?? '';
      const citation = (attrs.citation as string) ?? '';
      const quoteFont = attrs.fontFamily as string | undefined;
      const quoteColor = attrs.textColor as string | undefined;
      const quoteSize = attrs.fontSize as string | undefined;
      const quoteWeight = attrs.fontWeight as string | undefined;
      const quoteStyleAttr = attrs.fontStyle as string | undefined;
      const quoteStyle: React.CSSProperties = {};
      if (quoteFont) quoteStyle.fontFamily = quoteFont;
      if (quoteColor) quoteStyle.color = quoteColor;
      if (quoteSize) quoteStyle.fontSize = quoteSize;
      if (quoteWeight) quoteStyle.fontWeight = quoteWeight as React.CSSProperties['fontWeight'];
      if (quoteStyleAttr) quoteStyle.fontStyle = quoteStyleAttr as React.CSSProperties['fontStyle'];
      const citFont = attrs.citationFontFamily as string | undefined;
      const citColor = attrs.citationTextColor as string | undefined;
      const citSize = attrs.citationFontSize as string | undefined;
      const citWeight = attrs.citationFontWeight as string | undefined;
      const citStyleAttr = attrs.citationFontStyle as string | undefined;
      const citeStyle: React.CSSProperties = {};
      if (citFont) citeStyle.fontFamily = citFont;
      if (citColor) citeStyle.color = citColor;
      if (citSize) citeStyle.fontSize = citSize;
      if (citWeight) citeStyle.fontWeight = citWeight as React.CSSProperties['fontWeight'];
      if (citStyleAttr) citeStyle.fontStyle = citStyleAttr as React.CSSProperties['fontStyle'];
      if (quoteText.trim()) {
        const citeEl = citation ? <cite style={Object.keys(citeStyle).length ? citeStyle : undefined}>{isHtml(citation) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(citation) }} /> : citation}</cite> : null;
        content = isHtml(quoteText) ? (
          <blockquote className="block block-quote" style={Object.keys(quoteStyle).length ? quoteStyle : undefined}>
            <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(quoteText) }} />
            {citeEl}
          </blockquote>
        ) : (
          <blockquote className="block block-quote" style={Object.keys(quoteStyle).length ? quoteStyle : undefined}>
            <p>{quoteText}</p>
            {citeEl}
          </blockquote>
        );
      }
      break;
    }

    case 'store/product-grid': {
      content = (
        <ProductGrid
          apiBaseUrl={apiBaseUrl}
          apiEndpoint={(attrs.apiEndpoint as string) ?? '/products'}
          title={(attrs.title as string) ?? 'Products'}
          limit={(attrs.limit as number) ?? 12}
          collectionId={(attrs.collectionId as string) || undefined}
          useDemoData={useDemoData}
          tenantId={tenantId}
          storeId={storeId}
          titleFontFamily={(attrs.fontFamily as string) || undefined}
          titleTextColor={(attrs.textColor as string) || undefined}
          titleFontSize={(attrs.fontSize as string) || (attrs.titleFontSize as string) || undefined}
          titleFontWeight={(attrs.fontWeight as string) || (attrs.titleFontWeight as string) || undefined}
          titleFontStyle={(attrs.fontStyle as string) || (attrs.titleFontStyle as string) || undefined}
          buttonBackgroundColor={(attrs.buttonBackgroundColor as string) || undefined}
          buttonColor={(attrs.buttonColor as string) || undefined}
          buttonFontFamily={(attrs.buttonFontFamily as string) || undefined}
          buttonFontSize={(attrs.buttonFontSize as string) || undefined}
          buttonFontWeight={(attrs.buttonFontWeight as string) || undefined}
          buttonFontStyle={(attrs.buttonFontStyle as string) || undefined}
          buttonBorderRadius={(attrs.buttonBorderRadius as string) || undefined}
          buttonPadding={(attrs.buttonPadding as string) || undefined}
        />
      );
      break;
    }

    case 'store/collection-list': {
      content = (
        <CollectionList
          apiBaseUrl={apiBaseUrl}
          apiEndpoint={(attrs.apiEndpoint as string) ?? '/collections'}
          title={(attrs.title as string) ?? 'Collections'}
          useDemoData={useDemoData}
          titleFontFamily={(attrs.fontFamily as string) || undefined}
          titleTextColor={(attrs.textColor as string) || undefined}
          titleFontSize={(attrs.fontSize as string) || (attrs.titleFontSize as string) || undefined}
          titleFontWeight={(attrs.fontWeight as string) || (attrs.titleFontWeight as string) || undefined}
          titleFontStyle={(attrs.fontStyle as string) || (attrs.titleFontStyle as string) || undefined}
          buttonBackgroundColor={(attrs.buttonBackgroundColor as string) || undefined}
          buttonColor={(attrs.buttonColor as string) || undefined}
          buttonFontFamily={(attrs.buttonFontFamily as string) || undefined}
          buttonFontSize={(attrs.buttonFontSize as string) || undefined}
          buttonFontWeight={(attrs.buttonFontWeight as string) || undefined}
          buttonFontStyle={(attrs.buttonFontStyle as string) || undefined}
          buttonBorderRadius={(attrs.buttonBorderRadius as string) || undefined}
          buttonPadding={(attrs.buttonPadding as string) || undefined}
        />
      );
      break;
    }

    case 'store/newsletter': {
      const title = (attrs.title as string) ?? 'Join our newsletter';
      const subtitle = (attrs.subtitle as string) ?? 'Get 10% off your first order.';
      const buttonText = (attrs.buttonText as string) ?? 'Subscribe';
      const style: React.CSSProperties = {};
      if (attrs.fontFamily) style.fontFamily = attrs.fontFamily as string;
      if (attrs.textColor) style.color = attrs.textColor as string;
      const titleStyle: React.CSSProperties = { ...style };
      if (attrs.titleFontSize) titleStyle.fontSize = attrs.titleFontSize as string;
      if (attrs.titleFontWeight) titleStyle.fontWeight = attrs.titleFontWeight as React.CSSProperties['fontWeight'];
      const btnStyle: React.CSSProperties = {};
      if (attrs.buttonBackgroundColor) btnStyle.backgroundColor = attrs.buttonBackgroundColor as string;
      if (attrs.buttonColor) btnStyle.color = attrs.buttonColor as string;
      content = (
        <section className="block block-newsletter" style={style}>
          <div className="newsletter-inner">
            <h3 className="newsletter-title" style={Object.keys(titleStyle).length > 1 ? titleStyle : undefined}>{isHtml(title) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} /> : title}</h3>
            <p className="newsletter-subtitle">{isHtml(subtitle) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(subtitle) }} /> : subtitle}</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" className="newsletter-input" aria-label="Email" />
              <button type="submit" className="button-link newsletter-btn" style={Object.keys(btnStyle).length ? btnStyle : undefined}>{isHtml(buttonText) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(buttonText) }} /> : buttonText}</button>
            </form>
          </div>
        </section>
      );
      break;
    }

    case 'core/form': {
      if (isInnerBlocksBlock(block) && block.innerBlocks) {
        const title = (attrs.title as string) ?? 'Contact us';
        const submitText = (attrs.submitButtonText as string) ?? 'Submit';
        const submitScript = (attrs.submitScript as string) ?? '';
        content = (
          <FormBlock
            title={title}
            submitButtonText={submitText}
            submitScript={submitScript}
            fields={block.innerBlocks}
            apiBaseUrl={apiBaseUrl}
            useDemoData={useDemoData}
            tenantId={tenantId}
            storeId={storeId}
            layoutViewport={layoutViewport}
          />
        );
      } else {
        content = (
          <section className="block block-form block-form-empty">
            <p className="block-form-empty-hint">Add form fields by dragging them from the Form section.</p>
          </section>
        );
      }
      break;
    }

    case 'core/form-input': {
      const label = (attrs.label as string) ?? 'Field';
      const inputType = (attrs.inputType as string) ?? 'text';
      const placeholder = (attrs.placeholder as string) ?? '';
      const required = !!(attrs.required as boolean);
      const name = (attrs.name as string) || `field-${block.id}`;
      content = (
        <div className="block block-form-field">
          <label className="form-field-label">{label}{required && ' *'}</label>
          <input
            type={inputType}
            name={name}
            placeholder={placeholder}
            required={required}
            className="form-input"
          />
        </div>
      );
      break;
    }

    case 'core/form-select': {
      const label = (attrs.label as string) ?? 'Choose';
      const options = (attrs.options as Array<{ value: string; label: string }>) ?? [{ value: 'option1', label: 'Option 1' }];
      const required = !!(attrs.required as boolean);
      const name = (attrs.name as string) || `field-${block.id}`;
      content = (
        <div className="block block-form-field">
          <label className="form-field-label">{label}{required && ' *'}</label>
          <select name={name} required={required} className="form-select">
            <option value="">Select…</option>
            {options.map((o, i) => (
              <option key={i} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );
      break;
    }

    case 'core/form-textarea': {
      const label = (attrs.label as string) ?? 'Message';
      const placeholder = (attrs.placeholder as string) ?? '';
      const required = !!(attrs.required as boolean);
      const name = (attrs.name as string) || `field-${block.id}`;
      const rows = Math.max(2, Math.min(20, (attrs.rows as number) ?? 4));
      content = (
        <div className="block block-form-field">
          <label className="form-field-label">{label}{required && ' *'}</label>
          <textarea name={name} placeholder={placeholder} required={required} rows={rows} className="form-textarea" />
        </div>
      );
      break;
    }

    case 'store/promo-banner': {
      const text = (attrs.text as string) ?? 'Free shipping on orders over $50';
      const style: React.CSSProperties = {};
      if (attrs.backgroundColor) style.backgroundColor = attrs.backgroundColor as string;
      if (attrs.textColor) style.color = attrs.textColor as string;
      if (attrs.fontFamily) style.fontFamily = attrs.fontFamily as string;
      if (attrs.fontSize) style.fontSize = attrs.fontSize as string;
      content = (
        <aside className="block block-promo-banner" style={Object.keys(style).length ? style : undefined}>
          <p className="promo-banner-text"><span dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} /></p>
        </aside>
      );
      break;
    }

    case 'store/testimonials': {
      const title = (attrs.title as string) ?? 'What our customers say';
      const items = (attrs.items as Array<{ quote: string; author: string; rating?: number }>) ?? [];
      const style: React.CSSProperties = {};
      if (attrs.fontFamily) style.fontFamily = attrs.fontFamily as string;
      if (attrs.textColor) style.color = attrs.textColor as string;
      const titleStyle: React.CSSProperties = { ...style };
      if (attrs.titleFontSize) titleStyle.fontSize = attrs.titleFontSize as string;
      if (items.length) {
        content = (
          <section className="block block-testimonials" style={style}>
            <h3 className="testimonials-title" style={Object.keys(titleStyle).length > 1 ? titleStyle : undefined}>{isHtml(title) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} /> : title}</h3>
            <div className="testimonials-grid">
              {items.map((item, i) => (
                <blockquote key={i} className="testimonial-card">
                  {typeof item.rating === 'number' && (
                    <div className="testimonial-stars" aria-hidden>{"★".repeat(Math.min(5, item.rating))}</div>
                  )}
                  <p className="testimonial-quote">"{isHtml(item.quote) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.quote) }} /> : item.quote}"</p>
                  <cite className="testimonial-author">— {isHtml(item.author) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.author) }} /> : item.author}</cite>
                </blockquote>
              ))}
            </div>
          </section>
        );
      }
      break;
    }

    case 'store/trust-badges': {
      const items = (attrs.items as Array<{ icon: string; text: string }>) ?? [];
      const style: React.CSSProperties = {};
      if (attrs.fontFamily) style.fontFamily = attrs.fontFamily as string;
      if (attrs.textColor) style.color = attrs.textColor as string;
      if (attrs.fontSize) style.fontSize = attrs.fontSize as string;
      if (items.length) {
        content = (
          <section className="block block-trust-badges" style={style}>
            <div className="trust-badges-grid">
              {items.map((item, i) => (
                <div key={i} className="trust-badge-item">
                  <span className="trust-badge-icon" aria-hidden>{item.icon}</span>
                  <span className="trust-badge-text">{isHtml(item.text) ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.text) }} /> : item.text}</span>
                </div>
              ))}
            </div>
          </section>
        );
      }
      break;
    }

    default:
      break;
  }

  const children = block.children;
  const showChildren = renderChildren !== false && Array.isArray(children) && children.length > 0;
  if (!content && !showChildren) return null;
  const base = content ? wrapWithSpacing(content) : null;
  if (!showChildren) return base;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'visible' }}>
      {base}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto', overflow: 'visible' }}>
        {children.map((child) => {
          const layerLayout = child.attributes?.layerLayout as
            | { xPct?: number; yPct?: number; wPct?: number; hPct?: number }
            | undefined;
          const xPct = typeof layerLayout?.xPct === 'number' ? layerLayout.xPct : 0;
          const yPct = typeof layerLayout?.yPct === 'number' ? layerLayout.yPct : 0;
          const wPct = typeof layerLayout?.wPct === 'number' ? layerLayout.wPct : 25;
          const hPct = typeof layerLayout?.hPct === 'number' ? layerLayout.hPct : 10;
          return (
            <div
              key={child.id}
              style={{
                position: 'absolute',
                left: `${xPct}%`,
                top: `${yPct}%`,
                width: `${wPct}%`,
                height: `${hPct}%`,
                overflow: 'visible',
              }}
            >
              <BlockRenderer block={child} apiBaseUrl={apiBaseUrl} useDemoData={useDemoData} tenantId={tenantId} storeId={storeId} renderChildren={renderChildren} layoutViewport={layoutViewport} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
