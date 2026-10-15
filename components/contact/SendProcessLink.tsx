import { standaloneLinkClassName } from '@/components/ui/textStyles';
import { CONTACT_MAILTO } from '@/lib/contactMailto';
import { pageText } from '@/lib/pageText';

/**
 * The page's one call to action, shown in the hero and again under the contact questions. One component keeps both
 * copies on the same prefilled mailto, so the questions in the email always match the ones on the page.
 */
export function SendProcessLink() {
  return (
    <p className="mt-8">
      <a href={CONTACT_MAILTO} className={standaloneLinkClassName}>
        {pageText.sendProcessLabel}
      </a>
    </p>
  );
}
