import type { PageText } from '@/lib/i18n/pageText';
import { mailtoHref } from '@/lib/mailtoHref';
import { CONTACT_EMAIL } from '@/lib/siteConfig';

// CRLF is what RFC 6068 prescribes for line breaks in a mailto body
const LINE_BREAK = '\r\n';

/**
 * The prefilled mail repeats the contact questions as a numbered list, in the language of the page the visitor came
 * from, so the questions in the mail always match the ones on the screen.
 */
export const contactMailto = ({ questions, mailSubject }: PageText['contact']) =>
  mailtoHref(CONTACT_EMAIL, {
    subject: mailSubject,
    body: questions.map((question, index) => `${index + 1}. ${question}`).join(LINE_BREAK + LINE_BREAK),
  });
