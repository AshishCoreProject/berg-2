export const CUSTOMER_AUTH_STORAGE_KEY = 'berg_customer_auth';

export interface CustomerAuthSession {
  token?: string;
  refreshToken?: string;
  customerId?: string;
  name?: string;
  username?: string;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
  savedAt?: number;
  raw?: unknown;
}

interface RefreshParams {
  authApiBaseUrl?: string;
  storeId?: string;
  customerId?: string;
  refreshToken?: string;
}

function trimBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
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

function pickNumber(obj: Record<string, unknown> | null, keys: string[]): number | undefined {
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
}

function epochMaybeSeconds(value: number): number {
  // Convert seconds precision to epoch ms when needed.
  return value > 0 && value < 10_000_000_000 ? value * 1000 : value;
}

function decodeJwtExp(token?: string): number | undefined {
  if (!token) return undefined;
  const parts = token.split('.');
  if (parts.length < 2) return undefined;
  try {
    const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>;
    const exp = payload.exp;
    if (typeof exp === 'number' && Number.isFinite(exp) && exp > 0) {
      return epochMaybeSeconds(exp);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

const TOKEN_STRING_KEYS = [
  'token',
  'accessToken',
  'access_token',
  'jwt',
  'id_token',
  'bearerToken',
] as const;

export function extractSessionData(data: unknown): Partial<CustomerAuthSession> {
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
  const accessExpiryRaw =
    pickNumber(top, ['accessTokenExpiresAt', 'accessExpiresAt', 'expiresAt', 'exp']) ??
    pickNumber(inner, ['accessTokenExpiresAt', 'accessExpiresAt', 'expiresAt', 'exp']) ??
    pickNumber(asRecord(top?.tokens), ['accessTokenExpiresAt', 'expiresAt', 'exp']) ??
    pickNumber(asRecord(inner?.tokens), ['accessTokenExpiresAt', 'expiresAt', 'exp']);
  const refreshExpiryRaw =
    pickNumber(top, ['refreshTokenExpiresAt', 'refreshExpiresAt']) ??
    pickNumber(inner, ['refreshTokenExpiresAt', 'refreshExpiresAt']) ??
    pickNumber(asRecord(top?.tokens), ['refreshTokenExpiresAt', 'refreshExpiresAt']) ??
    pickNumber(asRecord(inner?.tokens), ['refreshTokenExpiresAt', 'refreshExpiresAt']);

  return {
    token,
    refreshToken,
    customerId:
      pickString(top, ['customerId', 'customer_id', 'userId', 'id']) ??
      pickString(inner, ['customerId', 'customer_id', 'userId', 'id']) ??
      pickString(sessionRec, ['customerId', 'customer_id', 'userId', 'id']) ??
      pickString(customer, ['id', 'customerId', 'customer_id']),
    name:
      pickString(top, ['name', 'fullName']) ??
      pickString(inner, ['name', 'fullName']) ??
      pickString(customer, ['name', 'fullName']),
    username:
      pickString(top, ['username', 'email']) ??
      pickString(inner, ['username', 'email']) ??
      pickString(customer, ['username', 'email']),
    accessTokenExpiresAt: accessExpiryRaw
      ? epochMaybeSeconds(accessExpiryRaw)
      : decodeJwtExp(token),
    refreshTokenExpiresAt: refreshExpiryRaw
      ? epochMaybeSeconds(refreshExpiryRaw)
      : undefined,
  };
}

export function isAccessTokenValid(
  session: CustomerAuthSession | null,
  bufferSeconds = 60,
): boolean {
  if (!session?.token?.trim()) return false;
  const expiresAt = session.accessTokenExpiresAt;
  // Opaque tokens or APIs without expiry: treat as valid until API returns 401.
  if (!expiresAt || !Number.isFinite(expiresAt)) return true;
  const bufferMs = Math.max(0, bufferSeconds) * 1000;
  return expiresAt - bufferMs > Date.now();
}

/** True if persisted session should be treated as logged-in (checkout + header). */
export function hasCustomerAuthSession(session: CustomerAuthSession | null): boolean {
  if (!session) return false;
  return Boolean(session.customerId?.trim() || session.token?.trim());
}

export function customerProfileFromSession(
  session: CustomerAuthSession | null,
): Pick<CustomerAuthSession, 'name' | 'username' | 'customerId'> | null {
  if (!hasCustomerAuthSession(session)) return null;
  return {
    name: session?.name,
    username: session?.username,
    customerId: session?.customerId,
  };
}

export function loadSession(): CustomerAuthSession | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomerAuthSession;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(next: Partial<CustomerAuthSession>): CustomerAuthSession {
  const existing = loadSession() ?? {};
  const patch = Object.fromEntries(
    Object.entries(next as Record<string, unknown>).filter(([, v]) => v !== undefined),
  ) as Partial<CustomerAuthSession>;
  const merged: CustomerAuthSession = {
    ...existing,
    ...patch,
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(CUSTOMER_AUTH_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore write failures (quota/private mode)
  }
  return merged;
}

export function clearSession(): void {
  try {
    localStorage.removeItem(CUSTOMER_AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function refreshSession({
  authApiBaseUrl,
  storeId,
  customerId,
  refreshToken,
}: RefreshParams): Promise<CustomerAuthSession | null> {
  const base = trimBaseUrl((authApiBaseUrl ?? '').trim());
  const sid = (storeId ?? '').trim();
  const cid = (customerId ?? '').trim();
  const rToken = (refreshToken ?? '').trim();
  if (!base || !sid || !cid || !rToken) return null;

  const res = await fetch(`${base}/api/customers/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storeId: sid,
      customerId: cid,
      refreshToken: rToken,
    }),
  });
  if (!res.ok) return null;

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  const extracted = extractSessionData(payload);
  const session = saveSession({
    ...extracted,
    raw: payload,
  });
  return session;
}
