/**
 * `no-restricted-syntax` selectors for Next.js App Router files: no `'use client'` in pages and layouts, and a typed
 * response for Route Handlers.
 *
 * Derived from: the two blocks `app/**\/{layout,page}.*` and `app/**\/route.*` in `eslint-config-upleveled@11.0.0`
 * (`node_modules/eslint-config-upleveled/index.js`). Selectors and messages are copied VERBATIM.
 *
 * Why they live here too: upleveled matches `app/**` relative to the ESLint root. That works for `app/page.tsx`, but a
 * package in a monorepo (`apps/web/app/page.tsx`) or a different App Router folder (`src/app/...`) is never matched,
 * so both guardrails would silently be off. `eslint.config.js` registers them again for the configured folders. For a
 * plain `app/` folder at the root the result is identical to upleveled's own blocks.
 */

/** Pages and layouts stay Server Components, interactivity goes into a separate Client Component file */
export const pageNoUseClientSyntax = {
  selector: "ExpressionStatement > Literal[value='use client']",
  message:
    'Performance: avoid making pages or layouts into Client Components - instead create a new Client Component and use it in your page / layout',
};

/**
 * Route Handlers (`GET`, `POST`, `PUT`, `DELETE`) declare `Promise<NextResponse<Body>>`, so the shape of the JSON
 * response is checked by TypeScript and the client can rely on it
 */
export const routeHandlerReturnTypeSyntax = {
  selector:
    "FunctionDeclaration[id.name=/^(GET|POST|PUT|DELETE)$/]:not([returnType.typeAnnotation.typeName.name='Promise'][returnType.typeAnnotation.typeArguments.params.0.typeName.name='NextResponse'][returnType.typeAnnotation.typeArguments.params.0.typeArguments.params.0]):not([returnType.typeAnnotation.typeName.name='NextResponse'][returnType.typeAnnotation.typeArguments.params.0])",
  message:
    'Route Handler function missing return type annotation (eg. `async function PUT(request: NextRequest): Promise<NextResponse<AnimalResponseBodyPut>>`)',
};
