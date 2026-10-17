import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LOCALE_COOKIE, LOCALES } from '@/lib/i18n/locales';
import { resolveLocale } from '@/lib/i18n/resolveLocale';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * Every path without a language prefix is redirected to one. The redirect depends on the visitor's cookie and browser
 * languages, so it must not be cached: a CDN that kept it would send everyone to the first visitor's language. A visit
 * to a bare `/hr` or `/en` (the picker's links, or a shared link) is remembered as the visitor's choice.
 */
export const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const savedLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const pathLocale = LOCALES.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));

  if (pathLocale === undefined) {
    const locale = resolveLocale({ cookie: savedLocale, acceptLanguage: request.headers.get('accept-language') });
    const url = request.nextUrl.clone();
    url.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;

    const response = NextResponse.redirect(url, 307);
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Vary', 'Accept-Language, Cookie');
    return response;
  }

  const response = NextResponse.next();
  if (pathname === `/${pathLocale}` && savedLocale !== pathLocale) {
    response.cookies.set(LOCALE_COOKIE, pathLocale, { maxAge: ONE_YEAR_IN_SECONDS, sameSite: 'lax', path: '/' });
  }
  return response;
};

export const config = {
  // `_next` serves the build output and the dev server's own endpoints, and paths with a dot are files; none of them
  // has a language
  matcher: ['/((?!_next|.*\\..*).*)'],
};
