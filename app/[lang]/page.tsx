import type { Metadata } from 'next';
import { AboutSection } from '@/components/home/AboutSection';
import { ContactSection } from '@/components/home/ContactSection';
import { ExamplesSection } from '@/components/home/ExamplesSection';
import { HeroSection } from '@/components/home/HeroSection';
import { ProcessSection } from '@/components/home/ProcessSection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { pageContainerClassName } from '@/components/ui/layoutStyles';
import { LOCALES, openGraphLocales } from '@/lib/i18n/locales';
import { getPageText } from '@/lib/i18n/pageText';
import { requireLocale } from '@/lib/i18n/requireLocale';
import { openGraphImageSize } from '@/lib/openGraphImageSize';
import { BRAND_NAME } from '@/lib/pageLabels';
import { SITE_URL } from '@/lib/siteConfig';

/**
 * The metadata lives on the page, not the layout: the `opengraph-image` file convention fills `openGraph.images` again
 * at the page level, without an alt text, unless the page sets the images itself. Setting them here gives each
 * language its own alt; the Twitter card inherits the image because it sets none of its own.
 */
export const generateMetadata = async ({ params }: Pick<PageProps<'/[lang]'>, 'params'>): Promise<Metadata> => {
  const locale = requireLocale((await params).lang);
  const text = getPageText(locale);
  const tagline = text.hero.titleLines.join(' ');
  const title = `${BRAND_NAME} · ${tagline}`;
  const description = `${text.hero.lead} ${text.hero.text}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      // `x-default` is the bare domain, where the proxy picks a language for a visitor who did not choose one
      languages: { hr: '/hr', en: '/en', 'x-default': '/' },
    },
    openGraph: {
      title,
      description,
      locale: openGraphLocales[locale],
      alternateLocale: LOCALES.filter((other) => other !== locale).map((other) => openGraphLocales[other]),
      type: 'website',
      images: [
        {
          url: `/${locale}/opengraph-image`,
          ...openGraphImageSize,
          type: 'image/png',
          alt: `${BRAND_NAME}. ${tagline}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
};

const Home = async ({ params }: PageProps<'/[lang]'>) => {
  const locale = requireLocale((await params).lang);
  const text = getPageText(locale);

  return (
    <>
      <SiteHeader text={text.nav} locale={locale} />

      <main className={pageContainerClassName}>
        <HeroSection text={text.hero} sendProcessLabel={text.sendProcessLabel} />
        <AboutSection text={text.about} />
        <ServicesSection text={text.services} />
        <ProcessSection text={text.process} />
        <ExamplesSection text={text.examples} />
        <ContactSection text={text.contact} sendProcessLabel={text.sendProcessLabel} />
      </main>

      <SiteFooter text={text.footer} />
    </>
  );
};

export default Home;
