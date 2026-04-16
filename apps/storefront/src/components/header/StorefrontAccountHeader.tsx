import { useEffect, useRef, useState } from 'react';
import { AccountHeaderIconButton, type HeaderFooterStyle } from '@berg/layout';
import { clearSession, loadSession } from '@/lib';

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
  const [open, setOpen] = useState(false);
  const [storedCustomer, setStoredCustomer] = useState<CustomerProfile | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const refreshFromStorage = () => {
      const session = loadSession();
      setStoredCustomer(
        session
          ? {
              name: session.name,
              username: session.username,
              customerId: session.customerId,
            }
          : null,
      );
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

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const effectiveCustomer = customer ?? storedCustomer;
  const effectiveAuthenticated = isAuthenticated || !!effectiveCustomer;
  const displayName = effectiveCustomer?.name?.trim() || 'Customer';
  const displayUsername = effectiveCustomer?.username?.trim() || 'Not available';
  const displayCustomerId = effectiveCustomer?.customerId?.trim() || 'Not available';
  const initials = buildInitials(displayName, displayUsername);

  return (
    <div className="account-menu-wrap" ref={rootRef}>
      <AccountHeaderIconButton
        headerStyle={headerStyle}
        onClick={() => {
          if (!effectiveAuthenticated) {
            onNavigate('/login');
            return;
          }
          setOpen((prev) => !prev);
        }}
      />
      {effectiveAuthenticated && open && (
        <div className="account-popover" role="dialog" aria-label="Account menu">
          <div className="account-popover-head">
            <span className="account-popover-avatar" aria-hidden>
              {initials}
            </span>
            <span className="account-popover-identity">
              <span className="account-popover-title">{displayName}</span>
              <span className="account-popover-username">{displayUsername}</span>
              <span className="account-popover-customer-id">ID: {displayCustomerId}</span>
            </span>
          </div>
          <div className="account-popover-divider" />
          <button
            type="button"
            className="account-popover-logout"
            onClick={() => {
              setOpen(false);
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
      )}
    </div>
  );
}
