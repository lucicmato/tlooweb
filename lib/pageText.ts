/**
 * All text the page shows. `content/copy.md` is a readable mirror that stays out of git, so keep the two in step. One
 * module, so the mail body and the contact section use the same three questions and cannot drift apart.
 */
export const pageText = {
  meta: {
    title: 'TLOWeb — jedan poslovni proces na webu',
  },
  hero: {
    title: 'Jedan poslovni proces na webu.',
    subtitle: 'Vi kažete koji se posao danas radi ručno. Ja ga složim kao alat na webu. Kod i podaci ostaju vama.',
  },
  sendProcessLabel: 'Pošalji proces',
  about: {
    title: 'Što radim',
    paragraphs: [
      'Gradim jedan poslovni proces. Vi kažete koji: posao koji se danas radi ručno, u tablici ili preko mailova. Ja ga složim kao alat na webu.',
      'Sav kod i svi podaci ostaju vama, a proces je u cijelosti vaš.',
      'AI agent ulazi samo ako je on taj korak u procesu. Čovjek uvijek potvrdi prije nego što se pošalje mail ili plati.',
    ],
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
  notDoing: {
    title: 'Ne radim',
    items: ['web stranice i vizitke', 'WordPress', 'usluge na pretplatu', 'agente koji sami šalju mail ili plaćaju'],
  },
  contact: {
    title: 'Kontakt',
    intro: 'Odgovorite na tri pitanja, dovoljno je nekoliko rečenica:',
    questions: ['Koji se posao danas radi ručno?', 'Što ulazi i što mora izaći?', 'Tko to danas radi?'],
    ideaNote:
      'Proces još nije jasan? Ako imate ideju, ali ne i jasan proces, javite se: razgovaramo o tome što bi to bilo kao jedan poslovni proces na webu.',
  },
  nav: {
    label: 'Navigacija',
    contact: 'Kontakt',
  },
  footer: {
    name: 'Mato Lučić',
    portfolioLabel: 'Portfolio',
  },
} as const;
