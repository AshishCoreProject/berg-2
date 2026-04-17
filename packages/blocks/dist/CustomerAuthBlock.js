import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
function trimBaseUrl(url) {
    return url.replace(/\/+$/, '');
}
function extractToken(data) {
    if (!data || typeof data !== 'object')
        return undefined;
    const o = data;
    if (typeof o.token === 'string')
        return o.token;
    if (typeof o.accessToken === 'string')
        return o.accessToken;
    const inner = o.data;
    if (inner && typeof inner === 'object') {
        const d = inner;
        if (typeof d.token === 'string')
            return d.token;
        if (typeof d.accessToken === 'string')
            return d.accessToken;
    }
    return undefined;
}
async function parseErrorMessage(res) {
    const text = await res.text();
    if (!text)
        return res.statusText || 'Request failed';
    try {
        const j = JSON.parse(text);
        const msg = j.message ?? j.error ?? j.detail;
        if (typeof msg === 'string')
            return msg;
        if (Array.isArray(msg))
            return msg.map(String).join(', ');
    }
    catch {
        /* not JSON */
    }
    return text.slice(0, 500);
}
const STORAGE_KEY = 'berg_customer_auth';
const SUBMIT_GRADIENT_PRESETS = {
    ocean: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
    sunset: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    violet: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
    emerald: 'linear-gradient(135deg, #059669 0%, #22c55e 100%)',
    midnight: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
};
function normalizeLength(value, fallback) {
    const raw = typeof value === 'number' ? `${value}px` : typeof value === 'string' ? value.trim() : '';
    return raw || fallback;
}
function asRecord(v) {
    return v && typeof v === 'object' ? v : null;
}
function pickString(obj, keys) {
    if (!obj)
        return undefined;
    for (const key of keys) {
        const value = obj[key];
        if (typeof value === 'string' && value.trim())
            return value.trim();
    }
    return undefined;
}
function extractSessionFields(data) {
    const top = asRecord(data);
    const inner = asRecord(top?.data);
    const customer = asRecord(inner?.customer) ?? asRecord(top?.customer);
    const token = pickString(top, ['token', 'accessToken']) ?? pickString(inner, ['token', 'accessToken']);
    const refreshToken = pickString(top, ['refreshToken']) ??
        pickString(inner, ['refreshToken']) ??
        pickString(asRecord(top?.tokens), ['refreshToken']) ??
        pickString(asRecord(inner?.tokens), ['refreshToken']);
    const pickNumber = (obj, keys) => {
        if (!obj)
            return undefined;
        for (const key of keys) {
            const value = obj[key];
            if (typeof value === 'number' && Number.isFinite(value))
                return value;
            if (typeof value === 'string' && value.trim()) {
                const parsed = Number(value);
                if (Number.isFinite(parsed))
                    return parsed;
            }
        }
        return undefined;
    };
    const epochMaybeSeconds = (value) => value > 0 && value < 10_000_000_000 ? value * 1000 : value;
    const decodeJwtExp = (jwt) => {
        if (!jwt)
            return undefined;
        const parts = jwt.split('.');
        if (parts.length < 2)
            return undefined;
        try {
            const payload = JSON.parse(atob(parts[1]));
            return typeof payload.exp === 'number' && payload.exp > 0
                ? epochMaybeSeconds(payload.exp)
                : undefined;
        }
        catch {
            return undefined;
        }
    };
    const accessExpiresAtRaw = pickNumber(top, ['accessTokenExpiresAt', 'accessExpiresAt', 'expiresAt', 'exp']) ??
        pickNumber(inner, ['accessTokenExpiresAt', 'accessExpiresAt', 'expiresAt', 'exp']) ??
        pickNumber(asRecord(top?.tokens), ['accessTokenExpiresAt', 'expiresAt', 'exp']) ??
        pickNumber(asRecord(inner?.tokens), ['accessTokenExpiresAt', 'expiresAt', 'exp']);
    const refreshExpiresAtRaw = pickNumber(top, ['refreshTokenExpiresAt', 'refreshExpiresAt']) ??
        pickNumber(inner, ['refreshTokenExpiresAt', 'refreshExpiresAt']) ??
        pickNumber(asRecord(top?.tokens), ['refreshTokenExpiresAt', 'refreshExpiresAt']) ??
        pickNumber(asRecord(inner?.tokens), ['refreshTokenExpiresAt', 'refreshExpiresAt']);
    return {
        token,
        refreshToken,
        customerId: pickString(top, ['customerId', 'userId', 'id']) ??
            pickString(inner, ['customerId', 'userId', 'id']) ??
            pickString(customer, ['id', 'customerId']),
        name: pickString(top, ['name', 'fullName']) ??
            pickString(inner, ['name', 'fullName']) ??
            pickString(customer, ['name', 'fullName']),
        username: pickString(top, ['username', 'email']) ??
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
export function CustomerAuthBlock({ attrs, authApiBaseUrl, authFormDefaults, storeId, onNavigate, isBuilderPreview, }) {
    const mode = attrs.mode === 'register' ? 'register' : 'login';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const d = authFormDefaults ?? {};
    const emailLabel = attrs.emailLabel?.trim() || d.emailLabel || 'Email';
    const emailPh = attrs.emailPlaceholder?.trim() || d.emailPlaceholder || 'you@example.com';
    const passwordLabel = attrs.passwordLabel?.trim() || d.passwordLabel || 'Password';
    const passwordPh = attrs.passwordPlaceholder?.trim() || d.passwordPlaceholder || '••••••••';
    const submitText = attrs.submitText?.trim() ||
        (mode === 'register'
            ? d.registerSubmitText || 'Create account'
            : d.loginSubmitText || 'Sign in');
    const alternatePrompt = attrs.alternatePrompt?.trim() ||
        (mode === 'login' ? "Don't have an account?" : 'Already have an account?');
    const alternateLinkText = attrs.alternateLinkText?.trim() ||
        (mode === 'login' ? 'Create account' : 'Sign in');
    const alternatePath = (attrs.alternatePath?.trim() || (mode === 'login' ? '/register' : '/login')).trim();
    const successRedirect = attrs.successRedirect?.trim() || (mode === 'register' ? '/login' : '/');
    const textAlignRaw = attrs.textAlign;
    const verticalAlignRaw = attrs.verticalAlign;
    const normalizedTextAlign = textAlignRaw === 'center' || textAlignRaw === 'right' || textAlignRaw === 'left'
        ? textAlignRaw
        : 'left';
    const normalizedVerticalAlign = verticalAlignRaw === 'top' || verticalAlignRaw === 'center' || verticalAlignRaw === 'bottom'
        ? verticalAlignRaw
        : 'center';
    const shellAlignItems = normalizedVerticalAlign === 'top'
        ? 'flex-start'
        : normalizedVerticalAlign === 'bottom'
            ? 'flex-end'
            : 'center';
    const submitFull = attrs.submitButtonWidth === 'full';
    const submitAlignSelf = normalizedTextAlign === 'center' ? 'center' : normalizedTextAlign === 'right' ? 'flex-end' : 'flex-start';
    const formMinHeight = normalizeLength(attrs.formMinHeight, '440px');
    const formPadding = normalizeLength(attrs.formPadding, '28px');
    const formGap = normalizeLength(attrs.formGap, '16px');
    const fieldGap = normalizeLength(attrs.fieldGap, '10px');
    const labelInputGap = normalizeLength(attrs.labelInputGap, '8px');
    const inputMinHeight = normalizeLength(attrs.inputMinHeight, '44px');
    const inputPaddingY = normalizeLength(attrs.inputPaddingY, '10px');
    const submitButtonGradientKey = attrs.submitButtonGradient?.trim() ?? '';
    const submitButtonTextColor = attrs.submitButtonTextColor?.trim() ?? '';
    const submitBackground = submitButtonGradientKey ? SUBMIT_GRADIENT_PRESETS[submitButtonGradientKey] : undefined;
    const shellStyle = {
        display: 'flex',
        width: '100%',
        minHeight: '100%',
        alignItems: shellAlignItems,
        justifyContent: 'center',
    };
    const formStyle = {
        textAlign: normalizedTextAlign,
        minHeight: formMinHeight,
        padding: formPadding,
        gap: formGap,
    };
    const fieldStyle = { gap: labelInputGap };
    const inputStyle = {
        minHeight: inputMinHeight,
        paddingTop: inputPaddingY,
        paddingBottom: inputPaddingY,
    };
    const submitStyle = {
        ...(submitFull ? { width: '100%', boxSizing: 'border-box' } : { alignSelf: submitAlignSelf }),
        ...(submitBackground ? { background: submitBackground } : {}),
        ...(submitButtonTextColor ? { color: submitButtonTextColor } : {}),
    };
    const endpoint = useMemo(() => {
        const envBase = typeof import.meta !== 'undefined'
            ? String(import.meta.env?.VITE_AUTH_API_BASE_URL ?? '').trim()
            : '';
        const base = trimBaseUrl((authApiBaseUrl ?? '').trim() || envBase);
        if (!base)
            return '';
        const path = mode === 'register' ? '/api/customers/auth/register' : '/api/customers/auth/login';
        return `${base}${path}`;
    }, [authApiBaseUrl, mode]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (isBuilderPreview)
            return;
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
            let data = null;
            try {
                data = await res.json();
            }
            catch {
                data = null;
            }
            const sessionFields = extractSessionFields(data);
            const token = sessionFields.token ?? extractToken(data);
            if (token) {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        token,
                        refreshToken: sessionFields.refreshToken,
                        customerId: sessionFields.customerId,
                        name: sessionFields.name,
                        username: sessionFields.username,
                        accessTokenExpiresAt: sessionFields.accessTokenExpiresAt,
                        refreshTokenExpiresAt: sessionFields.refreshTokenExpiresAt,
                        savedAt: Date.now(),
                        raw: data,
                    }));
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('customer-auth-session-changed'));
                    }
                }
                catch {
                    /* ignore quota */
                }
            }
            onNavigate?.(successRedirect.startsWith('/') ? successRedirect : `/${successRedirect}`);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("section", { className: "block block-customer-auth", children: _jsx("div", { className: "customer-auth-shell", style: shellStyle, children: _jsxs("form", { className: "customer-auth-form", style: formStyle, onSubmit: handleSubmit, children: [isBuilderPreview && (_jsx("p", { className: "customer-auth-preview-hint", children: "Preview only \u2014 submit is disabled in the builder." })), _jsxs("div", { className: "customer-auth-field", style: { ...fieldStyle, marginBottom: fieldGap }, children: [_jsx("label", { className: "customer-auth-label", htmlFor: `customer-auth-email-${mode}`, children: emailLabel }), _jsx("input", { id: `customer-auth-email-${mode}`, type: "email", autoComplete: "email", className: "customer-auth-input", style: inputStyle, value: email, onChange: (ev) => setEmail(ev.target.value), placeholder: emailPh, required: true, disabled: loading || !!isBuilderPreview })] }), _jsxs("div", { className: "customer-auth-field", style: fieldStyle, children: [_jsx("label", { className: "customer-auth-label", htmlFor: `customer-auth-password-${mode}`, children: passwordLabel }), _jsx("input", { id: `customer-auth-password-${mode}`, type: "password", autoComplete: mode === 'register' ? 'new-password' : 'current-password', className: "customer-auth-input", style: inputStyle, value: password, onChange: (ev) => setPassword(ev.target.value), placeholder: passwordPh, required: true, disabled: loading || !!isBuilderPreview })] }), error && _jsx("p", { className: "customer-auth-error", role: "alert", children: error }), _jsx("button", { type: "submit", className: "button-link customer-auth-submit", style: submitStyle, disabled: loading || !!isBuilderPreview, children: loading ? '…' : submitText }), alternatePath && alternateLinkText && (_jsxs("p", { className: "customer-auth-alternate", children: [alternatePrompt, ' ', _jsx("a", { href: alternatePath, className: "customer-auth-alternate-link", onClick: (ev) => {
                                    if (!onNavigate)
                                        return;
                                    ev.preventDefault();
                                    const path = alternatePath.startsWith('/') ? alternatePath : `/${alternatePath}`;
                                    onNavigate(path);
                                }, children: alternateLinkText })] }))] }) }) }));
}
