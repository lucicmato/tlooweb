import { MarginLabelSection } from '@/components/layout/MarginLabelSection';
import { ruledSectionClassName } from '@/components/ui/layoutStyles';
import { cardHeadingClassName, monoTagClassName, sectionHeadingClassName } from '@/components/ui/textStyles';
import type { PageText } from '@/lib/i18n/pageText';
import { sectionLabels } from '@/lib/pageLabels';

const SERVICES_HEADING_ID = 'services-heading';

type ServicesSectionProps = {
  text: PageText['services'];
};

/**
 * Three columns with a flex-basis of 220px: at tablet width they still fit side by side, and only on a phone they
 * stack. An ink rule above each column replaces a card frame, which the brand does not use.
 */
export const ServicesSection = ({ text }: ServicesSectionProps) => {
  return (
    <MarginLabelSection
      label={sectionLabels.services}
      headingId={SERVICES_HEADING_ID}
      className={`${ruledSectionClassName} pb-14`}
    >
      <h2 id={SERVICES_HEADING_ID} className={sectionHeadingClassName}>
        {text.title}
      </h2>
      <div className="mt-8 flex flex-wrap gap-x-10 gap-y-9">
        {text.items.map((item) => (
          <div key={item.title} className="flex min-w-0 grow basis-55 flex-col gap-2.5 border-t border-text pt-4.5">
            <span className={monoTagClassName}>{item.tag}</span>
            <h3 className={cardHeadingClassName}>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </MarginLabelSection>
  );
};
