/**
 * Shared Tailwind strings: each is used in more than one place, so a change to the focus ring or the heading size is
 * one edit. Hover only changes the underline and colour, with no transition, because the brief allows no animation.
 */
export const focusRingClassName = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link';

export const linkClassName = `text-link underline decoration-1 underline-offset-4 hover:text-text hover:decoration-2 ${focusRingClassName}`;

// Padding gives a link that sits alone on its line a touch target taller than the text itself
export const standaloneLinkClassName = `${linkClassName} inline-block py-2`;

// The framed call to action takes the text colour, not petrol, because the frame already marks it; underline on hover
export const actionLinkClassName = `inline-block border border-text px-5.5 py-3 text-action font-semibold text-text no-underline underline-offset-4 hover:underline hover:decoration-2 ${focusRingClassName}`;

export const pageHeadingClassName = 'text-display font-semibold text-balance';
export const sectionHeadingClassName = 'text-h2 font-semibold';
export const cardHeadingClassName = 'text-h3 font-semibold text-balance';
export const itemHeadingClassName = 'text-item font-semibold';

export const monoLabelClassName = 'font-mono text-label text-ink-muted';
// Row numbers keep the body line height and drop 4px, so they sit level with the first line of the text beside them
export const rowNumberClassName = `flex-none pt-1 ${monoLabelClassName} leading-body`;
export const monoTagClassName = 'font-mono text-label-sm tracking-label text-ink-muted';
