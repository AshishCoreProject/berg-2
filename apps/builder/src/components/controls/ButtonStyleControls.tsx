/**
 * Per-block button style: background, color, font, size, weight, style, radius, padding.
 */
interface Props {
  includeTextStyle: boolean;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  borderRadius: string;
  padding: string;
  keys: {
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    fontSize?: string;
    fontWeight?: string;
    fontStyle?: string;
    borderRadius: string;
    padding: string;
  };
  onChange: (attrs: Record<string, string>) => void;
}

const FONT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Serif' },
  { value: 'system-ui, -apple-system, sans-serif', label: 'Sans' },
  { value: '"Segoe UI", system-ui, sans-serif', label: 'Segoe UI' },
  { value: '"Lucida Console", Monaco, monospace', label: 'Monospace' },
];

const FONT_WEIGHT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Bold' },
  { value: '600', label: 'Semi-bold' },
  { value: '700', label: 'Bold (700)' },
];

export function ButtonStyleControls({
  includeTextStyle,
  backgroundColor,
  textColor,
  fontFamily,
  fontSize = '',
  fontWeight = '',
  fontStyle = '',
  borderRadius,
  padding,
  keys: k,
  onChange,
}: Props) {
  return (
    <div className="button-style-controls" onClick={(e) => e.stopPropagation()}>
      <label className="button-style-label">
        <span>BG</span>
        <input
          type="text"
          value={backgroundColor}
          onChange={(e) => onChange({ [k.backgroundColor]: e.target.value })}
          placeholder="#333"
          aria-label="Button background"
        />
      </label>
      {includeTextStyle && (
        <>
          <label className="button-style-label">
            <span>Color</span>
            <input
              type="text"
              value={textColor}
              onChange={(e) => onChange({ [k.textColor]: e.target.value })}
              placeholder="#000"
              aria-label="Button text color"
            />
          </label>
          <label className="button-style-label">
            <span>Font</span>
            <select
              value={fontFamily}
              onChange={(e) => onChange({ [k.fontFamily]: e.target.value })}
              aria-label="Button font"
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value || 'default'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          {k.fontSize !== undefined && (
            <label className="button-style-label">
              <span>Size</span>
              <input
                type="text"
                value={fontSize}
                onChange={(e) => onChange({ [k.fontSize!]: e.target.value })}
                placeholder="e.g. 1rem"
                aria-label="Button font size"
              />
            </label>
          )}
          {k.fontWeight !== undefined && (
            <label className="button-style-label">
              <span>Weight</span>
              <select
                value={fontWeight}
                onChange={(e) => onChange({ [k.fontWeight!]: e.target.value })}
                aria-label="Button font weight"
              >
                {FONT_WEIGHT_OPTIONS.map((opt) => (
                  <option key={opt.value || 'default'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          )}
          {k.fontStyle !== undefined && (
            <label className="button-style-label">
              <span>Style</span>
              <select
                value={fontStyle}
                onChange={(e) => onChange({ [k.fontStyle!]: e.target.value })}
                aria-label="Button font style"
              >
                <option value="">Default</option>
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </label>
          )}
        </>
      )}
      <label className="button-style-label">
        <span>Radius</span>
        <input
          type="text"
          value={borderRadius}
          onChange={(e) => onChange({ [k.borderRadius]: e.target.value })}
          placeholder="e.g. 8px"
          aria-label="Border radius"
        />
      </label>
      <label className="button-style-label">
        <span>Padding</span>
        <input
          type="text"
          value={padding}
          onChange={(e) => onChange({ [k.padding]: e.target.value })}
          placeholder="e.g. 8px 16px"
          aria-label="Padding"
        />
      </label>
    </div>
  );
}
