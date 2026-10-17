export const LOCALES = ['hr', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

// Croatian is the language of the business, so it is also the answer when a request names no language at all
export const DEFAULT_LOCALE: Locale = 'hr';

export const LOCALE_COOKIE = 'locale';

export const isLocale = (value: string): value is Locale => LOCALES.some((locale) => locale === value);

// Open Graph wants language_TERRITORY, not the bare language code the URLs use
export const openGraphLocales = { hr: 'hr_HR', en: 'en_US' } as const satisfies Record<Locale, string>;

// Each language is named in itself, so the picker reads the same on both pages
export const localeNames = { hr: 'Hrvatski', en: 'English' } as const satisfies Record<Locale, string>;
