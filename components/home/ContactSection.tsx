import { SendProcessLink } from '@/components/contact/SendProcessLink';
import { MarginLabelSection } from '@/components/layout/MarginLabelSection';
import { ruledSectionClassName, textMeasureClassName } from '@/components/ui/layoutStyles';
import { rowNumberClassName, sectionHeadingClassName } from '@/components/ui/textStyles';
import { CONTACT_MAILTO } from '@/lib/contactMailto';
import { pageText } from '@/lib/pageText';
import { CONTACT_ID } from '@/lib/siteConfig';

const CONTACT_HEADING_ID = 'contact-heading';

export const ContactSection = () => {
  return (
    <MarginLabelSection
      id={CONTACT_ID}
      label={pageText.contact.label}
      headingId={CONTACT_HEADING_ID}
      className={`${ruledSectionClassName} pb-20`}
    >
      <h2 id={CONTACT_HEADING_ID} className={sectionHeadingClassName}>
        {pageText.contact.title}
      </h2>
      <div className={`mt-6 ${textMeasureClassName} border border-line-strong px-box-x py-box-y`}>
        <p>{pageText.contact.intro}</p>
        <ol className="mt-5">
          {pageText.contact.questions.map((question, index) => (
            <li key={question} className="flex gap-4 border-t border-line py-3 last:border-b">
              <span className={`w-5 ${rowNumberClassName}`}>{index + 1}</span>
              <span className="font-semibold">{question}</span>
            </li>
          ))}
        </ol>
        <SendProcessLink href={CONTACT_MAILTO} />
      </div>
      <p className={`mt-7 ${textMeasureClassName} text-ink-muted`}>{pageText.contact.ideaNote}</p>
    </MarginLabelSection>
  );
};
