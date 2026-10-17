import { useId } from 'react';

import { FlowCardBody } from '@/components/home/FlowCardBody';
import {
  flowArrowClassName,
  flowCardClassName,
  flowCardDecisionClassName,
  flowCardFinalClassName,
  flowCardLinkClassName,
  flowCardNoteClassName,
  flowCardStartClassName,
  flowCardStepClassName,
  flowCardTextClassName,
} from '@/components/home/flowCardStyles';
import { BrokenLines } from '@/components/ui/BrokenLines';
import { ArrowHeadMarker } from '@/components/ui/icons/ArrowHeadMarker';
import type { PageText } from '@/lib/i18n/pageText';
import { stepLabels } from '@/lib/pageLabels';
import { CONTACT_ID } from '@/lib/siteConfig';

// Coordinates on the 540 × 764 canvas of the design, 1px each at the default font size; the boxes use the same grid
const ARROWS = [
  { d: 'M156 140V183', head: true },
  { d: 'M156 284V327', head: true },
  { d: 'M156 444V495', head: true },
  { d: 'M284 388H347', head: true },
  { d: 'M438 436V548', head: false },
  { d: 'M438 548H301', head: true },
  { d: 'M156 596V639', head: true },
] as const;

const positionedClassName = 'absolute flex items-center';
const boxClassName = `${positionedClassName} ${flowCardClassName}`;
const branchMarkClassName = 'absolute w-6 text-center font-mono text-card-mark text-ink-muted';

type ProcessDiagramProps = {
  text: PageText['process'];
};

/**
 * The diagram keeps the 540 × 764 canvas of the design, so cards and arrows stay where they were drawn; the frame
 * scrolls sideways instead of squeezing it. One SVG holds every arrow under the cards, and the marker id comes from
 * `useId` so a second copy of the diagram could not point its arrows at the first.
 */
export const ProcessDiagram = ({ text }: ProcessDiagramProps) => {
  const arrowHeadId = useId();

  return (
    <figure className="hidden min-w-0 shrink grow-0 basis-145 border border-line-strong diagram:block">
      <figcaption className="border-b border-line px-5 py-4 text-item font-semibold">{text.flowTitle}</figcaption>
      <div className="overflow-x-auto py-4">
        <div className="relative mx-auto h-191 w-135">
          <svg aria-hidden="true" viewBox="0 0 540 764" className={`absolute inset-0 size-full ${flowArrowClassName}`}>
            <defs>
              <ArrowHeadMarker id={arrowHeadId} className="fill-ink-muted stroke-none" />
            </defs>
            {ARROWS.map((arrow) => (
              <path key={arrow.d} d={arrow.d} markerEnd={arrow.head ? `url(#${arrowHeadId})` : undefined} />
            ))}
          </svg>

          <div className={`${boxClassName} top-6 left-4 h-29 w-70 ${flowCardStartClassName}`}>
            <FlowCardBody inlineLabel label={text.today.label} title={text.today.title}>
              <span className={flowCardNoteClassName}>{text.today.note}</span>
            </FlowCardBody>
          </div>
          <div className={`${boxClassName} top-47 left-4 h-24 w-70 ${flowCardStepClassName}`}>
            <FlowCardBody inlineLabel label={stepLabels.send} title={text.send.title}>
              <a href={`#${CONTACT_ID}`} className={flowCardLinkClassName}>
                {text.send.linkLabel}
              </a>
            </FlowCardBody>
          </div>
          <div
            className={`${positionedClassName} top-83 left-7 h-28 w-64 justify-center p-2 text-center ${flowCardTextClassName} font-semibold [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)] ${flowCardDecisionClassName}`}
          >
            <span>
              <BrokenLines lines={text.decision.titleLines} />
            </span>
          </div>
          {/*
            Each branch mark comes right before the card it leads to. The arrows carry the branch only for the eye, so
            this order is what a screen reader gets: question, the "no" mark, talk, the "yes" mark, step 2. The boxes
            are absolutely positioned and do not overlap, so the order does not change the drawing
          */}
          <div className={`${branchMarkClassName} top-90 left-76.5`}>{text.decision.no}</div>
          <div className={`${boxClassName} top-85 left-88 h-24 w-43 ${flowCardStepClassName}`}>
            <FlowCardBody title={text.talk.title}>
              <span className={flowCardNoteClassName}>{text.talk.note}</span>
            </FlowCardBody>
          </div>
          <div className={`${branchMarkClassName} top-113 left-42`}>{text.decision.yes}</div>
          <div className={`${boxClassName} top-125 left-4 h-24 w-70 ${flowCardStepClassName}`}>
            <FlowCardBody inlineLabel label={stepLabels.build} title={text.build.title} />
          </div>
          <div className={`${boxClassName} top-161 left-4 h-24 w-70 ${flowCardFinalClassName}`}>
            <FlowCardBody inlineLabel label={stepLabels.own} title={text.own.title}>
              <span className={flowCardNoteClassName}>{text.own.note}</span>
            </FlowCardBody>
          </div>
        </div>
      </div>
    </figure>
  );
};
