import { AboutSection } from '@/components/home/AboutSection';
import { ContactSection } from '@/components/home/ContactSection';
import { ExamplesSection } from '@/components/home/ExamplesSection';
import { HeroSection } from '@/components/home/HeroSection';
import { ProcessSection } from '@/components/home/ProcessSection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { pageContainerClassName } from '@/components/ui/layoutStyles';

const Home = () => {
  return (
    <>
      <SiteHeader />

      <main className={pageContainerClassName}>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <ProcessSection />
        <ExamplesSection />
        <ContactSection />
      </main>

      <SiteFooter />
    </>
  );
};

export default Home;
