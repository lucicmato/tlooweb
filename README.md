# TLOWeb

Jednostranična web stranica za TLOWeb: posao koji se danas radi ručno pretvaramo u alat na webu. Jedna ruta (`/`) sa
sekcijama O firmi, Što radimo, Kako se problem rješava, Primjeri i Kontakt. Nema baze ni backenda: kontakt je `mailto`
link s tri pitanja u tijelu maila.

**Stack:** Next.js 16 (App Router, `cacheComponents`, `typedRoutes`, React Compiler), React 19, Tailwind CSS 4,
TypeScript 6 u `strict` načinu. Nema `src/` foldera: `app/`, `components/` i `lib/` stoje u rootu, a `@/*` pokazuje na
root.

## Preduvjeti

| Alat | Verzija            | Gdje je zapisano                                |
| ---- | ------------------ | ----------------------------------------------- |
| Node | 24 ili noviji      | `engines` u `package.json`                      |
| npm  | 11.10.0 ili noviji | `devEngines` u `package.json` (`onFail: error`) |

```bash
node --version
npm --version
```

Ako je npm stariji od 11.10.0, nadogradi ga (`npm install --global npm@11`). Stariji npm ne poštuje zaštite iz
`.npmrc`: ili odbije instalaciju s `EBADDEVENGINES`, ili, ako je dovoljno star, tiho preskoči i `devEngines` i
`min-release-age`.

## Prvo pokretanje

```bash
npm install
npm run rebuild:trusted
npm run build
npm run dev
```

