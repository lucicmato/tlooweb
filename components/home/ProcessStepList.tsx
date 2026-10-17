import { FlowCardBody } from '@/components/home/FlowCardBody';
import {
  flowArrowClassName,
  flowCardClassName,
  flowCardDecisionClassName,
  flowCardFinalClassName,
  flowCardLabelClassName,
  flowCardLinkClassName,
  flowCardNoteClassName,
  flowCardStartClassName,
  flowCardStepClassName,
} from '@/components/home/flowCardStyles';
import { DownArrow } from '@/components/ui/icons/DownArrow';
import type { PageText } from '@/lib/i18n/pageText';
import { stepLabels } from '@/lib/pageLabels';
import { CONTACT_ID } from '@/lib/siteConfig';

const stepClassName = 'flex flex-col';
const answerClassName = 'flex items-baseline gap-3 text-card-note';
const downArrowClassName = `mx-auto block ${flowArrowClassName}`;
const answerMarkClassName = `w-6 flex-none uppercase ${flowCardLabelClassName}`;

type ProcessStepListProps = {
  text: PageText['process'];
};

/**
 * The narrow-screen form of the process diagram: the branch becomes two answer lines inside the question card, so the
 * steps read top to bottom without a sideways detour. The text is the diagram's, from the same `process` entries.
 */
export const ProcessStepList = ({ text }: ProcessStepListProps) => {
  return (
    <ol aria-label={text.flowTitle} className="flex min-w-0 basis-full flex-col diagram:hidden">
      <li className={stepClassName}>
        <div className={`${flowCardClassName} ${flowCardStartClassName}`}>
          <FlowCardBody label={text.today.label} title={text.today.title}>
            <span className={flowCardNoteClassName}>{text.today.note}</span>
          </FlowCardBody>
        </div>
      </li>
      <li className={stepClassName}>
        <DownArrow className={downArrowClassName} />
        <div className={`${flowCardClassName} ${flowCardStepClassName}`}>
          <FlowCardBody label={stepLabels.send} title={text.send.title}>
            <a href={`#${CONTACT_ID}`} className={flowCardLinkClassName}>
              {text.send.linkLabel}
            </a>
          </FlowCardBody>
        </div>
      </li>
      <li className={stepClassName}>
        <DownArrow className={downArrowClassName} />
        <div className={`${flowCardClassName} ${flowCardDecisionClassName}`}>
          <span className={`block ${flowCardLabelClassName}`}>{text.decision.label}</span>
          <b className="font-semibold">{text.decision.titleLines.join(' ')}</b>
          <span className={`mt-2 ${answerClassName}`}>
            <span className={answerMarkClassName}>{text.decision.yes}</span>
            <span>{text.decision.yesNote}</span>
          </span>
          <span className={`mt-1 ${answerClassName}`}>
            <span className={answerMarkClassName}>{text.decision.no}</span>
            <span>{text.decision.noNote}</span>
          </span>
        </div>
      </li>
      <li className={stepClassName}>
        <DownArrow className={downArrowClassName} />
        <div className={`${flowCardClassName} ${flowCardStepClassName}`}>
          <FlowCardBody label={stepLabels.build} title={text.build.title} />
        </div>
      </li>
      <li className={stepClassName}>
        <DownArrow className={downArrowClassName} />
        <div className={`${flowCardClassName} ${flowCardFinalClassName}`}>
          <FlowCardBody label={stepLabels.own} title={text.own.title}>
            <span className={flowCardNoteClassName}>{text.own.note}</span>
          </FlowCardBody>
        </div>
      </li>
    </ol>
  );
};
