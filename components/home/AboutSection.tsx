import { MarginLabelSection } from '@/components/layout/MarginLabelSection';
import { textMeasureClassName } from '@/components/ui/layoutStyles';
import { sectionHeadingClassName, standaloneLinkClassName } from '@/components/ui/textStyles';
import type { PageText } from '@/lib/i18n/pageText';
import { sectionLabels } from '@/lib/pageLabels';
import { PORTFOLIO_URL } from '@/lib/siteConfig';

const ABOUT_HEADING_ID = 'about-heading';

type AboutSectionProps = {
  text: PageText['about'];
};

export const AboutSection = ({ text }: AboutSectionProps) => {
  return (
    <MarginLabelSection label={sectionLabels.about} headingId={ABOUT_HEADING_ID} className="pt-14 pb-16">
      <h2 id={ABOUT_HEADING_ID} className={sectionHeadingClassName}>
        {text.title}
      </h2>
      <p className={`mt-5 ${textMeasureClassName} text-intro text-pretty`}>{text.text}</p>
      <p className="mt-6 text-lg leading-body font-semibold">
        <a href={PORTFOLIO_URL} className={standaloneLinkClassName}>
          {text.portfolioLabel}
        </a>
      </p>
    </MarginLabelSection>
  );
};
