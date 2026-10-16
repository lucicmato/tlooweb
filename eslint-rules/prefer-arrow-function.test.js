// Unit tests for `conventions/prefer-arrow-function`.
//
// Needs `@typescript-eslint/parser`, because overloads, assertion functions and the TSX generic comma are TypeScript
// syntax. Run from the project root: `node --test "eslint-rules/*.test.js"` (double quotes, see README.md).

import typescriptParser from '@typescript-eslint/parser';

import { RuleTester } from 'eslint';
import { describe, it } from 'node:test';
import { preferArrowFunction } from './prefer-arrow-function.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parser: typescriptParser, parserOptions: { ecmaFeatures: { jsx: true } } },
});

ruleTester.run('prefer-arrow-function', preferArrowFunction, {
  valid: [
    'export const TextField = ({ label }: TextFieldProps) => <label>{label}</label>;',
    'const Page = async () => null;\n\nexport default Page;',
    // Route Handlers keep the declaration, the typed-response selector only matches `FunctionDeclaration`
    {
      code: 'export async function GET(): Promise<NextResponse<Body>> { return NextResponse.json({}); }',
      filename: 'app/api/notes/route.ts',
    },
    {
      code: 'export async function PATCH(request: NextRequest) { return NextResponse.json({}); }',
      filename: 'app/api/notes/[noteId]/route.ts',
    },
    // Overloads, exported or not
    'function parse(value: string): number;\nfunction parse(value: number): number;\nfunction parse(value: unknown) { return Number(value); }',
    'export function parse(value: string): number;\nexport function parse(value: unknown) { return Number(value); }',
    'function assertDefined<T>(value: T): asserts value is NonNullable<T> { if (value == null) throw new Error(); }',
    'function* ids() { yield 1; }',
    'function handleClick(this: HTMLButtonElement) { this.blur(); }',
    'function legacy() { return arguments.length; }',
    'function Model() { if (!new.target) throw new Error(); }',
    'function Counter() { this.count = 0; }',
  ],
  invalid: [
    {
      code: 'export function TextField({ label }: TextFieldProps) {\n  return <label>{label}</label>;\n}',
      output: 'export const TextField = ({ label }: TextFieldProps) => {\n  return <label>{label}</label>;\n};',
      errors: [{ messageId: 'preferArrow', data: { name: 'TextField' } }],
    },
    {
      code: 'async function load(id: string): Promise<Note> { return fetchNote(id); }',
      output: 'const load = async (id: string): Promise<Note> => { return fetchNote(id); };',
      errors: [{ messageId: 'preferArrow' }],
    },
    // Next.js special files: the default export moves to the bottom
    {
      code: "export default function Page({ params }: PageProps<'/'>) {\n  return null;\n}",
      output: "const Page = ({ params }: PageProps<'/'>) => {\n  return null;\n};\n\nexport default Page;\n",
      filename: 'app/page.tsx',
      errors: [{ messageId: 'preferArrow', data: { name: 'Page' } }],
    },
    // A file that already ends with a newline gets one blank line before the export, not two
    {
      code: 'export default function Layout() {\n  return null;\n}\n',
      output: 'const Layout = () => {\n  return null;\n};\n\nexport default Layout;\n',
      filename: 'app/layout.tsx',
      errors: [{ messageId: 'preferArrow', data: { name: 'Layout' } }],
    },
    // A CRLF file stays CRLF
    {
      code: 'export default function Layout() {\r\n  return null;\r\n}\r\n',
      output: 'const Layout = () => {\r\n  return null;\r\n};\r\n\r\nexport default Layout;\r\n',
      filename: 'app/layout.tsx',
      errors: [{ messageId: 'preferArrow', data: { name: 'Layout' } }],
    },
    {
      code: 'export default function () { return null; }',
      output: null,
      errors: [{ messageId: 'anonymousDefault' }],
    },
    // TSX needs the comma, a `.ts` file does not
    {
      code: 'export function List<T>(props: ListProps<T>) { return null; }',
      output: 'export const List = <T,>(props: ListProps<T>) => { return null; };',
      filename: 'components/List.tsx',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'export function first<T>(items: T[]) { return items[0]; }',
      output: 'export const first = <T>(items: T[]) => { return items[0]; };',
      filename: 'lib/first.ts',
      errors: [{ messageId: 'preferArrow' }],
    },
    // `this` inside a nested function belongs to that function
    {
      code: 'function outer() { return function inner() { return this; }; }',
      output: 'const outer = () => { return function inner() { return this; }; };',
      errors: [{ messageId: 'preferArrow' }],
    },
    // Reported without a fix: used above the declaration (a `const` is not hoisted)
    {
      code: 'const label = format(1);\nfunction format(value: number) { return String(value); }',
      output: null,
      errors: [{ messageId: 'preferArrow' }],
    },
    // Reported without a fix: the comment between `)` and the body would be lost
    {
      code: 'function format(value: number) /* why */ { return String(value); }',
      output: null,
      errors: [{ messageId: 'preferArrow' }],
    },
    // Nested declarations count too
    {
      code: 'const run = () => {\n  function step() { return 1; }\n  return step();\n};',
      output: 'const run = () => {\n  const step = () => { return 1; };\n  return step();\n};',
      errors: [{ messageId: 'preferArrow', data: { name: 'step' } }],
    },
  ],
});
