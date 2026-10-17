import { ProcessDiagram } from '@/components/home/ProcessDiagram';
import { ProcessStepList } from '@/components/home/ProcessStepList';
import { MarginLabelSection } from '@/components/layout/MarginLabelSection';
import { ruledSectionClassName } from '@/components/ui/layoutStyles';
import { sectionHeadingClassName } from '@/components/ui/textStyles';
import type { PageText } from '@/lib/i18n/pageText';
import { sectionLabels } from '@/lib/pageLabels';

const PROCESS_HEADING_ID = 'process-heading';

type ProcessSectionProps = {
  text: PageText['process'];
};

/**
 * Both forms of the flow are rendered and CSS shows one: the switch at 600px is a layout decision, and a client-side
 * width check would flash the wrong form before hydration.
 */
export const ProcessSection = ({ text }: ProcessSectionProps) => {
  return (
    <MarginLabelSection
      label={sectionLabels.process}
      headingId={PROCESS_HEADING_ID}
      className={`${ruledSectionClassName} pb-16`}
      contentClassName="flex flex-wrap items-start gap-x-10 gap-y-8"
    >
      <div className="min-w-0 grow basis-65">
        <h2 id={PROCESS_HEADING_ID} className={sectionHeadingClassName}>
          {text.title}
        </h2>
        <p className="mt-5">{text.intro}</p>
      </div>
      <ProcessDiagram text={text} />
      <ProcessStepList text={text} />
    </MarginLabelSection>
  );
};
