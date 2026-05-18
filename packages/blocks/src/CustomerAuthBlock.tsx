import { useState, useMemo, type CSSProperties, type FormEvent } from 'react';
import type { AuthFormDefaults } from '@berg/core';

function trimBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

const TOKEN_STRING_KEYS = [
  'token',
  'accessToken',
  'access_token',
  'jwt',
  'id_token',
  'bearerToken',
] as const;

/** Some gateways return JSON as a string; unwrap a few times (no logging of content). */
function normalizeJsonPayload(data: unknown, maxWraps = 5): unknown {
  let cur: unknown = data;
  for (let i = 0; i < maxWraps && typeof cur === 'string'; i++) {
    const t = cur.trim();
    if (!t.startsWith('{') && !t.startsWith('[')) break;
    try {
      cur = JSON.parse(t) as unknown;
    } catch {
      break;
    }
  }
  return cur;
}

function looksLikeJwt(s: string): boolean {
  const t = s.trim();
  const parts = t.split('.');
  return parts.length === 3 && parts.every((p) => p.length >= 2);
}

/** Depth-first search for a JWT-shaped string (three dot-separated segments). */
function findJwtLikeStringInTree(
  node: unknown,
  depth: number,
  seen: WeakSet<object>,
): string | undefined {
  if (depth < 0 || node == null) return undefined;
  if (typeof node === 'string') {
    return looksLikeJwt(node) ? node.trim() : undefined;
  }
  if (typeof node !== 'object') return undefined;
  if (seen.has(node as object)) return undefined;
  seen.add(node as object);
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = findJwtLikeStringInTree(item, depth - 1, seen);
      if (hit) return hit;
    }
    return undefined;
  }
  for (const v of Object.values(node as Record<string, unknown>)) {
    const hit = findJwtLikeStringInTree(v, depth - 1, seen);
    if (hit) return hit;
  }
  return undefined;
}

/** Opaque tokens: string under keys whose names suggest an access/token field. */
function findTokenStringByLikelyKeys(
  node: unknown,
  depth: number,
  seen: WeakSet<object>,
): string | undefined {
  if (depth < 0 || node == null) return undefined;
  if (typeof node !== 'object') return undefined;
  if (seen.has(node as object)) return undefined;
  seen.add(node as object);
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = findTokenStringByLikelyKeys(item, depth - 1, seen);
      if (hit) return hit;
    }
    return undefined;
  }
  const rec = node as Record<string, unknown>;
  for (const [k, v] of Object.entries(rec)) {
    const kl = k.toLowerCase();
    const likely =
      kl.includes('access') ||
      kl.includes('token') ||
      kl === 'jwt' ||
      kl === 'bearer' ||
      kl.endsWith('_token');
    if (likely && typeof v === 'string') {
      const t = v.trim();
      if (t.length >= 12) return t;
    }
    const nested = findTokenStringByLikelyKeys(v, depth - 1, seen);
    if (nested) return nested;
  }
  return undefined;
}

