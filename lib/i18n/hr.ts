const tagline = ['Vaš proces.', 'Vaš alat.', 'Vaši podaci.'] as const;

// The talk card of the diagram and the "ne" answer of the step list say the same thing in two forms
const untilProcessIsClear = 'dok proces ne postane jasan';

/**
 * Croatian copy, the source language: `PageText` is derived from this object, so the English dictionary has to match
 * its shape down to the number of lines in the tagline.
 */
export const hr = {
  nav: {
    label: 'Navigacija',
    contact: 'Kontakt',
    languageLabel: 'Jezik',
  },
  hero: {
    titleLines: tagline,
    lead: 'Posao koji se danas radi ručno pretvaramo u alat na webu.',
    text: 'Umjesto skupih pretplata i gotovih alata koji ne odgovaraju vašem poslovanju, dobivate rješenje po mjeri koje platite samo jednom.',
  },
  sendProcessLabel: 'Pošalji proces',
  about: {
    title: 'O firmi',
    text: 'Mi smo TLOWeb. Aktivno se bavimo proizvodnjom softvera za telekomunikacije i financije te alatima za olakšavanje poslovne svakodnevice. To iskustvo ulažemo u alate koji zamjenjuju ručni rad u tablicama i mailovima, bez pretplate. Alat koji složimo održavamo i nakon isporuke, dokle god vam treba i dok god ima novih zahtjeva.',
    portfolioLabel: 'Pogledajte naš portfolio',
  },
  services: {
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
    title: 'Kako se problem rješava',
    intro: 'Ako proces još nije jasan, prvo razgovaramo. Sve ostalo ide u tri koraka.',
    flowTitle: 'Od ručnog posla do alata',
    today: {
      label: 'DANAS',
      title: 'Ručni posao',
      note: 'u tablicama i mailovima, ili bilo što drugo što vas muči',
    },
    send: {
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
      title: 'Složimo alat na webu',
    },
    own: {
      title: 'Proces je vaš',
      note: 'sav kod i svi podaci',
    },
  },
  examples: {
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
    title: 'Kontakt',
    intro: 'Odgovorite na tri pitanja, dovoljno je nekoliko rečenica:',
    questions: ['Koji se posao danas radi ručno?', 'Što ulazi i što mora izaći?', 'Tko to danas radi?'],
    ideaNote: 'Proces još nije jasan? Ako imate ideju, ali ne i jasan proces, javite se pa ćemo ga zajedno razjasniti.',
    mailSubject: 'Proces za TLOWeb',
  },
  footer: {
    taglineLines: tagline,
    emailLabel: 'E-MAIL',
    portfolioLabel: 'PORTFOLIO',
    portfolioLinkLabel: 'Pogledajte naše radove',
    backToTop: 'Na vrh ↑',
  },
} as const;
