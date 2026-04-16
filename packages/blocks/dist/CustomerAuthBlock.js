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
    const containerBackgroundColor = attrs.containerBackgroundColor?.trim();
    const containerTextColor = attrs.containerTextColor?.trim();
    const containerBackgroundImageUrl = attrs.containerBackgroundImageUrl?.trim();
    const containerBackgroundSize = attrs.containerBackgroundSize?.trim() || 'cover';
    const containerBackgroundPosition = attrs.containerBackgroundPosition?.trim() || 'center';
    const containerOverlayColor = attrs.containerOverlayColor?.trim();
    const containerOverlayOpacityRaw = attrs.containerOverlayOpacity;
    const containerOverlayOpacity = typeof containerOverlayOpacityRaw === 'number'
        ? Math.max(0, Math.min(1, containerOverlayOpacityRaw))
        : 0;
    const containerBorderRadius = attrs.containerBorderRadius?.trim() || '14px';
    const containerPadding = attrs.containerPadding?.trim() || '24px';
    const containerMinHeight = attrs.containerMinHeight?.trim() || '420px';
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
            const token = extractToken(data);
            if (token) {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, savedAt: Date.now(), raw: data }));
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
    const surfaceStyle = {
        ...(containerBackgroundColor ? { backgroundColor: containerBackgroundColor } : {}),
        ...(containerTextColor ? { color: containerTextColor } : {}),
        ...(containerBackgroundImageUrl
            ? {
                backgroundImage: `url("${containerBackgroundImageUrl}")`,
                backgroundSize: containerBackgroundSize,
                backgroundPosition: containerBackgroundPosition,
                backgroundRepeat: 'no-repeat',
            }
            : {}),
        borderRadius: containerBorderRadius,
        padding: containerPadding,
        minHeight: containerMinHeight,
    };
    return (_jsx("section", { className: "block block-customer-auth", children: _jsx("div", { className: "customer-auth-shell", children: _jsxs("div", { className: "customer-auth-surface", style: surfaceStyle, children: [containerOverlayColor && containerOverlayOpacity > 0 ? (_jsx("div", { className: "customer-auth-overlay", style: {
                            backgroundColor: containerOverlayColor,
                            opacity: containerOverlayOpacity,
                            borderRadius: containerBorderRadius,
                        } })) : null, _jsxs("form", { className: "customer-auth-form", onSubmit: handleSubmit, children: [isBuilderPreview && (_jsx("p", { className: "customer-auth-preview-hint", children: "Preview only \u2014 submit is disabled in the builder." })), _jsxs("div", { className: "customer-auth-field", children: [_jsx("label", { className: "customer-auth-label", htmlFor: `customer-auth-email-${mode}`, children: emailLabel }), _jsx("input", { id: `customer-auth-email-${mode}`, type: "email", autoComplete: "email", className: "customer-auth-input", value: email, onChange: (ev) => setEmail(ev.target.value), placeholder: emailPh, required: true, disabled: loading || !!isBuilderPreview })] }), _jsxs("div", { className: "customer-auth-field", children: [_jsx("label", { className: "customer-auth-label", htmlFor: `customer-auth-password-${mode}`, children: passwordLabel }), _jsx("input", { id: `customer-auth-password-${mode}`, type: "password", autoComplete: mode === 'register' ? 'new-password' : 'current-password', className: "customer-auth-input", value: password, onChange: (ev) => setPassword(ev.target.value), placeholder: passwordPh, required: true, disabled: loading || !!isBuilderPreview })] }), error && _jsx("p", { className: "customer-auth-error", role: "alert", children: error }), _jsx("button", { type: "submit", className: "button-link customer-auth-submit", disabled: loading || !!isBuilderPreview, children: loading ? '…' : submitText }), alternatePath && alternateLinkText && (_jsxs("p", { className: "customer-auth-alternate", children: [alternatePrompt, ' ', _jsx("a", { href: alternatePath, className: "customer-auth-alternate-link", onClick: (ev) => {
                                            if (!onNavigate)
                                                return;
                                            ev.preventDefault();
                                            const path = alternatePath.startsWith('/') ? alternatePath : `/${alternatePath}`;
                                            onNavigate(path);
                                        }, children: alternateLinkText })] }))] })] }) }) }));
}
