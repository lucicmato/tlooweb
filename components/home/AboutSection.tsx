import { MarginLabelSection } from '@/components/layout/MarginLabelSection';
import { textMeasureClassName } from '@/components/ui/layoutStyles';
import { sectionHeadingClassName, standaloneLinkClassName } from '@/components/ui/textStyles';
import { pageText } from '@/lib/pageText';
import { PORTFOLIO_URL } from '@/lib/siteConfig';

const ABOUT_HEADING_ID = 'about-heading';

export const AboutSection = () => {
  return (
    <MarginLabelSection label={pageText.about.label} headingId={ABOUT_HEADING_ID} className="pt-14 pb-16">
      <h2 id={ABOUT_HEADING_ID} className={sectionHeadingClassName}>
        {pageText.about.title}
      </h2>
      <p className={`mt-5 ${textMeasureClassName} text-intro text-pretty`}>{pageText.about.text}</p>
      <p className="mt-6 text-lg leading-body font-semibold">
        <a href={PORTFOLIO_URL} className={standaloneLinkClassName}>
          {pageText.about.portfolioLabel}
        </a>
      </p>
    </MarginLabelSection>
  );
};
