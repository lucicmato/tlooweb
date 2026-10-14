/**
 * Generic ESLint flat config with the "Full Stack Guardrails for AI Agents" workshop guardrails.
 *
 * Derived from: `eslint.config.js` in the workshop repo (root of the workshop's pnpm workspace). Differences from the original:
 * - the workshop-specific parts (`slides/`, `examples/`, the `app/` prefix) are replaced by `projectSettings` below
 * - SafeQL, MDX and the personal conventions layer are switchable and only imported when enabled
 * - the database authentication selectors live in `eslint-rules/database-auth.js` (copied verbatim)
 * - the two Next.js App Router selectors of eslint-config-upleveled (`'use client'` in pages and layouts, typed Route
 *   Handler response) are registered again in `eslint-rules/next-app-selectors.js`, because upleveled only matches
 *   `app/**` at the ESLint root and a monorepo package would silently lose them
 * See README.md for the full list of deviations and the CONFLICTS section.
 *
 * Needs `"type": "module"` in package.json (ESM config, top-level `await`) and has to be started from the project
 * root: `eslint-config-upleveled` reads `process.cwd()/tsconfig.json` and `process.cwd()/package.json` at import time.
 */

import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import reactDoctor from 'eslint-plugin-react-doctor';
import reactRsc from 'eslint-plugin-react-rsc';
import reactWebApi from 'eslint-plugin-react-web-api';

import upleveled, { noRestrictedSyntaxOptions } from 'eslint-config-upleveled';
import { fileURLToPath } from 'node:url';
import { databaseAuthRestrictedSyntax } from './eslint-rules/database-auth.js';
import { pageNoUseClientSyntax, routeHandlerReturnTypeSyntax } from './eslint-rules/next-app-selectors.js';
import { noEmptyCatch } from './eslint-rules/no-empty-catch.js';
import { noPasswordHashResponse } from './eslint-rules/no-password-hash-response.js';

/**
 * @typedef {object} ProjectSettings
 * @property {string} appDir Folder that contains `app/`, `database/` and the tsconfig of the package. `'.'` for a
 *   single-package project (the personal baseline: no `src/` folder). In a monorepo use the package folder, eg.
 *   `'apps/web'` (the workshop used `'app'`). Every glob below is prefixed with it.
 * @property {string} nextAppDir Next.js App Router folder inside `appDir`. Scopes the Route Handler rule to
 *   `<appDir>/<nextAppDir>/**\/route.ts`
 * @property {string} databaseDir Folder with the exported database query functions inside `appDir` (scope of the
 *   authentication selectors)
 * @property {boolean} enableDatabaseAuth Database authentication selectors (`databaseAuthRestrictedSyntax`) for
 *   `<appDir>/<databaseDir>/*.ts`. They encode the rule "every exported query function takes the session token", so
 *   they only make sense when the project has a database layer with sessions. Default `true` (the workshop
 *   behaviour). Set to `false` for projects without a database layer: with `true` and no `<databaseDir>` folder the
 *   selectors match nothing, so the switch then only records the intent in the diff
 * @property {boolean} enableSafeql SafeQL checks `sql` tagged templates against the real PostgreSQL schema at lint
 *   time. It needs a reachable, migrated database, `libpg-query` and the variables of the example env file. Set to
 *   `false` for projects without Postgres.js, or for a lint run that has no database. With `postgres` in
 *   `dependencies` the `PG*` variables are still required to load the config (eslint-config-upleveled reads them)
 * @property {string} envFile Env file for the SafeQL connection, relative to this file. Loaded with dotenv-safe
 * @property {string} envExampleFile dotenv-safe throws if a variable listed in this file is missing from the
 *   environment, so lint cannot silently run without the database settings. In CI set the variables with `env:`
 * @property {string[]} mdxFiles MDX files to lint with eslint-plugin-mdx, relative to this file, eg. `['**\/*.mdx']`.
 *   Empty means MDX is not linted. The workshop linted only its slides and type-checked app MDX with `mdx-tsc`.
 *   Checked: `mdx.flat` sets `no-unused-expressions: error`, so MDX with `{props.x}` expressions (the workshop's
 *   `AnimalsSummary.mdx`) fails. Add `{ files: mdxFiles, rules: { 'no-unused-expressions': 'off' } }` after the MDX
 *   block for such files
 * @property {number} cognitiveComplexityLimit Limit for code under `appDir`. The workshop used 12, the highest score
 *   in its demo app, so that one extra nested branch fails. Pick the highest existing score of a new codebase, then
 *   lower it over time
 * @property {boolean} enableConventions Personal conventions layer (import grouping, named exports, ...) from
 *   `eslint.conventions.js`. It needs `eslint-plugin-perfectionist`. The safety guardrails in this file do not
 *   depend on it
 * @property {Record<string, unknown>} conventionsOptions More options for `createConventionsConfig`, documented in
 *   `eslint.conventions.js`. Typical values: `{ filenameCaseIgnores: ['migrations/**', 'components/ui/*.tsx'] }` (ley
 *   migrations, shadcn/ui files) and `{ duplicateStringThreshold: 2 }` (opt-in rule for repeated string literals)
 * @property {string[]} extraIgnores Ignores on top of the root `.gitignore`, which `eslint-config-upleveled` already
 *   honours. It only reads the ROOT `.gitignore` (eslint-config-flat-gitignore), so nested ignore files need to be listed
 */

