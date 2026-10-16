# TLOWeb · naslovna stranica (smjer D) — predaja za implementaciju

`index.html` u ovoj mapi je vjerna, statična verzija dizajna: otvori je u pregledniku i to je izgled koji treba postići. Stilovi su namjerno inline (tako je dizajn nastao) i treba ih prebaciti u način stiliziranja koji projekt koristi. Logo je u `assets/tloweb-logo.svg`.

## Zadatak

- Implementiraj stranicu u postojećem stacku i konvencijama projekta, razbijenu u komponente po sekcijama (popis ispod).
- Izgled i ponašanje moraju odgovarati `index.html` na širinama **390, 834, 1440 i 1920 px**.
- Boje, fontove i razmake izvuci u varijable / tokene (popis ispod), ne ostavljaj ih razbacane po komponentama.
- Tekst je na hrvatskom i finaliziran: ne mijenjaj ga, osim placeholdera navedenih na kraju.

## Tokeni

**Boje**

| Uloga | Vrijednost |
|---|---|
| Pozadina (papir) | `#f3f0e8` |
| Tekst (tinta) | `#15181c` |
| Sekundarni tekst, mono oznake, strelice | `#585959` |
| Jača crta (header, footer, okviri) | `#797978` |
| Tanka crta (razdjelnici sekcija i redova) | `#d0cdc7` |
| Poveznice | `#1f5a70` → hover `#15181c` + deblja podcrta |
| Kartica u flowu | `#faf8f3` |
| Pitanje u flowu (romb) | `#dcd7cb` |
| Tamna kartica | pozadina `#15181c`, tekst `#f3f0e8`, opis `#d0cdc7`, mono `#b0afab` |

**Tipografija**

- Font: **Schibsted Grotesk** 400 / 600 / 700 (Google Fonts), fallback `system-ui, sans-serif`.
- Mono: `ui-monospace, 'Cascadia Mono', 'SF Mono', Consolas, monospace`.
- Tijelo: 18px, line-height 1.6.
- H1: `clamp(2.6rem, 6.4vw, 5.5rem)`, 600, line-height 1.02, letter-spacing −0.025em. Tri reda s `<br>`: »Vaš proces. / Vaš alat. / Vaši podaci.«
- H2: 1.75rem, 600, line-height 1.15, letter-spacing −0.01em.
- H3: 1.375rem u »Što radimo«, 1.125rem u »Primjeri«.
- Mono oznake: 12–13px, VELIKA SLOVA gdje su u dizajnu, letter-spacing 0.06em.

**Raspored**

- Kontejner: max-width 1200px, bočni padding 20px.
- Svaka sekcija: lijeva margina (160–200px) s mono oznakom (`TLOWeb`, `01`–`04`) + sadržaj (flex-basis 760px). Ispod ~1000px širine margina pada iznad sadržaja.
- Header i footer imaju crtu preko cijele širine ekrana; sekcije su odvojene tankom crtom.
- Bez zaobljenih kutova, sjena i gradijenata.

## Sekcije (redom)

1. **Header** (`#top`): logo lijevo, poveznica »Kontakt« → `#kontakt`.
2. **Hero**: H1 lijevo; desno dva odlomka i uokvireni gumb »Pošalji proces« → `#kontakt`. Gornji/donji razmak `clamp(48px, 7vw, 88px)` / `clamp(40px, 5vw, 72px)`. Dio »pretvaramo u alat na webu.« se ne smije prelomiti (`white-space: nowrap`).
3. **O firmi** (oznaka `TLOWeb`): odlomak (`clamp(1.1875rem, 1rem + 0.8vw, 1.375rem)`) i poveznica »Pogledajte naš portfolio«.
4. **01 · Što radimo**: tri stupca (mono pitanje, H3, tekst) s tamnom crtom iznad svakog; flex-basis 220px, na tabletu ostaju u tri stupca.
5. **02 · Kako se problem rješava**: tekst lijevo, dijagram desno.
   - Dijagram (≥ 600px): host 540 × 764 px; kartice, romb i strelice su apsolutno pozicionirani, svaka strelica je zaseban mali SVG. Može ostati tako ili se prepisati u jedan SVG / CSS grid, ali mora izgledati isto.
   - Ispod 600px dijagram se skriva i prikazuje se okomiti popis koraka (`.d-flow-list`, isti sadržaj). Pravilo je u `<style>` u `<head>`.
   - U koraku 1 »odgovori na tri pitanja« je poveznica na `#kontakt`.
   - Ako se tekst flowa mijenja, mijenja se na oba mjesta (dijagram i popis).
6. **03 · Primjeri**: tri reda kao tablica (P-1…P-3, naslov, opis).
7. **04 · Kontakt** (`#kontakt`): okvir s tri pitanja i gumbom »Pošalji proces« (`mailto:`), napomena ispod okvira. Padding okvira `clamp(20px, 4vw, 28px) clamp(20px, 5vw, 32px)`.
8. **Footer**: logo i slogan u tri reda; E-MAIL i PORTFOLIO kao `<dl>`; na dnu »© 2026 TLOWeb« i »Na vrh ↑« → `#top`.

## Responzivno — provjeri na 390, 834, 1440, 1920 px

- **< 600px**: flow kao okomiti popis; sve sekcije u jednom stupcu.
- **< ~1000px**: mono oznake sekcija iznad sadržaja; u heroju naslov pa tekst jedan ispod drugog.
- **Široki ekrani**: sadržaj ostaje 1200px i centriran; rastu samo margine.

## Pristupačnost (već je u dizajnu, zadrži)

- `lang="hr"`, sekcije s `aria-labelledby`, `alt` na logu, dekorativni SVG-ovi `aria-hidden="true"`.
- Vidljiv fokus na poveznicama (outline 2px `#1f5a70`, offset 4px).
- Kontrast teksta najmanje 4.5:1 (boje iz tablice to zadovoljavaju).
- Ako dodaješ glatko skrolanje za sidra, poštuj `prefers-reduced-motion`.

## Zamijeniti prije objave

- `kontakt@tloweb.example` → prava adresa (gumb u Kontaktu i footer).
- `https://portfolio.example` → pravi portfolio (O firmi i footer).
- Godina u footeru (`© 2026`).
- Dodati `<meta name="description">`, prijedlog: »Posao koji se danas radi ručno pretvaramo u alat na webu. Umjesto skupih pretplata dobivate rješenje po mjeri koje platite samo jednom.«

## Otvorena pitanja (nisu u dizajnu)

- Je li održavanje uključeno u cijenu ili se naplaćuje po zahtjevu? Ako se naplaćuje, treba kratko pojašnjenje u »O firmi«.
- Trebaju li u footeru podaci tvrtke (naziv, OIB, adresa)?
