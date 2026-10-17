import { Fragment } from 'react';

type BrokenLinesProps = {
  lines: readonly string[];
};

/**
 * Hard line breaks that belong to the copy (the three-line tagline, the two-line question in the diagram), so the text
 * stays one string array in the `lib/i18n` dictionaries instead of markup with `<br>` spread across components.
 */
export const BrokenLines = ({ lines }: BrokenLinesProps) => {
  return lines.map((line, index) => (
    <Fragment key={line}>
      {index > 0 && <br />}
      {line}
    </Fragment>
  ));
};