function customerIdFromJwtAccessToken(jwt: string): string | undefined {
  const parts = jwt.trim().split('.');
  if (parts.length < 2) return undefined;
  try {
    const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>;
    for (const k of ['customerId', 'customer_id', 'sub', 'userId', 'id']) {
      const v = payload[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (typeof v === 'number' && Number.isFinite(v)) return String(Math.trunc(v));
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function extractToken(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const o = data as Record<string, unknown>;
  const layers: (Record<string, unknown> | null)[] = [
    asRecord(o),
    asRecord(o.data),
    asRecord(o.result),
    asRecord(o.auth),
    asRecord(o.session),
    asRecord(o.tokens),
    asRecord(asRecord(o.data)?.tokens),
    asRecord(asRecord(o.data)?.session),
    asRecord(asRecord(o.data)?.customer),
  ];
  for (const rec of layers) {
    const s = pickString(rec, [...TOKEN_STRING_KEYS]);
    if (s) return s;
  }
  return undefined;
}

async function parseErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return res.statusText || 'Request failed';
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    const msg = j.message ?? j.error ?? j.detail;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.map(String).join(', ');
  } catch {
    /* not JSON */
  }
  return text.slice(0, 500);
}

const STORAGE_KEY = 'berg_customer_auth';

/** Matches @ecommerce-store/cart-checkout-plugin guest cart localStorage key. */
function getCartGuestStorageKey(tenantSegment: string, storeSegment: string): string {
  const t = tenantSegment.trim() || 'default';
  const s = storeSegment.trim() || 'default';
  return `cart_guest_id:${t}:${s}`;
}
const SUBMIT_GRADIENT_PRESETS: Record<string, string> = {
  ocean: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
  sunset: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
  violet: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
  emerald: 'linear-gradient(135deg, #059669 0%, #22c55e 100%)',
  midnight: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
};

function normalizeLength(
  value: unknown,
  fallback: string,
): string {
  const raw = typeof value === 'number' ? `${value}px` : typeof value === 'string' ? value.trim() : '';
  return raw || fallback;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
}

function pickString(obj: Record<string, unknown> | null, keys: string[]): string | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function pickScalarId(obj: Record<string, unknown> | null, keys: string[]): string | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(Math.trunc(value));
  }
  return undefined;
}

function extractSessionFields(data: unknown): {
  token?: string;
  refreshToken?: string;
  customerId?: string;
  name?: string;
  username?: string;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
} {
  const top = asRecord(data);
  const inner = asRecord(top?.data);
  const customer = asRecord(inner?.customer) ?? asRecord(top?.customer);
  const sessionRec = asRecord(top?.session) ?? asRecord(inner?.session);
  const token =
    pickString(top, [...TOKEN_STRING_KEYS]) ??
    pickString(inner, [...TOKEN_STRING_KEYS]) ??
    pickString(sessionRec, [...TOKEN_STRING_KEYS]) ??
    pickString(asRecord(top?.tokens), [...TOKEN_STRING_KEYS]) ??
    pickString(asRecord(inner?.tokens), [...TOKEN_STRING_KEYS]) ??
    pickString(asRecord(top?.auth), [...TOKEN_STRING_KEYS]) ??
    pickString(asRecord(inner?.auth), [...TOKEN_STRING_KEYS]);
  const refreshToken =
    pickString(top, ['refreshToken', 'refresh_token']) ??
    pickString(inner, ['refreshToken', 'refresh_token']) ??
    pickString(sessionRec, ['refreshToken', 'refresh_token']) ??
    pickString(asRecord(top?.tokens), ['refreshToken', 'refresh_token']) ??
    pickString(asRecord(inner?.tokens), ['refreshToken', 'refresh_token']);
  const pickNumber = (obj: Record<string, unknown> | null, keys: string[]): number | undefined => {
    if (!obj) return undefined;
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return undefined;
  };
  const epochMaybeSeconds = (value: number): number =>
    value > 0 && value < 10_000_000_000 ? value * 1000 : value;
  const decodeJwtExp = (jwt?: string): number | undefined => {
    if (!jwt) return undefined;
    const parts = jwt.split('.');
    if (parts.length < 2) return undefined;
    try {
      const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>;
      return typeof payload.exp === 'number' && payload.exp > 0
        ? epochMaybeSeconds(payload.exp)
        : undefined;
    } catch {
      return undefined;
    }
  };
  const accessExpiresAtRaw =
    pickNumber(top, ['accessTokenExpiresAt', 'accessExpiresAt', 'expiresAt', 'exp']) ??
    pickNumber(inner, ['accessTokenExpiresAt', 'accessExpiresAt', 'expiresAt', 'exp']) ??
    pickNumber(asRecord(top?.tokens), ['accessTokenExpiresAt', 'expiresAt', 'exp']) ??
    pickNumber(asRecord(inner?.tokens), ['accessTokenExpiresAt', 'expiresAt', 'exp']);
  const refreshExpiresAtRaw =
    pickNumber(top, ['refreshTokenExpiresAt', 'refreshExpiresAt']) ??
    pickNumber(inner, ['refreshTokenExpiresAt', 'refreshExpiresAt']) ??
    pickNumber(asRecord(top?.tokens), ['refreshTokenExpiresAt', 'refreshExpiresAt']) ??
    pickNumber(asRecord(inner?.tokens), ['refreshTokenExpiresAt', 'refreshExpiresAt']);

  return {
    token,
    refreshToken,
    customerId:
      pickScalarId(top, ['customerId', 'customer_id', 'userId', 'id']) ??
      pickScalarId(inner, ['customerId', 'customer_id', 'userId', 'id']) ??
      pickScalarId(sessionRec, ['customerId', 'customer_id', 'userId', 'id']) ??
      pickScalarId(customer, ['id', 'customerId', 'customer_id']),
    name:
      pickString(top, ['name', 'fullName']) ??
      pickString(inner, ['name', 'fullName']) ??
      pickString(customer, ['name', 'fullName']),
    username:
      pickString(top, ['username', 'email']) ??
      pickString(inner, ['username', 'email']) ??
      pickString(customer, ['username', 'email']),
    accessTokenExpiresAt: accessExpiresAtRaw
      ? epochMaybeSeconds(accessExpiresAtRaw)
      : decodeJwtExp(token),
    refreshTokenExpiresAt: refreshExpiresAtRaw
      ? epochMaybeSeconds(refreshExpiresAtRaw)
      : undefined,
  };
}

