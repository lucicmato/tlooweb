type ArrowHeadMarkerProps = {
  id: string;
  className?: string;
};

/**
 * A filled arrowhead for `marker-end` on SVG paths. It goes inside the `<defs>` of the SVG that uses it, and the id
 * should come from `useId` in that component: a fixed id would repeat with a second copy, and `url(#…)` would then
 * resolve to the first one.
 */
export const ArrowHeadMarker = ({ id, className }: ArrowHeadMarkerProps) => (
  <marker id={id} orient="auto" markerWidth="5" markerHeight="5" refX="2" refY="2">
    <path d="M0 0L4 2L0 4Z" className={className} />
  </marker>
);
