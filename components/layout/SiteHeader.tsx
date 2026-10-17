import { Wordmark } from '@/components/brand/Wordmark';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import { pageContainerClassName } from '@/components/ui/layoutStyles';
import { standaloneLinkClassName } from '@/components/ui/textStyles';
import type { Locale } from '@/lib/i18n/locales';
import type { PageText } from '@/lib/i18n/pageText';
import { CONTACT_ID, TOP_ID } from '@/lib/siteConfig';

type SiteHeaderProps = {
  text: PageText['nav'];
  locale: Locale;
};

/**
 * The rule under the header spans the whole screen while the content stays in the page container, so the header reads
 * as a band. The wordmark is not a link: on a one-page site it would only point at the page already open.
 */
export const SiteHeader = ({ text, locale }: SiteHeaderProps) => {
  return (
    <header id={TOP_ID} className="border-b border-line-strong">
      <div className={`${pageContainerClassName} flex items-center justify-between gap-4 py-4`}>
        <Wordmark className="block h-4.5 w-auto" />
        <div className="flex items-center gap-6">
          <nav aria-label={text.label}>
            <a href={`#${CONTACT_ID}`} className={`${standaloneLinkClassName} text-base leading-body`}>
              {text.contact}
            </a>
          </nav>
          <LanguageSwitch locale={locale} label={text.languageLabel} />
        </div>
      </div>
    </header>
  );
};
