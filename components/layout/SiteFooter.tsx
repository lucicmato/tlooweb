import { Wordmark } from '@/components/brand/Wordmark';
import { BrokenLines } from '@/components/ui/BrokenLines';
import { contentColumnClassName, marginColumnClassName, pageContainerClassName } from '@/components/ui/layoutStyles';
import { linkClassName, monoTagClassName, standaloneLinkClassName } from '@/components/ui/textStyles';
import { mailtoHref } from '@/lib/mailtoHref';
import { pageText } from '@/lib/pageText';
import { CONTACT_EMAIL, PORTFOLIO_URL, TOP_ID } from '@/lib/siteConfig';

/**
 * The footer reuses the section grid: the wordmark and tagline sit in the margin column, the contact details in the
 * content column, so they line up with the section labels and text above.
 */
export const SiteFooter = () => {
  return (
    <footer className="border-t border-line-strong">
      <div className={`${pageContainerClassName} pt-10 pb-6`}>
        <div className="flex flex-wrap gap-x-10 gap-y-7">
          <div className={`${marginColumnClassName} flex flex-col gap-3`}>
            <Wordmark className="block h-4.5 w-auto self-start" />
            <p className="text-note text-balance text-ink-muted">
              <BrokenLines lines={pageText.footer.taglineLines} />
            </p>
          </div>
          <dl className={`${contentColumnClassName} flex flex-wrap gap-x-14 gap-y-5 text-base`}>
            <div className="flex flex-col gap-1">
              <dt className={monoTagClassName}>{pageText.footer.emailLabel}</dt>
              <dd>
                <a href={mailtoHref(CONTACT_EMAIL)} className={linkClassName}>
                  {CONTACT_EMAIL}
                </a>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className={monoTagClassName}>{pageText.footer.portfolioLabel}</dt>
              <dd>
                <a href={PORTFOLIO_URL} className={linkClassName}>
                  {pageText.footer.portfolioLinkLabel}
                </a>
              </dd>
            </div>
          </dl>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-line pt-3 text-sm leading-body text-ink-muted">
          <span>{pageText.footer.copyright}</span>
          <a href={`#${TOP_ID}`} className={standaloneLinkClassName}>
            {pageText.footer.backToTop}
          </a>
        </div>
      </div>
    </footer>
  );
};
