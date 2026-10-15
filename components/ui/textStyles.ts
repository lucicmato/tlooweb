/**
 * Shared Tailwind strings: each is used in more than one place, so a change to the focus ring or the heading size is
 * one edit. Hover only changes the underline and colour, with no transition, because the brief allows no animation.
 */
export const linkClassName =
  'text-link underline decoration-1 underline-offset-4 hover:text-text hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link';

// Padding gives a link that sits alone on its line a touch target taller than the text itself
export const standaloneLinkClassName = `${linkClassName} inline-block py-2`;

// Weight, line height and tracking are the heading rules of brand/README.md; only the size differs per level
const headingBaseClassName = 'font-semibold leading-[1.15] tracking-[-0.01em]';

export const pageHeadingClassName = `${headingBaseClassName} text-4xl text-balance sm:text-5xl`;
export const sectionHeadingClassName = `${headingBaseClassName} text-2xl`;
export const itemHeadingClassName = headingBaseClassName;
