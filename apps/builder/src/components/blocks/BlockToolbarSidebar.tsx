/**
 * Block settings / toolbar rendered in the right sidebar when a block is selected.
 * Builder.io-style: all options in sidebar; canvas shows only block preview + resize handles.
 */
import type { Block } from '@berg/schema';
import { isInnerBlocksBlock, createBlockId, getBlockDefinition } from '@berg/schema';
import { TypographyControls } from '@/components/controls/TypographyControls';
import { ButtonStyleControls } from '@/components/controls/ButtonStyleControls';
import { TextEditor } from '@/components/controls/TextEditor';
import { CollapsibleSection } from '@/features/sidebar';

interface Props {
  block: Block;
  onUpdate: (attrs: Record<string, unknown> & { innerBlocks?: Block[] }) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onInsertAbove?: () => void;
  onInsertBelow?: () => void;
  gridColumnSpan: number;
  gridColumnStart: number;
  onGridChange?: (span: number, start: number) => void;
}

const TYPOGRAPHY_BLOCK_TYPES: Block['type'][] = [
  'core/paragraph', 'core/heading', 'core/button', 'core/hero',
  'core/list', 'core/quote', 'store/product-grid', 'store/collection-list',
  'store/promo-banner', 'store/newsletter', 'store/testimonials', 'store/trust-badges',
];
const BUTTON_STYLE_BLOCK_TYPES: Block['type'][] = ['core/button', 'core/hero', 'store/product-grid', 'store/collection-list'];
type TextAlignValue = 'left' | 'center' | 'right';
type VerticalAlignValue = 'top' | 'center' | 'bottom';

function TextAlignControl({
  value,
  onChange,
}: {
  value: TextAlignValue;
  onChange: (next: TextAlignValue) => void;
}) {
  const options: Array<{ value: TextAlignValue; label: string; icon: JSX.Element }> = [
    {
      value: 'left',
      label: 'Align left',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="14" y2="12" />
          <line x1="4" y1="18" x2="18" y2="18" />
        </svg>
      ),
    },
    {
      value: 'center',
      label: 'Align center',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="6" y1="18" x2="18" y2="18" />
        </svg>
      ),
    },
    {
      value: 'right',
      label: 'Align right',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="10" y1="12" x2="20" y2="12" />
          <line x1="6" y1="18" x2="20" y2="18" />
        </svg>
      ),
    },
  ];

  return (
    <div className="toolbar-align-group" role="group" aria-label="Text alignment">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`toolbar-btn toolbar-btn-icon toolbar-align-btn ${value === option.value ? 'toolbar-align-btn-active' : ''}`}
          onClick={() => onChange(option.value)}
          aria-label={option.label}
          title={option.label}
          aria-pressed={value === option.value}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

function VerticalAlignControl({
  value,
  onChange,
}: {
  value: VerticalAlignValue;
  onChange: (next: VerticalAlignValue) => void;
}) {
  const options: Array<{ value: VerticalAlignValue; label: string; icon: JSX.Element }> = [
    {
      value: 'top',
      label: 'Align top',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="4" y1="5" x2="20" y2="5" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="16" y2="14" />
        </svg>
      ),
    },
    {
      value: 'center',
      label: 'Align middle',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="8" y1="8" x2="16" y2="8" />
          <line x1="8" y1="16" x2="16" y2="16" />
        </svg>
      ),
    },
    {
      value: 'bottom',
      label: 'Align bottom',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="4" y1="19" x2="20" y2="19" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="16" y2="14" />
        </svg>
      ),
    },
  ];

  return (
    <div className="toolbar-align-group" role="group" aria-label="Vertical text alignment">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`toolbar-btn toolbar-btn-icon toolbar-align-btn ${value === option.value ? 'toolbar-align-btn-active' : ''}`}
          onClick={() => onChange(option.value)}
          aria-label={option.label}
          title={option.label}
          aria-pressed={value === option.value}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

