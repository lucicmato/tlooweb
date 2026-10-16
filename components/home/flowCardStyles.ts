import { linkClassName } from '@/components/ui/textStyles';

/**
 * Card looks shared by the process diagram and its narrow-screen step list, so both versions change together. The
 * final card uses `brand-on-ink`, which swaps the text and label tokens to their light variants on the ink fill.
 */
export const flowCardTextClassName = 'text-card';
export const flowCardClassName = `px-4 py-3 ${flowCardTextClassName}`;

export const flowCardStartClassName = 'border border-dashed border-line-strong';
export const flowCardStepClassName = 'border border-line-strong bg-paper-raised';
export const flowCardDecisionClassName = 'bg-paper-sunk';
export const flowCardFinalClassName = 'brand-on-ink border border-ink bg-surface text-text';

export const flowCardLabelClassName = 'font-mono text-card-label text-ink-muted';
export const flowCardNoteClassName = 'text-card-note text-text-soft';
// Vertical padding on an inline link enlarges its tap target without moving the 22px line it sits on
export const flowCardLinkClassName = `${linkClassName} py-1.5 text-card-note`;
export const flowArrowClassName = 'fill-none stroke-ink-muted stroke-2 [stroke-linecap:round] [stroke-linejoin:round]';
