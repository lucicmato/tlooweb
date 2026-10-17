import { en } from '@/lib/i18n/en';
import { hr } from '@/lib/i18n/hr';
import type { Locale } from '@/lib/i18n/locales';

// Literal types widen to `string` and tuples stay tuples: a translation may say anything, but in the same shape
type Widen<T> = T extends string ? string : { readonly [K in keyof T]: Widen<T[K]> };

export type PageText = Widen<typeof hr>;

const pageTexts: Record<Locale, PageText> = { hr, en };

export const getPageText = (locale: Locale) => pageTexts[locale];
