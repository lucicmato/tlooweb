import { actionLinkClassName } from '@/components/ui/textStyles';

type SendProcessLinkProps = {
  href: string;
  label: string;
};

/**
 * The page's one call to action, shown in the hero and again under the contact questions. The hero copy points to the
 * questions first; only the contact copy opens the prefilled mail, once the visitor has read what to write.
 */
export const SendProcessLink = ({ href, label }: SendProcessLinkProps) => {
  return (
    <p className="mt-7">
      <a href={href} className={actionLinkClassName}>
        {label}
      </a>
    </p>
  );
};
