/**
 * OPTIONAL flat-config layer that enforces the personal code conventions as far as ESLint can.
 *
 * Origin: personal conventions (`~/.claude/CLAUDE.md`), NOT the workshop. It is composable: `eslint.config.js` spreads
 * it at the end when `projectSettings.enableConventions` is `true`, or use it on its own:
 *
 *   import upleveled from 'eslint-config-upleveled';
 *   import { createConventionsConfig } from './eslint.conventions.js';
 *   export default [...upleveled, ...createConventionsConfig()];
 *
 * What it enforces (everything else is in the "cannot be automated" list in README.md):
 * - import grouping: `server-only`, React, default imports, named imports, styles and side-effect imports, one blank
 *   line between groups, `next/*` then third-party then `@/*` then relative inside a group (eslint-plugin-perfectionist)
 * - named exports only, `export default` just in the files where Next.js needs it or allows it (custom rule
 *   `conventions/no-default-export`, same detection as `no-restricted-exports` with a message that says what to do)
 * - no `../` imports, use the `@/*` alias (`no-restricted-imports`)
 * - file names: `PascalCase.tsx` for components, `camelCase.ts` for everything else (`unicorn/filename-case`) and a
 *   component file exports a name equal to its file name (custom rule `conventions/file-name-matches-export`)
 * - components and functions as arrow functions assigned to a `const`, with the exceptions of the convention built in
 *   (Route Handlers, overloads, assertion functions, generators, `this`) and an autofix (custom rule
 *   `conventions/prefer-arrow-function`). The kit's own files keep their declarations, see `KIT_FILES`
 * - comments and identifiers in English, as a heuristic for Croatian diacritics (custom rule `conventions/english-only`)
 * - a blank line after the `'use client'` / `'use server'` directive (`@stylistic/padding-line-between-statements`)
 * - OPT-IN: a named constant for duplicated string literals (`sonarjs/no-duplicate-string`, see `duplicateStringThreshold`)
 *
 * Relies on plugins that `eslint-config-upleveled` already registers: `unicorn` and `@stylistic`. Needs
 * `eslint-plugin-perfectionist` (verified with 5.12.1 on ESLint 10.11.0).
 */

import perfectionist from 'eslint-plugin-perfectionist';

import { englishOnly } from './eslint-rules/english-only.js';
import { fileNameMatchesExport } from './eslint-rules/file-name-matches-export.js';
import { noDefaultExport } from './eslint-rules/no-default-export.js';
import { preferArrowFunction } from './eslint-rules/prefer-arrow-function.js';

const CODE_FILES = '**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}';

// Copies of the guardrails kit, written with `function` declarations like the workshop they come from. They are
// replaced as a whole when the kit changes, so rewriting them here would only create a diff against the kit
const KIT_FILES = [
  'eslint.config.{js,mjs}',
  'eslint.conventions.js',
  'prettier.config.js',
  'eslint-rules/**',
  '.claude/**',
];

// Next.js App Router files (Next.js 16) that REQUIRE a default export, according to the docs
// (`next/dist/docs/01-app/03-api-reference/03-file-conventions/`): page, layout, template, loading, error, global-error,
// not-found, default, forbidden, unauthorized and the metadata files in code form (sitemap, robots, manifest, icon,
// apple-icon, opengraph-image, twitter-image; the last one is documented on the `opengraph-image` page).
// `route`, `instrumentation` and `mdx-components` use named exports, so they are deliberately NOT in this list.
const NEXT_DEFAULT_EXPORT_FILE_NAMES = [
  'page',
  'layout',
  'template',
  'loading',
  'error',
  'global-error',
  'not-found',
  'default',
  'forbidden',
  'unauthorized',
  'sitemap',
  'robots',
  'manifest',
  'icon',
  'apple-icon',
  'opengraph-image',
  'twitter-image',
];

// Every special file name of the App Router, for the file name rules (`route`, `mdx-components`, ... are lowercase
// kebab-case names that Next.js dictates)
const NEXT_SPECIAL_FILE_NAMES = [
  ...NEXT_DEFAULT_EXPORT_FILE_NAMES,
  'route',
  'proxy',
  'middleware',
  'instrumentation',
  'instrumentation-client',
  'mdx-components',
];

// Next.js: "The file must export a single function, either as a default export or named `proxy`", so both are allowed
const NEXT_OPTIONAL_DEFAULT_EXPORT_FILE_NAMES = ['proxy', 'middleware'];

const EXTENSIONS = '{js,jsx,ts,tsx,mjs,cjs,mts,cts}';

