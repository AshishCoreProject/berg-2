import type { StoredPage } from '@berg/schema';
import { SharedHeader, type HeaderFooterStyle } from '@berg/layout';
import { StorefrontAccountHeader } from '@/components/header/StorefrontAccountHeader';
import { StorefrontCartHeader } from '@/components/header/StorefrontCartHeader';

interface Props {
  siteTitle: string;
  pages: StoredPage[];
  currentSlug: string | null;
  homeSlug: string;
  onNavigate: (path: string) => void;
  headerStyle?: HeaderFooterStyle;
  hiddenFromHeader?: string[];
  isAuthenticated?: boolean;
  customer?: { name?: string; username?: string } | null;
  onLogout?: () => void;
}

export function SiteHeader({
  siteTitle,
  pages,
  currentSlug,
  homeSlug,
  onNavigate,
  headerStyle,
  hiddenFromHeader,
  isAuthenticated,
  customer,
  onLogout,
}: Props) {
  return (
    <SharedHeader
      siteTitle={siteTitle}
      pages={pages}
      currentSlug={currentSlug}
      homeSlug={homeSlug}
      onNavigate={onNavigate}
      headerStyle={headerStyle}
      hiddenFromHeader={hiddenFromHeader}
      viewportMode="auto"
      rightSlot={
        <span className="site-header-right-slot">
          <StorefrontAccountHeader
            headerStyle={headerStyle}
            onNavigate={onNavigate}
            isAuthenticated={isAuthenticated}
            customer={customer}
            onLogout={onLogout}
          />
          <StorefrontCartHeader headerStyle={headerStyle} onNavigate={onNavigate} />
        </span>
      }
    />
  );
}
