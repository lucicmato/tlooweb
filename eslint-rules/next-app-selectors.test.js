// Unit tests for the Next.js App Router selectors in `next-app-selectors.js`.
//
// Origin: new in this kit (the workshop relies on the same selectors inside eslint-config-upleveled and has no test
// for them). The cases pin down what the selectors accept and what they report.
//
// Needs `@typescript-eslint/parser`, because the Route Handler selector reads TypeScript return type annotations. Run
// from the project root: `node --test "eslint-rules/*.test.js"` (double quotes, see README.md).

import typescriptParser from '@typescript-eslint/parser';

import { RuleTester } from 'eslint';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import { describe, it } from 'node:test';
import { pageNoUseClientSyntax, routeHandlerReturnTypeSyntax } from './next-app-selectors.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({ languageOptions: { parser: typescriptParser } });
const noRestrictedSyntax = builtinRules.get('no-restricted-syntax');

ruleTester.run('no-restricted-syntax page without use client', noRestrictedSyntax, {
  valid: [
    {
      code: 'export default function Page() { return null; }',
      options: [pageNoUseClientSyntax],
    },
    // A string that merely looks like the directive, deeper in the file, is not a directive
    {
      code: "export default function Page() { const label = 'use client'; return label; }",
      options: [pageNoUseClientSyntax],
    },
  ],
  invalid: [
    {
      code: "'use client';\n\nexport default function Page() { return null; }",
      options: [pageNoUseClientSyntax],
      errors: [{ message: /^Performance: avoid making pages or layouts into Client Components/ }],
    },
  ],
});

ruleTester.run('no-restricted-syntax Route Handler return type', noRestrictedSyntax, {
  valid: [
    {
      code: 'export async function GET(): Promise<NextResponse<{ animals: string[] }>> { return NextResponse.json({ animals: [] }); }',
      options: [routeHandlerReturnTypeSyntax],
    },
    {
      code: 'export function POST(): NextResponse<{ ok: true }> { return NextResponse.json({ ok: true }); }',
      options: [routeHandlerReturnTypeSyntax],
    },
    // Only the four HTTP method names are checked
    {
      code: 'async function helper() { return 1; }',
      options: [routeHandlerReturnTypeSyntax],
    },
  ],
  invalid: [
    {
      code: 'export async function GET() { return NextResponse.json({ animals: [] }); }',
      options: [routeHandlerReturnTypeSyntax],
      errors: [{ message: /^Route Handler function missing return type annotation/ }],
    },
    {
      // A `Promise` that does not wrap a `NextResponse<Body>` does not make the JSON shape checkable
      code: 'export async function PUT(): Promise<Response> { return Response.json({}); }',
      options: [routeHandlerReturnTypeSyntax],
      errors: [{ message: /^Route Handler function missing return type annotation/ }],
    },
    {
      // `NextResponse` without a body type argument
      code: 'export async function DELETE(): Promise<NextResponse> { return NextResponse.json({}); }',
      options: [routeHandlerReturnTypeSyntax],
      errors: [{ message: /^Route Handler function missing return type annotation/ }],
    },
  ],
});
