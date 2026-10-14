/**
 * Selectors for the "database authentication" convention, used through `no-restricted-syntax` on the database folder
 * (see `eslint.config.js`) and unit-tested in `auth.test.js`.
 *
 * Derived from: `databaseAuthRestrictedSyntax` and the two message constants in `eslint.config.js` of the workshop repo.
 * The messages and ESQuery selectors are copied VERBATIM. Only the location changed: they live in their own module so
 * `auth.test.js` can import them without loading the whole ESLint config (which needs the database environment
 * variables for SafeQL).
 *
 * Convention: every exported database query function either takes `sessionToken` as its first parameter (or as a
 * destructured property of it) AND uses it inside the `sql` tagged template, or is named with the suffix `Insecure`,
 * `Unauthenticated` or `Public` to declare "no authentication on purpose". Limit (workshop README): a parameter or a
 * `Public` suffix alone does not implement authorization, it only forces the author to decide explicitly.
 */

export const ambiguousAuthenticationMessage = `Ambiguous authentication of exported database query function - either pass \`sessionToken\` as the first parameter or destructured property in first parameter and use it in the SQL query, or name the function ending with \`Insecure\`, \`Unauthenticated\` or \`Public\`:

const getUser = cache(async (sessionToken: string, userId: number) =>

const getArticleCategoriesInsecure = cache(async () =>

`;

export const unusedSessionTokenMessage = `Unused \`sessionToken\` in database query function SQL - use \`sessionToken\` in the \`sql\` tagged template to implement authentication and authorization:

INNER JOIN sessions ON (
  sessions.token = \${sessionToken}
  AND sessions.expiry_timestamp > now()
)

`;

// Selectors for exported database query functions, used in the database-folder config of `eslint.config.js` and in
// `eslint-rules/auth.test.js`
export const databaseAuthRestrictedSyntax = [
  // export const getNote = cache(async (id) => ...)
  {
    selector:
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name!=/(Insecure|Unauthenticated|Public)$/][init.callee.name='cache'][init.arguments.0.params.0.name!='sessionToken']:not(:has(:function > ObjectPattern.params > Property > Identifier.key[name='sessionToken']))",
    message: ambiguousAuthenticationMessage,
  },
  // export const getNote = async (id) => ...
  {
    selector:
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name!=/(Insecure|Unauthenticated|Public)$/][init.type='ArrowFunctionExpression'][init.params.0.name!='sessionToken']:not(:has(:function > ObjectPattern.params > Property > Identifier.key[name='sessionToken']))",
    message: ambiguousAuthenticationMessage,
  },
  // export async function getNote(id) { ... }
  {
    selector:
      "ExportNamedDeclaration > FunctionDeclaration[id.name!=/(Insecure|Unauthenticated|Public)$/][params.0.name!='sessionToken']:not([params.0.type='ObjectPattern']:has(ObjectPattern.params > Property > Identifier.key[name='sessionToken']))",
    message: ambiguousAuthenticationMessage,
  },
  // sessionToken parameter, with block or expression body, but not
  // used inside a `sql` tagged template
  {
    selector:
      ":function[params.0.name='sessionToken']:not(:has(TaggedTemplateExpression[tag.name='sql'] Identifier[name='sessionToken']))",
    message: unusedSessionTokenMessage,
  },
  {
    selector:
      ":function[params.0.type='ObjectPattern']:has(ObjectPattern.params > Property > Identifier.key[name='sessionToken']):not(:has(TaggedTemplateExpression[tag.name='sql'] Identifier[name='sessionToken']))",
    message: unusedSessionTokenMessage,
  },
];
