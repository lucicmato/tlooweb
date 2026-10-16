<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

tlooweb: a Next.js web application. A single npm package without a `src/` folder: Next.js 16 App Router in `app/`, React 19, Tailwind CSS 4, no database.

## Setup

1. Use Node 24 or newer and npm 11.10.0 or newer (`devEngines` in `package.json`; older npm silently ignores `min-release-age` in `.npmrc`). This is a human step
2. `npm install`, then ask the user to run `npm run rebuild:trusted` (install scripts of dependencies are off, see Process; this is a human step)
3. `npm run build` (generates the Next.js route types that `npm run lint` and `npm run typecheck` need)

## Checks

For prose-only changes (including notes, README files and `AGENTS.md`), review the diff. Do not run builds, lint, type checks or tests.

For code changes, run only checks relevant to the changed behavior, from the repository root. Use file or test filters where supported:

- `npm run lint`
- `npm run typecheck`
- `npm run format:check` (only for files that were not edited through the Claude Code editor tools, which the hooks format automatically)
- `npm run test:eslint-rules` (only after changing `eslint-rules/`)
- `npm run test:hooks` (only after changing `.claude/hooks/`)

The project has no unit or end-to-end tests yet.

CI in `.github/workflows/ci.yml` runs the full suite. Do not repeat or broaden passing checks without a new change or unresolved concern. If a check fails, reproduce the failure and fix the cause before rerunning it. Investigate failed checks rather than rerunning until green.

Fix failures without weakening checks or expectations. Do not disable a rule, add a suppression, skip or delete a test, loosen an assertion or change a guardrail to make a change pass. If a check or an expectation looks wrong, say so and ask. Requirement changes need the user's approval.

## Guardrails in this repository

In Claude Code these are enforced by tools, not by this file (`.claude/settings.json` and `.claude/hooks/`); other agents only get the instructions in this file, so they run the checks themselves:

- after each edit, the edited file is formatted (Prettier) and linted (`eslint --fix --max-warnings 0`); what `--fix` cannot fix comes back to you as an error
- before each command or file access, destructive database commands, credential files, hand edits of lockfiles and `node_modules`, force pushes, installs with another package manager and weakened lint flags are rejected; an `eslint-disable` without a `-- reason` and any `@ts-ignore` are rejected, and a described `eslint-disable` or a skipped or removed test needs the user's approval
- before you finish, `npm run typecheck` and `npm run lint` run if you changed code; a failure keeps you working

If a guardrail rejects something, do not look for another spelling of the same action or edit the guardrail. Tell the user which one blocked you and why you needed it.

## Process

- Keep diffs small and follow the style of the surrounding code
- Before writing a label, term or claim, check that it exists in the references or the repository. Do not guess
- Quote diagnostics and terminal output from real runs, not from memory. No long demos, rehearsals or agent runs unless asked
- Add a dependency only when asked. The project `.npmrc` saves exact versions (`save-exact=true`), rejects releases younger than 7 days (`min-release-age=7`) and does not run install scripts of dependencies (`ignore-scripts=true`). Do not override any of them (`--min-release-age=0`, `npm rebuild`, `--ignore-scripts=false`): name the exact package and version you need, and ask the user to approve and install it themselves
- Never log a password, a password hash, a token, a session cookie or a request body that contains one (`console.log`), and remove debugging output before you finish. No lint rule in the workshop setup catches this
- When the user rejects a wording or an approach without choosing a replacement, offer 2-3 options and wait

## Final report

End every task with:

- the changes you made
- the final result of each check you ran
- unfinished criteria, if any
- every guardrail error you hit during the task, including errors you fixed before the final checks: command, file, exact message, the code that was rejected and the correction. `node .claude/hooks/guardrails-report.mjs` lists what the hooks recorded

If no guardrail reported an error, say so. Do not invent errors or deliberately introduce failures.

## Project conventions

- Pages and layouts are Server Components in `app/`, Client Components are separate files starting with `'use client'`
- Next.js version notice: before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (resolved from the directory of the package that depends on `next`; in a monorepo the `next` package may not be visible from the root). The installed version can differ from your training data. `next dev` writes this notice into the `AGENTS.md` of the Next.js package itself (the `BEGIN:nextjs-agent-rules` block at the top of this file), so keep that block and commit it

## Code conventions

Personal style, valid in every project. A project-specific rule above wins if it conflicts. Comments and identifiers are in English and explain why, never what: if a comment retells the code, the code needs a better name.

### Import order

Four groups, in this order, one blank line between groups: (1) React: `react`, `react-dom`; (2) default imports: everything without curly braces; (3) named imports: everything with curly braces; (4) styles and other side-effect imports. The shape of an import is quicker to see than its path, so shape is the primary sort key.

```tsx
'use client';

import { useState } from 'react';

import Link from 'next/link';
import toast from 'react-hot-toast';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { PasswordField } from '@/components/ui/form/PasswordField';
import { TextField } from '@/components/ui/form/TextField';
import { createClient } from '@/utils/supabase/client';

import './form.css';
```