// Files that tools load through their default export (`next.config.ts`, `eslint.config.js`, `postcss.config.mjs`,
// `playwright.config.ts`, `jest.config.ts`, `prettier.config.js`, `ley.config.js`, ...)
const CONFIG_FILES = `**/*.config.${EXTENSIONS}`;

/**
 * Import tiers inside one import shape, in the order they appear. Separate custom groups per tier with no blank line
 * between them give the order `next/*`, third-party, `@/*`, relative without splitting the shape group visually.
 * Node built-ins (`node:fs`) sort with third-party packages, which is a choice, the convention does not name them.
 */
const IMPORT_TIERS = [
  { name: 'framework', matchers: [{ elementNamePattern: '^next(/.+)?$' }] },
  { name: 'third-party', matchers: [{ selector: 'external' }, { selector: 'builtin' }] },
  { name: 'internal', matchers: [{ selector: 'internal' }] },
  { name: 'relative', matchers: [{ selector: 'parent' }, { selector: 'sibling' }, { selector: 'index' }] },
];

/**
 * "The shape of an import is the primary sort key": anything without braces is "default" (`import A`,
 * `import * as A`, `import type A`), anything with braces is "named" (`import type { A }` and `import A, { b }` too).
 * Listed in the order they appear in a file.
 */
const IMPORT_SHAPES = [
  { name: 'default', modifierSets: [['default'], ['wildcard']] },
  { name: 'named', modifierSets: [['named']] },
];

// One plugin object for both config objects below: flat config refuses two different objects under the same plugin name
const conventionsPlugin = {
  rules: {
    'english-only': englishOnly,
    'file-name-matches-export': fileNameMatchesExport,
    'no-default-export': noDefaultExport,
    'prefer-arrow-function': preferArrowFunction,
  },
};

const shapeTierGroupName = (/** @type {string} */ shape, /** @type {string} */ tier) => `${shape}-${tier}`;

const importCustomGroups = [
  // `import 'server-only'` is a marker, it goes before everything else
  { groupName: 'server-only', elementNamePattern: '^server-only$' },
  // React wins over the import shape (`import React, { useState } from 'react'` is a React import)
  { groupName: 'react', elementNamePattern: ['^react$', '^react/.+', '^react-dom$', '^react-dom/.+'] },
  // Styles, including `import styles from './X.module.scss'`, and side-effect imports go last
  {
    groupName: 'styles-and-side-effects',
    type: 'unsorted',
    anyOf: [{ selector: 'side-effect-style' }, { selector: 'style' }, { selector: 'side-effect' }],
  },
  // Custom groups match in the order listed here, so "named" is listed before "default": a mixed
  // `import A, { b }` (default AND named specifier) has to be claimed by the named group
  ...[...IMPORT_SHAPES].reverse().flatMap((shape) =>
    IMPORT_TIERS.map((tier) => ({
      groupName: shapeTierGroupName(shape.name, tier.name),
      anyOf: shape.modifierSets.flatMap((modifiers) => tier.matchers.map((matcher) => ({ modifiers, ...matcher }))),
    })),
  ),
];

const importGroups = [
  'server-only',
  'react',
  ...IMPORT_SHAPES.flatMap((shape) =>
    IMPORT_TIERS.flatMap((tier, index) => {
      const groupName = shapeTierGroupName(shape.name, tier.name);

      // No blank line between the tiers of one shape, the global `newlinesBetween: 1` applies between shapes
      return index === 0 ? [groupName] : [{ newlinesBetween: 0 }, groupName];
    }),
  ),
  'styles-and-side-effects',
  'unknown',
];

/**
 * @param {object} [options]
 * @param {string} [options.appDir] Folder with `app/` and the sources, `'.'` for a single-package project
 * @param {string} [options.nextAppDir] Next.js App Router folder inside `appDir`
 * @param {string[]} [options.extraDefaultExportFiles] More globs (relative to `appDir`) that may use `export default`
 * @param {string[]} [options.filenameCaseIgnores] More globs (relative to `appDir`) skipped by the file name rules, eg.
 *   `['migrations/**']` for ley migrations named `00000-createTable.ts` or `['components/ui/*.tsx']` for shadcn/ui
 * @param {number} [options.duplicateStringThreshold] Turns on `sonarjs/no-duplicate-string` with this threshold (2 means
 *   "second occurrence"). Off by default: it ignores JSX attribute values, so it does NOT catch a repeated
 *   `aria-controls="mobile-navigation"`, and it needs a registered `sonarjs` plugin (eslint-config-upleveled has it)
 */