export function BlockToolbarSidebar({
  block,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onInsertAbove,
  onInsertBelow,
  gridColumnSpan,
  gridColumnStart,
  onGridChange,
}: Props) {
  const attrs = block.attributes ?? {};
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
  const hasButtonStyle = BUTTON_STYLE_BLOCK_TYPES.includes(block.type);
  const buttonStyleKeys =
    block.type === 'core/button'
      ? { backgroundColor: 'backgroundColor', textColor: 'textColor', fontFamily: 'fontFamily', borderRadius: 'borderRadius', padding: 'padding', fontSize: undefined as string | undefined, fontWeight: undefined as string | undefined, fontStyle: undefined as string | undefined }
      : block.type === 'core/hero'
        ? { backgroundColor: 'ctaBackgroundColor', textColor: 'ctaTextColor', fontFamily: 'ctaFontFamily', borderRadius: 'ctaBorderRadius', padding: 'ctaPadding', fontSize: 'ctaFontSize' as string, fontWeight: 'ctaFontWeight' as string, fontStyle: 'ctaFontStyle' as string }
        : { backgroundColor: 'buttonBackgroundColor', textColor: 'buttonColor', fontFamily: 'buttonFontFamily', borderRadius: 'buttonBorderRadius', padding: 'buttonPadding', fontSize: 'buttonFontSize' as string, fontWeight: 'buttonFontWeight' as string, fontStyle: 'buttonFontStyle' as string };
  const buttonStyleAttrs = hasButtonStyle
    ? {
        backgroundColor: (attrs[buttonStyleKeys.backgroundColor] as string) ?? '',
        textColor: (attrs[buttonStyleKeys.textColor] as string) ?? '',
        fontFamily: (attrs[buttonStyleKeys.fontFamily] as string) ?? '',
        borderRadius: (attrs[buttonStyleKeys.borderRadius] as string) ?? '',
        padding: (attrs[buttonStyleKeys.padding] as string) ?? '',
        ...(buttonStyleKeys.fontSize && { fontSize: (attrs[buttonStyleKeys.fontSize] as string) ?? '' }),
        ...(buttonStyleKeys.fontWeight && { fontWeight: (attrs[buttonStyleKeys.fontWeight] as string) ?? '' }),
        ...(buttonStyleKeys.fontStyle && { fontStyle: (attrs[buttonStyleKeys.fontStyle] as string) ?? '' }),
      }
    : null;

  const blockTypeLabel = block.type.replace('core/', '').replace('store/', '');

  return (
    <div className="block-toolbar-sidebar">
      <div className="block-toolbar-sidebar-header">
        <h3 className="block-toolbar-sidebar-title">Settings</h3>
        <span className="block-toolbar-sidebar-badge">{blockTypeLabel}</span>
      </div>
      <CollapsibleSection title="Content" defaultOpen className="sidebar-section-content-primary">
        <div className="block-toolbar block-toolbar-in-sidebar">
        {block.type === 'core/paragraph' && (
          <div className="toolbar-field">
            <span className="toolbar-group-label">Paragraph text</span>
            <TextEditor
              value={(attrs.content as string) ?? ''}
              onChange={(html) => onUpdate({ content: html })}
              placeholder="Write your paragraph…"
              contentClassName="toolbar-text-editor"
            />
          </div>
        )}
        {block.type === 'core/heading' && (
          <>
            <div className="toolbar-field">
              <span className="toolbar-group-label">Heading text</span>
              <TextEditor
                value={(attrs.content as string) ?? ''}
                onChange={(html) => onUpdate({ content: html })}
                placeholder="Heading"
                compact
              />
            </div>
            <div className="toolbar-field">
              <span className="toolbar-group-label">Level</span>
              <select
                className="toolbar-width-select"
                value={String((attrs.level as number) ?? 2)}
                onChange={(e) => onUpdate({ level: Number(e.target.value) })}
                aria-label="Heading level"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>H{n}</option>
                ))}
              </select>
            </div>
            <div className="toolbar-field">
              <span className="toolbar-group-label">Alignment</span>
              <TextAlignControl
                value={((attrs.textAlign as TextAlignValue) ?? 'left')}
                onChange={(textAlign) => onUpdate({ textAlign })}
              />
            </div>
            <div className="toolbar-field">
              <span className="toolbar-group-label">Vertical align</span>
              <VerticalAlignControl
                value={((attrs.verticalAlign as VerticalAlignValue) ?? 'center')}
                onChange={(verticalAlign) => onUpdate({ verticalAlign })}
              />
            </div>
          </>
        )}
        {block.type === 'core/paragraph' && (
          <>
            <div className="toolbar-field">
              <span className="toolbar-group-label">Alignment</span>
              <TextAlignControl
                value={((attrs.textAlign as TextAlignValue) ?? 'left')}
                onChange={(textAlign) => onUpdate({ textAlign })}
              />
            </div>
            <div className="toolbar-field">
              <span className="toolbar-group-label">Vertical align</span>
              <VerticalAlignControl
                value={((attrs.verticalAlign as VerticalAlignValue) ?? 'center')}
                onChange={(verticalAlign) => onUpdate({ verticalAlign })}
              />
            </div>
          </>
        )}
        {block.type === 'core/hero' && (
          <>
            <div className="toolbar-field hero-content-field">
              <span className="toolbar-group-label">Title</span>
              <TextEditor
                value={(attrs.title as string) ?? ''}
                onChange={(html) => onUpdate({ title: html })}
                placeholder="Hero title"
                compact
              />
            </div>
            <div className="toolbar-field hero-content-field">
              <span className="toolbar-group-label">Subtitle</span>
              <TextEditor
                value={(attrs.subtitle as string) ?? ''}
                onChange={(html) => onUpdate({ subtitle: html })}
                placeholder="Subtitle"
                compact
              />
            </div>
            <div className="toolbar-field hero-content-field">
              <span className="toolbar-group-label">CTA text</span>
              <TextEditor
                value={(attrs.ctaText as string) ?? ''}
                onChange={(html) => onUpdate({ ctaText: html })}
                placeholder="Button text"
                compact
              />
            </div>
            <CollapsibleSection title="Title style" defaultOpen={false} className="sidebar-section-hero-typography">
              <div className="block-toolbar block-toolbar-in-sidebar">
                <TypographyControls
                  fontFamily={(attrs.titleFontFamily as string) ?? (attrs.fontFamily as string) ?? ''}
                  textColor={(attrs.titleTextColor as string) ?? (attrs.textColor as string) ?? ''}
                  fontSize={(attrs.titleFontSize as string) ?? ''}
                  fontWeight={(attrs.titleFontWeight as string) ?? ''}
                  fontStyle={(attrs.titleFontStyle as string) ?? ''}
                  onChange={(next) => onUpdate({
                    ...(next.fontFamily !== undefined && { titleFontFamily: next.fontFamily }),
                    ...(next.textColor !== undefined && { titleTextColor: next.textColor }),
                    ...(next.fontSize !== undefined && { titleFontSize: next.fontSize }),
                    ...(next.fontWeight !== undefined && { titleFontWeight: next.fontWeight }),
                    ...(next.fontStyle !== undefined && { titleFontStyle: next.fontStyle }),
                  })}
                />
              </div>
            </CollapsibleSection>
            <CollapsibleSection title="Subtitle style" defaultOpen={false} className="sidebar-section-hero-typography">
              <div className="block-toolbar block-toolbar-in-sidebar">
                <TypographyControls
                  fontFamily={(attrs.subtitleFontFamily as string) ?? (attrs.fontFamily as string) ?? ''}
                  textColor={(attrs.subtitleTextColor as string) ?? (attrs.textColor as string) ?? ''}
                  fontSize={(attrs.subtitleFontSize as string) ?? ''}
                  fontWeight={(attrs.subtitleFontWeight as string) ?? ''}
                  fontStyle={(attrs.subtitleFontStyle as string) ?? ''}
                  onChange={(next) => onUpdate({
                    ...(next.fontFamily !== undefined && { subtitleFontFamily: next.fontFamily }),
                    ...(next.textColor !== undefined && { subtitleTextColor: next.textColor }),
                    ...(next.fontSize !== undefined && { subtitleFontSize: next.fontSize }),
                    ...(next.fontWeight !== undefined && { subtitleFontWeight: next.fontWeight }),
                    ...(next.fontStyle !== undefined && { subtitleFontStyle: next.fontStyle }),
                  })}
                />
              </div>
            </CollapsibleSection>
            {buttonStyleAttrs && (
              <CollapsibleSection title="Button" defaultOpen={false} className="sidebar-section-hero-button">
                <div className="block-toolbar block-toolbar-in-sidebar">
                  <div className="toolbar-field">
                    <span className="toolbar-group-label">Link URL</span>
                    <input
                      type="url"
                      className="toolbar-input-full"
                      value={(attrs.ctaUrl as string) ?? ''}
                      onChange={(e) => onUpdate({ ctaUrl: e.target.value })}
                      placeholder="/products"
                      aria-label="CTA link URL"
                    />
                  </div>
                  <ButtonStyleControls
                    includeTextStyle
                    backgroundColor={buttonStyleAttrs.backgroundColor}
                    textColor={buttonStyleAttrs.textColor}
                    fontFamily={buttonStyleAttrs.fontFamily}
                    fontSize={'fontSize' in buttonStyleAttrs ? buttonStyleAttrs.fontSize : undefined}
                    fontWeight={'fontWeight' in buttonStyleAttrs ? buttonStyleAttrs.fontWeight : undefined}
                    fontStyle={'fontStyle' in buttonStyleAttrs ? buttonStyleAttrs.fontStyle : undefined}
                    borderRadius={buttonStyleAttrs.borderRadius}
                    padding={buttonStyleAttrs.padding}
                    keys={buttonStyleKeys}
                    onChange={(next) => onUpdate(next)}
                  />
                </div>
              </CollapsibleSection>
            )}
            <CollapsibleSection title="Background" defaultOpen={false} className="sidebar-section-hero-background">
              <div className="block-toolbar block-toolbar-in-sidebar">
                <div className="toolbar-field">
                  <span className="toolbar-group-label">Background color</span>
                  <div className="toolbar-color-row">
                    <input
                      type="color"
                      value={(attrs.heroBackgroundColor as string) || '#f1f5f9'}
                      onChange={(e) => onUpdate({ heroBackgroundColor: e.target.value })}
                      className="toolbar-color-picker"
                      aria-label="Hero background color"
                    />
                    <input
                      type="text"
                      className="toolbar-input-full toolbar-color-hex"
                      value={(attrs.heroBackgroundColor as string) ?? ''}
                      onChange={(e) => onUpdate({ heroBackgroundColor: e.target.value.trim() || undefined })}
                      placeholder="#f1f5f9"
                      aria-label="Hero background (hex)"
                    />
                  </div>
                </div>
                <div className="toolbar-field">
                  <span className="toolbar-group-label">Background image</span>
                  <input
                    type="url"
                    className="toolbar-input-full"
                    value={(attrs.backgroundImage as string) ?? ''}
                    onChange={(e) => onUpdate({ backgroundImage: e.target.value })}
                    placeholder="https://…"
                    aria-label="Background image URL"
                  />
                </div>
              </div>
            </CollapsibleSection>
          </>
        )}
        {block.type === 'core/quote' && (
          <>
            <span className="toolbar-group-label">Quote</span>
            <TypographyControls
              fontFamily={(attrs.fontFamily as string) ?? ''}
              textColor={(attrs.textColor as string) ?? ''}
              fontSize={(attrs.fontSize as string) ?? ''}
              fontWeight={(attrs.fontWeight as string) ?? ''}
              fontStyle={(attrs.fontStyle as string) ?? ''}
              onChange={(next) => onUpdate({
                ...(next.fontFamily !== undefined && { fontFamily: next.fontFamily }),
                ...(next.textColor !== undefined && { textColor: next.textColor }),
                ...(next.fontSize !== undefined && { fontSize: next.fontSize }),
                ...(next.fontWeight !== undefined && { fontWeight: next.fontWeight }),
                ...(next.fontStyle !== undefined && { fontStyle: next.fontStyle }),
              })}
            />
            <span className="toolbar-group-label">Citation</span>
            <TypographyControls
              fontFamily={(attrs.citationFontFamily as string) ?? ''}
              textColor={(attrs.citationTextColor as string) ?? ''}
              fontSize={(attrs.citationFontSize as string) ?? ''}
              fontWeight={(attrs.citationFontWeight as string) ?? ''}
              fontStyle={(attrs.citationFontStyle as string) ?? ''}
              onChange={(next) => onUpdate({
                ...(next.fontFamily !== undefined && { citationFontFamily: next.fontFamily }),
                ...(next.textColor !== undefined && { citationTextColor: next.textColor }),
                ...(next.fontSize !== undefined && { citationFontSize: next.fontSize }),
                ...(next.fontWeight !== undefined && { citationFontWeight: next.fontWeight }),
                ...(next.fontStyle !== undefined && { citationFontStyle: next.fontStyle }),
              })}
            />
          </>
        )}
        {block.type === 'store/product-grid' && (
          <>
            <span className="toolbar-group-label">Section title</span>
            <TextEditor
              value={(attrs.title as string) ?? ''}
              onChange={(html) => onUpdate({ title: html })}
              placeholder="Featured products"
              compact
            />
            <span className="toolbar-group-label">API endpoint</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.apiEndpoint as string) ?? ''}
              onChange={(e) => onUpdate({ apiEndpoint: e.target.value })}
              placeholder="/products"
              aria-label="API endpoint"
            />
            <span className="toolbar-group-label">Collection ID</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.collectionId as string) ?? ''}
              onChange={(e) => onUpdate({ collectionId: e.target.value })}
              placeholder="Optional"
              aria-label="Collection ID"
            />
            <span className="toolbar-group-label">Limit</span>
            <input
              type="number"
              className="toolbar-input-full"
              value={(attrs.limit as number) ?? 12}
              onChange={(e) => onUpdate({ limit: Number(e.target.value) || 12 })}
              min={1}
              aria-label="Product limit"
            />
          </>
        )}
        {block.type === 'core/form' && (
          <>
            <span className="toolbar-group-label">Form title</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.title as string) ?? ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Contact us"
              aria-label="Form title"
            />
            <span className="toolbar-group-label">Submit button text</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.submitButtonText as string) ?? 'Submit'}
              onChange={(e) => onUpdate({ submitButtonText: e.target.value })}
              placeholder="Submit"
              aria-label="Submit button text"
            />
            <span className="toolbar-group-label">Submit script</span>
            <textarea
              className="toolbar-input-full"
              value={(attrs.submitScript as string) ?? ''}
              onChange={(e) => onUpdate({ submitScript: e.target.value })}
              placeholder={'formEl.addEventListener("submit", (e) => {\n  e.preventDefault();\n  const data = new FormData(formEl);\n  console.log(Object.fromEntries(data));\n});'}
              rows={6}
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
              aria-label="Submit script"
            />
            <span className="toolbar-hint" style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem', display: 'block' }}>
              Run on form mount. formEl = form element. Add your submit handler.
            </span>
            <span className="toolbar-group-label" style={{ marginTop: '1rem' }}>Fields</span>
            {(isInnerBlocksBlock(block) ? block.innerBlocks ?? [] : []).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {(isInnerBlocksBlock(block) ? block.innerBlocks ?? [] : []).map((f) => {
                  const updateField = (fieldAttrs: Record<string, unknown>) => {
                    const inner = (isInnerBlocksBlock(block) ? block.innerBlocks ?? [] : []).map((x) =>
                      x.id === f.id ? { ...x, attributes: { ...x.attributes, ...fieldAttrs } } : x
                    );
                    onUpdate({ innerBlocks: inner });
                  };
                  return (
                    <div
                      key={f.id}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--surface)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                          {(f.attributes?.label as string) || f.type.replace('core/form-', '')} ({f.type.replace('core/form-', '')})
                        </span>
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => {
                            const inner = (isInnerBlocksBlock(block) ? block.innerBlocks ?? [] : []).filter((x) => x.id !== f.id);
                            onUpdate({ innerBlocks: inner });
                          }}
                          title="Delete field"
                          aria-label={`Delete ${(f.attributes?.label as string) || f.type}`}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Label</label>
                          <input
                            type="text"
                            className="toolbar-input-full"
                            value={(f.attributes?.label as string) ?? ''}
                            onChange={(e) => updateField({ label: e.target.value })}
                            placeholder="Field label"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8125rem' }}
                          />
                        </div>
                        {(f.type === 'core/form-input' || f.type === 'core/form-textarea') && (
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Placeholder</label>
                            <input
                              type="text"
                              className="toolbar-input-full"
                              value={(f.attributes?.placeholder as string) ?? ''}
                              onChange={(e) => updateField({ placeholder: e.target.value })}
                              placeholder="Optional placeholder"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8125rem' }}
                            />
                          </div>
                        )}
                        {f.type === 'core/form-input' && (
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Input type</label>
                            <select
                              className="toolbar-input-full"
                              value={(f.attributes?.inputType as string) ?? 'text'}
                              onChange={(e) => updateField({ inputType: e.target.value })}
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8125rem' }}
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="tel">Phone</option>
                              <option value="number">Number</option>
                              <option value="url">URL</option>
                            </select>
                          </div>
                        )}
                        {f.type === 'core/form-select' && (
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Options (one per line: value|label)</label>
                            <textarea
                              className="toolbar-input-full"
                              value={((f.attributes?.options as Array<{ value: string; label: string }>) ?? []).map((o) => `${o.value}|${o.label}`).join('\n')}
                              onChange={(e) => {
                                const lines = e.target.value.split('\n').filter(Boolean);
                                const options = lines.map((line) => {
                                  const [value, label] = line.split('|').map((s) => s?.trim() ?? '');
                                  return { value: value || line, label: label || value || line };
                                });
                                updateField({ options });
                              }}
                              placeholder="option1|Option 1"
                              rows={3}
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                            />
                          </div>
                        )}
                        {f.type === 'core/form-textarea' && (
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Rows</label>
                            <input
                              type="number"
                              className="toolbar-input-full"
                              value={(f.attributes?.rows as number) ?? 4}
                              onChange={(e) => updateField({ rows: Math.max(2, Math.min(20, Number(e.target.value) || 4)) })}
                              min={2}
                              max={20}
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8125rem' }}
                            />
                          </div>
                        )}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                          <input type="checkbox" checked={!!(f.attributes?.required as boolean)} onChange={(e) => updateField({ required: e.target.checked })} />
                          Required
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="toolbar-hint" style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>
                No fields yet. Add below.
              </span>
            )}
            <span className="toolbar-group-label">Add field</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(['core/form-input', 'core/form-select', 'core/form-textarea'] as const).map((ft) => (
                <button
                  key={ft}
                  type="button"
                  className="toolbar-btn"
                  onClick={() => {
                    const def = getBlockDefinition(ft);
                    const newField: Block = {
                      id: createBlockId(),
                      type: ft,
                      attributes: { ...def.defaultAttributes },
                    };
                    const inner = (isInnerBlocksBlock(block) ? block.innerBlocks ?? [] : []);
                    onUpdate({ innerBlocks: [...inner, newField] });
                  }}
                >
                  + {ft.replace('core/form-', '')}
                </button>
              ))}
            </div>
          </>
        )}
        {block.type === 'core/form-input' && (
          <>
            <span className="toolbar-group-label">Label</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.label as string) ?? ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Field"
              aria-label="Field label"
            />
            <span className="toolbar-group-label">Input type</span>
            <select
              className="toolbar-input-full"
              value={(attrs.inputType as string) ?? 'text'}
              onChange={(e) => onUpdate({ inputType: e.target.value })}
              aria-label="Input type"
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="tel">Phone</option>
              <option value="number">Number</option>
              <option value="url">URL</option>
            </select>
            <span className="toolbar-group-label">Placeholder</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.placeholder as string) ?? ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Optional"
              aria-label="Placeholder"
            />
            <label className="toolbar-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" checked={!!(attrs.required as boolean)} onChange={(e) => onUpdate({ required: e.target.checked })} />
              Required
            </label>
          </>
        )}
        {block.type === 'core/form-select' && (
          <>
            <span className="toolbar-group-label">Label</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.label as string) ?? ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Choose"
              aria-label="Select label"
            />
            <span className="toolbar-group-label">Options (one per line: value|label)</span>
            <textarea
              className="toolbar-input-full"
              value={((attrs.options as Array<{ value: string; label: string }>) ?? []).map((o) => `${o.value}|${o.label}`).join('\n')}
              onChange={(e) => {
                const lines = e.target.value.split('\n').filter(Boolean);
                const options = lines.map((line) => {
                  const [value, label] = line.split('|').map((s) => s.trim());
                  return { value: value || line, label: label || value || line };
                });
                onUpdate({ options });
              }}
              placeholder="option1|Option 1"
              rows={4}
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
              aria-label="Options"
            />
            <label className="toolbar-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" checked={!!(attrs.required as boolean)} onChange={(e) => onUpdate({ required: e.target.checked })} />
              Required
            </label>
          </>
        )}
        {block.type === 'core/form-textarea' && (
          <>
            <span className="toolbar-group-label">Label</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.label as string) ?? ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Message"
              aria-label="Textarea label"
            />
            <span className="toolbar-group-label">Placeholder</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.placeholder as string) ?? ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Optional"
              aria-label="Placeholder"
            />
            <span className="toolbar-group-label">Rows</span>
            <input
              type="number"
              className="toolbar-input-full"
              value={(attrs.rows as number) ?? 4}
              onChange={(e) => onUpdate({ rows: Math.max(2, Math.min(20, Number(e.target.value) || 4)) })}
              min={2}
              max={20}
              aria-label="Rows"
            />
            <label className="toolbar-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" checked={!!(attrs.required as boolean)} onChange={(e) => onUpdate({ required: e.target.checked })} />
              Required
            </label>
          </>
        )}
        {block.type === 'core/custom' && (
          <>
            <span className="toolbar-group-label">HTML</span>
            <textarea
              className="toolbar-input-full"
              value={(attrs.html as string) ?? ''}
              onChange={(e) => onUpdate({ html: e.target.value })}
              placeholder={'<div class="p-6">Your content</div>'}
              rows={6}
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
              aria-label="Custom HTML"
            />
            <span className="toolbar-group-label">CSS (optional)</span>
            <textarea
              className="toolbar-input-full"
              value={(attrs.css as string) ?? ''}
              onChange={(e) => onUpdate({ css: e.target.value })}
              placeholder={'.card { padding: 1rem; } — body fills block (avoid height: 200vh)'}
              rows={4}
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
              aria-label="Custom CSS"
            />
            <span className="toolbar-group-label">JavaScript (optional)</span>
            <textarea
              className="toolbar-input-full"
              value={(attrs.script as string) ?? ''}
              onChange={(e) => onUpdate({ script: e.target.value })}
              placeholder={'document.querySelector(".btn").addEventListener("click", () => {});'}
              rows={4}
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
              aria-label="Custom JavaScript"
            />
            <span className="toolbar-group-label">Wrapper classes (optional)</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.wrapperClasses as string) ?? ''}
              onChange={(e) => onUpdate({ wrapperClasses: e.target.value })}
              placeholder="e.g. rounded-xl shadow-lg"
              aria-label="Wrapper Tailwind classes"
            />
          </>
        )}
        {block.type === 'store/promo-banner' && (
          <>
            <span className="toolbar-group-label">Banner text</span>
            <TextEditor
              value={(attrs.text as string) ?? ''}
              onChange={(html) => onUpdate({ text: html })}
              placeholder="Free shipping on orders over $50"
              compact
            />
            <span className="toolbar-group-label">Background color</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.backgroundColor as string) ?? ''}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              placeholder="#1e3a5f"
              aria-label="Background color"
            />
          </>
        )}
        {block.type === 'store/newsletter' && (
          <>
            <span className="toolbar-group-label">Title</span>
            <TextEditor
              value={(attrs.title as string) ?? ''}
              onChange={(html) => onUpdate({ title: html })}
              placeholder="Join our newsletter"
              compact
            />
            <span className="toolbar-group-label">Subtitle</span>
            <TextEditor
              value={(attrs.subtitle as string) ?? ''}
              onChange={(html) => onUpdate({ subtitle: html })}
              placeholder="Get 10% off your first order."
              contentClassName="toolbar-text-editor"
            />
            <span className="toolbar-group-label">Button text</span>
            <TextEditor
              value={(attrs.buttonText as string) ?? ''}
              onChange={(html) => onUpdate({ buttonText: html })}
              placeholder="Subscribe"
              compact
            />
          </>
        )}
        {block.type === 'store/collection-list' && (
          <>
            <span className="toolbar-group-label">Section title</span>
            <TextEditor
              value={(attrs.title as string) ?? ''}
              onChange={(html) => onUpdate({ title: html })}
              placeholder="Collections"
              compact
            />
            <span className="toolbar-group-label">API endpoint</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.apiEndpoint as string) ?? ''}
              onChange={(e) => onUpdate({ apiEndpoint: e.target.value })}
              placeholder="/collections"
              aria-label="API endpoint"
            />
          </>
        )}
        {block.type === 'core/image' && (
          <>
            <span className="toolbar-group-label">Image URL</span>
            <input
              type="url"
              className="toolbar-input-full"
              value={(attrs.url as string) ?? ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="https://…"
              aria-label="Image URL"
            />
            <span className="toolbar-group-label">Alt text</span>
            <input
              type="text"
              className="toolbar-input-full"
              value={(attrs.alt as string) ?? ''}
              onChange={(e) => onUpdate({ alt: e.target.value })}
              placeholder="Alt text (SEO)"
              aria-label="Alt text"
            />
            <span className="toolbar-group-label">Caption</span>
            <TextEditor
              value={(attrs.caption as string) ?? ''}
              onChange={(html) => onUpdate({ caption: html })}
              placeholder="Optional caption"
              compact
            />
            <span className="toolbar-group-label">Caption style</span>
            <TypographyControls
              fontFamily={(attrs.captionFontFamily as string) ?? ''}
              textColor={(attrs.captionTextColor as string) ?? ''}
              fontSize={(attrs.captionFontSize as string) ?? ''}
              fontWeight={(attrs.captionFontWeight as string) ?? ''}
              fontStyle={(attrs.captionFontStyle as string) ?? ''}
              onChange={(next) => onUpdate({
                ...(next.fontFamily !== undefined && { captionFontFamily: next.fontFamily }),
                ...(next.textColor !== undefined && { captionTextColor: next.textColor }),
                ...(next.fontSize !== undefined && { captionFontSize: next.fontSize }),
                ...(next.fontWeight !== undefined && { captionFontWeight: next.fontWeight }),
                ...(next.fontStyle !== undefined && { captionFontStyle: next.fontStyle }),
              })}
            />
            <span className="toolbar-group-label">Width</span>
            <div className="toolbar-row" style={{ alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="range"
                min={20}
                max={100}
                value={(attrs.width as number) ?? 100}
                onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                aria-label="Image width"
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', minWidth: '2.5rem' }}>
                {((attrs.width as number) ?? 100)}%
              </span>
            </div>
          </>
        )}
        {block.type === 'core/button' && (
          <>
            <span className="toolbar-group-label">Button text</span>
            <TextEditor
              value={(attrs.text as string) ?? ''}
              onChange={(html) => onUpdate({ text: html })}
              placeholder="Click me"
              compact
            />
            <span className="toolbar-group-label">Link URL</span>
            <input
              type="url"
              className="toolbar-input-full"
              value={(attrs.url as string) ?? ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="#"
              aria-label="Link URL"
            />
          </>
        )}
        {block.type === 'core/spacer' && (
          <div className="toolbar-field">
            <span className="toolbar-group-label">Height (px)</span>
            <div className="toolbar-row" style={{ alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="range"
                min={20}
                max={400}
                value={(attrs.height as number) ?? 40}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  const layout = (attrs.layout as { x?: number; y?: number; w?: number; h?: number }) ?? {};
                  const rowHeight = 40;
                  onUpdate({
                    height: v,
                    layout: { ...layout, h: Math.max(1, Math.ceil(v / rowHeight)) },
                  });
                }}
                aria-label="Spacer height"
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', minWidth: '2.5rem' }}>
                {((attrs.height as number) ?? 40)}px
              </span>
            </div>
          </div>
        )}
        {block.type === 'core/columns' && isInnerBlocksBlock(block) && block.innerBlocks && (
          <div className="toolbar-field">
            <span className="toolbar-group-label">Column widths</span>
            {(() => {
              const columnWidths = (attrs.columnWidths as number[]) ?? block.innerBlocks.map(() => 50);
              const total = columnWidths.reduce((a, b) => a + b, 0) || 100;
              const normalized = columnWidths.map((w) => (total ? Math.round((w / total) * 100) : 50));
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {block.innerBlocks.map((_, i) => (
                    <div key={i} className="toolbar-row" style={{ alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', minWidth: '3rem' }}>Col {i + 1}</span>
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
                        aria-label={`Column ${i + 1} width`}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', minWidth: '2.5rem' }}>{normalized[i]}%</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
        {block.type === 'core/list' && (
          <>
            <div className="toolbar-field">
              <span className="toolbar-group-label">Ordered list</span>
              <label className="toolbar-checkbox-label" style={{ marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  className="toolbar-checkbox"
                  checked={!!(attrs.ordered as boolean)}
                  onChange={(e) => onUpdate({ ordered: e.target.checked })}
                  aria-label="Numbered list"
                />
                <span className="toolbar-checkbox-text">Numbered (1, 2, 3…)</span>
              </label>
            </div>
            <span className="toolbar-group-label">List items</span>
            {(() => {
              const items = (attrs.items as string[]) ?? [];
              const displayItems = items.length ? items : [''];
              return displayItems.map((item, i) => (
              <div key={i} className="toolbar-row" style={{ marginBottom: '0.5rem', gap: '0.5rem', alignItems: 'flex-start' }}>
                <TextEditor
                  value={item}
                  onChange={(html) => {
                    const items = (attrs.items as string[]) ?? [];
                    const next = [...items];
                    if (!next[i]) next[i] = '';
                    next[i] = html;
                    onUpdate({ items: next });
                  }}
                  placeholder={`Item ${i + 1}`}
                  compact
                />
                <button
                  type="button"
                  className="toolbar-btn"
                  style={{ fontSize: 11, flexShrink: 0 }}
                  onClick={() => {
                    const items = ((attrs.items as string[]) ?? []).filter((_, idx) => idx !== i);
                    onUpdate({ items: items.length ? items : [''] });
                  }}
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
            ));
            })()}
            <button
              type="button"
              className="toolbar-btn"
              style={{ fontSize: 12 }}
              onClick={() => {
                const items = (attrs.items as string[]) ?? [];
                onUpdate({ items: [...items, ''] });
              }}
            >
              + Add item
            </button>
          </>
        )}
        {block.type === 'store/testimonials' && (
          <>
            <div className="toolbar-field">
              <span className="toolbar-group-label">Section title</span>
              <TextEditor
                value={(attrs.title as string) ?? ''}
                onChange={(html) => onUpdate({ title: html })}
                placeholder="What our customers say"
                compact
              />
            </div>
            <span className="toolbar-group-label">Testimonials</span>
            {((attrs.items as Array<{ quote: string; author: string; rating?: number }>) ?? [{ quote: '', author: '', rating: 5 }]).map((item, i) => (
              <CollapsibleSection key={i} title={`Testimonial ${i + 1}`} defaultOpen={false} className="sidebar-section-testimonial">
                <div className="block-toolbar block-toolbar-in-sidebar">
                  <div className="toolbar-field">
                    <span className="toolbar-group-label">Quote</span>
                    <TextEditor value={item.quote} onChange={(html) => {
                      const items = (attrs.items as Array<{ quote: string; author: string; rating?: number }>) ?? [];
                      const next = [...items]; if (!next[i]) next[i] = { quote: '', author: '', rating: 5 };
                      next[i] = { ...next[i], quote: html }; onUpdate({ items: next });
                    }} placeholder="Quote" compact />
                  </div>
                  <div className="toolbar-field">
                    <span className="toolbar-group-label">Author</span>
                    <TextEditor value={item.author} onChange={(html) => {
                      const items = (attrs.items as Array<{ quote: string; author: string; rating?: number }>) ?? [];
                      const next = [...items]; if (!next[i]) next[i] = { quote: '', author: '', rating: 5 };
                      next[i] = { ...next[i], author: html }; onUpdate({ items: next });
                    }} placeholder="Author name" compact />
                  </div>
                  <div className="toolbar-field">
                    <span className="toolbar-group-label">Rating (1–5)</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      className="toolbar-input-full"
                      value={typeof item.rating === 'number' ? item.rating : 5}
                      onChange={(e) => {
                        const items = (attrs.items as Array<{ quote: string; author: string; rating?: number }>) ?? [];
                        const next = [...items]; if (!next[i]) next[i] = { quote: '', author: '', rating: 5 };
                        next[i] = { ...next[i], rating: Number(e.target.value) || 5 }; onUpdate({ items: next });
                      }}
                      aria-label="Rating"
                    />
                  </div>
                  <button type="button" className="toolbar-btn danger" style={{ fontSize: 11 }} onClick={() => {
                    const items = ((attrs.items as Array<{ quote: string; author: string; rating?: number }>) ?? []).filter((_, idx) => idx !== i);
                    onUpdate({ items: items.length ? items : [{ quote: '', author: '', rating: 5 }] });
                  }}>Remove</button>
                </div>
              </CollapsibleSection>
            ))}
            <button type="button" className="toolbar-btn" style={{ marginTop: 8 }} onClick={() => {
              const items = (attrs.items as Array<{ quote: string; author: string; rating?: number }>) ?? [];
              onUpdate({ items: [...items, { quote: '', author: '', rating: 5 }] });
            }}>+ Add testimonial</button>
          </>
        )}
        {block.type === 'store/trust-badges' && (
          <>
            <span className="toolbar-group-label">Badges</span>
            {((attrs.items as Array<{ icon: string; text: string }>) ?? [{ icon: '🚚', text: 'Free shipping' }]).map((item, i) => (
              <div key={i} className="toolbar-row" style={{ marginBottom: '0.5rem', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="toolbar-input-full"
                  value={item.icon}
                  onChange={(e) => {
                    const items = (attrs.items as Array<{ icon: string; text: string }>) ?? [];
                    const next = [...items]; if (!next[i]) next[i] = { icon: '', text: '' };
                    next[i] = { ...next[i], icon: e.target.value }; onUpdate({ items: next });
                  }}
                  placeholder="Icon (emoji)"
                  style={{ width: 48, textAlign: 'center' }}
                  aria-label="Badge icon"
                />
                <input
                  type="text"
                  className="toolbar-input-full"
                  value={item.text}
                  onChange={(e) => {
                    const items = (attrs.items as Array<{ icon: string; text: string }>) ?? [];
                    const next = [...items]; if (!next[i]) next[i] = { icon: '', text: '' };
                    next[i] = { ...next[i], text: e.target.value }; onUpdate({ items: next });
                  }}
                  placeholder="Label"
                  aria-label="Badge text"
                />
                <button type="button" className="toolbar-btn" style={{ fontSize: 11, flexShrink: 0 }} onClick={() => {
                  const items = ((attrs.items as Array<{ icon: string; text: string }>) ?? []).filter((_, idx) => idx !== i);
                  onUpdate({ items: items.length ? items : [{ icon: '✓', text: '' }] });
                }} aria-label="Remove badge">✕</button>
              </div>
            ))}
            <button type="button" className="toolbar-btn" style={{ fontSize: 12 }} onClick={() => {
              const items = (attrs.items as Array<{ icon: string; text: string }>) ?? [];
              onUpdate({ items: [...items, { icon: '✓', text: '' }] });
            }}>+ Add badge</button>
          </>
        )}
        {block.type !== 'core/hero' && block.type !== 'core/quote' && block.type !== 'core/image' && hasTypography && typographyAttrs && (
          <div className="toolbar-field">
            <span className="toolbar-group-label">Text</span>
            <TypographyControls
              fontFamily={typographyAttrs.fontFamily}
              textColor={typographyAttrs.textColor}
              fontSize={typographyAttrs.fontSize}
              fontWeight={typographyAttrs.fontWeight}
              fontStyle={typographyAttrs.fontStyle}
              onChange={(next) => onUpdate(next)}
            />
          </div>
        )}
        {block.type !== 'core/hero' && hasButtonStyle && buttonStyleAttrs && (
          <ButtonStyleControls
            includeTextStyle={block.type !== 'core/button'}
            backgroundColor={buttonStyleAttrs.backgroundColor}
            textColor={buttonStyleAttrs.textColor}
            fontFamily={buttonStyleAttrs.fontFamily}
            fontSize={'fontSize' in buttonStyleAttrs ? buttonStyleAttrs.fontSize : undefined}
            fontWeight={'fontWeight' in buttonStyleAttrs ? buttonStyleAttrs.fontWeight : undefined}
            fontStyle={'fontStyle' in buttonStyleAttrs ? buttonStyleAttrs.fontStyle : undefined}
            borderRadius={buttonStyleAttrs.borderRadius}
            padding={buttonStyleAttrs.padding}
            keys={buttonStyleKeys}
            onChange={(next) => onUpdate(next)}
          />
        )}
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Layout" defaultOpen className="sidebar-section-layout">
        <div className="block-toolbar block-toolbar-in-sidebar">
          <div className="toolbar-field">
            <label className="toolbar-group-label">Height (px)</label>
            <div className="toolbar-row" style={{ alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                min={40}
                max={800}
                step={40}
                className="toolbar-input-full"
                value={(() => {
                  const layout = attrs.layout as { h?: number } | undefined;
                  const h = layout?.h ?? 2;
                  return h * 40;
                })()}
                onChange={(e) => {
                  const px = Math.max(40, Math.min(800, Number(e.target.value) || 40));
                  const h = Math.max(1, Math.round(px / 40));
                  const layout = (attrs.layout as { x?: number; y?: number; w?: number; h?: number }) ?? {};
                  onUpdate({ layout: { ...layout, h } });
                }}
                aria-label="Block height in pixels"
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', minWidth: '2.5rem' }}>px</span>
            </div>
            <span className="toolbar-hint" style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem', display: 'block' }}>
              {block.type === 'core/custom'
                ? 'Set this higher than your CSS height (e.g. .card { height: 500px } → 520px here). Or drag resize handle.'
                : 'Or drag resize handle on block'}
            </span>
          </div>
          {onGridChange && (
            <div className="toolbar-field">
              <label className="toolbar-group-label">Width</label>
              <select
                className="toolbar-width-select"
                value={`${gridColumnSpan}`}
                onChange={(e) => {
                  const span = Number(e.target.value);
                  const start = Math.min(gridColumnStart, 13 - span);
                  onGridChange(span, start);
                }}
                aria-label="Column width"
              >
                <option value={12}>Full width</option>
                <option value={6}>½ (6 cols)</option>
                <option value={4}>⅓ (4 cols)</option>
                <option value={3}>¼ (3 cols)</option>
                <option value={2}>⅙ (2 cols)</option>
                <option value={1}>1 col</option>
              </select>
            </div>
          )}
          <div className="toolbar-field toolbar-field-checkbox">
            <label className="toolbar-checkbox-label">
              <input
                type="checkbox"
                className="toolbar-checkbox"
                checked={!!(attrs.fullBleed as boolean)}
                onChange={(e) => onUpdate({ fullBleed: e.target.checked })}
                aria-label="Full bleed (left to right)"
              />
              <span className="toolbar-checkbox-text">Full bleed (left to right)</span>
            </label>
          </div>
          <CollapsibleSection title="Margin" defaultOpen={false} className="sidebar-section-spacing">
            <div className="block-toolbar block-toolbar-in-sidebar toolbar-spacing">
              <div className="toolbar-field">
                <span className="toolbar-group-label">Top</span>
                <input
                  type="text"
                  className="toolbar-input-full"
                  value={(attrs.marginTop as string) ?? ''}
                  onChange={(e) => onUpdate({ marginTop: e.target.value.trim() || undefined })}
                  placeholder="e.g. 16 or 24"
                  aria-label="Margin top"
                />
              </div>
              <div className="toolbar-field">
                <span className="toolbar-group-label">Bottom</span>
                <input
                  type="text"
                  className="toolbar-input-full"
                  value={(attrs.marginBottom as string) ?? ''}
                  onChange={(e) => onUpdate({ marginBottom: e.target.value.trim() || undefined })}
                  placeholder="e.g. 16 or 24"
                  aria-label="Margin bottom"
                />
              </div>
              <div className="toolbar-field">
                <span className="toolbar-group-label">Left</span>
                <input
                  type="text"
                  className="toolbar-input-full"
                  value={(attrs.marginLeft as string) ?? ''}
                  onChange={(e) => onUpdate({ marginLeft: e.target.value.trim() || undefined })}
                  placeholder="0"
                  aria-label="Margin left"
                />
              </div>
              <div className="toolbar-field">
                <span className="toolbar-group-label">Right</span>
                <input
                  type="text"
                  className="toolbar-input-full"
                  value={(attrs.marginRight as string) ?? ''}
                  onChange={(e) => onUpdate({ marginRight: e.target.value.trim() || undefined })}
                  placeholder="0"
                  aria-label="Margin right"
                />
              </div>
            </div>
          </CollapsibleSection>
          <CollapsibleSection title="Padding" defaultOpen={false} className="sidebar-section-spacing">
            <div className="block-toolbar block-toolbar-in-sidebar toolbar-spacing">
              <div className="toolbar-field">
                <span className="toolbar-group-label">Top</span>
                <input
                  type="text"
                  className="toolbar-input-full"
                  value={(attrs.paddingTop as string) ?? ''}
                  onChange={(e) => onUpdate({ paddingTop: e.target.value.trim() || undefined })}
                  placeholder="e.g. 16 or 24"
                  aria-label="Padding top"
                />
              </div>
              <div className="toolbar-field">
                <span className="toolbar-group-label">Bottom</span>
                <input
                  type="text"
                  className="toolbar-input-full"
                  value={(attrs.paddingBottom as string) ?? ''}
                  onChange={(e) => onUpdate({ paddingBottom: e.target.value.trim() || undefined })}
                  placeholder="e.g. 16 or 24"
                  aria-label="Padding bottom"
                />
              </div>
              <div className="toolbar-field">
                <span className="toolbar-group-label">Left</span>
                <input
                  type="text"
                  className="toolbar-input-full"
                  value={(attrs.paddingLeft as string) ?? ''}
                  onChange={(e) => onUpdate({ paddingLeft: e.target.value.trim() || undefined })}
                  placeholder="0"
                  aria-label="Padding left"
                />
              </div>
              <div className="toolbar-field">
                <span className="toolbar-group-label">Right</span>
                <input
                  type="text"
                  className="toolbar-input-full"
                  value={(attrs.paddingRight as string) ?? ''}
                  onChange={(e) => onUpdate({ paddingRight: e.target.value.trim() || undefined })}
                  placeholder="0"
                  aria-label="Padding right"
                />
              </div>
            </div>
          </CollapsibleSection>
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Actions" defaultOpen className="sidebar-section-actions">
        <div className="toolbar-row toolbar-row-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {onInsertAbove && (
            <button type="button" className="toolbar-btn" onClick={onInsertAbove} aria-label="Add block above">Add above</button>
          )}
          {onInsertBelow && (
            <button type="button" className="toolbar-btn" onClick={onInsertBelow} aria-label="Add block below">Add below</button>
          )}
          {onMoveUp && (
            <button type="button" className="toolbar-btn toolbar-btn-icon" onClick={onMoveUp} aria-label="Move up">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
            </button>
          )}
          {onMoveDown && (
            <button type="button" className="toolbar-btn toolbar-btn-icon" onClick={onMoveDown} aria-label="Move down">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          )}
          <button type="button" className="toolbar-btn danger" onClick={onDelete} aria-label="Delete">Delete</button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
