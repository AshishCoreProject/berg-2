import { useState } from 'react';
import type { Block } from '@berg/schema';
import { isInnerBlocksBlock } from '@berg/schema';
import { BlockRenderer } from '@berg/blocks';
import { BlockDragHandle } from './BlockDragHandle';
import { ResizableSpacer } from '@/components/canvas';
import { TextEditor } from '@/components/controls';
import './BlockPreview.css';

interface Props {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (attrs: Record<string, unknown>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onInsertAbove?: () => void;
  onInsertBelow?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  gridColumnSpan?: number;
  gridColumnStart?: number;
  onGridChange?: (span: number, start: number) => void;
  /** When true, drag handle is for react-grid-layout (no native draggable). */
  useGridDrag?: boolean;
  /** When true and block is selected, toolbar is shown in right sidebar instead of inline. */
  toolbarInSidebar?: boolean;
  /** When true, use BlockRenderer for pixel-perfect storefront preview (editing via sidebar only). */
  useStorefrontPreview?: boolean;
  /** When clicking a nested block (e.g. form field), select it by id. */
  onSelectNestedBlock?: (id: string) => void;
  /** Check if a nested block is selected (for form field highlight). */
  isNestedSelected?: (id: string) => boolean;
  apiBaseUrl?: string;
  useDemoData?: boolean;
}

export function BlockEditor({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp: _onMoveUp,
  onMoveDown: _onMoveDown,
  onInsertAbove,
  onInsertBelow,
  onDragStart,
  onDragEnd,
  isDragging = false,
  gridColumnSpan: _gridColumnSpan = 12,
  gridColumnStart: _gridColumnStart = 1,
  onGridChange: _onGridChange,
  useGridDrag = false,
  toolbarInSidebar = false,
  useStorefrontPreview = true,
  onSelectNestedBlock,
  isNestedSelected,
  apiBaseUrl,
  useDemoData,
}: Props) {
  const [isHover, setIsHover] = useState(false);

  const attrs = block.attributes ?? {};
  const set = (key: string, value: unknown) => onUpdate({ [key]: value });

  const TYPOGRAPHY_BLOCK_TYPES: Block['type'][] = [
    'core/paragraph',
    'core/heading',
    'core/button',
    'core/hero',
    'core/list',
    'core/quote',
    'store/product-grid',
    'store/collection-list',
  ];
  const hasTypography = TYPOGRAPHY_BLOCK_TYPES.includes(block.type);
  const typographyAttrs = hasTypography
    ? {
        fontFamily: (attrs.fontFamily as string) ?? '',
        textColor: (attrs.textColor as string) ?? '',
        fontSize: (attrs.fontSize as string) ?? '',
        fontWeight: (attrs.fontWeight as string) ?? '',
        fontStyle: (attrs.fontStyle as string) ?? '',
      }
    : null;

  const previewTextStyle = (): React.CSSProperties => {
    if (!hasTypography || !typographyAttrs) return {};
    const s: React.CSSProperties = {};
    if (typographyAttrs.fontFamily) s.fontFamily = typographyAttrs.fontFamily;
    if (typographyAttrs.textColor) s.color = typographyAttrs.textColor;
    if (typographyAttrs.fontSize) s.fontSize = typographyAttrs.fontSize;
    if (typographyAttrs.fontWeight) s.fontWeight = typographyAttrs.fontWeight as React.CSSProperties['fontWeight'];
    if (typographyAttrs.fontStyle) s.fontStyle = typographyAttrs.fontStyle as React.CSSProperties['fontStyle'];
    return s;
  };

  const styleFrom = (
    fontFamily: string | undefined,
    textColor: string | undefined,
    fontSize?: string,
    fontWeight?: string,
    fontStyle?: string
  ): React.CSSProperties => {
    const s: React.CSSProperties = {};
    if (fontFamily) s.fontFamily = fontFamily;
    if (textColor) s.color = textColor;
    if (fontSize) s.fontSize = fontSize;
    if (fontWeight) s.fontWeight = fontWeight as React.CSSProperties['fontWeight'];
    if (fontStyle) s.fontStyle = fontStyle as React.CSSProperties['fontStyle'];
    return s;
  };

  const renderContent = () => {
    switch (block.type) {
      case 'core/paragraph':
        return (
          <div className="block block-paragraph" style={previewTextStyle()}>
            <TextEditor
              value={(attrs.content as string) ?? ''}
              onChange={(html) => set('content', html)}
              placeholder="Write paragraph…"
              contentClassName="block-paragraph-inner"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        );

      case 'core/heading': {
        const level = Math.min(6, Math.max(1, (attrs.level as number) ?? 2));
        return (
          <div className={`block block-heading block-heading-${level}`} style={previewTextStyle()}>
            <TextEditor
              value={(attrs.content as string) ?? ''}
              onChange={(html) => set('content', html)}
              placeholder="Heading"
              contentClassName="block-heading-inner"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        );
      }

      case 'core/image': {
        const url = (attrs.url as string) ?? '';
        const alt = (attrs.alt as string) ?? '';
        const caption = (attrs.caption as string) ?? '';
        const width = (attrs.width as number) ?? 100;
        const capFont = (attrs.captionFontFamily as string) ?? '';
        const capColor = (attrs.captionTextColor as string) ?? '';
        return (
          <figure className="block block-image block-image-editor" style={{ maxWidth: width ? `${width}%` : undefined }}>
            {url ? (
              <img src={url} alt={alt || undefined} />
            ) : (
              <div className="block-image-placeholder">
                Add image URL in block settings →
              </div>
            )}
            {caption && (
              <figcaption style={styleFrom(capFont || undefined, capColor || undefined, (attrs.captionFontSize as string) || undefined, (attrs.captionFontWeight as string) || undefined, (attrs.captionFontStyle as string) || undefined)}>{caption}</figcaption>
            )}
          </figure>
        );
      }

      case 'core/button': {
        const text = (attrs.text as string) ?? 'Click me';
        const bg = (attrs.backgroundColor as string) ?? '';
        const radius = (attrs.borderRadius as string) ?? '';
        const pad = (attrs.padding as string) ?? '';
        const btnStyle: React.CSSProperties = {
          ...(previewTextStyle()),
          ...(bg && { backgroundColor: bg }),
          ...(radius && { borderRadius: radius }),
          ...(pad && { padding: pad }),
        };
        return (
          <div className="block block-button-wrap">
            <span className="button-link button-link-preview" style={Object.keys(btnStyle).length ? btnStyle : undefined}>
              <TextEditor
                value={text}
                onChange={(html) => set('text', html)}
                placeholder="Button text"
                compact
                bare
                onKeyDown={(e) => e.stopPropagation()}
              />
            </span>
          </div>
        );
      }

      case 'core/hero': {
        const title = (attrs.title as string) ?? '';
        const subtitle = (attrs.subtitle as string) ?? '';
        const backgroundImage = (attrs.backgroundImage as string) ?? '';
        const heroBg = (attrs.heroBackgroundColor as string) ?? '';
        const ctaText = (attrs.ctaText as string) ?? '';
        const ctaBg = (attrs.ctaBackgroundColor as string) ?? '';
        const ctaColor = (attrs.ctaTextColor as string) ?? '';
        const ctaFont = (attrs.ctaFontFamily as string) ?? '';
        const ctaRadius = (attrs.ctaBorderRadius as string) ?? '';
        const ctaPad = (attrs.ctaPadding as string) ?? '';
        const titleFont = (attrs.titleFontFamily as string) ?? (attrs.fontFamily as string) ?? '';
        const titleColor = (attrs.titleTextColor as string) ?? (attrs.textColor as string) ?? '';
        const titleSize = (attrs.titleFontSize as string) ?? '';
        const titleWeight = (attrs.titleFontWeight as string) ?? '';
        const titleStyleAttr = (attrs.titleFontStyle as string) ?? '';
        const subtitleFont = (attrs.subtitleFontFamily as string) ?? (attrs.fontFamily as string) ?? '';
        const subtitleColor = (attrs.subtitleTextColor as string) ?? (attrs.textColor as string) ?? '';
        const subtitleSize = (attrs.subtitleFontSize as string) ?? '';
        const subtitleWeight = (attrs.subtitleFontWeight as string) ?? '';
        const subtitleStyleAttr = (attrs.subtitleFontStyle as string) ?? '';
        const ctaStyle: React.CSSProperties = {
          ...(ctaBg && { backgroundColor: ctaBg }),
          ...(ctaColor && { color: ctaColor }),
          ...(ctaFont && { fontFamily: ctaFont }),
          ...(ctaRadius && { borderRadius: ctaRadius }),
          ...(ctaPad && { padding: ctaPad }),
        };
        const ctaSize = (attrs.ctaFontSize as string) ?? '';
        const ctaWeight = (attrs.ctaFontWeight as string) ?? '';
        const ctaStyleAttr = (attrs.ctaFontStyle as string) ?? '';
        if (ctaSize) ctaStyle.fontSize = ctaSize;
        if (ctaWeight) ctaStyle.fontWeight = ctaWeight as React.CSSProperties['fontWeight'];
        if (ctaStyleAttr) ctaStyle.fontStyle = ctaStyleAttr as React.CSSProperties['fontStyle'];
        const ctaInputStyle: React.CSSProperties = {};
        if (ctaColor) ctaInputStyle.color = ctaColor;
        if (ctaFont) ctaInputStyle.fontFamily = ctaFont;
        return (
          <section
            className="block block-hero-preview"
            style={{
              ...(backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}),
              ...(heroBg ? { backgroundColor: heroBg } : {}),
            }}
          >
            <div className="hero-inner" style={styleFrom(titleFont || undefined, titleColor || undefined, titleSize || undefined, titleWeight || undefined, titleStyleAttr || undefined)}>
              <h2 className="hero-title" style={styleFrom(titleFont || undefined, titleColor || undefined, titleSize || undefined, titleWeight || undefined, titleStyleAttr || undefined)}>
                <TextEditor
                  value={title}
                  onChange={(html) => set('title', html)}
                  placeholder="Hero title"
                  contentClassName="hero-title-inner"
                  compact
                  bare
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </h2>
              <p className="hero-subtitle" style={styleFrom(subtitleFont || undefined, subtitleColor || undefined, subtitleSize || undefined, subtitleWeight || undefined, subtitleStyleAttr || undefined)}>
                <TextEditor
                  value={subtitle}
                  onChange={(html) => set('subtitle', html)}
                  placeholder="Subtitle"
                  contentClassName="hero-subtitle-inner"
                  compact
                  bare
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </p>
              <p className="hero-cta">
                <span className="button-link button-link-preview" style={Object.keys(ctaStyle).length ? ctaStyle : undefined}>
                  <TextEditor
                    value={ctaText}
                    onChange={(html) => set('ctaText', html)}
                    placeholder="Button text"
                    compact
                    bare
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </span>
              </p>
            </div>
          </section>
        );
      }

      case 'core/spacer': {
        const height = (attrs.height as number) ?? 40;
        const rowHeight = 40;
        return (
          <div
            className="block block-spacer-preview block-spacer-resizable"
            style={{ height: `${height}px` }}
          >
            <ResizableSpacer
              value={height}
              onChange={(v) => {
                const layout = (attrs.layout as { x?: number; y?: number; w?: number; h?: number }) ?? {};
                onUpdate({
                  height: v,
                  layout: { ...layout, h: Math.max(1, Math.ceil(v / rowHeight)) },
                });
              }}
              min={20}
              max={400}
            />
          </div>
        );
      }

      case 'core/list': {
        const items = (attrs.items as string[]) ?? [];
        const ordered = (attrs.ordered as boolean) ?? false;
        const ListTag = ordered ? 'ol' : 'ul';
        const addItem = () => set('items', [...items, '']);
        return (
          <ListTag className="block block-list" style={previewTextStyle()}>
            {items.length === 0 ? (
              <li>
                <TextEditor
                  value=""
                  onChange={(html) => set('items', [html])}
                  placeholder="List item"
                  compact
                  bare
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
                  }}
                />
              </li>
            ) : (
              items.map((item, i) => (
                <li key={i}>
                  <TextEditor
                    value={item}
                    onChange={(html) => {
                      const next = [...items];
                      next[i] = html;
                      set('items', next);
                    }}
                    placeholder="List item"
                    compact
                    bare
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter' && i === items.length - 1) {
                        e.preventDefault();
                        addItem();
                      }
                    }}
                  />
                </li>
              ))
            )}
            {items.length > 0 && (
              <li style={{ listStyle: 'none', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); addItem(); }}
                  className="toolbar-btn"
                  style={{ fontSize: 12 }}
                >
                  + Add item
                </button>
              </li>
            )}
          </ListTag>
        );
      }

      case 'core/quote': {
        const quoteFont = (attrs.fontFamily as string) ?? '';
        const quoteColor = (attrs.textColor as string) ?? '';
        const quoteSize = (attrs.fontSize as string) ?? '';
        const quoteWeight = (attrs.fontWeight as string) ?? '';
        const quoteStyleAttr = (attrs.fontStyle as string) ?? '';
        const citFont = (attrs.citationFontFamily as string) ?? '';
        const citColor = (attrs.citationTextColor as string) ?? '';
        const citSize = (attrs.citationFontSize as string) ?? '';
        const citWeight = (attrs.citationFontWeight as string) ?? '';
        const citStyleAttr = (attrs.citationFontStyle as string) ?? '';
        return (
          <blockquote className="block block-quote">
            <div className="quote-text" style={styleFrom(quoteFont || undefined, quoteColor || undefined, quoteSize || undefined, quoteWeight || undefined, quoteStyleAttr || undefined)}>
              <TextEditor
                value={(attrs.content as string) ?? ''}
                onChange={(html) => set('content', html)}
                placeholder="Quote text"
                contentClassName="quote-text-inner"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <cite className="quote-citation" style={styleFrom(citFont || undefined, citColor || undefined, citSize || undefined, citWeight || undefined, citStyleAttr || undefined)}>
              <TextEditor
                value={(attrs.citation as string) ?? ''}
                onChange={(html) => set('citation', html)}
                placeholder="Citation"
                compact
                bare
                onKeyDown={(e) => e.stopPropagation()}
              />
            </cite>
          </blockquote>
        );
      }

      case 'core/columns':
        if (isInnerBlocksBlock(block) && block.innerBlocks) {
          const columnWidths = (attrs.columnWidths as number[]) ?? block.innerBlocks.map(() => 50);
          const total = columnWidths.reduce((a, b) => a + b, 0) || 100;
          const normalized = columnWidths.map((w) => (total ? Math.round((w / total) * 100) : 50));
          return (
            <div className="block block-columns-preview block-columns-resizable">
              <div
                className="columns-inner"
                style={{
                  gridTemplateColumns: normalized.map((p) => `${p}fr`).join(' '),
                }}
              >
                {block.innerBlocks.map((col, i) => (
                  <div key={col.id} className="block-column-preview column-resizable">
                    <span className="column-placeholder">Column</span>
                    <div className="column-width-control">
                      <input
                        type="range"
                        min={10}
                        max={90}
                        value={normalized[i] ?? 50}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const next = [...normalized];
                          next[i] = v;
                          const rest = 100 - v;
                          const others = block.innerBlocks!.length - 1;
                          for (let j = 0; j < next.length; j++) {
                            if (j !== i) next[j] = Math.round(rest / others);
                          }
                          onUpdate({ columnWidths: next });
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>{normalized[i]}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;

      case 'core/column':
        return <div className="block-column-preview">Column</div>;

      case 'core/divider':
        return <hr className="block block-divider" />;

      case 'store/product-grid':
      case 'store/collection-list': {
        /* Use BlockRenderer for pixel-perfect storefront preview (same layout as storefront) */
        return (
          <BlockRenderer
            block={block}
            apiBaseUrl={apiBaseUrl}
            useDemoData={useDemoData ?? true}
          />
        );
      }

      case 'core/custom':
        return <BlockRenderer block={block} apiBaseUrl={apiBaseUrl} useDemoData={useDemoData} />;

      case 'core/form': {
        if (isInnerBlocksBlock(block) && block.innerBlocks) {
          return (
            <section className="block block-form block-form-preview">
              <h3 className="block-form-title">{(attrs.title as string) || 'Form'}</h3>
              <div className="block-form-fields-preview" onClick={(e) => e.stopPropagation()}>
                {block.innerBlocks.map((f) => (
                  <div
                    key={f.id}
                    className={`block-form-field-wrap ${isNestedSelected?.(f.id) ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onSelectNestedBlock?.(f.id); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectNestedBlock?.(f.id); } }}
                  >
                    <BlockRenderer block={f} apiBaseUrl={apiBaseUrl} useDemoData={useDemoData} />
                  </div>
                ))}
                <div className="block-form-drop-hint">Drop fields from Form section</div>
              </div>
              <div className="block-form-actions">
                <span className="button-link form-submit-btn">{(attrs.submitButtonText as string) || 'Submit'}</span>
              </div>
            </section>
          );
        }
        return (
          <section className="block block-form block-form-empty">
            <p className="block-form-empty-hint">Drag Form Input, Form Select, or Form Textarea from the Form section.</p>
          </section>
        );
      }

      case 'store/promo-banner': {
        const text = (attrs.text as string) ?? 'Free shipping on orders over $50';
        const style: React.CSSProperties = {};
        if (attrs.backgroundColor) style.backgroundColor = attrs.backgroundColor as string;
        if (attrs.textColor) style.color = attrs.textColor as string;
        if (attrs.fontFamily) style.fontFamily = attrs.fontFamily as string;
        if (attrs.fontSize) style.fontSize = attrs.fontSize as string;
        return (
          <aside className="block block-promo-banner" style={Object.keys(style).length ? style : undefined}>
            <p className="promo-banner-text">
              <TextEditor
                value={text}
                onChange={(html) => set('text', html)}
                placeholder="Promo text"
                compact
                bare
                onKeyDown={(e) => e.stopPropagation()}
              />
            </p>
          </aside>
        );
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
        const btnStyle: React.CSSProperties = {};
        if (attrs.buttonBackgroundColor) btnStyle.backgroundColor = attrs.buttonBackgroundColor as string;
        if (attrs.buttonColor) btnStyle.color = attrs.buttonColor as string;
        return (
          <section className="block block-newsletter" style={style}>
            <div className="newsletter-inner">
              <h3 className="newsletter-title" style={Object.keys(titleStyle).length > 1 ? titleStyle : undefined}>
                <TextEditor
                  value={title}
                  onChange={(html) => set('title', html)}
                  placeholder="Title"
                  compact
                  bare
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </h3>
              <p className="newsletter-subtitle">
                <TextEditor
                  value={subtitle}
                  onChange={(html) => set('subtitle', html)}
                  placeholder="Subtitle"
                  compact
                  bare
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </p>
              <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Enter your email" className="newsletter-input" aria-label="Email" readOnly disabled />
                <span className="button-link newsletter-btn" style={Object.keys(btnStyle).length ? btnStyle : undefined}>
                  <TextEditor
                    value={buttonText}
                    onChange={(html) => set('buttonText', html)}
                    placeholder="Subscribe"
                    compact
                    bare
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </span>
              </form>
            </div>
          </section>
        );
      }

      case 'store/testimonials': {
        const title = (attrs.title as string) ?? 'What our customers say';
        const items = (attrs.items as Array<{ quote: string; author: string; rating?: number }>) ?? [];
        const style: React.CSSProperties = {};
        if (attrs.fontFamily) style.fontFamily = attrs.fontFamily as string;
        if (attrs.textColor) style.color = attrs.textColor as string;
        const titleStyle: React.CSSProperties = { ...style };
        if (attrs.titleFontSize) titleStyle.fontSize = attrs.titleFontSize as string;
        const ensureItems = items.length ? items : [{ quote: '', author: '', rating: 5 }];
        const updateItem = (i: number, field: 'quote' | 'author' | 'rating', value: string | number) => {
          const next = [...ensureItems];
          if (!next[i]) next[i] = { quote: '', author: '', rating: 5 };
          next[i] = { ...next[i], [field]: value };
          onUpdate({ items: next });
        };
        const addItem = () => onUpdate({ items: [...ensureItems, { quote: '', author: '', rating: 5 }] });
        const removeItem = (i: number) => {
          if (ensureItems.length <= 1) return;
          onUpdate({ items: ensureItems.filter((_, idx) => idx !== i) });
        };
        return (
          <section className="block block-testimonials" style={style}>
            <h3 className="testimonials-title" style={Object.keys(titleStyle).length > 1 ? titleStyle : undefined}>
              <TextEditor
                value={title}
                onChange={(html) => set('title', html)}
                placeholder="Section title"
                compact
                bare
                onKeyDown={(e) => e.stopPropagation()}
              />
            </h3>
            <div className="testimonials-grid">
              {ensureItems.map((item, i) => (
                <blockquote key={i} className="testimonial-card">
                  <div className="testimonial-stars" aria-hidden>{"★".repeat(Math.min(5, typeof item.rating === 'number' ? item.rating : 5))}</div>
                  <p className="testimonial-quote">
                    <TextEditor
                      value={item.quote}
                      onChange={(html) => updateItem(i, 'quote', html)}
                      placeholder="Quote"
                      compact
                      bare
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </p>
                  <cite className="testimonial-author">
                    <TextEditor
                      value={item.author}
                      onChange={(html) => updateItem(i, 'author', html)}
                      placeholder="Author"
                      compact
                      bare
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </cite>
                  <button type="button" className="toolbar-btn" style={{ fontSize: 11, marginTop: 4 }} onClick={(e) => { e.stopPropagation(); removeItem(i); }} aria-label="Remove testimonial">
                    Remove
                  </button>
                </blockquote>
              ))}
            </div>
            <button type="button" className="toolbar-btn" style={{ marginTop: 8 }} onClick={(e) => { e.stopPropagation(); addItem(); }}>
              + Add testimonial
            </button>
          </section>
        );
      }

      case 'store/trust-badges': {
        const items = (attrs.items as Array<{ icon: string; text: string }>) ?? [
          { icon: '🚚', text: 'Free shipping' },
          { icon: '🔒', text: 'Secure payment' },
          { icon: '↩️', text: 'Easy returns' },
          { icon: '💬', text: '24/7 support' },
        ];
        const style: React.CSSProperties = {};
        if (attrs.fontFamily) style.fontFamily = attrs.fontFamily as string;
        if (attrs.textColor) style.color = attrs.textColor as string;
        if (attrs.fontSize) style.fontSize = attrs.fontSize as string;
        const ensureItems = items.length ? items : [{ icon: '✓', text: '' }];
        const updateItem = (i: number, field: 'icon' | 'text', value: string) => {
          const next = [...ensureItems];
          if (!next[i]) next[i] = { icon: '', text: '' };
          next[i] = { ...next[i], [field]: value };
          onUpdate({ items: next });
        };
        const addItem = () => onUpdate({ items: [...ensureItems, { icon: '✓', text: '' }] });
        const removeItem = (i: number) => {
          if (ensureItems.length <= 1) return;
          onUpdate({ items: ensureItems.filter((_, idx) => idx !== i) });
        };
        return (
          <section className="block block-trust-badges" style={style}>
            <div className="trust-badges-grid">
              {ensureItems.map((item, i) => (
                <div key={i} className="trust-badge-item">
                  <span className="trust-badge-icon" aria-hidden>
                    <input
                      type="text"
                      data-block-editable
                      value={item.icon}
                      onChange={(e) => updateItem(i, 'icon', e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder="Icon"
                      style={{ width: 32, textAlign: 'center', background: 'transparent', border: 'none', fontSize: '1.25em' }}
                    />
                  </span>
                  <span className="trust-badge-text">
                    <TextEditor
                      value={item.text}
                      onChange={(html) => updateItem(i, 'text', html)}
                      placeholder="Label"
                      compact
                      bare
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </span>
                  <button type="button" className="toolbar-btn" style={{ fontSize: 10, marginLeft: 4 }} onClick={(e) => { e.stopPropagation(); removeItem(i); }} aria-label="Remove badge">
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="toolbar-btn" style={{ marginTop: 8 }} onClick={(e) => { e.stopPropagation(); addItem(); }}>
              + Add badge
            </button>
          </section>
        );
      }

      default:
        return <span className="block-type-label">{block.type}</span>;
    }
  };

  /** Builder.io-style: when toolbarInSidebar, no toolbar in canvas—only selection outline + resize handles. */
  const showToolbarInCanvas = !toolbarInSidebar && (isHover || isSelected);

  /** Height in px from layout – applied to block-main so sidebar Height = actual block height */
  const layout = attrs.layout as { h?: number } | undefined;
  const layoutHeightPx = (layout?.h ?? 2) * 40;

  /** Builder.io-style: canvas always shows pure preview; all editing in sidebar. */
  const renderCanvasContent = () => {
    const fullBleed = !!(attrs.fullBleed as boolean);
    if (!useStorefrontPreview) {
      return fullBleed ? <div className="block-full-bleed-preview">{renderContent()}</div> : renderContent();
    }
    const isEmpty = (block.type === 'core/paragraph' || block.type === 'core/heading') &&
      !String((block.attributes?.content as string) ?? '').trim();
    if (isEmpty) {
      const content = (
        <div className="block-empty-placeholder" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          {block.type === 'core/paragraph' ? 'Empty paragraph — click to edit in sidebar' : 'Empty heading — click to edit in sidebar'}
        </div>
      );
      return fullBleed ? <div className="block-full-bleed-preview">{content}</div> : content;
    }
    const content = <BlockRenderer block={block} apiBaseUrl={apiBaseUrl} useDemoData={useDemoData} />;
    return fullBleed ? <div className="block-full-bleed-preview">{content}</div> : content;
  };

  return (
    <div
      className={`block-wrap ${isSelected ? 'selected' : ''} ${isHover ? 'is-hover' : ''} ${isDragging ? 'is-dragging' : ''}`}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDragEnd={onDragEnd}
    >
      <div className="block-inner">
        {onDragStart && (
            <div className="block-drag-handle-wrap" onClick={(e) => e.stopPropagation()}>
              <BlockDragHandle onDragStart={onDragStart} onDragEnd={onDragEnd} />
            </div>
          )}
          {useGridDrag && !onDragStart && (
            <div className="block-drag-handle-wrap" onClick={(e) => e.stopPropagation()}>
              <BlockDragHandle gridHandle />
            </div>
          )}
        <div className="block-main" style={{ height: layoutHeightPx, minHeight: layoutHeightPx }}>
          {showToolbarInCanvas && (
            <div className={`block-toolbar block-toolbar-minimal ${isSelected ? 'block-toolbar-selected' : ''}`}>
              <div
                className="block-toolbar-minimal-main"
                onClick={() => onSelect()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
                aria-label="Select block to edit in sidebar"
              >
                <span className="block-type">{block.type.replace('core/', '').replace('store/', '')}</span>
                <span className="toolbar-minimal-hint">
                  {isSelected ? 'Editing in sidebar →' : 'Click to edit →'}
                </span>
              </div>
              {(onInsertAbove || onInsertBelow) && (
                <div className="block-toolbar-insert-btns" onClick={(e) => e.stopPropagation()}>
                  {onInsertAbove && (
                    <button type="button" className="block-toolbar-insert" onClick={onInsertAbove} aria-label="Add block above" title="Add block above">
                      +↑
                    </button>
                  )}
                  {onInsertBelow && (
                    <button type="button" className="block-toolbar-insert" onClick={onInsertBelow} aria-label="Add block below" title="Add block below">
                      +↓
                    </button>
                  )}
                </div>
              )}
              <button
                type="button"
                className="block-toolbar-delete"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                aria-label="Delete block"
                title="Delete block"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          )}
          <div className="block-content">
            {renderCanvasContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
