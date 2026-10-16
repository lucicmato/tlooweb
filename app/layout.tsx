import type { Metadata } from 'next';
import { Schibsted_Grotesk } from 'next/font/google';
import { metaDescription, pageText } from '@/lib/pageText';
import { SITE_URL } from '@/lib/siteConfig';

import './globals.css';

// `latin-ext` carries the Croatian letters outside basic Latin; without it they would fall back to another font
const schibstedGrotesk = Schibsted_Grotesk({
  variable: '--font-schibsted',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: pageText.meta.title,
  description: metaDescription,
  openGraph: {
    title: pageText.meta.title,
    description: metaDescription,
    locale: 'hr_HR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: pageText.meta.title,
    description: metaDescription,
  },
};

const RootLayout = ({ children }: LayoutProps<'/'>) => {
  return (
    <html lang="hr" className={`${schibstedGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-surface font-sans text-lg leading-body text-text">{children}</body>
    </html>
  );
};

export default RootLayout;
