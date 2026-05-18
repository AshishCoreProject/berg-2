import { useEffect, useMemo, useState } from 'react';
import { useCart, useCheckout } from '@ecommerce-store/cart-checkout-plugin';
import { getDemoProductById } from '@berg/blocks';
import { v4 as uuidv4 } from 'uuid';

type Props = {
  onNavigate: (path: string) => void;
  tenantId: string;
  storeId?: string;
};

type CheckoutFormState = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethod: 'standard' | 'express';
};

function resolveCartItemLabel(item: Record<string, unknown>): string {
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (name) return name;

  const title = typeof item.title === 'string' ? item.title.trim() : '';
  if (title) return title;

  const productName = typeof item.product_name === 'string' ? item.product_name.trim() : '';
  if (productName) return productName;

  const idValue = item.id;
  const id = idValue == null ? '' : String(idValue).trim();
  if (!id) return 'Unknown product';

  const demo = getDemoProductById(id);
  if (demo?.title) return demo.title;

  return id;
}

function validate(form: CheckoutFormState): Partial<Record<keyof CheckoutFormState, string>> {
  const errors: Partial<Record<keyof CheckoutFormState, string>> = {};
  const email = form.email.trim();
  if (!email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';

  if (!form.firstName.trim()) errors.firstName = 'First name is required.';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!form.address1.trim()) errors.address1 = 'Address is required.';
  if (!form.city.trim()) errors.city = 'City is required.';
  if (!form.postalCode.trim()) errors.postalCode = 'Postal code is required.';
  if (!form.country.trim()) errors.country = 'Country is required.';
  if (!form.state.trim()) errors.state = 'State/region is required.';
  return errors;
}

