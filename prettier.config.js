// Prettier config: the personal baseline (tabWidth 2, semi, singleQuote, trailingComma all, printWidth 120,
// useTabs false, endOfLine auto) merged with the workshop's embedded SQL formatting.
//
// Derived from: `prettier.config.js` in the workshop repo (identical to the template shipped in
// `node_modules/eslint-config-upleveled/templates/next-js-postgresql/prettier.config.js`).
// Workshop values: only `singleQuote` and `trailingComma` were set, so Prettier's default `printWidth: 80`
// applied. The baseline values below win over that (see CONFLICTS in README.md).
//
// Needs `"type": "module"` in package.json (ES module default export), as in the workshop.
//
// Do not keep a `.prettierrc` next to this file: Prettier 3.9.8 picks `.prettierrc` BEFORE `prettier.config.js`
// (checked with `prettier --find-config-path`), so this file would be ignored without any warning.
//
// The SQL part is OPTIONAL and separable (Postgres.js projects with `sql` tagged templates only). Set
// `ENABLE_EMBEDDED_SQL` to `false` and the two plugins are neither loaded nor needed in `devDependencies`
// (`npm uninstall prettier-plugin-embed prettier-plugin-sql`).

// Plugins are only resolved when this is `true`, so a project without SQL does not have to install them.
// The cast to `boolean` is deliberate: with a plain `true` literal `@typescript-eslint/no-unnecessary-condition`
// reports the toggle below as "always truthy" (measured with eslint-config-upleveled 11.0.0), and `npm run lint`
// (`--max-warnings 0`) would fail on this very file.
const ENABLE_EMBEDDED_SQL = /** @type {boolean} */ (false);

/** @type {import('prettier').Config} */
const baseConfig = {
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 120,
  useTabs: false,
  // Windows development with Linux CI
  endOfLine: 'auto',
};

// ---------------------------------------------------------------------------
// OPTIONAL: SQL inside `sql` tagged templates and `/* sql */` comments.
// Keeps the queries that SafeQL checks consistently formatted and readable in diffs.
// ---------------------------------------------------------------------------

/** @type {import('prettier').Config} */
const prettierPluginsConfig = {
  plugins: ['prettier-plugin-embed', 'prettier-plugin-sql'],
};

/** @type {import('prettier-plugin-embed').PrettierPluginEmbedOptions} */
const prettierPluginEmbedConfig = {
  embeddedSqlComments: ['sql'],
  embeddedSqlTags: ['sql'],
};

/** @type {import('prettier-plugin-sql').SqlBaseOptions} */
const prettierPluginSqlConfig = {
  language: 'postgresql',
  keywordCase: 'upper',
  identifierCase: 'lower',
  dataTypeCase: 'lower',
  functionCase: 'lower',
  // - Wrap all parenthesized expressions to new lines (eg. `INSERT` columns)
  // - Do not wrap foreign keys (eg. `REFERENCES table_name (id)`)
  // - Do not wrap column type expressions (eg. `VARCHAR(255)`)
  // - Do not wrap longer field names when used alone (eg. `address_line_one`)
  // - Do not wrap shorter expressions in function calls (eg. `avg(ratings.rating)`)
  expressionWidth: 30,
};

const embeddedSqlConfig = {
  ...prettierPluginsConfig,
  ...prettierPluginEmbedConfig,
  ...prettierPluginSqlConfig,
};

/** @type {import('prettier').Config} */
const config = {
  ...baseConfig,
  ...(ENABLE_EMBEDDED_SQL ? embeddedSqlConfig : {}),
};

export default config;
