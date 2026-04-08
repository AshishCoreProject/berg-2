/**
 * Reusable style controls for Header, Footer, or Button.
 * Used in SiteSettings for full customization of header, footer, and default button.
 */
export interface StyleValues {
  backgroundColor?: string;
  color?: string;
  fontFamily?: string;
  linkColor?: string;
  footerLinksColor?: string;
  logoUrl?: string;
  showTitle?: boolean;
  titlePosition?: "right" | "below" | "above";
  logoTextGap?: string;
  logoWidthPx?: number;
  logoHeightPx?: number;
  showCartIcon?: boolean;
  cartIconColor?: string;
  borderRadius?: string;
  padding?: string;
  boxShadow?: string;
  border?: string;
}

interface Props {
  title: string;
  values: StyleValues;
  onChange: (next: StyleValues) => void;
  variant: "header" | "footer" | "button" | "box";
}

const FONT_OPTIONS = [
  { value: "", label: "Default" },
  { value: 'Georgia, "Times New Roman", serif', label: "Serif" },
  { value: "system-ui, -apple-system, sans-serif", label: "Sans" },
  { value: '"Segoe UI", system-ui, sans-serif', label: "Segoe UI" },
  { value: "monospace", label: "Monospace" },
];

function isLogoDataUrl(url: string | undefined): boolean {
  return Boolean(url?.startsWith("data:"));
}

