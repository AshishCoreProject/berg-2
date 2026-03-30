import type { StoredPage } from '@berg/schema';
import { SharedHeader, type HeaderFooterStyle } from '@berg/layout';

interface Props {
  siteTitle: string;
  pages: StoredPage[];
  currentSlug: string | null;
  homeSlug: string;
  onNavigate: (path: string) => void;
  headerStyle?: HeaderFooterStyle;
  hiddenFromHeader?: string[];
}

export function SiteHeader({ siteTitle, pages, currentSlug, homeSlug, onNavigate, headerStyle, hiddenFromHeader }: Props) {
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
    />
  );
}