export function CheckoutPage({ onNavigate, tenantId, storeId }: Props) {
  const { items, summary, isSyncing } = useCart();
  const { startCheckout, isPending, error } = useCheckout();

  const [form, setForm] = useState<CheckoutFormState>({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    shippingMethod: 'standard',
  });
  const [touched, setTouched] = useState<Partial<Record<keyof CheckoutFormState, boolean>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const orderApiBaseUrl =
    (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_ORDER_API_BASE_URL?.trim() || undefined;

  useEffect(() => {
    document.title = 'Checkout';
  }, []);

  useEffect(() => {
    if (!isSyncing && items.length === 0) {
      setSubmitError(null);
    }
  }, [isSyncing, items.length]);

  const fieldErrors = useMemo(() => validate(form), [form]);
  const hasErrors = Object.keys(fieldErrors).length > 0;

  const shippingCost = form.shippingMethod === 'express' ? 12 : 0;
  const total = summary.subtotal + shippingCost;

  const onChange = (key: keyof CheckoutFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value } as CheckoutFormState));
  };

  const onBlur = (key: keyof CheckoutFormState) => () => setTouched((prev) => ({ ...prev, [key]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setTouched({
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      address1: true,
      address2: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      shippingMethod: true,
    });

    const errorsNow = validate(form);
    if (Object.keys(errorsNow).length > 0) return;
    if (items.length === 0) {
      setSubmitError('Your cart is empty.');
      return;
    }

    const body: Record<string, unknown> = {
      contact: {
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      },
      shipping_address: {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        address1: form.address1.trim(),
        address2: form.address2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        postal_code: form.postalCode.trim(),
        country: form.country.trim(),
      },
      shipping_method: form.shippingMethod,
    };

    if (!orderApiBaseUrl) {
      setSubmitError('Order API is not configured. Set VITE_ORDER_API_BASE_URL.');
      return;
    }

    // New key per submit click to avoid accidental duplicate order creation.
    const idempotencyKey = uuidv4();

    let checkoutRes: Awaited<ReturnType<typeof startCheckout>>;
    try {
      checkoutRes = await startCheckout(body);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Checkout failed.';
      setSubmitError(message);
      return;
    }

    const url =
      typeof checkoutRes.checkout_url === 'string' && checkoutRes.checkout_url.length > 0
        ? checkoutRes.checkout_url
        : typeof checkoutRes.redirect_url === 'string' && checkoutRes.redirect_url.length > 0
          ? checkoutRes.redirect_url
          : undefined;
    const cartId = checkoutRes?.cart_id;
    if (!cartId || typeof cartId !== 'string') {
      setSubmitError('Unable to start checkout (missing cart_id). Please try again.');
      return;
    }

    setIsCreatingOrder(true);
    try {
      const orderRes = await fetch(`${orderApiBaseUrl.replace(/\/$/, '')}/orders`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'X-Tenant-Id': tenantId,
          ...(storeId ? { 'X-Store-Id': storeId } : {}),
        },
        body: JSON.stringify({
          checkout_id: cartId,
        }),
      });

      if (!orderRes.ok) {
        const text = await orderRes.text();
        throw new Error(text || `Order API failed (${orderRes.status})`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create order.';
      setSubmitError(message);
      setIsCreatingOrder(false);
      return;
    }
    setIsCreatingOrder(false);

    if (typeof url === 'string' && url.length > 0) {
      window.location.href = url;
      return;
    }
    setSubmitError('Unable to start checkout. Please try again.');
  };

  return (
    <main className="storefront storefront-checkout-page" role="main">
      <div className="storefront-checkout-header">
        <div>
          <h1 className="storefront-checkout-title">Checkout</h1>
          <p className="storefront-checkout-subtitle">Review your details, then you’ll be redirected to secure payment.</p>
        </div>
        <button type="button" className="storefront-checkout-back" onClick={() => onNavigate('/cart')}>
          ← Back to cart
        </button>
      </div>

      <div className="storefront-checkout-grid">
        <section className="storefront-checkout-left" aria-label="Checkout details">
          <form className="storefront-checkout-form" onSubmit={handleSubmit}>
            <div className="storefront-checkout-card">
              <div className="storefront-checkout-card-head">
                <h2 className="storefront-checkout-card-title">Contact</h2>
                <span className="storefront-checkout-card-hint">We’ll send your receipt here.</span>
              </div>
              <div className="storefront-checkout-fields">
                <div className="storefront-checkout-field">
                  <label className="form-field-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    className="form-input"
                    value={form.email}
                    onChange={onChange('email')}
                    onBlur={onBlur('email')}
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                  />
                  {touched.email && fieldErrors.email ? (
                    <div className="storefront-checkout-field-error" role="alert">{fieldErrors.email}</div>
                  ) : null}
                </div>
                <div className="storefront-checkout-field">
                  <label className="form-field-label" htmlFor="phone">Phone (optional)</label>
                  <input
                    id="phone"
                    className="form-input"
                    value={form.phone}
                    onChange={onChange('phone')}
                    onBlur={onBlur('phone')}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            <div className="storefront-checkout-card">
              <div className="storefront-checkout-card-head">
                <h2 className="storefront-checkout-card-title">Shipping address</h2>
              </div>
              <div className="storefront-checkout-fields storefront-checkout-fields--two">
                <div className="storefront-checkout-field">
                  <label className="form-field-label" htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    className="form-input"
                    value={form.firstName}
                    onChange={onChange('firstName')}
                    onBlur={onBlur('firstName')}
                    autoComplete="given-name"
                  />
                  {touched.firstName && fieldErrors.firstName ? (
                    <div className="storefront-checkout-field-error" role="alert">{fieldErrors.firstName}</div>
                  ) : null}
                </div>
                <div className="storefront-checkout-field">
                  <label className="form-field-label" htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    className="form-input"
                    value={form.lastName}
                    onChange={onChange('lastName')}
                    onBlur={onBlur('lastName')}
                    autoComplete="family-name"
                  />
                  {touched.lastName && fieldErrors.lastName ? (
                    <div className="storefront-checkout-field-error" role="alert">{fieldErrors.lastName}</div>
                  ) : null}
                </div>
              </div>
              <div className="storefront-checkout-fields">
                <div className="storefront-checkout-field">
                  <label className="form-field-label" htmlFor="address1">Address</label>
                  <input
                    id="address1"
                    className="form-input"
                    value={form.address1}
                    onChange={onChange('address1')}
                    onBlur={onBlur('address1')}
                    autoComplete="address-line1"
                    placeholder="Street address"
                  />
                  {touched.address1 && fieldErrors.address1 ? (
                    <div className="storefront-checkout-field-error" role="alert">{fieldErrors.address1}</div>
                  ) : null}
                </div>
                <div className="storefront-checkout-field">
                  <label className="form-field-label" htmlFor="address2">Apartment, suite, etc (optional)</label>
                  <input
                    id="address2"
                    className="form-input"
                    value={form.address2}
                    onChange={onChange('address2')}
                    onBlur={onBlur('address2')}
                    autoComplete="address-line2"
                  />
                </div>
              </div>
              <div className="storefront-checkout-fields storefront-checkout-fields--two">
                <div className="storefront-checkout-field">
                  <label className="form-field-label" htmlFor="city">City</label>
                  <input
                    id="city"
                    className="form-input"
                    value={form.city}
                    onChange={onChange('city')}
                    onBlur={onBlur('city')}
                    autoComplete="address-level2"
                  />
                  {touched.city && fieldErrors.city ? (
                    <div className="storefront-checkout-field-error" role="alert">{fieldErrors.city}</div>
                  ) : null}
                </div>
                <div className="storefront-checkout-field">
                  <label className="form-field-label" htmlFor="state">State / Region</label>
                  <input
                    id="state"
                    className="form-input"
                    value={form.state}
                    onChange={onChange('state')}
                    onBlur={onBlur('state')}
                    autoComplete="address-level1"
                  />
                  {touched.state && fieldErrors.state ? (
                    <div className="storefront-checkout-field-error" role="alert">{fieldErrors.state}</div>
                  ) : null}
                </div>
              </div>
              <div className="storefront-checkout-fields storefront-checkout-fields--two">
                <div className="storefront-checkout-field">
                  <label className="form-field-label" htmlFor="postalCode">Postal code</label>
                  <input
                    id="postalCode"
                    className="form-input"
                    value={form.postalCode}
                    onChange={onChange('postalCode')}
                    onBlur={onBlur('postalCode')}
                    autoComplete="postal-code"
                  />
                  {touched.postalCode && fieldErrors.postalCode ? (
                    <div className="storefront-checkout-field-error" role="alert">{fieldErrors.postalCode}</div>
                  ) : null}
                </div>
                <div className="storefront-checkout-field">
                  <label className="form-field-label" htmlFor="country">Country</label>
                  <select
                    id="country"
                    className="form-select"
                    value={form.country}
                    onChange={onChange('country')}
                    onBlur={onBlur('country')}
                    autoComplete="country-name"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="India">India</option>
                  </select>
                  {touched.country && fieldErrors.country ? (
                    <div className="storefront-checkout-field-error" role="alert">{fieldErrors.country}</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="storefront-checkout-card">
              <div className="storefront-checkout-card-head">
                <h2 className="storefront-checkout-card-title">Shipping</h2>
              </div>
              <div className="storefront-checkout-shipping">
                <label className="storefront-checkout-radio">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="standard"
                    checked={form.shippingMethod === 'standard'}
                    onChange={onChange('shippingMethod')}
                  />
                  <span className="storefront-checkout-radio-main">
                    <span className="storefront-checkout-radio-title">Standard</span>
                    <span className="storefront-checkout-radio-sub">3–5 business days</span>
                  </span>
                  <span className="storefront-checkout-radio-price">Free</span>
                </label>

                <label className="storefront-checkout-radio">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="express"
                    checked={form.shippingMethod === 'express'}
                    onChange={onChange('shippingMethod')}
                  />
                  <span className="storefront-checkout-radio-main">
                    <span className="storefront-checkout-radio-title">Express</span>
                    <span className="storefront-checkout-radio-sub">1–2 business days</span>
                  </span>
                  <span className="storefront-checkout-radio-price">$12.00</span>
                </label>
              </div>
            </div>

            <div className="storefront-checkout-card storefront-checkout-card--payment">
              <div className="storefront-checkout-card-head">
                <h2 className="storefront-checkout-card-title">Payment</h2>
              </div>
              <div className="storefront-checkout-redirect-note">
                <strong>Redirect payment</strong>
                <p className="storefront-checkout-redirect-note-text">
                  When you continue, you’ll be redirected to a secure payment page to complete your purchase.
                </p>
              </div>
            </div>

            {(submitError || error) ? (
              <div className="storefront-checkout-submit-error" role="alert">
                {submitError ?? error?.message}
              </div>
            ) : null}
          </form>
        </section>

        <aside className="storefront-checkout-right" aria-label="Order summary">
          <div className="storefront-checkout-summary">
            <h2 className="storefront-checkout-summary-title">Order summary</h2>

            {isSyncing && items.length === 0 ? (
              <p className="storefront-checkout-summary-muted">Loading…</p>
            ) : null}

            {!isSyncing && items.length === 0 ? (
              <div className="storefront-checkout-empty">
                <p className="storefront-checkout-summary-muted">Your cart is empty.</p>
                <button type="button" className="storefront-checkout-cta" onClick={() => onNavigate('/products')}>
                  Browse products
                </button>
              </div>
            ) : null}

            {items.length > 0 ? (
              <>
                <ul className="storefront-checkout-lines" aria-label="Items in your order">
                  {items.map((item) => {
                    const qty = item.quantity ?? 1;
                    const price = item.price ?? 0;
                    const label = resolveCartItemLabel(item as Record<string, unknown>);
                    return (
                      <li key={String(item.id)} className="storefront-checkout-line">
                        <span className="storefront-checkout-line-name">
                          {label} <span className="storefront-checkout-line-qty">× {qty}</span>
                        </span>
                        <span className="storefront-checkout-line-price">${(price * qty).toFixed(2)}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="storefront-checkout-totals">
                  <div className="storefront-checkout-total-row">
                    <span>Subtotal</span>
                    <span>${summary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="storefront-checkout-total-row">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="storefront-checkout-total-row storefront-checkout-total-row--muted">
                    <span>Taxes</span>
                    <span>Calculated at payment</span>
                  </div>
                  <div className="storefront-checkout-total-row storefront-checkout-total-row--grand">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="storefront-checkout-cta"
                  disabled={isSyncing || isPending || isCreatingOrder || items.length === 0 || hasErrors}
                  onClick={() => {
                    const formEl = document.querySelector('.storefront-checkout-form') as HTMLFormElement | null;
                    formEl?.requestSubmit();
                  }}
                >
                  {isCreatingOrder ? 'Creating order…' : isPending ? 'Redirecting…' : 'Continue to payment'}
                </button>

                <p className="storefront-checkout-summary-footnote">
                  By continuing, you agree to our terms and acknowledge our privacy policy.
                </p>
              </>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}

