import { mailtoHref } from '@/lib/mailtoHref';
import { pageText } from '@/lib/pageText';
import { CONTACT_EMAIL, MAIL_SUBJECT } from '@/lib/siteConfig';

// CRLF is what RFC 6068 prescribes for line breaks in a mailto body
const LINE_BREAK = '\r\n';

const body = pageText.contact.questions
  .map((question, index) => `${index + 1}. ${question}`)
  .join(LINE_BREAK + LINE_BREAK);

export const CONTACT_MAILTO = mailtoHref(CONTACT_EMAIL, { subject: MAIL_SUBJECT, body });
