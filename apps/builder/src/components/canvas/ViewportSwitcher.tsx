/**
 * Viewport switcher: Desktop (960px), Tablet (768px), Mobile (375px).
 * Lets users preview the builder canvas at different breakpoints.
 */

export type Viewport = 'desktop' | 'tablet' | 'mobile';

export const VIEWPORT_WIDTHS: Record<Viewport, number> = {
  desktop: 1460,
  tablet: 768,
  mobile: 576,
};

interface Props {
  viewport: Viewport;
  onViewportChange: (v: Viewport) => void;
}

export function ViewportSwitcher({ viewport, onViewportChange }: Props) {
  return (
    <div className="viewport-switcher" role="group" aria-label="Preview viewport">
      <button
        type="button"
        className={`viewport-btn ${viewport === 'desktop' ? 'active' : ''}`}
        onClick={() => onViewportChange('desktop')}
        title={`Desktop (${VIEWPORT_WIDTHS.desktop}px)`}
        aria-pressed={viewport === 'desktop'}
      >
        <svg width="20" height="14" viewBox="0 0 20 14" fill="currentColor" aria-hidden>
          <rect x="0" y="0" width="20" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2" y="12" width="16" height="2" fill="currentColor" />
        </svg>
        <span>Desktop</span>
      </button>
      <button
        type="button"
        className={`viewport-btn ${viewport === 'tablet' ? 'active' : ''}`}
        onClick={() => onViewportChange('tablet')}
        title={`Tablet (${VIEWPORT_WIDTHS.tablet}px)`}
        aria-pressed={viewport === 'tablet'}
      >
        <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" aria-hidden>
          <rect x="1" y="0" width="12" height="16" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span>Tablet</span>
      </button>
      <button
        type="button"
        className={`viewport-btn ${viewport === 'mobile' ? 'active' : ''}`}
        onClick={() => onViewportChange('mobile')}
        title={`Mobile (${VIEWPORT_WIDTHS.mobile}px)`}
        aria-pressed={viewport === 'mobile'}
      >
        <svg width="10" height="18" viewBox="0 0 10 18" fill="currentColor" aria-hidden>
          <rect x="0.5" y="0.5" width="9" height="17" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="5" cy="15.5" r="1" fill="currentColor" />
        </svg>
        <span>Mobile</span>
      </button>
    </div>
  );
}
