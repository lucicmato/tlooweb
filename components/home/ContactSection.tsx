import { SendProcessLink } from '@/components/contact/SendProcessLink';
import { MarginLabelSection } from '@/components/layout/MarginLabelSection';
import { ruledSectionClassName, textMeasureClassName } from '@/components/ui/layoutStyles';
import { rowNumberClassName, sectionHeadingClassName } from '@/components/ui/textStyles';
import { contactMailto } from '@/lib/contactMailto';
import type { PageText } from '@/lib/i18n/pageText';
import { sectionLabels } from '@/lib/pageLabels';
import { CONTACT_ID } from '@/lib/siteConfig';

const CONTACT_HEADING_ID = 'contact-heading';

type ContactSectionProps = {
  text: PageText['contact'];
  sendProcessLabel: string;
};

export const ContactSection = ({ text, sendProcessLabel }: ContactSectionProps) => {
  return (
    <MarginLabelSection
      id={CONTACT_ID}
      label={sectionLabels.contact}
      headingId={CONTACT_HEADING_ID}
      className={`${ruledSectionClassName} pb-20`}
    >
      <h2 id={CONTACT_HEADING_ID} className={sectionHeadingClassName}>
        {text.title}
      </h2>
      <div className={`mt-6 ${textMeasureClassName} border border-line-strong px-box-x py-box-y`}>
        <p>{text.intro}</p>
        <ol className="mt-5">
          {text.questions.map((question, index) => (
            <li key={question} className="flex gap-4 border-t border-line py-3 last:border-b">
              <span className={`w-5 ${rowNumberClassName}`}>{index + 1}</span>
              <span className="font-semibold">{question}</span>
            </li>
          ))}
        </ol>
        <SendProcessLink href={contactMailto(text)} label={sendProcessLabel} />
      </div>
      <p className={`mt-7 ${textMeasureClassName} text-ink-muted`}>{text.ideaNote}</p>
    </MarginLabelSection>
  );
};
