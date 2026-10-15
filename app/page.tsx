import { Wordmark } from '@/components/brand/Wordmark';
import {
  itemHeadingClassName,
  linkClassName,
  pageHeadingClassName,
  sectionHeadingClassName,
  standaloneLinkClassName,
} from '@/components/ui/textStyles';
import { CONTACT_MAILTO } from '@/lib/contactMailto';
import { pageText } from '@/lib/pageText';
import { CONTACT_EMAIL, CONTACT_ID, PORTFOLIO_URL } from '@/lib/siteConfig';

const HERO_HEADING_ID = 'hero-heading';
const ABOUT_HEADING_ID = 'about-heading';
const EXAMPLES_HEADING_ID = 'examples-heading';
const NOT_DOING_HEADING_ID = 'not-doing-heading';
const CONTACT_HEADING_ID = 'contact-heading';

// The 45rem column (720px) holds the text; the side padding keeps it off the screen edge on a phone
const columnClassName = 'mx-auto w-full max-w-180 px-5';
const sectionClassName = 'border-t border-line py-12';

export default function Home() {
  return (
    <>
      <header className={`${columnClassName} flex items-center justify-between py-6`}>
        <Wordmark className="h-5 w-auto" />
        <nav aria-label={pageText.nav.label}>
          <a href={`#${CONTACT_ID}`} className={standaloneLinkClassName}>
            {pageText.nav.contact}
          </a>
        </nav>
      </header>

      <main className={`${columnClassName} flex-1`}>
        <section aria-labelledby={HERO_HEADING_ID} className="pt-10 pb-16 sm:pt-20">
          <h1 id={HERO_HEADING_ID} className={pageHeadingClassName}>
            {pageText.hero.title}
          </h1>
          <p className="mt-6 text-xl text-pretty">{pageText.hero.subtitle}</p>
          <p className="mt-8">
            <a href={CONTACT_MAILTO} className={standaloneLinkClassName}>
              {pageText.sendProcessLabel}
            </a>
          </p>
        </section>

        <section aria-labelledby={ABOUT_HEADING_ID} className={sectionClassName}>
          <h2 id={ABOUT_HEADING_ID} className={sectionHeadingClassName}>
            {pageText.about.title}
          </h2>
          <div className="mt-5 space-y-4">
            {pageText.about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section aria-labelledby={EXAMPLES_HEADING_ID} className={sectionClassName}>
          <h2 id={EXAMPLES_HEADING_ID} className={sectionHeadingClassName}>
            {pageText.examples.title}
          </h2>
          <p className="mt-5">{pageText.examples.intro}</p>
          <ol className="mt-8 list-decimal space-y-8 pl-7 marker:font-semibold">
            {pageText.examples.items.map((item) => (
              <li key={item.title}>
                <h3 className={itemHeadingClassName}>{item.title}</h3>
                <p className="mt-1">{item.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby={NOT_DOING_HEADING_ID} className={sectionClassName}>
          <h2 id={NOT_DOING_HEADING_ID} className={sectionHeadingClassName}>
            {pageText.notDoing.title}
          </h2>
          <ul className="mt-5 list-disc space-y-2 pl-7">
            {pageText.notDoing.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section id={CONTACT_ID} aria-labelledby={CONTACT_HEADING_ID} className={sectionClassName}>
          <h2 id={CONTACT_HEADING_ID} className={sectionHeadingClassName}>
            {pageText.contact.title}
          </h2>
          <p className="mt-5">{pageText.contact.intro}</p>
          <ul className="mt-4 list-disc space-y-2 pl-7">
            {pageText.contact.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
          <p className="mt-8">
            <a href={CONTACT_MAILTO} className={standaloneLinkClassName}>
              {pageText.sendProcessLabel}
            </a>
          </p>
          <p className="mt-8">{pageText.contact.ideaNote}</p>
        </section>
      </main>

      <footer className={`${columnClassName} border-t border-line py-8 text-base text-ink-muted`}>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <span>{pageText.footer.name}</span>
          <a href={PORTFOLIO_URL} className={linkClassName}>
            {pageText.footer.portfolioLabel}
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} className={linkClassName}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </footer>
    </>
  );
}