export function StyleEditor({ title, values, onChange, variant }: Props) {
  const set = (key: keyof StyleValues, value: string | undefined) => {
    onChange({ ...values, [key]: value || undefined });
  };

  const setBoolean = (key: keyof StyleValues, value: boolean) => {
    onChange({ ...values, [key]: value });
  };

  const setNumber = (key: keyof StyleValues, value: number | undefined) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="style-editor">
      <h4 className="style-editor-title">{title}</h4>
      <label className="style-editor-row">
        <span>Background</span>
        <div className="style-editor-color">
          <input
            type="color"
            value={values.backgroundColor || "#1a1a1a"}
            onChange={(e) => set("backgroundColor", e.target.value)}
            title="Background color"
          />
          <input
            type="text"
            value={values.backgroundColor ?? ""}
            onChange={(e) =>
              set("backgroundColor", e.target.value.trim() || undefined)
            }
            placeholder="#1a1a1a"
            className="style-hex"
          />
        </div>
      </label>

      {variant !== "box" && (
        <>
          <label className="style-editor-row">
            <span>Brand Color</span>
            <div className="style-editor-color">
              <input
                type="color"
                value={values.color || "#ffffff"}
                onChange={(e) => set("color", e.target.value)}
                title="Text color"
              />
              <input
                type="text"
                value={values.color ?? ""}
                onChange={(e) => set("color", e.target.value.trim() || undefined)}
                placeholder="#ffffff"
                className="style-hex"
              />
            </div>
          </label>
          <label className="style-editor-row">
            <span>Font</span>
            <select
              value={values.fontFamily ?? ""}
              onChange={(e) => set("fontFamily", e.target.value || undefined)}
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value || "default"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {variant !== "button" && (
            <label className="style-editor-row">
              <span>{variant === "footer" ? "Link color (fallback)" : "Link color"}</span>
              <div className="style-editor-color">
                <input
                  type="color"
                  value={values.linkColor || "#94a3b8"}
                  onChange={(e) => set("linkColor", e.target.value)}
                  title="Link color"
                />
                <input
                  type="text"
                  value={values.linkColor ?? ""}
                  onChange={(e) =>
                    set("linkColor", e.target.value.trim() || undefined)
                  }
                  placeholder="#94a3b8"
                  className="style-hex"
                />
              </div>
            </label>
          )}
          {variant === "footer" && (
            <label className="style-editor-row">
              <span>Footer links color</span>
              <div className="style-editor-color">
                <input
                  type="color"
                  value={values.footerLinksColor || "#94a3b8"}
                  onChange={(e) => set("footerLinksColor", e.target.value)}
                  title="Footer links color"
                />
                <input
                  type="text"
                  value={values.footerLinksColor ?? ""}
                  onChange={(e) =>
                    set("footerLinksColor", e.target.value.trim() || undefined)
                  }
                  placeholder="#94a3b8"
                  className="style-hex"
                />
              </div>
            </label>
          )}
        </>
      )}

      {variant === "header" && (
        <>
          <label className="style-editor-row">
            <span>Logo image</span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.75rem",
                color: "var(--muted)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
                <polyline points="7 9 12 4 17 9" />
                <line x1="12" y1="4" x2="12" y2="16" />
              </svg>
              <span>Upload logo from your computer</span>
            </div>
            <label className="file-upload">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") {
                      set("logoUrl", reader.result);
                    }
                  };
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
              <span>Upload Logo</span>
            </label>
          </label>
          {isLogoDataUrl(values.logoUrl) && (
            <div
              className="style-editor-row"
              style={{ alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}
            >
              <img
                src={values.logoUrl}
                alt=""
                style={{
                  maxHeight: 40,
                  maxWidth: 120,
                  width: "auto",
                  objectFit: "contain",
                  borderRadius: 4,
                  border: "1px solid var(--border, #e2e8f0)",
                }}
              />
              <button
                type="button"
                onClick={() => set("logoUrl", undefined)}
                aria-label="Remove uploaded logo"
                style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem" }}
              >
                Remove
              </button>
            </div>
          )}
          <label className="style-editor-row" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
              {isLogoDataUrl(values.logoUrl)
                ? "Or paste an image URL (replaces upload)"
                : "Image URL"}
            </span>
            <input
              type="url"
              value={
                isLogoDataUrl(values.logoUrl) ? "" : (values.logoUrl ?? "")
              }
              onChange={(e) =>
                set("logoUrl", e.target.value.trim() || undefined)
              }
              placeholder="https://example.com/logo.png"
            />
          </label>
          <label className="style-editor-row">
            <span>Show site name</span>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="checkbox"
                checked={values.showTitle !== false}
                onChange={(e) => setBoolean("showTitle", e.target.checked)}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                Toggle site name text
              </span>
            </div>
          </label>
          <label className="style-editor-row">
            <span>Site name position</span>
            <select
              value={values.titlePosition ?? "right"}
              onChange={(e) =>
                set(
                  "titlePosition",
                  (e.target.value || "right") as StyleValues["titlePosition"],
                )
              }
              disabled={!values.logoUrl || values.showTitle === false}
            >
              <option value="right">Right of logo</option>
              <option value="below">Below logo</option>
              <option value="above">Above logo</option>
            </select>
          </label>
          <label className="style-editor-row">
            <span>Logo/name gap</span>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
            >
              <button
                type="button"
                onClick={() => {
                  if (!values.logoUrl || values.showTitle === false) return;
                  const raw = values.logoTextGap || "8px";
                  const match = raw.match(/^(\d+(?:\.\d+)?)([a-z%]*)$/i);
                  const current = match ? parseFloat(match[1]) : 8;
                  const unit = match && match[2] ? match[2] : "px";
                  const next = Math.max(0, current - 2);
                  set("logoTextGap", `${next}${unit}`);
                }}
                style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}
                disabled={!values.logoUrl || values.showTitle === false}
              >
                –
              </button>
              <input
                type="text"
                value={values.logoTextGap ?? ""}
                onChange={(e) =>
                  set("logoTextGap", e.target.value.trim() || undefined)
                }
                placeholder="8px"
                disabled={!values.logoUrl || values.showTitle === false}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!values.logoUrl || values.showTitle === false) return;
                  const raw = values.logoTextGap || "8px";
                  const match = raw.match(/^(\d+(?:\.\d+)?)([a-z%]*)$/i);
                  const current = match ? parseFloat(match[1]) : 8;
                  const unit = match && match[2] ? match[2] : "px";
                  const next = current + 2;
                  set("logoTextGap", `${next}${unit}`);
                }}
                style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}
                disabled={!values.logoUrl || values.showTitle === false}
              >
                +
              </button>
            </div>
          </label>
          <label className="style-editor-row">
            <span>Logo width (px)</span>
            <input
              type="number"
              min={1}
              value={values.logoWidthPx ?? ""}
              onChange={(e) => {
                const next = e.target.value.trim();
                setNumber("logoWidthPx", next ? Number(next) : undefined);
              }}
              placeholder="120"
            />
          </label>
          <label className="style-editor-row">
            <span>Logo height (px)</span>
            <input
              type="number"
              min={1}
              value={values.logoHeightPx ?? ""}
              onChange={(e) => {
                const next = e.target.value.trim();
                setNumber("logoHeightPx", next ? Number(next) : undefined);
              }}
              placeholder="32"
            />
          </label>
          <label className="style-editor-row">
            <span>Show cart icon</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={values.showCartIcon !== false}
                onChange={(e) => setBoolean("showCartIcon", e.target.checked)}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                Cart link in header (opens /cart)
              </span>
            </div>
          </label>
          <label className="style-editor-row">
            <span>Cart icon color</span>
            <div className="style-editor-color">
              <input
                type="color"
                value={values.cartIconColor || values.linkColor || "#94a3b8"}
                onChange={(e) => set("cartIconColor", e.target.value)}
                title="Cart icon color"
              />
              <input
                type="text"
                value={values.cartIconColor ?? ""}
                onChange={(e) =>
                  set("cartIconColor", e.target.value.trim() || undefined)
                }
                placeholder={values.linkColor || "uses link color"}
                className="style-hex"
              />
            </div>
          </label>
        </>
      )}
      {variant === "button" && (
        <>
          <label className="style-editor-row">
            <span>Border radius</span>
            <input
              type="text"
              value={values.borderRadius ?? ""}
              onChange={(e) =>
                set("borderRadius", e.target.value.trim() || undefined)
              }
              placeholder="8px"
            />
          </label>
          <label className="style-editor-row">
            <span>Padding</span>
            <input
              type="text"
              value={values.padding ?? ""}
              onChange={(e) =>
                set("padding", e.target.value.trim() || undefined)
              }
              placeholder="0.5rem 1rem"
            />
          </label>
        </>
      )}

      {variant === "box" && (
        <>
          <label className="style-editor-row">
            <span>Border</span>
            <input
              type="text"
              value={values.border ?? ""}
              onChange={(e) => set("border", e.target.value.trim() || undefined)}
              placeholder="1px solid #e2e8f0"
            />
          </label>
          <label className="style-editor-row">
            <span>Shadow</span>
            <input
              type="text"
              value={values.boxShadow ?? ""}
              onChange={(e) => set("boxShadow", e.target.value.trim() || undefined)}
              placeholder="0 8px 24px rgba(0,0,0,.12)"
            />
          </label>
          <label className="style-editor-row">
            <span>Border radius</span>
            <input
              type="text"
              value={values.borderRadius ?? ""}
              onChange={(e) =>
                set("borderRadius", e.target.value.trim() || undefined)
              }
              placeholder="12px"
            />
          </label>
          <label className="style-editor-row">
            <span>Padding</span>
            <input
              type="text"
              value={values.padding ?? ""}
              onChange={(e) => set("padding", e.target.value.trim() || undefined)}
              placeholder="24px"
            />
          </label>
        </>
      )}
    </div>
  );
}