export function createConventionsConfig({
  appDir = '.',
  nextAppDir = 'app',
  extraDefaultExportFiles = [],
  filenameCaseIgnores = [],
  duplicateStringThreshold,
} = {}) {
  /** @param {string} glob */
  const inApp = (glob) => (appDir === '.' ? glob : `${appDir}/${glob}`);

  const nextSpecialFiles = `{${NEXT_SPECIAL_FILE_NAMES.join(',')}}`;
  const nextDefaultExportFiles = `{${NEXT_DEFAULT_EXPORT_FILE_NAMES.join(',')}}`;
  const optionalDefaultExportFiles = `{${NEXT_OPTIONAL_DEFAULT_EXPORT_FILE_NAMES.join(',')}}`;

  return [
    {
      name: 'conventions/import-order',
      files: [inApp(CODE_FILES)],
      plugins: { perfectionist },
      rules: {
        'perfectionist/sort-imports': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            ignoreCase: true,
            // Only `@/*` is "ours". A scoped package such as `@tanstack/react-query` stays third-party
            internalPattern: ['^@/.+'],
            // `true`, otherwise `import 'server-only'` and CSS imports are not MOVED into their groups (side-effect imports
            // would stay where they are and split the other imports into separate parts). The order among them is still
            // untouched, because the `styles-and-side-effects` custom group is `unsorted`: CSS import order is cascade order
            sortSideEffects: true,
            newlinesBetween: 1,
            newlinesInside: 0,
            customGroups: importCustomGroups,
            groups: importGroups,
          },
        ],
      },
    },
    {
      name: 'conventions/named-exports-only',
      files: [inApp(CODE_FILES)],
      ignores: [
        inApp('**/*.d.ts'),
        inApp(`${nextAppDir}/**/${nextDefaultExportFiles}.${EXTENSIONS}`),
        inApp(`${optionalDefaultExportFiles}.${EXTENSIONS}`),
        inApp(CONFIG_FILES),
        ...extraDefaultExportFiles.map((glob) => inApp(glob)),
      ],
      plugins: { conventions: conventionsPlugin },
      rules: {
        'conventions/no-default-export': 'error',
      },
    },
    {
      name: 'conventions/no-parent-imports',
      files: [inApp(CODE_FILES)],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                regex: String.raw`^\.\.(/|$)`,
                message:
                  'Use the `@/*` alias instead of `../`. Relative imports are only for the same folder (`./FieldError`)',
              },
            ],
          },
        ],
      },
    },
    {
      name: 'conventions/file-names',
      files: [inApp('**/*.tsx')],
      ignores: [inApp(`**/${nextSpecialFiles}.tsx`), ...filenameCaseIgnores.map((glob) => inApp(glob))],
      plugins: { conventions: conventionsPlugin },
      rules: {
        // Directory names are not checked: Next.js dictates `(auth)` and `[animalId]` folders
        'unicorn/filename-case': ['error', { case: 'pascalCase', checkDirectories: false }],
        'conventions/file-name-matches-export': 'error',
      },
    },
    {
      name: 'conventions/file-names-ts',
      files: [inApp('**/*.ts')],
      ignores: [
        inApp('**/*.d.ts'),
        inApp(`**/${nextSpecialFiles}.ts`),
        inApp(CONFIG_FILES),
        ...filenameCaseIgnores.map((glob) => inApp(glob)),
      ],
      rules: {
        // `animalPages.spec.ts` and `next.config.ts` pass: only the part before the first dot is checked
        'unicorn/filename-case': ['error', { case: 'camelCase', checkDirectories: false }],
      },
    },
    {
      name: 'conventions/arrow-functions',
      files: [inApp(CODE_FILES)],
      ignores: [inApp('**/*.d.ts'), ...KIT_FILES.map((glob) => inApp(glob))],
      plugins: { conventions: conventionsPlugin },
      rules: {
        'conventions/prefer-arrow-function': 'error',
      },
    },
    {
      name: 'conventions/english-only',
      files: [inApp(CODE_FILES)],
      plugins: { conventions: conventionsPlugin },
      rules: {
        'conventions/english-only': 'error',
      },
    },
    ...(duplicateStringThreshold === undefined
      ? []
      : [
          {
            name: 'conventions/duplicate-strings',
            files: [inApp(CODE_FILES)],
            rules: {
              'sonarjs/no-duplicate-string': ['error', { threshold: duplicateStringThreshold }],
            },
          },
        ]),
    {
      name: 'conventions/directive-spacing',
      files: [inApp(CODE_FILES)],
      rules: {
        // `'use client'` stays the first line, with an empty line below it
        '@stylistic/padding-line-between-statements': ['error', { blankLine: 'always', prev: 'directive', next: '*' }],
      },
    },
  ];
}
