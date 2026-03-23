/**
 * Font, size, style, and color controls for text in blocks.
 * Used in the block toolbar when a text-bearing block is selected.
 */
interface Props {
  fontFamily: string;
  textColor: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  onChange: (attrs: {
    fontFamily?: string;
    textColor?: string;
    fontSize?: string;
    fontWeight?: string;
    fontStyle?: string;
  }) => void;
}

const FONT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Serif' },
  { value: 'system-ui, -apple-system, sans-serif', label: 'Sans' },
  { value: '"Segoe UI", system-ui, sans-serif', label: 'Segoe UI' },
  { value: '"Lucida Console", Monaco, monospace', label: 'Monospace' },
  { value: 'cursive', label: 'Cursive' },
];

const FONT_WEIGHT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Bold' },
  { value: '300', label: 'Light (300)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi-bold (600)' },
  { value: '700', label: 'Bold (700)' },
];

const FONT_STYLE_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'normal', label: 'Normal' },
  { value: 'italic', label: 'Italic' },
];

const COLOR_PRESETS = [
  '#000000',
  '#ffffff',
  '#374151',
  '#6b7280',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#2563eb',
  '#7c3aed',
];

export function TypographyControls({
  fontFamily,
  textColor,
  fontSize = '',
  fontWeight = '',
  fontStyle = '',
  onChange,
}: Props) {
  const currentFont = fontFamily ?? '';
  const currentColor = textColor || '';

  return (
    <div className="typography-controls">
      <label className="typography-control typography-font">
        <span className="typography-label">Font</span>
        <select
          value={currentFont}
          onChange={(e) => onChange({ fontFamily: e.target.value || undefined })}
          onClick={(e) => e.stopPropagation()}
          aria-label="Font family"
        >
          {FONT_OPTIONS.map((opt) => (
            <option key={opt.value || 'default'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="typography-control typography-size">
        <span className="typography-label">Size</span>
        <input
          type="text"
          value={fontSize}
          onChange={(e) => onChange({ fontSize: e.target.value.trim() || undefined })}
          onClick={(e) => e.stopPropagation()}
          placeholder="e.g. 1rem, 16px"
          aria-label="Font size"
        />
      </label>
      <label className="typography-control typography-weight">
        <span className="typography-label">Weight</span>
        <select
          value={fontWeight}
          onChange={(e) => onChange({ fontWeight: e.target.value || undefined })}
          onClick={(e) => e.stopPropagation()}
          aria-label="Font weight"
        >
          {FONT_WEIGHT_OPTIONS.map((opt) => (
            <option key={opt.value || 'default'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="typography-control typography-style">
        <span className="typography-label">Style</span>
        <select
          value={fontStyle}
          onChange={(e) => onChange({ fontStyle: e.target.value || undefined })}
          onClick={(e) => e.stopPropagation()}
          aria-label="Font style"
        >
          {FONT_STYLE_OPTIONS.map((opt) => (
            <option key={opt.value || 'default'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="typography-control typography-color">
        <span className="typography-label">Color</span>
        <div className="typography-color-row">
          <input
            type="color"
            value={currentColor || '#000000'}
            onChange={(e) => onChange({ textColor: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="typography-color-picker"
            aria-label="Text color"
          />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => onChange({ textColor: e.target.value.trim() || undefined })}
            onClick={(e) => e.stopPropagation()}
            placeholder="#000000"
            className="typography-color-hex"
            aria-label="Text color (hex)"
          />
        </div>
        <div className="typography-color-presets">
          {COLOR_PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              className="typography-color-preset"
              style={{ background: hex }}
              onClick={(e) => { e.stopPropagation(); onChange({ textColor: hex }); }}
              title={hex}
              aria-label={`Color ${hex}`}
            />
          ))}
        </div>
      </label>
    </div>
  );
}
