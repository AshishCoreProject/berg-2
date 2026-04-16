import { useState, useMemo, type CSSProperties, type FormEvent } from 'react';
import type { AuthFormDefaults } from '@berg/core';

function trimBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function extractToken(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const o = data as Record<string, unknown>;
  if (typeof o.token === 'string') return o.token;
  if (typeof o.accessToken === 'string') return o.accessToken;
  const inner = o.data;
  if (inner && typeof inner === 'object') {
    const d = inner as Record<string, unknown>;
    if (typeof d.token === 'string') return d.token;
    if (typeof d.accessToken === 'string') return d.accessToken;
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
  const token = pickString(top, ['token', 'accessToken']) ?? pickString(inner, ['token', 'accessToken']);
  const refreshToken =
    pickString(top, ['refreshToken']) ??
    pickString(inner, ['refreshToken']) ??
    pickString(asRecord(top?.tokens), ['refreshToken']) ??
    pickString(asRecord(inner?.tokens), ['refreshToken']);
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
      pickString(top, ['customerId', 'userId', 'id']) ??
      pickString(inner, ['customerId', 'userId', 'id']) ??
      pickString(customer, ['id', 'customerId']),
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
  storeId?: string;
  onNavigate?: (path: string) => void;
  isBuilderPreview?: boolean;
}

export function CustomerAuthBlock({
  attrs,
  authApiBaseUrl,
  authFormDefaults,
  storeId,
  onNavigate,
  isBuilderPreview,
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

    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: sid, email: email.trim(), password }),
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
      const sessionFields = extractSessionFields(data);
      const token = sessionFields.token ?? extractToken(data);
      if (token) {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              token,
              refreshToken: sessionFields.refreshToken,
              customerId: sessionFields.customerId,
              name: sessionFields.name,
              username: sessionFields.username,
              accessTokenExpiresAt: sessionFields.accessTokenExpiresAt,
              refreshTokenExpiresAt: sessionFields.refreshTokenExpiresAt,
              savedAt: Date.now(),
              raw: data,
            }),
          );
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