Stranica je na [http://localhost:3000](http://localhost:3000) i osvježava se dok mijenjaš kod.

Što koji korak radi:

1. **`npm install`** instalira točno verzije iz `package-lock.json` (u CI-ju `npm ci`). Projektni `.npmrc` sprema točne
   verzije (`save-exact=true`), odbija izdanja mlađa od 7 dana (`min-release-age=7`) i ne pokreće install skripte
   paketa (`ignore-scripts=true`).
2. **`npm run rebuild:trusted`** pokreće install skripte samo za pakete s nativnim binarnim datotekama kojima se
   vjeruje (`bcrypt`, `esbuild`, `sharp`, `@parcel/watcher`). Bez ovog koraka ti paketi nisu ispravno postavljeni.
3. **`npm run build`** generira tipove ruta u `.next/types` (`typedRoutes`). `npm run typecheck` i `npm run lint` bez
   njih ne prolaze, pa build ide prije njih nakon svake promjene ruta.
4. **`npm run dev`** pokreće razvojni server.

## Skripte

| Skripta                     | Što radi                                                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`               | Razvojni server na portu 3000                                                                                                                              |
| `npm run build`             | Produkcijski build. **Ne provjerava tipove** (`typescript.ignoreBuildErrors` u `next.config.ts`)                                                           |
| `npm run start`             | Pokreće produkcijski build (nakon `npm run build`)                                                                                                         |
| `npm run typecheck`         | `tsc --noEmit`, pa `scripts/next-tsc.ts`: dijagnostike Next.js TypeScript plugina koje `tsc` ne učita (npr. TS71008, `metadata` mora imati tip `Metadata`) |
| `npm run lint`              | ESLint nad cijelim projektom s `--max-warnings 0`: svako upozorenje je greška                                                                              |
| `npm run format`            | Prettier prepisuje sve fajlove                                                                                                                             |
| `npm run format:check`      | Prettier samo provjerava, ništa ne mijenja                                                                                                                 |
| `npm run rebuild:trusted`   | Install skripte samo za pakete kojima se vjeruje (vidi gore)                                                                                               |
| `npm run test:eslint-rules` | Testovi custom ESLint pravila u `eslint-rules/`                                                                                                            |
| `npm run test:hooks`        | Testovi Claude Code hookova u `.claude/hooks/`                                                                                                             |

Projekt još nema unit ni end-to-end testova.

## Struktura

```
app/                 ruta `/`: layout.tsx, page.tsx, globals.css, Open Graph slika i njen alt tekst
components/
  brand/             Wordmark.tsx, ugrađena kopija brand/logo.svg
  contact/           link „Pošalji proces“ (mailto)
  home/              sekcije naslovne stranice, dijagram procesa i lista koraka za uske ekrane
  layout/            zaglavlje, podnožje, sekcija s oznakom na margini
  ui/                zajednički dijelovi, ikone i dijeljene Tailwind klase (layoutStyles.ts, textStyles.ts)
lib/
  pageText.ts        sav tekst stranice
  siteConfig.ts      kontakt e-mail, URL stranice, ID-jevi sidara
  mailtoHref.ts      sastavljanje mailto linka
  contactMailto.ts   mailto link s pitanjima iz pageText.ts
brand/               vizualni identitet: tokeni boja, logotipi, OG predložak (vidi brand/README.md)
eslint-rules/        custom ESLint pravila s testovima
scripts/next-tsc.ts  provjera Next.js TypeScript plugina iz komandne linije
.claude/             Claude Code dozvole i hookovi (guardrails)
.github/workflows/   CI
```

## Gdje se što mijenja

**Tekst stranice:** `lib/pageText.ts`. Iz njega čitaju stranica, metapodaci (naslov i opis) i tijelo kontakt maila, pa
se tekst mijenja samo tu. Godina u podnožju (`© 2026 TLOWeb`) upisana je ručno i mijenja se uz izdanje.

**Kontakt e-mail i adresa stranice:** `lib/siteConfig.ts`. `CONTACT_EMAIL` i `SITE_URL` su namjerno na rezerviranoj
domeni `.example` i **moraju se zamijeniti prije objave**. `SITE_URL` je `metadataBase` iz kojeg društvene mreže
dohvaćaju Open Graph sliku.

**Boje:** samo `brand/colors.css`. `app/globals.css` ih čita u `@theme inline` i ne definira vlastite hex vrijednosti,
pa boje imaju jedan izvor. Pravila korištenja boja su u `brand/README.md`.

**Veličine teksta, razmaci, širina sadržaja, breakpoint dijagrama:** blok `@theme` u `app/globals.css`.

**Wordmark:** mijenja se na dva mjesta, `brand/logo*.svg` i `components/brand/Wordmark.tsx`.

**Open Graph slika:** predložak je `brand/og.svg`, a objavljuje se `app/opengraph-image.png` (1200×630) s alt tekstom u
`app/opengraph-image.alt.txt`. Nema automatskog izvoza: nakon promjene predloška PNG se ponovno izvozi ručno.

**Font:** Schibsted Grotesk preko `next/font/google` u `app/layout.tsx`, s podskupom `latin-ext` zbog č, ć, š, đ, ž.

## Provjere i CI

CI (`.github/workflows/ci.yml`) radi na svaki push, ovim redom:

1. `npm ci` i `npm run rebuild:trusted`
2. `npm run format:check`
3. `npm run test:eslint-rules` i `npm run test:hooks`
4. `npm run build`
5. `npm run typecheck`
6. `npm run lint`

Isto lokalno, prije commita:

```bash
npm run format:check
npm run build
npm run typecheck
npm run lint
```

`npm run build` ne provjerava tipove, pa je `npm run typecheck` obavezan, a ne dodatak. Testove ESLint pravila i
hookova treba pokrenuti samo kad se mijenja `eslint-rules/` ili `.claude/hooks/`.

## Konvencije koda

Puna pravila su u [`AGENTS.md`](AGENTS.md), odjeljak „Code conventions“. Ono što ESLint provodi sam (`eslint.config.js`
i `eslint.conventions.js`), a `eslint --fix` većinom i popravi:

- redoslijed importa u četiri grupe (React, default, named, stilovi), preko `eslint-plugin-perfectionist`
- named exporti; `export default` samo u Next.js special fajlovima (`page.tsx`, `layout.tsx`, ...) i config fajlovima
- ime fajla komponente jednako imenu exporta
- komponente i funkcije kao arrow funkcije dodijeljene `const`-u (`conventions/prefer-arrow-function`)
- komentari i identifikatori na engleskom; tekst za korisnike je u `lib/pageText.ts` na hrvatskom
- `eslint-disable` samo s razlogom (`-- razlog`)

Formatiranje je Prettier iz `prettier.config.js` (širina retka 120, jednostruki navodnici). Ne dodaj `.prettierrc`:
Prettier bi ga uzeo prije `prettier.config.js` bez upozorenja.

## Dodavanje paketa

Zbog `.npmrc` paket se instalira s točnom verzijom i samo ako je izdanje staro barem 7 dana. Te se postavke ne
zaobilaze (`--min-release-age=0`, `--ignore-scripts=false`). Ako novi paket treba install skriptu, dodaj ga u
`rebuild:trusted` u `package.json`; CI pokreće tu skriptu prije builda.

## Editor

VS Code: `.vscode/settings.json` postavlja `typescript.tsdk` na TypeScript iz projekta. Odaberi **TypeScript: Select
TypeScript Version → Use Workspace Version**, inače se Next.js TypeScript plugin iz `tsconfig.json` ne učita i editor ne
prijavljuje greške koje `npm run typecheck` prijavljuje. Formatiranje pri spremanju je opcionalno: u istom fajlu su
zakomentirane linije koje ga uključuju.

## Objava

1. U `lib/siteConfig.ts` zamijeni `CONTACT_EMAIL` i `SITE_URL` pravim vrijednostima.
2. Produkcija: `npm run build`, pa `npm run start`. CI prije builda pokreće `npm run rebuild:trusted`; ako host dopušta
   vlastitu build naredbu, isti korak ide i tamo.
3. Host (Hostinger) bira verziju Nodea iz `engines` u `package.json`. Bez `"node": ">=24"` uzme Node 22, čiji npm
   10.9.9 padne na provjeri `devEngines` s `EBADDEVENGINES`.

## Rad s Claude Code i drugim agentima

- [`AGENTS.md`](AGENTS.md) su upute za agente (Claude Code ga učita preko `CLAUDE.md`): koje provjere pokrenuti,
  konvencije koda, proces i završni izvještaj. Blok na vrhu piše `next dev` i ostaje u fajlu.
- `.claude/settings.json` i `.claude/hooks/` provode guardrailse u Claude Codeu:
  - nakon svake izmjene fajl prolazi kroz Prettier i `eslint --fix --max-warnings 0`
  - prije naredbe ili pristupa fajlu odbijaju se destruktivne naredbe, čitanje credential fajlova (`.env*`, `.npmrc`),
    ručne izmjene lockfilea i `node_modules`, force push, drugi package manageri i oslabljeni lint
  - prije kraja zadatka, ako se mijenjao kod, pokreću se `npm run typecheck` i `npm run lint`
- `npm run rebuild:trusted` pokreće čovjek (ljudski korak prema `AGENTS.md`), a `npm install` u Claude Codeu traži
  odobrenje. `npm rebuild` i zaobilaženje postavki iz `.npmrc` hookovi agentu odbijaju.
- Što su hookovi odbili ili prijavili: `node .claude/hooks/guardrails-report.mjs` (opcije `--session <id>`, `--json`,
  `--info`).
- `.claude/settings.local.json` je osobni i nije u gitu.

## Vizualni identitet

Boje, wordmark, pismo, ton naslova i što stranica smije, a što ne: [`brand/README.md`](brand/README.md).
