import { useEffect } from 'react';

type Props = {
  onNavigate: (path: string) => void;
};

export function CheckoutSuccessPage({ onNavigate }: Props) {
  useEffect(() => {
    document.title = 'Order confirmed';
  }, []);

  return (
    <main className="storefront storefront-checkout-success" role="main">
      <div className="storefront-checkout-success-inner">
        <div className="storefront-checkout-success-badge" aria-hidden>
          ✓
        </div>
        <h1 className="storefront-checkout-success-title">Order confirmed</h1>
        <p className="storefront-checkout-success-subtitle">
          Thanks for your purchase. You’ll receive a confirmation email shortly.
        </p>
        <div className="storefront-checkout-success-actions">
          <button type="button" className="storefront-checkout-cta" onClick={() => onNavigate('/products')}>
            Continue shopping
          </button>
          <button type="button" className="storefront-checkout-success-link" onClick={() => onNavigate('/')}>
            Back to home
          </button>
        </div>
      </div>
    </main>
  );
}

