import type { PageText } from '@/lib/i18n/pageText';

const tagline = ['Your process.', 'Your tool.', 'Your data.'] as const;

// The talk card of the diagram and the "no" answer of the step list say the same thing in two forms
const untilProcessIsClear = 'until the process is clear';

/**
 * English copy, translated from `hr.ts` in the same plain register: no exclamation marks, no "solutions", sentence-case
 * headings (brand/README.md).
 */
export const en = {
  nav: {
    label: 'Navigation',
    contact: 'Contact',
    languageLabel: 'Language',
  },
  hero: {
    titleLines: tagline,
    lead: 'We turn work you do by hand today into a web tool.',
    text: 'Instead of costly subscriptions and off-the-shelf tools that don’t fit how you work, you get a tool built for you that you pay for once.',
  },
  sendProcessLabel: 'Send your process',
  about: {
    title: 'About us',
    text: 'We are TLOWeb. We build software for telecommunications and finance, and tools that make everyday business easier. We put that experience into tools that replace manual work in spreadsheets and email, with no subscription. We keep maintaining the tool we build after delivery, for as long as you need it and as long as there are new requests.',
    portfolioLabel: 'See our portfolio',
  },
  services: {
    title: 'What we do',
    items: [
      {
        tag: 'WHAT WE BUILD',
        title: 'A tool shaped to your work',
        text: 'We take work that is done by hand today, in a spreadsheet or over email, and build it as a web tool. You choose which work.',
      },
      {
        tag: 'WHO OWNS IT',
        title: 'The code and data stay yours',
        text: 'The process is entirely yours, and there is no subscription.',
      },
      {
        tag: 'WHO DECIDES',
        title: 'A person has the final say',
        text: 'An AI agent comes in only if it is that step of the process. Before an email goes out or a payment is made, a person always confirms.',
      },
    ],
  },
  process: {
    title: 'How the problem gets solved',
    intro: 'If the process isn’t clear yet, we talk first. Everything else takes three steps.',
    flowTitle: 'From manual work to a tool',
    today: {
      label: 'TODAY',
      title: 'Manual work',
      note: 'in spreadsheets and email, or anything else that bothers you',
    },
    send: {
      title: 'You send the process',
      linkLabel: 'answer three questions',
    },
    decision: {
      label: 'QUESTION',
      titleLines: ['Is the process', 'clear?'],
      yes: 'yes',
      yesNote: 'on to step 2',
      no: 'no',
      noNote: `first a conversation, ${untilProcessIsClear}`,
    },
    talk: {
      title: 'Conversation',
      note: untilProcessIsClear,
    },
    build: {
      title: 'We build the web tool',
    },
    own: {
      title: 'The process is yours',
      note: 'all the code and all the data',
    },
  },
  examples: {
    title: 'Examples',
    intro: 'Three kinds of process, as examples. This is not a list of finished projects.',
    items: [
      {
        title: 'Sorting what comes in',
        text: 'Incoming items arrive in different forms: spreadsheets, PDFs, emails. The tool takes them in, sorts them by rules you set and leaves to a person whatever the rules don’t cover.',
      },
      {
        title: 'A register that isn’t an off-the-shelf HR tool',
        text: 'A list kept in a spreadsheet because no ready-made tool fits your work. The tool keeps it in one place, instead of in a spreadsheet that everyone has in a different version.',
      },
      {
        title: 'An inquiry that lands in a tool you already use',
        text: 'An inquiry comes in through the web and ends up where your team already tracks it, in a tool you already use. Not in yet another inbox.',
      },
    ],
  },
  contact: {
    title: 'Contact',
    intro: 'Answer three questions, a few sentences are enough:',
    questions: ['What work is done by hand today?', 'What goes in and what has to come out?', 'Who does it today?'],
    ideaNote:
      'Process not clear yet? If you have an idea but not a clear process, get in touch and we will work it out together.',
    mailSubject: 'A process for TLOWeb',
  },
  footer: {
    taglineLines: tagline,
    emailLabel: 'EMAIL',
    portfolioLabel: 'PORTFOLIO',
    portfolioLinkLabel: 'See our work',
    backToTop: 'Back to top ↑',
  },
} as const satisfies PageText;
