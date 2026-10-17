import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/locales';
import type { Locale } from '@/lib/i18n/locales';

/**
 * Narrows the `[lang]` segment to a supported locale. The proxy prefixes every other path, but paths with a dot skip
 * it as files, so `/robots.txt` still arrives here as a `lang`; anything unsupported is a 404.
 */
export const requireLocale = (lang: string): Locale => {
  if (!isLocale(lang)) notFound();
  return lang;
};
