import type { ReactNode } from 'react';

import { flowCardLabelClassName } from '@/components/home/flowCardStyles';

type FlowCardBodyProps = {
  label?: string;
  title: string;
  // The diagram sets the label inline before a line break, the list as a block; the two sit 1px apart in the design
  inlineLabel?: boolean;
  children?: ReactNode;
};

export const FlowCardBody = ({ label, title, inlineLabel = false, children }: FlowCardBodyProps) => {
  return (
    <span>
      {label !== undefined &&
        (inlineLabel ? (
          <>
            <span className={flowCardLabelClassName}>{label}</span>
            <br />
          </>
        ) : (
          <span className={`block ${flowCardLabelClassName}`}>{label}</span>
        ))}
      <b className="font-semibold">{title}</b>
      {children !== undefined && (
        <>
          <br />
          {children}
        </>
      )}
    </span>
  );
};
