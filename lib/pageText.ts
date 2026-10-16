const tagline = ['Vaš proces.', 'Vaš alat.', 'Vaši podaci.'] as const;

// The talk card of the diagram and the "ne" answer of the step list say the same thing in two forms
const untilProcessIsClear = 'dok proces ne postane jasan';

/**
 * All text the page shows.
 */
export const pageText = {
  meta: {
    title: `TLOWeb · ${tagline.join(' ')}`,
  },
  nav: {
    label: 'Navigacija',
    contact: 'Kontakt',
  },
  hero: {
    titleLines: tagline,
    lead: 'Posao koji se danas radi ručno pretvaramo u alat na webu.',
    text: 'Umjesto skupih pretplata i gotovih alata koji ne odgovaraju vašem poslovanju, dobivate rješenje po mjeri koje platite samo jednom.',
  },
  sendProcessLabel: 'Pošalji proces',
  about: {
    label: 'TLOWeb',
    title: 'O firmi',
    text: 'Mi smo TLOWeb. Aktivno se bavimo proizvodnjom softvera za telekomunikacije i financije te alatima za olakšavanje poslovne svakodnevice. To iskustvo ulažemo u alate koji zamjenjuju ručni rad u tablicama i mailovima, bez pretplate. Alat koji složimo održavamo i nakon isporuke, dokle god vam treba i dok god ima novih zahtjeva.',
    portfolioLabel: 'Pogledajte naš portfolio',
  },
  services: {
    label: '01',
    title: 'Što radimo',
    items: [
      {
        tag: 'ŠTO GRADIMO',
        title: 'Alat po mjeri vašeg posla',
        text: 'Uzmemo posao koji se danas radi ručno, u tablici ili preko mailova, i složimo ga kao alat na webu. Koji posao, birate vi.',
      },
      {
        tag: 'ČIJE JE',
        title: 'Kod i podaci ostaju vama',
        text: 'Proces je u cijelosti vaš, a pretplate nema.',
      },
      {
        tag: 'TKO ODLUČUJE',
        title: 'Čovjek ima zadnju riječ',
        text: 'AI agent ulazi samo ako je on taj korak u procesu. Prije nego što se pošalje mail ili plati, čovjek uvijek potvrdi.',
      },
    ],
  },
  process: {
    label: '02',
    title: 'Kako se problem rješava',
    intro: 'Ako proces još nije jasan, prvo razgovaramo. Sve ostalo ide u tri koraka.',
    flowTitle: 'Od ručnog posla do alata',
    today: {
      label: 'DANAS',
      title: 'Ručni posao',
      note: 'u tablicama i mailovima, ili bilo što drugo što vas muči',
    },
    send: {
      label: '1',
      title: 'Pošaljete proces',
      linkLabel: 'odgovori na tri pitanja',
    },
    decision: {
      label: 'PITANJE',
      titleLines: ['Je li proces', 'jasan?'],
      yes: 'da',
      yesNote: 'idemo na korak 2',
      no: 'ne',
      noNote: `prvo razgovor, ${untilProcessIsClear}`,
    },
    talk: {
      title: 'Razgovor',
      note: untilProcessIsClear,
    },
    build: {
      label: '2',
      title: 'Složimo alat na webu',
    },
    own: {
      label: '3',
      title: 'Proces je vaš',
      note: 'sav kod i svi podaci',
    },
  },
  examples: {
    label: '03',
    title: 'Primjeri',
    intro: 'Tri vrste procesa, kao primjer. Ovo nije popis gotovih projekata.',
    items: [
      {
        title: 'Razvrstavanje uvoza',
        text: 'Uvoz stiže u različitim oblicima: tablice, PDF-ovi, mailovi. Alat ga prima, razvrsta po pravilima koja vi odredite i ostavi za čovjeka ono što pravila ne pokrivaju.',
      },
      {
        title: 'Evidencija koja nije gotov kadrovski alat',
        text: 'Popis koji se vodi u tablici jer nijedan gotov alat ne odgovara baš vašem poslu. Alat ga drži na jednom mjestu, umjesto u tablici koju svatko ima u drugoj verziji.',
      },
      {
        title: 'Upit koji završi u alatu koji već imate',
        text: 'Upit stigne preko weba i završi tamo gdje ga vaš tim već prati, u alatu kojim se već služite. Ne u još jednom e-poštanskom sandučiću.',
      },
    ],
  },
  contact: {
    label: '04',
    title: 'Kontakt',
    intro: 'Odgovorite na tri pitanja, dovoljno je nekoliko rečenica:',
    questions: ['Koji se posao danas radi ručno?', 'Što ulazi i što mora izaći?', 'Tko to danas radi?'],
    ideaNote: 'Proces još nije jasan? Ako imate ideju, ali ne i jasan proces, javite se pa ćemo ga zajedno razjasniti.',
  },
  footer: {
    taglineLines: tagline,
    emailLabel: 'E-MAIL',
    portfolioLabel: 'PORTFOLIO',
    portfolioLinkLabel: 'Pogledajte naše radove',
    // The year is written out, not computed: it is part of the approved copy and changes with a release, not a clock
    copyright: '© 2026 TLOWeb',
    backToTop: 'Na vrh ↑',
  },
} as const;

export const metaDescription = `${pageText.hero.lead} ${pageText.hero.text}`;
