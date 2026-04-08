import { useEffect, useRef } from 'react';
import { useCart, useCheckout } from '@storefront-ui-plugin/cart-checkout-plugin';
import { getDemoProductById } from '@berg/blocks';

interface Props {
  onNavigate: (path: string) => void;
  /** True when API runtime has required config (url + tenant + store). */
  cartApiConfigured: boolean;
  /** True while cart provider is currently in API mode. */
  cartApiEnabled: boolean;
  /** Optional reason shown when falling back to local mode. */
  cartApiFallbackReason?: string | null;
  /** Switch parent provider from API mode to local fallback mode. */
  onApiFailure: (reason: string) => void;
  /** Re-enable API mode after fallback. */
  onRetryApi: () => void;
}

function resolveCartItemLabel(item: Record<string, unknown>): string {
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (name) return name;

  const title = typeof item.title === 'string' ? item.title.trim() : '';
  if (title) return title;

  const productName =
    typeof item.product_name === 'string' ? item.product_name.trim() : '';
  if (productName) return productName;

  const idValue = item.id;
  const id = idValue == null ? '' : String(idValue).trim();
  if (!id) return 'Unknown product';

  const demo = getDemoProductById(id);
  if (demo?.title) return demo.title;

  return id;
}

export function CartPage({
  onNavigate,
  cartApiConfigured,
  cartApiEnabled,
  cartApiFallbackReason,
  onApiFailure,
  onRetryApi,
}: Props) {
  const { items, summary, removeItem, updateQuantity, clearCart, isSyncing, lastError } = useCart();
  const { isPending, error: checkoutError } = useCheckout();
  const hasTriggeredFallbackRef = useRef(false);

  useEffect(() => {
    document.title = 'Cart';
  }, []);

  useEffect(() => {
    if (!cartApiEnabled) {
      hasTriggeredFallbackRef.current = false;
    }
  }, [cartApiEnabled]);

  useEffect(() => {
    if (!cartApiEnabled) return;
    if (hasTriggeredFallbackRef.current) return;
    const reason = checkoutError?.message || lastError?.message;
    if (!reason) return;
    hasTriggeredFallbackRef.current = true;
    onApiFailure(reason);
  }, [cartApiEnabled, lastError, checkoutError, onApiFailure]);

  const handleCheckout = async () => {
    // Checkout is now handled on the internal /checkout page (collect details, then redirect to hosted payment).
    onNavigate('/checkout');
  };

  return (
    <main className="storefront storefront-cart-page" role="main">
      <div className="storefront-cart-inner">
        <h1 className="storefront-cart-title">Cart</h1>

        {cartApiConfigured && cartApiEnabled ? (
          <div className="storefront-cart-status storefront-cart-status--api">
            Cart API mode is active.
          </div>
        ) : null}
        {cartApiConfigured && !cartApiEnabled ? (
          <div className="storefront-cart-status storefront-cart-status--fallback" role="status">
            Cart API unavailable. Using local fallback.
            {cartApiFallbackReason ? ` (${cartApiFallbackReason})` : ''}
            <button type="button" className="storefront-cart-retry-btn" onClick={onRetryApi}>
              Retry API
            </button>
          </div>
        ) : null}
        {!cartApiConfigured ? (
          <div className="storefront-cart-status storefront-cart-status--info">
            Cart API not configured. Using local cart.
          </div>
        ) : null}

        {cartApiEnabled && lastError ? (
          <p className="storefront-cart-api-error" role="alert">
            {lastError.message}
          </p>
        ) : null}
        {cartApiEnabled && checkoutError ? (
          <p className="storefront-cart-api-error" role="alert">
            {checkoutError.message}
          </p>
        ) : null}

        {isSyncing && items.length === 0 ? (
          <p className="storefront-cart-empty">Loading cart…</p>
        ) : null}

        {!isSyncing && items.length === 0 ? (
          <p className="storefront-cart-empty">Your cart is empty.</p>
        ) : null}

        {items.length > 0 ? (
          <>
            <ul className="storefront-cart-lines" aria-label="Cart items">
              {items.map((item) => {
                const qty = item.quantity ?? 1;
                const line = (item.price ?? 0) * qty;
                const label = resolveCartItemLabel(item as Record<string, unknown>);
                return (
                  <li key={String(item.id)} className="storefront-cart-line">
                    <div className="storefront-cart-line-info">
                      <span className="storefront-cart-line-name">{label}</span>
                      <span className="storefront-cart-line-meta">
                        ${(item.price ?? 0).toFixed(2)} × {qty}
                      </span>
                    </div>
                    <div className="storefront-cart-line-actions">
                      <span className="storefront-cart-line-total">${line.toFixed(2)}</span>
                      <div className="storefront-cart-qty">
                        <button
                          type="button"
                          className="storefront-cart-qty-btn"
                          aria-label="Decrease quantity"
                          disabled={isSyncing}
                          onClick={() => updateQuantity(item.id, qty - 1)}
                        >
                          −
                        </button>
                        <span className="storefront-cart-qty-value">{qty}</span>
                        <button
                          type="button"
                          className="storefront-cart-qty-btn"
                          aria-label="Increase quantity"
                          disabled={isSyncing}
                          onClick={() => updateQuantity(item.id, qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="storefront-cart-remove"
                        disabled={isSyncing}
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="storefront-cart-summary">
              <span>Subtotal ({summary.itemCount} items)</span>
              <strong>${summary.subtotal.toFixed(2)}</strong>
            </div>
            <div className="storefront-cart-actions-row">
              <button type="button" className="storefront-cart-clear" disabled={isSyncing} onClick={() => clearCart()}>
                Clear cart
              </button>
              {cartApiEnabled ? (
                <button
                  type="button"
                  className="storefront-cart-checkout-btn"
                  disabled={isSyncing || isPending}
                  onClick={handleCheckout}
                >
                  {isPending ? 'Checking out…' : 'Checkout'}
                </button>
              ) : null}
            </div>
          </>
        ) : null}

        <button type="button" className="storefront-cart-back-btn" onClick={() => onNavigate('/')}>
          Continue shopping
        </button>
      </div>
    </main>
  );
}
