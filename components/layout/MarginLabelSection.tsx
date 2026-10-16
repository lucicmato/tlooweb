import type { ReactNode } from 'react';

import { contentColumnClassName, marginColumnClassName } from '@/components/ui/layoutStyles';
import { monoLabelClassName } from '@/components/ui/textStyles';

type MarginLabelSectionProps = {
  label: string;
  headingId: string;
  id?: string;
  // Vertical padding and the top rule differ per section in the design, so the caller sets them
  className: string;
  contentClassName?: string;
  children: ReactNode;
};

/**
 * For the sections below the hero that carry a mono label (`01`…`04`, or `TLOWeb` for About) in the left margin
 * column, with the content beside it. The hero does not use it: it has no label and spans the full container. The
 * heading stays with the caller, because in the process section it sits inside a nested column rather than at the top
 * of the content.
 */
export const MarginLabelSection = ({
  label,
  headingId,
  id,
  className,
  contentClassName = '',
  children,
}: MarginLabelSectionProps) => {
  return (
    <section id={id} aria-labelledby={headingId} className={`flex flex-wrap gap-x-10 gap-y-3 ${className}`}>
      <div className={`${marginColumnClassName} ${monoLabelClassName} pt-2`}>{label}</div>
      <div className={`${contentColumnClassName} ${contentClassName}`}>{children}</div>
    </section>
  );
};
