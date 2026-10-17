# TLOWeb: vizualni identitet

Smjer: operativan, ne marketinški. Izgleda kao interni alat koji je netko složio pažljivo. Ime je tekst, nema simbola, maskote ni ilustracije.

Ovo su datoteke identiteta. Jedna stranica ih koristi (`app/`), ali samo na mobitelu i u jednom pregledniku je provjerena.

## Datoteke

| Datoteka         | Čemu služi                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `colors.css`     | Tokeni: četiri boje, izvedeni tonovi, dva pisma. Jedini izvor boja.                                         |
| `logo.svg`       | Wordmark u `currentColor`. Za SVG ugrađen u HTML: preuzima boju teksta oko sebe, pa radi na svakoj podlozi. |
| `logo-ink.svg`   | Wordmark u tinti. Za svijetlu podlogu kad se koristi kao slika (`<img>`, dokument, PDF).                    |
| `logo-paper.svg` | Wordmark u papiru. Za tamnu podlogu kad se koristi kao slika.                                               |
| `fonts/`         | Schibsted Grotesk Medium kao statički TTF, s licencom (`OFL.txt`). Samo za sliku za dijeljenje linka.       |

Zašto tri logotipa: SVG učitan kao slika ne vidi boju stranice oko sebe, a `prefers-color-scheme` prati sustav, ne podlogu. Zato boja ide ili iz okoline (`logo.svg` ugrađen), ili je fiksna u datoteci.

## Wordmark

Piše se **TLOWeb**: `TLO` u debelom rezu, `Web` u tankom. Rez se mijenja točno na šavu imena, bez razmaka.

- Wordmark je nacrtan geometrijom, nije složen fontom. Ne slaži ga ponovno u `Schibsted Grotesk` ili drugom pismu i ne zamjenjuj ga tekstom u naslovu.
- Najmanja visina na ekranu: 16 px. Ispod toga tanki `Web` gubi oblik.
- Slobodni prostor oko znaka: pola visine slova `T` sa svake strane.
- U tekstu se ime uvijek piše `TLOWeb`. Nikad `tloweb`, `TLOweb`, `TLO Web`, `TloWeb`.
- Jedna boja: tinta ili papir. Wordmark se ne boji radnom ni stop bojom.

Ne radi s wordmarkom: rastezanje, izvlačenje obrisa (outline), sjene, gradijent, kosina, promjena omjera debelog i tankog reza, razdvajanje `TLO` i `Web` u dvije boje, dodavanje simbola ili podcrte.

## Boje

Najviše četiri. Sve ostalo se izvodi iz njih (`color-mix` u `colors.css`), da nema pete boje koja se potiho pojavi.

Iznimka (16. 10. 2026.): dizajn naslovne stranice koristi dvije površine koje se ne mogu dobiti miješanjem tinte i papira, `--brand-paper-raised` (`#faf8f3`, kartica u dijagramu procesa) i `--brand-paper-sunk` (`#dcd7cb`, pitanje u dijagramu). Samo za površine, nikad za tekst ni crtu.

| Token           | Vrijednost | Uloga                                             | Kontrast na papiru |
| --------------- | ---------- | ------------------------------------------------- | ------------------ |
| `--brand-ink`   | `#15181c`  | Tinta: tekst, wordmark, tamna podloga             | 15.64              |
| `--brand-paper` | `#f3f0e8`  | Papir: podloga, tekst na tamnoj podlozi           | -                  |
| `--brand-work`  | `#1f5a70`  | Radna boja: link, crta, jedan naglasak po prikazu | 6.69               |
| `--brand-stop`  | `#a63a2b`  | „Ne“ i upozorenje: rijetko, uvijek uz riječi      | 5.65               |

Kontrasti su izračunati (WCAG 2.x relativna luminancija), ne procijenjeni.

Pravila:

- **Radna boja** je za link, tanku crtu i najviše jedan naglasak po prikazu. Ne koristi se kao ispuna velike površine ni kao boja naslova.
- **Stop boja** se koristi rijetko: greška u formi, razlog zašto nešto ne ide dalje, korak u kojem čovjek mora potvrditi prije nego što ide novac ili mail. Uvijek ide uz tekst koji kaže što je krivo, nikad sama (radna i stop boja se razlikuju po tonu, ne po svjetlini, pa ih dio ljudi ne razlikuje po boji).
- **Na tamnoj podlozi** radna i stop boja ne prolaze kontrast (2.34 i 2.77), pa se tamo ne koriste. Tekst je papir, link je papir s podvlakom, upozorenje je riječima. Za to služi klasa `.brand-on-ink` u `colors.css`.
- Tamna podloga je za traku ili logo, ne tamna tema cijele stranice. Tamna tema nije definirana.
- Čisto crna (`#000`) i čisto bijela (`#fff`) ne smiju se pojaviti.
- Sive se ne biraju od oka: `--brand-ink-muted` za sporedni tekst (kontrast 6.17), `--brand-line` samo za ukrasnu liniju, `--brand-line-strong` za rub koji nešto znači (rub polja u formi).

