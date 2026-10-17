import { focusRingClassName, monoLabelTextClassName } from '@/components/ui/textStyles';
import { localeNames, LOCALES } from '@/lib/i18n/locales';
import type { Locale } from '@/lib/i18n/locales';

type LanguageSwitchProps = {
  locale: Locale;
  label: string;
};

// Padding and the 1px frame give the two-letter codes a touch target of at least 24px in both directions. The other
// code keeps a transparent frame, so the row does not shift when the language changes
const optionClassName = 'inline-block border px-2 py-1';

/**
 * Two links rather than a dropdown: with two languages a toggle would only add a click. The current language is framed
 * like the call to action and the other one stays muted until hovered, so the frame alone says which page is open; an
 * underlined petrol link would look selected. The code on screen is short, so `title` carries the full name, and
 * `lang` makes a screen reader say each code in its own language.
 */
export const LanguageSwitch = ({ locale, label }: LanguageSwitchProps) => {
  return (
    <nav aria-label={label}>
      <ul className={`flex items-center gap-1 ${monoLabelTextClassName}`}>
        {LOCALES.map((option, index) => (
          <li key={option} className="flex items-center gap-1">
            {index > 0 && (
              <span aria-hidden="true" className="text-ink-muted">
                /
              </span>
            )}
            {option === locale ? (
              <span
                aria-current="true"
                lang={option}
                title={localeNames[option]}
                className={`${optionClassName} border-text font-semibold text-text`}
              >
                {option.toUpperCase()}
              </span>
            ) : (
              <a
                href={`/${option}`}
                hrefLang={option}
                lang={option}
                title={localeNames[option]}
                className={`${optionClassName} border-transparent text-ink-muted underline-offset-4 hover:text-text hover:underline ${focusRingClassName}`}
              >
                {option.toUpperCase()}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};
