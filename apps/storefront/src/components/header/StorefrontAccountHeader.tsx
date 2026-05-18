import { useCallback, useEffect, useRef, useState } from 'react';
import { AccountHeaderIconButton, type HeaderFooterStyle } from '@berg/layout';
import {
  clearSession,
  customerProfileFromSession,
  loadSession,
} from '@/lib';

/** Set on successful login in CustomerAuthBlock; cleared when the account modal is dismissed. */
const ACCOUNT_MODAL_INTENT_KEY = 'berg:show-account-modal';

interface CustomerProfile {
  name?: string;
  username?: string;
  customerId?: string;
}

interface Props {
  headerStyle?: HeaderFooterStyle;
  onNavigate: (path: string) => void;
  isAuthenticated?: boolean;
  customer?: CustomerProfile | null;
  onLogout?: () => void;
}

function hasPropCustomer(customer: CustomerProfile | null | undefined): boolean {
  if (!customer) return false;
  return Boolean(
    customer.customerId?.trim() || customer.name?.trim() || customer.username?.trim(),
  );
}

function buildInitials(name?: string, username?: string): string {
  const source = (name?.trim() || username?.trim() || 'CU').replace(/\s+/g, ' ');
  const parts = source.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function StorefrontAccountHeader({
  headerStyle,
  onNavigate,
  isAuthenticated = false,
  customer,
  onLogout,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [storedCustomer, setStoredCustomer] = useState<CustomerProfile | null>(() =>
    customerProfileFromSession(loadSession()),
  );

  const clearAccountModalIntent = useCallback(() => {
    try {
      window.sessionStorage.removeItem(ACCOUNT_MODAL_INTENT_KEY);
    } catch {
      /* private mode */
    }
  }, []);

  /** Closing the modal clears the post-login intent so remounts / Strict Mode stay correct. */
  const setAccountModalOpen = useCallback(
    (next: boolean) => {
      if (!next) clearAccountModalIntent();
      setOpen(next);
    },
    [clearAccountModalIntent],
  );

  useEffect(() => {
    const refreshFromStorage = () => {
      setStoredCustomer(customerProfileFromSession(loadSession()));
    };
    refreshFromStorage();
    const onStorage = () => refreshFromStorage();
    const onSessionChanged = () => refreshFromStorage();
    window.addEventListener('storage', onStorage);
    window.addEventListener('customer-auth-session-changed', onSessionChanged as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('customer-auth-session-changed', onSessionChanged as EventListener);
    };
  }, []);

  /** Open once after login: keep sessionStorage flag until the user closes the modal (survives header remount + React Strict Mode). */
  useEffect(() => {
    if (!storedCustomer) return;
    try {
      if (window.sessionStorage.getItem(ACCOUNT_MODAL_INTENT_KEY) === '1') {
        setOpen(true);
      }
    } catch {
      /* private mode */
    }
  }, [storedCustomer]);

  useEffect(() => {
    if (!open) return undefined;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountModalOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('keydown', onEscape);
    };
  }, [open, setAccountModalOpen]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const target = e.target;
      if (target instanceof Node && el.contains(target)) return;
      setAccountModalOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open, setAccountModalOpen]);

  const effectiveCustomer = customer ?? storedCustomer;
  const effectiveAuthenticated =
    isAuthenticated || !!storedCustomer || hasPropCustomer(customer);
  const displayName = effectiveCustomer?.name?.trim() || 'Customer';
  const displayUsername = effectiveCustomer?.username?.trim() || 'Not available';
  const displayCustomerId = effectiveCustomer?.customerId?.trim() || 'Not available';
  const initials = buildInitials(displayName, displayUsername);

  const dropdown =
    effectiveAuthenticated && open ? (
      <div
        className="account-modal-card"
        role="dialog"
        aria-modal="false"
        aria-label="Account"
      >
        <div className="account-popover-head">
          <span className="account-popover-avatar" aria-hidden>
            {initials}
          </span>
          <span className="account-popover-identity">
            <span className="account-popover-title">{displayName}</span>
            <span className="account-popover-username">{displayUsername}</span>
            <span className="account-popover-customer-id">Customer ID: {displayCustomerId}</span>
          </span>
        </div>
        <div className="account-popover-divider" />
        <button
          type="button"
          className="account-popover-logout"
          onClick={() => {
            setAccountModalOpen(false);
            if (onLogout) onLogout();
            else {
              clearSession();
              setStoredCustomer(null);
              window.dispatchEvent(new Event('customer-auth-session-changed'));
            }
          }}
        >
          Logout
        </button>
      </div>
    ) : null;

  return (
    <div ref={wrapRef} className="account-menu-wrap">
      <AccountHeaderIconButton
        headerStyle={headerStyle}
        onClick={() => {
          if (!effectiveAuthenticated) {
            onNavigate('/login');
            return;
          }
          setAccountModalOpen(!open);
        }}
      />
      {dropdown}
    </div>
  );
}
