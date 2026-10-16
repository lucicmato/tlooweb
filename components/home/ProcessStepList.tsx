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
import { pageText } from '@/lib/pageText';
import { CONTACT_ID } from '@/lib/siteConfig';

const stepClassName = 'flex flex-col';
const answerClassName = 'flex items-baseline gap-3 text-card-note';
const downArrowClassName = `mx-auto block ${flowArrowClassName}`;
const answerMarkClassName = `w-6 flex-none uppercase ${flowCardLabelClassName}`;

/**
 * The narrow-screen form of the process diagram: the branch becomes two answer lines inside the question card, so the
 * steps read top to bottom without a sideways detour. The text is the diagram's, from the same `pageText` entries.
 */
export const ProcessStepList = () => {
  const { process } = pageText;

  return (
    <ol aria-label={process.flowTitle} className="flex min-w-0 basis-full flex-col diagram:hidden">
      <li className={stepClassName}>
        <div className={`${flowCardClassName} ${flowCardStartClassName}`}>
          <FlowCardBody label={process.today.label} title={process.today.title}>
            <span className={flowCardNoteClassName}>{process.today.note}</span>
          </FlowCardBody>
        </div>
      </li>
      <li className={stepClassName}>
        <DownArrow className={downArrowClassName} />
        <div className={`${flowCardClassName} ${flowCardStepClassName}`}>
          <FlowCardBody label={process.send.label} title={process.send.title}>
            <a href={`#${CONTACT_ID}`} className={flowCardLinkClassName}>
              {process.send.linkLabel}
            </a>
          </FlowCardBody>
        </div>
      </li>
      <li className={stepClassName}>
        <DownArrow className={downArrowClassName} />
        <div className={`${flowCardClassName} ${flowCardDecisionClassName}`}>
          <span className={`block ${flowCardLabelClassName}`}>{process.decision.label}</span>
          <b className="font-semibold">{process.decision.titleLines.join(' ')}</b>
          <span className={`mt-2 ${answerClassName}`}>
            <span className={answerMarkClassName}>{process.decision.yes}</span>
            <span>{process.decision.yesNote}</span>
          </span>
          <span className={`mt-1 ${answerClassName}`}>
            <span className={answerMarkClassName}>{process.decision.no}</span>
            <span>{process.decision.noNote}</span>
          </span>
        </div>
      </li>
      <li className={stepClassName}>
        <DownArrow className={downArrowClassName} />
        <div className={`${flowCardClassName} ${flowCardStepClassName}`}>
          <FlowCardBody label={process.build.label} title={process.build.title} />
        </div>
      </li>
      <li className={stepClassName}>
        <DownArrow className={downArrowClassName} />
        <div className={`${flowCardClassName} ${flowCardFinalClassName}`}>
          <FlowCardBody label={process.own.label} title={process.own.title}>
            <span className={flowCardNoteClassName}>{process.own.note}</span>
          </FlowCardBody>
        </div>
      </li>
    </ol>
  );
};
