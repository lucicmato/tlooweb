import { useId } from 'react';

type WordmarkProps = {
  className?: string;
};

/**
 * Inline copy of `brand/logo.svg` so it takes the surrounding text colour through `currentColor`. It is drawn
 * lettering, not typeset text: replacing it with a heading in the brand typeface would change the proportions between
 * the heavy and the light weight. The clip id comes from `useId` because a fixed id would repeat when the wordmark is
 * rendered twice, and `url(#…)` would then resolve to the first copy even if it is hidden.
 */
export function Wordmark({ className }: WordmarkProps) {
  const clipId = useId();

  return (
    <svg viewBox="0 -2 530 104" role="img" aria-label="TLOWeb" className={className}>
      <defs>
        <clipPath id={clipId}>
          <rect x="-20" y="0" width="570" height="100" />
        </clipPath>
      </defs>
      <g fill="currentColor">
        <path d="M0 0H76V17H46.5V100H29.5V17H0Z" />
        <path d="M86 0H103V83H144V100H86Z" />
        <path
          fillRule="evenodd"
          d="M157 50A45 52 0 1 0 247 50A45 52 0 1 0 157 50ZM174 50A28 38 0 1 0 230 50A28 38 0 1 0 174 50Z"
        />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="9">
        <g clipPath={`url(#${clipId})`} strokeLinejoin="miter">
          <path d="M262.53 -12L294.77 112" />
          <path d="M320.77 -12L288.53 112" />
          <path d="M314.53 -12L346.77 112" />
          <path d="M372.77 -12L340.53 112" />
        </g>
        <path d="M383.8 65H446.8A31.5 31.5 0 1 0 439.43 85.25" />
        <path d="M461.8 0V100" />
        <circle cx="493.3" cy="65" r="31.5" />
      </g>
    </svg>
  );
}
