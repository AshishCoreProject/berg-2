/**
 * Collapsible section for the right sidebar with clear visual hierarchy.
 */
import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

export function CollapsibleSection({ title, defaultOpen = true, className = '', children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`sidebar-section ${open ? 'sidebar-section-open' : ''} ${className}`.trim()}>
      <button
        type="button"
        className="sidebar-section-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="sidebar-section-title">{title}</span>
        <svg
          className="sidebar-section-icon"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="sidebar-section-content">{children}</div>}
    </div>
  );
}
