// Unit tests for `conventions/english-only` (heuristic: Croatian diacritics in comments and identifiers).
//
// Run from the project root: `node --test "eslint-rules/*.test.js"` (double quotes, see README.md).

import { RuleTester } from 'eslint';
import { describe, it } from 'node:test';
import { englishOnly } from './english-only.js';

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester().run('english-only', englishOnly, {
  valid: [
    '// The proxy only honours same-origin paths\nconst nextPath = "/";',
    '/* Explains why, not what */ const value = 1;',
    // User-facing copy may be Croatian, only comments and identifiers are checked
    'const label = "Šuma";',
    'const message = `Čekaj`;',
    // Croatian without diacritics cannot be detected (documented limit of the heuristic)
    '// ovo je komentar\nconst value = 1;',
    { code: '// naïve is fine with a custom character set\nconst value = 1;', options: [{ characters: 'čćžšđ' }] },
  ],
  invalid: [
    {
      code: '// Čuvamo sesiju jer korisnik može otvoriti više kartica\nconst value = 1;',
      errors: [{ messageId: 'comment', data: { character: 'Č' } }],
    },
    {
      code: '/* Ovdje se računa ukupna cijena */ const value = 1;',
      errors: [{ messageId: 'comment', data: { character: 'č' } }],
    },
    {
      code: 'const cijenaZaŠtampu = 1;',
      errors: [{ messageId: 'identifier', data: { character: 'Š', name: 'cijenaZaŠtampu' } }],
    },
    {
      code: 'function računaj() {}',
      errors: [{ messageId: 'identifier', data: { character: 'č', name: 'računaj' } }],
    },
    {
      code: '// naïve is flagged with a custom character set\nconst value = 1;',
      options: [{ characters: 'ï' }],
      errors: [{ messageId: 'comment', data: { character: 'ï' } }],
    },
  ],
});
