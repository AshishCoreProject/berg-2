import { useEffect } from 'react';
import { useCart, useCheckout } from '@ecommerce-store/cart-checkout-plugin';
import { getDemoProductById } from '@berg/blocks';
import { loadSession } from '@/lib';

interface Props {
  onNavigate: (path: string) => void;
  /** True when API runtime has required config (url + tenant + store). */
  cartApiConfigured: boolean;
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

function resolveText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export function CartPage({ onNavigate, cartApiConfigured }: Props) {
  const CHECKOUT_RETURN_PATH_STORAGE_KEY = 'storefront:checkout:return-path';
  const { items, summary, removeItem, updateQuantity, clearCart, isSyncing, lastError } = useCart();
  const { isPending, error: checkoutError } = useCheckout();

  useEffect(() => {
    document.title = 'Cart';
  }, []);

  const handleCheckout = () => {
    const userId = loadSession()?.customerId?.trim();
    if (!userId) {
      try {
        window.sessionStorage.setItem(CHECKOUT_RETURN_PATH_STORAGE_KEY, '/checkout');
      } catch {
        // ignore storage failures
      }
      onNavigate('/login');
      return;
    }
    onNavigate('/checkout');
  };

  return (
    <main className="storefront storefront-cart-page" role="main">
      <div className="storefront-cart-inner">
        <h1 className="storefront-cart-title">Cart</h1>

        {cartApiConfigured ? (
          <div className="storefront-cart-status storefront-cart-status--api">
            Cart API mode is active.
          </div>
        ) : null}
        {!cartApiConfigured ? (
          <div className="storefront-cart-status storefront-cart-status--info">
            Cart API not configured. Using local cart.
          </div>
        ) : null}

        {cartApiConfigured && lastError ? (
          <p className="storefront-cart-api-error" role="alert">
            {lastError.message}
          </p>
        ) : null}
        {cartApiConfigured && checkoutError ? (
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
                const image = resolveText((item as Record<string, unknown>).image);
                const description = resolveText((item as Record<string, unknown>).description);
                const variantTitle = resolveText((item as Record<string, unknown>).variant_title);
                const variantOptionsRaw = (item as Record<string, unknown>).variant_options;
                const variantOptions = Array.isArray(variantOptionsRaw)
                  ? variantOptionsRaw
                      .filter((entry): entry is string => typeof entry === 'string')
                      .map((entry) => entry.trim())
                      .filter(Boolean)
                  : [];
                const variantText = variantTitle || (variantOptions.length ? variantOptions.join(' / ') : '');
                return (
                  <li key={String(item.id)} className="storefront-cart-line">
                    <div className="storefront-cart-line-main">
                      {image ? (
                        <div className="storefront-cart-line-image-wrap">
                          <img src={image} alt={label} className="storefront-cart-line-image" />
                        </div>
                      ) : null}
                      <div className="storefront-cart-line-info">
                        <span className="storefront-cart-line-name">{label}</span>
                        {description ? (
                          <span className="storefront-cart-line-description">{description}</span>
                        ) : null}
                        {variantText ? (
                          <span className="storefront-cart-line-variant">{variantText}</span>
                        ) : null}
                        <span className="storefront-cart-line-meta">
                          ${(item.price ?? 0).toFixed(2)} × {qty}
                        </span>
                      </div>
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
              {cartApiConfigured ? (
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
