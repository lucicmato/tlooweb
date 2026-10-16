import { Wordmark } from '@/components/brand/Wordmark';
import { pageContainerClassName } from '@/components/ui/layoutStyles';
import { standaloneLinkClassName } from '@/components/ui/textStyles';
import { pageText } from '@/lib/pageText';
import { CONTACT_ID, TOP_ID } from '@/lib/siteConfig';

/**
 * The rule under the header spans the whole screen while the content stays in the page container, so the header reads
 * as a band. The wordmark is not a link: on a one-page site it would only point at the page already open.
 */
export const SiteHeader = () => {
  return (
    <header id={TOP_ID} className="border-b border-line-strong">
      <div className={`${pageContainerClassName} flex items-center justify-between gap-4 py-4`}>
        <Wordmark className="block h-4.5 w-auto" />
        <nav aria-label={pageText.nav.label}>
          <a href={`#${CONTACT_ID}`} className={`${standaloneLinkClassName} text-base leading-body`}>
            {pageText.nav.contact}
          </a>
        </nav>
      </div>
    </header>
  );
};
