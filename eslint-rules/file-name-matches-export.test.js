// Unit tests for `conventions/file-name-matches-export`.
//
// Run from the project root: `node --test "eslint-rules/*.test.js"` (double quotes, see README.md).

import { RuleTester } from 'eslint';
import { describe, it } from 'node:test';
import { fileNameMatchesExport } from './file-name-matches-export.js';

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester().run('file-name-matches-export', fileNameMatchesExport, {
  valid: [
    { code: 'export function TextField() {}', filename: 'components/ui/form/TextField.tsx' },
    { code: 'export const TextField = () => null;', filename: 'components/ui/form/TextField.tsx' },
    // Several exports are fine, as long as one of them is named like the file
    { code: 'export function Card() {}\nexport function CardHeader() {}', filename: 'components/Card.tsx' },
    { code: 'function Card() {}\nexport { Card };', filename: 'components/Card.tsx' },
    { code: 'export class ErrorBoundary {}', filename: 'components/ErrorBoundary.tsx' },
    // Barrel files re-export other modules
    { code: "export * from './TextField';", filename: 'components/index.tsx' },
    // Default exports are reported by `conventions/no-default-export`, not twice
    { code: 'export default function TextField() {}', filename: 'components/TextField2.tsx' },
    // Not component files: more dots in the name, no exports at all
    { code: 'export function somethingElse() {}', filename: 'components/Button.stories.tsx' },
    { code: 'const local = 1;', filename: 'components/Anything.tsx' },
  ],
  invalid: [
    {
      code: 'export function Input() {}',
      filename: 'components/ui/form/TextField.tsx',
      errors: [{ messageId: 'mismatch', data: { fileName: 'TextField', exported: 'Input' } }],
    },
    {
      code: 'export const inputClassName = "a";\nexport const labelClassName = "b";',
      filename: 'components/ui/form/fieldStyles.tsx',
      errors: [
        { messageId: 'mismatch', data: { fileName: 'fieldStyles', exported: 'inputClassName, labelClassName' } },
      ],
    },
  ],
});
