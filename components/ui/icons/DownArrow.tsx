type DownArrowProps = {
  className?: string;
};

/**
 * A decorative arrow pointing down, 16 × 32 at the default size. It carries no stroke or fill of its own, so the
 * caller's class sets them, the same way the arrows of a drawn diagram are styled.
 */
export const DownArrow = ({ className }: DownArrowProps) => (
  <svg aria-hidden="true" width="16" height="32" viewBox="0 0 16 32" className={className}>
    <path d="M8 4V27" />
    <path d="M3 22L8 28L13 22" />
  </svg>
);
