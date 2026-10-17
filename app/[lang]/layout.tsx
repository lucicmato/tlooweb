import { Schibsted_Grotesk } from 'next/font/google';
import { LOCALES } from '@/lib/i18n/locales';
import { requireLocale } from '@/lib/i18n/requireLocale';

import '@/app/globals.css';

// `latin-ext` carries the Croatian letters outside basic Latin; without it they would fall back to another font
const schibstedGrotesk = Schibsted_Grotesk({
  variable: '--font-schibsted',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

const RootLayout = async ({ children, params }: LayoutProps<'/[lang]'>) => {
  const locale = requireLocale((await params).lang);

  return (
    <html lang={locale} className={`${schibstedGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-surface font-sans text-lg leading-body text-text">{children}</body>
    </html>
  );
};

export default RootLayout;