/** @type {ProjectSettings} */
const projectSettings = {
  appDir: '.',
  nextAppDir: 'app',
  databaseDir: 'database',
  enableDatabaseAuth: false,
  enableSafeql: false,
  envFile: '.env',
  envExampleFile: '.env.example',
  mdxFiles: [],
  cognitiveComplexityLimit: 12,
  enableConventions: true,
  conventionsOptions: { filenameCaseIgnores: ['scripts/**'] },
  extraIgnores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts', '.claude/**'],
};

const {
  appDir,
  nextAppDir,
  databaseDir,
  enableDatabaseAuth,
  enableSafeql,
  envFile,
  envExampleFile,
  mdxFiles,
  cognitiveComplexityLimit,
  enableConventions,
  conventionsOptions,
  extraIgnores,
} = projectSettings;

const CODE_FILES = '**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}';
const TYPESCRIPT_FILES = '**/*.{ts,tsx}';

/**
 * Prefixes a glob with `appDir`, without producing a `./` prefix that flat config globs do not match
 * @param {string} glob
 */
function inApp(glob) {
  return appDir === '.' ? glob : `${appDir}/${glob}`;
}

/**
 * SafeQL block copied from eslint-config-upleveled, which only enables SafeQL when the ROOT package.json contains
 * `postgres` in `dependencies`. With `postgres` there, upleveled configures SafeQL too and this block repeats it with
 * the same options. In a monorepo (`postgres` in the package, not in the root) this block is the only SafeQL
 * configuration.
 */
async function createSafeqlConfig() {
  const [{ default: dotenv }, safeql] = await Promise.all([import('dotenv-safe'), import('@ts-safeql/eslint-plugin')]);

  dotenv.config({
    quiet: true,
    path: fileURLToPath(new URL(envFile, import.meta.url)),
    example: fileURLToPath(new URL(envExampleFile, import.meta.url)),
  });

  // No destructuring: `@typescript-eslint/naming-convention` (eslint-config-upleveled) only allows `UPPER_CASE` variables
  // of type boolean, string, number and array, so `const { PGHOST } = process.env` (`string | undefined`) fails lint
  const { env } = process;

  return [
    {
      files: [inApp(CODE_FILES)],
      plugins: {
        '@ts-safeql': safeql,
      },
      rules: {
        '@ts-safeql/check-sql': [
          'error',
          {
            connections: [
              {
                // Credentials are encoded, so a password with `@` or `/` cannot break the URL
                databaseUrl: `postgres://${encodeURIComponent(String(env.PGUSERNAME))}:${encodeURIComponent(String(env.PGPASSWORD))}@${env.PGHOST}:${env.PGPORT ?? '5432'}/${env.PGDATABASE}`,
                targets: [
                  {
                    tag: 'sql',
                    fieldTransform: 'camel',
                    transform: '{type}[]',
                  },
                ],
                overrides: {
                  types: {
                    json: 'JsonAgg',
                  },
                },
              },
            ],
          },
        ],
      },
    },
  ];
}

/**
 * `eslint-config-upleveled` registers SafeQL on its own when the ROOT package.json has `postgres` in `dependencies`,
 * whatever `enableSafeql` says (checked with `enableSafeql: false` and `postgres` installed: the invalid query was still
 * reported). Then the switch only works with this block, which turns the upleveled rule off again.
 */
const upleveledRegistersSafeql = upleveled.some(
  (configObject) => configObject.plugins !== undefined && '@ts-safeql' in configObject.plugins,
);

async function createMdxConfig() {
  const mdx = await import('eslint-plugin-mdx');

  return [
    {
      ...mdx.flat,
      files: mdxFiles,
    },
  ];
}

async function createConventionsConfig() {
  const { createConventionsConfig: create } = await import('./eslint.conventions.js');

  return create({ appDir, nextAppDir, ...conventionsOptions });
}

const config = [
  ...upleveled,
  ...(appDir === '.'
    ? []
    : [
        {
          settings: {
            // Resolve the `@/*` path alias from the package tsconfig instead of the root one
            'import-x/resolver': {
              options: {
                project: `${appDir}/tsconfig.json`,
              },
            },
            // `@next/next/no-html-link-for-pages` only looks for `app/` and `pages/` in the ESLint root. Without this it
            // prints "Pages directory cannot be found" and silently turns itself off for the whole package
            next: {
              rootDir: appDir,
            },
          },
        },
      ]),
  {
    ignores: extraIgnores.map((glob) => inApp(glob)),
  },
  {
    // The packages behind the switches are imported dynamically in this file and are only installed when the switch
    // is on, so `import-x/no-unresolved` would fail lint on a project that leaves them out. An `eslint-disable`
    // comment cannot do this: with the packages installed it becomes an unused directive, which also fails lint
    // (`reportUnusedDisableDirectives` below plus `--max-warnings 0`). This block is the same rule, same severity.
    files: ['eslint.config.{js,mjs}'],
    rules: {
      'import-x/no-unresolved': [
        'error',
        { ignore: ['^dotenv-safe$', '^@ts-safeql/eslint-plugin$', '^eslint-plugin-mdx$'] },
      ],
    },
  },
  {
    linterOptions: {
      // ESLint default, written down because it is a guardrail: with `--max-warnings 0` a stale `eslint-disable`
      // fails lint, so suppressions cannot silently outlive the problem they were added for
      reportUnusedDisableDirectives: 'warn',
    },
    plugins: {
      '@eslint-community/eslint-comments': eslintComments,
      workshop: {
        rules: {
          'no-empty-catch': noEmptyCatch,
          'no-password-hash-response': noPasswordHashResponse,
        },
      },
    },
    rules: {
      // Fail lint on disable comments without a `--` description
      '@eslint-community/eslint-comments/require-description': 'error',
      'workshop/no-empty-catch': 'error',
    },
  },
  ...(enableDatabaseAuth
    ? [
        {
          // Copied from `upleveled:database-auth` in eslint-config-upleveled and strengthened (destructured
          // `sessionToken`, `export async function`, token has to be used inside the `sql` template). The upstream block
          // only matches `database/*.ts` relative to the config root, never `<package>/database/*.ts` in a monorepo.
          // Flat config REPLACES rule options between matching config objects, so the base selectors are spread again.
          files: [inApp(`${databaseDir}/*.ts`)],
          rules: {
            'no-restricted-syntax': [...noRestrictedSyntaxOptions, ...databaseAuthRestrictedSyntax],
          },
        },
      ]
    : []),
  {
    // The same selector as in eslint-config-upleveled, registered again because upleveled only matches `app/**` at the
    // ESLint root (see `eslint-rules/next-app-selectors.js`). Without it a monorepo package silently loses the rule
    files: [inApp(`${nextAppDir}/**/{layout,page}.{js,jsx,tsx}`)],
    rules: {
      'no-restricted-syntax': [...noRestrictedSyntaxOptions, pageNoUseClientSyntax],
    },
  },
  {
    // `workshop/no-password-hash-response` is scoped to Route Handlers, where a serialized query result reaches the
    // browser. The workshop scoped it to `app/app/**/route.ts`, which is `<nextAppDir>/**/route.ts` of its `app/` package
    files: [inApp(`${nextAppDir}/**/route.{js,ts}`)],
    rules: {
      'no-restricted-syntax': [...noRestrictedSyntaxOptions, routeHandlerReturnTypeSyntax],
      'workshop/no-password-hash-response': 'error',
    },
  },
  ...(enableSafeql ? await createSafeqlConfig() : []),
  ...(!enableSafeql && upleveledRegistersSafeql
    ? [
        {
          // Makes `enableSafeql: false` a real switch for projects with `postgres` installed. The `PG*` variables are
          // still read at load time, because upleveled checks them before this block runs
          files: [CODE_FILES],
          rules: { '@ts-safeql/check-sql': 'off' },
        },
      ]
    : []),
  {
    files: [inApp(CODE_FILES)],
    rules: {
      'sonarjs/cognitive-complexity': ['error', cognitiveComplexityLimit],
    },
  },
  {
    files: [inApp(TYPESCRIPT_FILES)],
    rules: {
      // Fail lint on redundant `?.` and `??` on non-nullable values
      '@typescript-eslint/no-unnecessary-condition': 'error',
    },
  },
  {
    ...reactRsc.configs['recommended-typescript'],
    files: [inApp(TYPESCRIPT_FILES)],
  },
  {
    ...reactWebApi.configs.recommended,
    files: [inApp(TYPESCRIPT_FILES)],
  },
  {
    ...reactDoctor.configs.next,
    files: [inApp(TYPESCRIPT_FILES)],
    rules: {
      ...reactDoctor.configs.next.rules,
      // Selected React state and effect mistakes, instead of the
      // 566-rule recommended config overlapping with the shared config
      'react-doctor/no-adjust-state-on-prop-change': 'warn',
      'react-doctor/no-async-effect-callback': 'warn',
      'react-doctor/no-derived-state-effect': 'warn',
      'react-doctor/no-derived-useState': 'warn',
      'react-doctor/no-effect-chain': 'warn',
      'react-doctor/no-fetch-in-effect': 'warn',
      'react-doctor/no-prop-callback-in-effect': 'warn',
      'react-doctor/no-self-updating-effect': 'warn',
      'react-doctor/no-set-state-in-render': 'warn',
    },
  },
  ...(mdxFiles.length > 0 ? await createMdxConfig() : []),
  ...(enableConventions ? await createConventionsConfig() : []),
];

export default config;