export interface CustomerAuthBlockProps {
  attrs: Record<string, unknown>;
  authApiBaseUrl?: string;
  authFormDefaults?: AuthFormDefaults;
  /** Store id sent in login/register JSON body. */
  storeId?: string;
  /** Fallback tenant segment for guest cart key when cartGuestStorageTenantId is omitted. */
  tenantId?: string;
  /**
   * Tenant segment for reading cart guest id from localStorage (should match CartProvider).
   */
  cartGuestStorageTenantId?: string;
  /**
   * Store segment for reading cart guest id from localStorage (should match CartProvider storeId).
   */
  cartGuestStorageStoreId?: string;
  onNavigate?: (path: string) => void;
  isBuilderPreview?: boolean;
  /**
   * When true (storefront with API cart + non-empty guest cart), login requires a guest id in
   * localStorage; otherwise the form shows an error and does not call the auth API.
   */
  requireGuestCartIdForLogin?: boolean;
}

export function CustomerAuthBlock({
  attrs,
  authApiBaseUrl,
  authFormDefaults,
  storeId,
  tenantId,
  cartGuestStorageTenantId,
  cartGuestStorageStoreId,
  onNavigate,
  isBuilderPreview,
  requireGuestCartIdForLogin = false,
}: CustomerAuthBlockProps) {
  const mode = attrs.mode === 'register' ? 'register' : 'login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const d = authFormDefaults ?? {};
  const emailLabel = (attrs.emailLabel as string)?.trim() || d.emailLabel || 'Email';
  const emailPh = (attrs.emailPlaceholder as string)?.trim() || d.emailPlaceholder || 'you@example.com';
  const passwordLabel = (attrs.passwordLabel as string)?.trim() || d.passwordLabel || 'Password';
  const passwordPh = (attrs.passwordPlaceholder as string)?.trim() || d.passwordPlaceholder || '••••••••';
  const submitText =
    (attrs.submitText as string)?.trim() ||
    (mode === 'register'
      ? d.registerSubmitText || 'Create account'
      : d.loginSubmitText || 'Sign in');

  const alternatePrompt =
    (attrs.alternatePrompt as string)?.trim() ||
    (mode === 'login' ? "Don't have an account?" : 'Already have an account?');
  const alternateLinkText =
    (attrs.alternateLinkText as string)?.trim() ||
    (mode === 'login' ? 'Create account' : 'Sign in');
  const alternatePath = ((attrs.alternatePath as string)?.trim() || (mode === 'login' ? '/register' : '/login')).trim();

  const successRedirect =
    (attrs.successRedirect as string)?.trim() || (mode === 'register' ? '/login' : '/');

  const textAlignRaw = attrs.textAlign as string | undefined;
  const verticalAlignRaw = attrs.verticalAlign as string | undefined;
  const normalizedTextAlign =
    textAlignRaw === 'center' || textAlignRaw === 'right' || textAlignRaw === 'left'
      ? textAlignRaw
      : 'left';
  const normalizedVerticalAlign =
    verticalAlignRaw === 'top' || verticalAlignRaw === 'center' || verticalAlignRaw === 'bottom'
      ? verticalAlignRaw
      : 'center';
  const shellAlignItems: CSSProperties['alignItems'] =
    normalizedVerticalAlign === 'top'
      ? 'flex-start'
      : normalizedVerticalAlign === 'bottom'
        ? 'flex-end'
        : 'center';
  const submitFull = attrs.submitButtonWidth === 'full';
  const submitAlignSelf: CSSProperties['alignSelf'] =
    normalizedTextAlign === 'center' ? 'center' : normalizedTextAlign === 'right' ? 'flex-end' : 'flex-start';
  const formMinHeight = normalizeLength(attrs.formMinHeight, '440px');
  const formPadding = normalizeLength(attrs.formPadding, '28px');
  const formGap = normalizeLength(attrs.formGap, '16px');
  const fieldGap = normalizeLength(attrs.fieldGap, '10px');
  const labelInputGap = normalizeLength(attrs.labelInputGap, '8px');
  const inputMinHeight = normalizeLength(attrs.inputMinHeight, '44px');
  const inputPaddingY = normalizeLength(attrs.inputPaddingY, '10px');
  const submitButtonGradientKey = (attrs.submitButtonGradient as string | undefined)?.trim() ?? '';
  const submitButtonTextColor = (attrs.submitButtonTextColor as string | undefined)?.trim() ?? '';
  const submitBackground = submitButtonGradientKey ? SUBMIT_GRADIENT_PRESETS[submitButtonGradientKey] : undefined;

  const shellStyle: CSSProperties = {
    display: 'flex',
    width: '100%',
    minHeight: '100%',
    alignItems: shellAlignItems,
    justifyContent: 'center',
  };
  const formStyle: CSSProperties = {
    textAlign: normalizedTextAlign,
    minHeight: formMinHeight,
    padding: formPadding,
    gap: formGap,
  };
  const fieldStyle: CSSProperties = { gap: labelInputGap };
  const inputStyle: CSSProperties = {
    minHeight: inputMinHeight,
    paddingTop: inputPaddingY,
    paddingBottom: inputPaddingY,
  };
  const submitStyle: CSSProperties = {
    ...(submitFull ? { width: '100%', boxSizing: 'border-box' } : { alignSelf: submitAlignSelf }),
    ...(submitBackground ? { background: submitBackground } : {}),
    ...(submitButtonTextColor ? { color: submitButtonTextColor } : {}),
  };

  const endpoint = useMemo(() => {
    const envBase =
      typeof import.meta !== 'undefined'
        ? String((import.meta as { env?: { VITE_AUTH_API_BASE_URL?: string } }).env?.VITE_AUTH_API_BASE_URL ?? '').trim()
        : '';
    const base = trimBaseUrl((authApiBaseUrl ?? '').trim() || envBase);
    if (!base) return '';
    const path = mode === 'register' ? '/api/customers/auth/register' : '/api/customers/auth/login';
    return `${base}${path}`;
  }, [authApiBaseUrl, mode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isBuilderPreview) return;

    const sid = (storeId ?? '').trim();
    if (!sid) {
      setError('Store ID is not configured. Set it in the builder under Website settings.');
      return;
    }
    if (!endpoint) {
      setError('Auth API URL is not configured. Set Customer auth base URL in the builder or VITE_AUTH_API_BASE_URL.');
      return;
    }

    let guestId: string | undefined;
    if (typeof window !== 'undefined') {
      const tenantSeg =
        (cartGuestStorageTenantId ?? tenantId ?? '').trim() || 'default';
      const storeSeg = (cartGuestStorageStoreId ?? sid).trim() || 'default';
      const raw = window.localStorage.getItem(
        getCartGuestStorageKey(tenantSeg, storeSeg),
      );
      const trimmed = raw?.trim();
      if (trimmed) guestId = trimmed;
    }

    if (
      mode === 'login' &&
      requireGuestCartIdForLogin &&
      !guestId
    ) {
      setError(
        'Your cart session is out of sync. Refresh the page, or clear your cart, then try signing in again.',
      );
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        storeId: sid,
        email: email.trim(),
        password,
      };
      if (guestId) payload.guestId = guestId;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(await parseErrorMessage(res));
        return;
      }
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      data = normalizeJsonPayload(data);
      const sessionFields = extractSessionFields(data);
      const token =
        sessionFields.token ??
        extractToken(data) ??
        findJwtLikeStringInTree(data, 10, new WeakSet()) ??
        findTokenStringByLikelyKeys(data, 10, new WeakSet());
      const resolvedCustomerId =
        sessionFields.customerId ?? (token ? customerIdFromJwtAccessToken(token) : undefined);
      if (token && mode !== 'register') {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              token,
              refreshToken: sessionFields.refreshToken,
              customerId: resolvedCustomerId,
              name: sessionFields.name,
              username: sessionFields.username,
              accessTokenExpiresAt: sessionFields.accessTokenExpiresAt,
              refreshTokenExpiresAt: sessionFields.refreshTokenExpiresAt,
              savedAt: Date.now(),
              raw: data,
            }),
          );
          try {
            window.sessionStorage.setItem('berg:show-account-modal', '1');
          } catch {
            /* private mode */
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('customer-auth-session-changed'));
          }
        } catch {
          /* ignore quota */
        }
      }
      onNavigate?.(successRedirect.startsWith('/') ? successRedirect : `/${successRedirect}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="block block-customer-auth">
      <div className="customer-auth-shell" style={shellStyle}>
        <form className="customer-auth-form" style={formStyle} onSubmit={handleSubmit}>
          {isBuilderPreview && (
            <p className="customer-auth-preview-hint">Preview only — submit is disabled in the builder.</p>
          )}
          <div className="customer-auth-field" style={{ ...fieldStyle, marginBottom: fieldGap }}>
            <label className="customer-auth-label" htmlFor={`customer-auth-email-${mode}`}>
              {emailLabel}
            </label>
            <input
              id={`customer-auth-email-${mode}`}
              type="email"
              autoComplete="email"
              className="customer-auth-input"
              style={inputStyle}
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder={emailPh}
              required
              disabled={loading || !!isBuilderPreview}
            />
          </div>
          <div className="customer-auth-field" style={fieldStyle}>
            <label className="customer-auth-label" htmlFor={`customer-auth-password-${mode}`}>
              {passwordLabel}
            </label>
            <input
              id={`customer-auth-password-${mode}`}
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              className="customer-auth-input"
              style={inputStyle}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              placeholder={passwordPh}
              required
              disabled={loading || !!isBuilderPreview}
            />
          </div>
          {error && <p className="customer-auth-error" role="alert">{error}</p>}
          <button
            type="submit"
            className="button-link customer-auth-submit"
            style={submitStyle}
            disabled={loading || !!isBuilderPreview}
          >
            {loading ? '…' : submitText}
          </button>
          {alternatePath && alternateLinkText && (
            <p className="customer-auth-alternate">
              {alternatePrompt}{' '}
              <a
                href={alternatePath}
                className="customer-auth-alternate-link"
                onClick={(ev) => {
                  if (!onNavigate) return;
                  ev.preventDefault();
                  const path = alternatePath.startsWith('/') ? alternatePath : `/${alternatePath}`;
                  onNavigate(path);
                }}
              >
                {alternateLinkText}
              </a>
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