## Pismo

Jedno pismo: **Schibsted Grotesk**. Odabran je kao miran grotesk s karakterom (blago raširene završnice), a ne kao zadani sans. Hrvatski znakovi `č ć š đ ž` prikazani su ispravno (provjereno u specimenu, uz tri druga kandidata: Hanken Grotesk, Instrument Sans, IBM Plex Sans).

Drugo pismo je **sistemski monospace** i samo za sitne oznake: datum, verzija, status, oznaka jezika (`HR / EN`). Ne za naslove ni za tekst. Ne više od dva pisma.

- Tekst: težina 400. Naslovi: težina 600, `letter-spacing: -0.01em`, `line-height: 1.15`.
- Naslovi se pišu kao u rečenici (veliko samo prvo slovo), bez uskličnika.
- Učitavanje na stranici: preko `next/font/google` u `app/[lang]/layout.tsx` (podskupovi `latin` i `latin-ext`). Prema dokumentaciji Next.js 16 se CSS i datoteke fonta preuzimaju pri buildu i služe s vlastite domene, bez zahtjeva preglednika prema Googleu. Slika za dijeljenje linka koristi statički rez iz `fonts/` (preuzet iz službenog repozitorija [schibsted/schibsted-grotesk](https://github.com/schibsted/schibsted-grotesk)), jer generator slike ne čita woff2 ni odabranu težinu varijabilnog fonta.

## Naslovi: ispravno i krivo

Ispravno:

```
Razvrstavanje uvoza
Evidencija koja nije gotov kadrovski alat
Jedan poslovni proces na webu. Kod ostaje vama.
```

Krivo:

```
Transformiramo vaš biznis uz moć AI-ja!
Revolucionarna digitalna rješenja po mjeri
TLOWeb: vaš partner za digitalnu budućnost
```

Zašto je ispravno ispravno: imenuje stvar koju klijent prepoznaje (proces, ne „rješenje“), kratko je, ne obećava ishod i ne koristi pridjeve. Zašto je krivo krivo: uskličnik, „AI“ kao atrakcija, „revolucionarno“ i „partner“ ne govore ništa što se može provjeriti. To je ton startupa, a identitet je alat.

## Što smije, što ne smije

Smije:

- tekst, tanka crta i razmak kao jedini ukras;
- jedna radna boja po prikazu: link, crta ili naglasak;
- monospace za datum, verziju, status i oznaku jezika;
- tamna traka s papirnim tekstom.

Ne smije:

- ljubičasta, neon, gradijent, sjena, zaobljena „pilula“;
- ilustracije, posebno ljudi, roboti i grafovi;
- maskota ili simbol uz ime;
- tri kartice s ikonama koje ništa ne govore;
- lažni logotipi klijenata i lažne brojke;
- radna ili stop boja na tamnoj podlozi;
- stop boja kao ukras.

## Open Graph

Slika za dijeljenje linka (1200×630) generira se iz koda, za svaki jezik posebno: `app/[lang]/opengraph-image.tsx`. Raspored je onaj iz nekadašnjeg predloška `og.svg`: wordmark (`logo-ink.svg`), kratka crta u radnoj boji i slogan u tri retka iz rječnika (`lib/i18n/hr.ts`, `lib/i18n/en.ts`), „Vaš proces. Vaš alat. Vaši podaci.“ i „Your process. Your tool. Your data.“. Boje se čitaju iz `colors.css`, font iz `fonts/`. Slike nastaju pri buildu (`/hr/opengraph-image`, `/en/opengraph-image`), pa ručnog izvoza više nema: promjena slogana u rječniku mijenja i sliku.

Alt tekst i URL slike postavlja `generateMetadata` u `app/[lang]/page.tsx`, ne konvencija `opengraph-image`, jer konvencija daje isti alt tekst za oba jezika.

Nije u opsegu ove isporuke: favicon. Ako zatreba, odluka je posebna (samo `T` ili `TLO` iz wordmarka), jer se `Web` na 16 px ne čita.

## Povezanost sa stranicom

`app/globals.css` uvozi `colors.css` i čita tokene u `@theme inline`, a ne definira vlastite hex vrijednosti, pa boje imaju jedan izvor. `components/brand/Wordmark.tsx` je ugrađena kopija `logo.svg`: kad se mijenja wordmark, mijenjaju se oba.
