import { pageText } from '@/lib/pageText';
import { CONTACT_EMAIL, MAIL_SUBJECT } from '@/lib/siteConfig';

// CRLF is what RFC 6068 prescribes for line breaks in a mailto body
const LINE_BREAK = '\r\n';

const body = pageText.contact.questions
  .map((question, index) => `${index + 1}. ${question}`)
  .join(LINE_BREAK + LINE_BREAK);

/**
 * `encodeURIComponent` on the parts, not on the whole URL: the `?` and `&` that separate the fields must stay literal,
 * while spaces and diacritics in the subject and body have to be percent-encoded.
 */
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(MAIL_SUBJECT)}&body=${encodeURIComponent(body)}`;
