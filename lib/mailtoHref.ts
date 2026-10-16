type MailtoFields = {
  subject?: string;
  body?: string;
};

/**
 * `encodeURIComponent` on each value, not on the whole URL, and not `URLSearchParams`: the `?` and `&` between the
 * fields must stay literal, and `URLSearchParams` writes a space as `+`, which mail clients show as a plus sign.
 */
export const mailtoHref = (email: string, { subject, body }: MailtoFields = {}) => {
  const fields = [
    subject === undefined ? undefined : `subject=${encodeURIComponent(subject)}`,
    body === undefined ? undefined : `body=${encodeURIComponent(body)}`,
  ].filter((field) => field !== undefined);

  return fields.length > 0 ? `mailto:${email}?${fields.join('&')}` : `mailto:${email}`;
};