Inside a group: framework (`next/*`), then third-party, then `@/*`, then relative (`./`, `../`), alphabetical inside each; no blank lines inside a group. `import React, { useState } from 'react'` is group 1. `import type { Metadata } from 'next'` is group 3 (it has `{}`), `import type Config from './config'` and `import * as z from 'zod'` are group 2. `import './globals.css'` is group 4. `import 'server-only'` goes before everything, as a marker. `'use client'` / `'use server'` stays the first line, with a blank line below. `import/order` sorts by path and cannot express this. This project enforces it with `eslint-plugin-perfectionist`, so `eslint --fix` applies it.

### Exports

Named exports for components and functions. `export default` only where the framework requires it: Next.js `page.tsx`, `layout.tsx`, `error.tsx` and the other special files, `proxy.ts` (called `middleware.ts` before Next.js 16), and tool config files such as `eslint.config.js` or `eslint.config.mjs`. `route.ts` handlers are named HTTP method exports (`GET`, `POST`): Next.js ignores a default export there. A named export cannot be renamed at the import site, so a search for the component name finds every use.

### Functions

Components and functions are arrow functions assigned to a `const`, not `function` declarations, and every new component starts that way. One form for everything a module defines, and a `const` cannot be reassigned the way a `function` declaration can.

```tsx
export const TextField = ({ label, error }: TextFieldProps) => {
  // ...
};
```

Next.js special files use the same form with the default export at the bottom: `const Page = async ({ params }: PageProps<'/animals/[animalId]'>) => { ... };`, then `export default Page;`. Route Handlers in `route.ts` stay `export async function GET(request: NextRequest): Promise<NextResponse<Body>>`: the typed-response guardrail matches function declarations only, so an arrow handler would skip the check silently. A generic component in a `.tsx` file needs a comma (`const List = <T,>(props: ListProps<T>) => ...`), otherwise TSX reads `<T>` as a JSX tag. TypeScript overloads and assertion functions (`asserts value is T`) stay `function` declarations. No lint rule enforces this, so apply it by hand. The ESLint config, `eslint-rules/`, `prettier.config.js` and `.claude/hooks/` are copies of the guardrails kit and keep its declarations.

### Comments

A non-trivial component or util gets a JSDoc block of one to three sentences that stresses the decision the code does not show:

```tsx
/**
 * The proxy adds `?next=` when it bounces an unauthenticated request. Only
 * same-origin, single-slash paths are honoured: anything else would turn the
 * login redirect into an open redirect.
 */
```

### Styles and classes

Tailwind is the styling layer. A Tailwind class string that appears a second time moves to a shared constant (`fieldStyles.ts` with `inputClassName`, `labelClassName`), not a copied string per component; otherwise changing a focus ring becomes a project-wide search. SCSS only for what Tailwind does not cover cleanly (keyframes, `:has()` and deep child selectors, overriding third-party components): `@use` never `@import`, at most 2 levels of nesting, no hardcoded colors, spacing or typography (read the custom properties from `@theme`), `sass` in `devDependencies`, and an SCSS file that only rewrites Tailwind utilities is deleted. Layout: `styles/_mixins.scss` (shared mixins), `styles/_keyframes.scss` (animations), `styles/vendor/_toastify.scss` (override of third-party CSS), `app/globals.css` (`@import 'tailwindcss'` and `@theme`, the tokens), and `Component.module.scss` next to its component only where needed.

### File names

- component: `PascalCase.tsx`, in a folder by area (`components/ui/form/TextField.tsx`)
- util, constants, style constants: `camelCase.ts` (`fieldStyles.ts`, `nextPath.ts`, `fonts.ts`)
- the file name is the name of its main export

### Constants

Static lists, maps and constants live at module level, not inside the component body, and get `as const`. IDs and string literals used more than once go into a named constant (`const MOBILE_NAV_ID = 'mobile-navigation'`). What never changes is not rebuilt on every render, and a duplicated literal is a silent bug that a diff does not show.

### Accessibility is not a phase

A form is not written without `aria-invalid` and `aria-describedby` tied to the error message. A navigation is not written without `aria-label` and `aria-expanded` / `aria-controls` on the toggle. They go in with the first version: adding them later means rewriting the component.

### Validation is the server's job

Client-side validation is UX, not a boundary. Every input that arrives from outside (form, query parameter, tool input) is validated on the server too, from the same schema the form uses. Redirect targets and URLs from query parameters are never trusted without a check (see `safeNextPath`).

### Project setup

The Prettier config (`.prettierrc` or `prettier.config.js`, never both: Prettier picks `.prettierrc` first), `tsconfig.json`, the flat ESLint config (`eslint.config.mjs` or `eslint.config.js`, never both: ESLint silently uses the `.js` one) and the `typecheck`, `lint`, `format`, `format:check` scripts exist before the first component; add what is missing first. `strict: true` is never turned off: if something does not pass, the code is wrong. `@/*` points to the project root (`"paths": { "@/*": ["./*"] }`), there is no `src/` folder. Relative imports only inside the same folder (`./FieldError`); going up with `../` uses `@/`. `eslint-disable` without a comment that says why is forbidden: a rule switched off without a reason is a rule that never comes back.
