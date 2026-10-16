/**
 * The page grid of the design is built from flex-wrap with flex-basis, not from breakpoints: the margin column (160 to
 * 200px) drops above the content by itself once the row can no longer hold it next to 760px of content. A grow factor
 * of 999 makes the content take all the free width while both fit.
 */
export const pageContainerClassName = 'mx-auto w-full max-w-page px-5';

export const marginColumnClassName = 'grow basis-40 max-w-50';
export const contentColumnClassName = 'min-w-0 grow-999 basis-190';

export const textMeasureClassName = 'max-w-190';

// Every section after the intro opens with a hairline and the same top spacing; only the bottom padding differs
export const ruledSectionClassName = 'border-t border-line pt-12';
