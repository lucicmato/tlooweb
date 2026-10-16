import { MarginLabelSection } from '@/components/layout/MarginLabelSection';
import { ruledSectionClassName } from '@/components/ui/layoutStyles';
import { itemHeadingClassName, rowNumberClassName, sectionHeadingClassName } from '@/components/ui/textStyles';
import { pageText } from '@/lib/pageText';

const EXAMPLES_HEADING_ID = 'examples-heading';

export const ExamplesSection = () => {
  return (
    <MarginLabelSection
      label={pageText.examples.label}
      headingId={EXAMPLES_HEADING_ID}
      className={`${ruledSectionClassName} pb-14`}
    >
      <h2 id={EXAMPLES_HEADING_ID} className={sectionHeadingClassName}>
        {pageText.examples.title}
      </h2>
      <p className="mt-5 text-ink-muted">{pageText.examples.intro}</p>
      {/* The strong rules close the table at top and bottom; the hairlines only separate rows inside it */}
      <ol className="mt-8 border-t border-line-strong">
        {pageText.examples.items.map((item, index) => (
          <li
            key={item.title}
            className="flex flex-wrap gap-x-8 gap-y-2 border-b border-line py-6 last:border-line-strong"
          >
            <span className={`w-12 ${rowNumberClassName}`}>P-{index + 1}</span>
            <h3 className={`min-w-0 grow basis-55 ${itemHeadingClassName}`}>{item.title}</h3>
            <p className="min-w-0 grow-2 basis-90">{item.text}</p>
          </li>
        ))}
      </ol>
    </MarginLabelSection>
  );
};
