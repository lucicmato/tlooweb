import { SendProcessLink } from '@/components/contact/SendProcessLink';
import { BrokenLines } from '@/components/ui/BrokenLines';
import { pageHeadingClassName } from '@/components/ui/textStyles';
import { pageText } from '@/lib/pageText';
import { CONTACT_ID } from '@/lib/siteConfig';

const HERO_HEADING_ID = 'hero-heading';

/**
 * Heading and text share one wrapping row (flex-basis 520 and 320px), so on a tablet the text drops under the heading
 * without a breakpoint. They align to the bottom, which puts the text level with the last line of the heading. The lead
 * wraps balanced: when it needs two lines they come out about equal, instead of a short tail alone on the second.
 */
export const HeroSection = () => {
  return (
    <section
      aria-labelledby={HERO_HEADING_ID}
      className="flex flex-wrap items-end gap-x-16 gap-y-8 border-b border-line-strong pt-hero-top pb-hero-bottom"
    >
      <h1 id={HERO_HEADING_ID} className={`min-w-0 grow-3 basis-130 ${pageHeadingClassName}`}>
        <BrokenLines lines={pageText.hero.titleLines} />
      </h1>
      <div className="min-w-0 grow-2 basis-80 pb-1.5">
        <p className="text-lead text-balance">{pageText.hero.lead}</p>
        <p className="mt-3 text-lead text-pretty">{pageText.hero.text}</p>
        <SendProcessLink href={`#${CONTACT_ID}`} />
      </div>
    </section>
  );
};
