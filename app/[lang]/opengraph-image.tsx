import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LOCALES } from '@/lib/i18n/locales';
import { getPageText } from '@/lib/i18n/pageText';
import { requireLocale } from '@/lib/i18n/requireLocale';
import { openGraphImageSize } from '@/lib/openGraphImageSize';

// Nothing here depends on the request, so the files are read once per server process. The paths stay literal: a
// computed path would make the bundler trace the whole project into the server output
const [fontData, logoSvg, colorsCss] = await Promise.all([
  readFile(join(process.cwd(), 'brand/fonts/SchibstedGrotesk-Medium.ttf')),
  readFile(join(process.cwd(), 'brand/logo-ink.svg')),
  readFile(join(process.cwd(), 'brand/colors.css'), 'utf8'),
]);

const brandColorPattern = /--brand-([a-z-]+):\s*(#[\da-f]{6})\b/gi;

const brandColor = (name: string) => {
  const value = Array.from(colorsCss.matchAll(brandColorPattern)).find(([, colorName]) => colorName === name)?.[2];
  if (value === undefined) throw new Error(`brand/colors.css has no hex value for --brand-${name}`);
  return value;
};

const colors = { ink: brandColor('ink'), paper: brandColor('paper'), work: brandColor('work') } as const;

const logoSrc = `data:image/svg+xml;base64,${logoSvg.toString('base64')}`;

// A route handler does not inherit the layout's params, so the image route lists the languages itself
export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

/**
 * The share card of the former `brand/og.svg` template, drawn per language so the tagline comes from the dictionary
 * instead of a hand-exported PNG. Coordinates are the template's: the wordmark at 95 % from (96, 96), the work-colour
 * rule at y 312, three tagline lines on baselines 398, 466 and 534. Colours come from `brand/colors.css`, and the font
 * is a static TTF because `ImageResponse` reads neither woff2 nor a chosen weight of a variable font. The URL and the
 * alt text are announced by the layout's `generateMetadata`, the only place that can give each language its own alt.
 */
const OpenGraphImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
  const text = getPageText(requireLocale((await params).lang));

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: colors.paper,
        color: colors.ink,
        fontFamily: 'Schibsted Grotesk',
      }}
    >
      <img src={logoSrc} alt="" width={503.5} height={98.8} style={{ position: 'absolute', left: 96, top: 94.1 }} />
      <div style={{ position: 'absolute', left: 96, top: 312, width: 72, height: 6, backgroundColor: colors.work }} />
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 343.875,
          display: 'flex',
          flexDirection: 'column',
          fontSize: 56,
          fontWeight: 500,
          lineHeight: '68px',
          letterSpacing: '-0.01em',
        }}
      >
        {text.hero.titleLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>,
    {
      ...openGraphImageSize,
      fonts: [{ name: 'Schibsted Grotesk', data: fontData, weight: 500, style: 'normal' }],
    },
  );
};

export default OpenGraphImage;
