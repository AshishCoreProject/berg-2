import type { FooterLinksConfig, StoredPage } from '@berg/schema';
import { SharedFooter, type HeaderFooterStyle } from '@berg/layout';

interface Props {
  siteTitle: string;
  pages: StoredPage[];
  homeSlug: string;
  onNavigate: (path: string) => void;
  footerStyle?: HeaderFooterStyle;
  hiddenFromHeader?: string[];
  footerLinks?: FooterLinksConfig;
}

export function SiteFooter({
  siteTitle,
  pages,
  homeSlug,
  onNavigate,
  footerStyle,
  hiddenFromHeader,
  footerLinks,
}: Props) {
  return (
    <SharedFooter
      siteTitle={siteTitle}
      pages={pages}
      homeSlug={homeSlug}
      onNavigate={onNavigate}
      footerStyle={footerStyle}
      hiddenFromHeader={hiddenFromHeader}
      footerLinks={footerLinks}
      viewportMode="auto"
    />
  );
}
