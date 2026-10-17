import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/locales';
import type { Locale } from '@/lib/i18n/locales';

// Bosnian, Serbian, Serbo-Croatian and Montenegrin readers are better served by the Croatian page than the English one
const CROATIAN_READERS = ['hr', 'bs', 'sr', 'sh', 'cnr'] as const;

// `q=0` marks a language as "not acceptable", so it must not tip the choice
const refusedQualityPattern = /^q=0(?:\.0{0,3})?$/;

type LocaleSignals = {
  cookie: string | undefined;
  acceptLanguage: string | null;
};

/**
 * The visitor's last pick wins. Otherwise a Croatian-family language anywhere in `Accept-Language` means Croatian,
 * because many people here run an English browser with Croatian further down the list. A header without one means
 * English, and no header at all (link preview crawlers send none) means the default, Croatian.
 */
export const resolveLocale = ({ cookie, acceptLanguage }: LocaleSignals): Locale => {
  if (cookie !== undefined && isLocale(cookie)) return cookie;
  if (acceptLanguage === null || acceptLanguage.trim() === '') return DEFAULT_LOCALE;

  const languages = acceptLanguage.split(',').flatMap((range) => {
    const [tag = '', ...parameters] = range.split(';').map((part) => part.trim());
    if (parameters.some((parameter) => refusedQualityPattern.test(parameter))) return [];

    const [primaryLanguage = ''] = tag.toLowerCase().split('-');
    return [primaryLanguage];
  });

  return languages.some((language) => CROATIAN_READERS.some((code) => code === language)) ? 'hr' : 'en';
};
