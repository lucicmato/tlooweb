export const BRAND_NAME = 'TLOWeb';

/**
 * Labels that belong to the layout rather than to a language: the section numbers in the margin, the step numbers of
 * the process and the copyright line. Both dictionaries share them, so renumbering a section is one edit.
 */
export const sectionLabels = {
  about: BRAND_NAME,
  services: '01',
  process: '02',
  examples: '03',
  contact: '04',
} as const;

export const stepLabels = {
  send: '1',
  build: '2',
  own: '3',
} as const;

// The year is written out, not computed: it is part of the approved copy and changes with a release, not a clock
export const COPYRIGHT = `© 2026 ${BRAND_NAME}`;
