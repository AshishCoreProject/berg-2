import type { MouseEvent } from "react";
import type { HeaderFooterStyle } from "./types";

export interface CartHeaderIconButtonProps {
  headerStyle?: HeaderFooterStyle;
  /** Called when the user activates the cart control (ignored when preview is true). */
  onClick?: () => void;
  /** Builder canvas: show icon but do not navigate. */
  preview?: boolean;
}

/**
 * Header cart control (SVG). Color: cartIconColor → linkColor → color → CSS accent.
 * Visibility: headerStyle.showCartIcon !== false.
 */
export function CartHeaderIconButton({
  headerStyle,
  onClick,
  preview = false,
}: CartHeaderIconButtonProps) {
  if (headerStyle?.showCartIcon === false) return null;

  const cartColor = headerStyle?.cartIconColor?.trim();
  const color =
    cartColor || headerStyle?.linkColor || headerStyle?.color || undefined;

  const handleClick = (e: MouseEvent) => {
    if (preview) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.();
  };

  return (
    <button
      type="button"
      className="site-header-cart-btn"
      aria-label="Shopping cart"
      onClick={handleClick}
      style={color ? { color } : undefined}
    >
      <svg
        className="site-header-cart-svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    </button>
  );
}
