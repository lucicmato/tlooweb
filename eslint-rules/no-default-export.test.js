// Unit tests for `conventions/no-default-export`.
//
// Run from the project root: `node --test "eslint-rules/*.test.js"` (double quotes, see README.md).

import { RuleTester } from 'eslint';
import { describe, it } from 'node:test';
import { noDefaultExport } from './no-default-export.js';

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester().run('no-default-export', noDefaultExport, {
  valid: [
    'export function TextField() {}',
    'export const TextField = () => null;',
    'export class ErrorBoundary {}',
    'const a = 1;\nexport { a };',
    "export { a as b } from './a';",
    "export * from './a';",
    "export * as helpers from './a';",
    // Importing a default export is not restricted, only declaring one
    "import config from './config';\nexport const value = config;",
  ],
  invalid: [
    {
      code: 'export default function Page() {}',
      errors: [{ messageId: 'noDefaultExport' }],
    },
    {
      code: 'export default class Page {}',
      errors: [{ messageId: 'noDefaultExport' }],
    },
    {
      code: 'export default { name: "config" };',
      errors: [{ messageId: 'noDefaultExport' }],
    },
    {
      code: 'const value = 1;\nexport { value as default };',
      errors: [{ messageId: 'noDefaultExport' }],
    },
    {
      code: "export { default } from './page';",
      errors: [{ messageId: 'noDefaultExport' }],
    },
    {
      code: "export { value as default } from './page';",
      errors: [{ messageId: 'noDefaultExport' }],
    },
    {
      code: "export * as default from './page';",
      errors: [{ messageId: 'noDefaultExport' }],
    },
  ],
});
