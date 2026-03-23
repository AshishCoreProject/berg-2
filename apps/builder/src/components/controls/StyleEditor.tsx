/**
 * Reusable style controls for Header, Footer, or Button.
 * Used in SiteSettings for full customization of header, footer, and default button.
 */
export interface StyleValues {
  backgroundColor?: string;
  color?: string;
  fontFamily?: string;
  linkColor?: string;
  borderRadius?: string;
  padding?: string;
}

interface Props {
  title: string;
  values: StyleValues;
  onChange: (next: StyleValues) => void;
  variant: 'header' | 'footer' | 'button';
}

const FONT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Serif' },
  { value: 'system-ui, -apple-system, sans-serif', label: 'Sans' },
  { value: '"Segoe UI", system-ui, sans-serif', label: 'Segoe UI' },
  { value: 'monospace', label: 'Monospace' },
];

export function StyleEditor({ title, values, onChange, variant }: Props) {
  const set = (key: keyof StyleValues, value: string | undefined) => {
    onChange({ ...values, [key]: value || undefined });
  };

  return (
    <div className="style-editor">
      <h4 className="style-editor-title">{title}</h4>
      <label className="style-editor-row">
        <span>Background</span>
        <div className="style-editor-color">
          <input
            type="color"
            value={values.backgroundColor || '#1a1a1a'}
            onChange={(e) => set('backgroundColor', e.target.value)}
            title="Background color"
          />
          <input
            type="text"
            value={values.backgroundColor ?? ''}
            onChange={(e) => set('backgroundColor', e.target.value.trim() || undefined)}
            placeholder="#1a1a1a"
            className="style-hex"
          />
        </div>
      </label>
      <label className="style-editor-row">
        <span>Text color</span>
        <div className="style-editor-color">
          <input
            type="color"
            value={values.color || '#ffffff'}
            onChange={(e) => set('color', e.target.value)}
            title="Text color"
          />
          <input
            type="text"
            value={values.color ?? ''}
            onChange={(e) => set('color', e.target.value.trim() || undefined)}
            placeholder="#ffffff"
            className="style-hex"
          />
        </div>
      </label>
      <label className="style-editor-row">
        <span>Font</span>
        <select
          value={values.fontFamily ?? ''}
          onChange={(e) => set('fontFamily', e.target.value || undefined)}
        >
          {FONT_OPTIONS.map((opt) => (
            <option key={opt.value || 'default'} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
      {variant !== 'button' && (
        <label className="style-editor-row">
          <span>Link color</span>
          <div className="style-editor-color">
            <input
              type="color"
              value={values.linkColor || '#94a3b8'}
              onChange={(e) => set('linkColor', e.target.value)}
              title="Link color"
            />
            <input
              type="text"
              value={values.linkColor ?? ''}
              onChange={(e) => set('linkColor', e.target.value.trim() || undefined)}
              placeholder="#94a3b8"
              className="style-hex"
            />
          </div>
        </label>
      )}
      {variant === 'button' && (
        <>
          <label className="style-editor-row">
            <span>Border radius</span>
            <input
              type="text"
              value={values.borderRadius ?? ''}
              onChange={(e) => set('borderRadius', e.target.value.trim() || undefined)}
              placeholder="8px"
            />
          </label>
          <label className="style-editor-row">
            <span>Padding</span>
            <input
              type="text"
              value={values.padding ?? ''}
              onChange={(e) => set('padding', e.target.value.trim() || undefined)}
              placeholder="0.5rem 1rem"
            />
          </label>
        </>
      )}
    </div>
  );
}
