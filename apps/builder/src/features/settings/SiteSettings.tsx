import { StyleEditor } from '@/components/controls';

type ButtonStyle = { backgroundColor?: string; color?: string; fontFamily?: string; borderRadius?: string; padding?: string };

interface Props {
  siteTitle: string;
  apiBaseUrl: string;
  /** Cart API tenant id (query param). */
  tenantId: string;
  /** Cart API store_id (query param); optional if backend infers from tenant. */
  storeId: string;
  theme: 'light' | 'dark';
  accentColor: string;
  useDemoData: boolean;
  buttonStyle: ButtonStyle;
  onSiteTitleChange: (value: string) => void;
  onApiBaseUrlChange: (value: string) => void;
  onTenantIdChange: (value: string) => void;
  onStoreIdChange: (value: string) => void;
  onThemeChange: (value: 'light' | 'dark') => void;
  onAccentColorChange: (value: string) => void;
  onUseDemoDataChange: (value: boolean) => void;
  onButtonStyleChange: (value: ButtonStyle) => void;
  onCreateDemoStore: () => void;
}

const ACCENT_PRESETS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Amber', value: '#f59e0b' },
];

export function SiteSettings({
  siteTitle,
  apiBaseUrl,
  tenantId,
  storeId,
  theme,
  accentColor,
  useDemoData,
  buttonStyle,
  onSiteTitleChange,
  onApiBaseUrlChange,
  onTenantIdChange,
  onStoreIdChange,
  onThemeChange,
  onAccentColorChange,
  onUseDemoDataChange,
  onButtonStyleChange,
  onCreateDemoStore,
}: Props) {
  return (
    <section className="site-settings">
      <h3 className="sidebar-title">Website</h3>
      <label>
        <span>Site name</span>
        <input
          type="text"
          value={siteTitle}
          onChange={(e) => onSiteTitleChange(e.target.value)}
          placeholder="My Website"
        />
      </label>
      <p className="site-settings-hint">Shown in the storefront header.</p>

      <StyleEditor title="Buttons (default)" values={buttonStyle} onChange={onButtonStyleChange} variant="button" />

      <label>
        <span>Theme</span>
        <select value={theme} onChange={(e) => onThemeChange(e.target.value as 'light' | 'dark')}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </label>
      <p className="site-settings-hint">Applies to builder and storefront.</p>

      <label>
        <span>Accent color</span>
        <div className="accent-color-row">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => onAccentColorChange(e.target.value)}
            className="accent-color-picker"
            title="Accent color"
          />
          <input
            type="text"
            value={accentColor}
            onChange={(e) => onAccentColorChange(e.target.value)}
            placeholder="#3b82f6"
            className="accent-color-hex"
          />
        </div>
        <div className="accent-presets">
          {ACCENT_PRESETS.map(({ name, value }) => (
            <button
              key={value}
              type="button"
              className="accent-preset-btn"
              style={{ background: value }}
              onClick={() => onAccentColorChange(value)}
              title={name}
              aria-label={name}
            />
          ))}
        </div>
      </label>

      <label>
        <span>API Base URL</span>
        <input
          type="url"
          value={apiBaseUrl}
          onChange={(e) => onApiBaseUrlChange(e.target.value)}
          placeholder="https://api.example.com"
        />
      </label>
      <p className="site-settings-hint">Product/Collection blocks fetch from this endpoint.</p>

      <label>
        <span>Tenant ID (cart API)</span>
        <input
          type="text"
          value={tenantId}
          onChange={(e) => onTenantIdChange(e.target.value)}
          placeholder="e.g. 86882b22-a67f-4f7f-b91f-0d3e725b25fd"
        />
      </label>
      <p className="site-settings-hint">Sent as <code>tenant_id</code> to cart and checkout endpoints when API URL is set.</p>

      <label>
        <span>Store ID (cart API)</span>
        <input
          type="text"
          value={storeId}
          onChange={(e) => onStoreIdChange(e.target.value)}
          placeholder="e.g. storefront-1"
        />
      </label>
      <p className="site-settings-hint">
        Sent as <code>store_id</code> to cart and checkout endpoints when API URL is set. Leave empty to use your home page slug.
      </p>

      <label className="site-settings-checkbox">
        <input
          type="checkbox"
          checked={useDemoData}
          onChange={(e) => onUseDemoDataChange(e.target.checked)}
        />
        <span>Use demo data</span>
      </label>
      <p className="site-settings-hint">When enabled, storefront uses built-in products/collections (no API needed).</p>

      <button type="button" className="btn btn-primary btn-block" onClick={onCreateDemoStore}>
        Create demo store
      </button>
      <p className="site-settings-hint">Creates an impressive demo store: Home, Products, About, with hero, promo banner, trust badges, testimonials, newsletter &amp; more.</p>
    </section>
  );
}
