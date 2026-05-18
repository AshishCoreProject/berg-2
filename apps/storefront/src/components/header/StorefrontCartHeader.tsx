import { useCart } from '@ecommerce-store/cart-checkout-plugin';
import { CartHeaderIconButton, type HeaderFooterStyle } from '@berg/layout';

interface Props {
  headerStyle?: HeaderFooterStyle;
  onNavigate: (path: string) => void;
}

/** Cart icon + optional item count badge; must render under CartProvider. */
export function StorefrontCartHeader({ headerStyle, onNavigate }: Props) {
  const { summary } = useCart();
  const count = summary.itemCount;

  return (
    <span className="storefront-cart-header-wrap">
      <CartHeaderIconButton headerStyle={headerStyle} onClick={() => onNavigate('/cart')} />
      {count > 0 ? (
        <span className="storefront-cart-header-badge" aria-hidden>
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </span>
  );
}
