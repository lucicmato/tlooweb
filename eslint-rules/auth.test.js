// Unit tests for the database authentication selectors (`database-auth.js`) and for `workshop/no-password-hash-response`.
//
// Derived from: `eslint-rules/auth.test.js` in the workshop repo. Test cases are copied unchanged. The only change is
// the import: the selectors come from `./database-auth.js` instead of `../eslint.config.js`, so the tests do not need
// the database environment variables that the ESLint config loads for SafeQL.
//
// Run from the project root: `node --test "eslint-rules/*.test.js"` (double quotes, see README.md).

import { RuleTester } from 'eslint';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import { describe, it } from 'node:test';
import { databaseAuthRestrictedSyntax } from './database-auth.js';
import { noPasswordHashResponse } from './no-password-hash-response.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

function validCase(code) {
  return { code, options: databaseAuthRestrictedSyntax };
}

function invalidCase(code, messageStart) {
  return {
    code,
    options: databaseAuthRestrictedSyntax,
    errors: [{ message: new RegExp(`^${messageStart}`) }],
  };
}

ruleTester.run('no-restricted-syntax database auth', builtinRules.get('no-restricted-syntax'), {
  valid: [
    validCase(`export const getNotes = cache(async (sessionToken) => sql\`SELECT \${sessionToken}\`);`),
    validCase(
      `export const getNotes = cache(async ({ sessionToken, userId }) => sql\`SELECT \${sessionToken}, \${userId}\`);`,
    ),
    validCase(
      `export const getNote = cache(async (sessionToken, id) => { const [note] = await sql\`SELECT \${sessionToken}, \${id}\`; return note; });`,
    ),
    validCase(`export async function getUser(sessionToken) { return sql\`SELECT \${sessionToken}\`; }`),
    validCase('export const getAnimalsInsecure = cache(async () => sql`SELECT 1`);'),
    validCase('export const getCategoriesPublic = async () => sql`SELECT 1`;'),
    validCase(`export async function getUserUnauthenticated(username) { return sql\`SELECT \${username}\`; }`),
    validCase('export const sql = connectOneTimeToDatabase();'),
  ],
  invalid: [
    invalidCase(`export const getNoteById = cache(async (id) => sql\`SELECT \${id}\`);`, 'Ambiguous authentication'),
    invalidCase(`export const getNoteById = async (id) => sql\`SELECT \${id}\`;`, 'Ambiguous authentication'),
    invalidCase(`export async function getNoteById(id) { return sql\`SELECT \${id}\`; }`, 'Ambiguous authentication'),
    invalidCase(
      `export const getNoteById = cache(async (sessionToken, id) => sql\`SELECT \${id}\`);`,
      'Unused `sessionToken`',
    ),
    invalidCase(
      `export const getNote = cache(async (sessionToken, id) => { if (!sessionToken) return; return sql\`SELECT \${id}\`; });`,
      'Unused `sessionToken`',
    ),
    invalidCase(
      `export const getNote = cache(async ({ sessionToken, id }) => sql\`SELECT \${id}\`);`,
      'Unused `sessionToken`',
    ),
  ],
});

ruleTester.run('no-password-hash-response', noPasswordHashResponse, {
  valid: ['NextResponse.json({ user: { username: userWithPasswordHash.username } });', 'NextResponse.json({ user });'],
  invalid: [
    {
      code: 'NextResponse.json({ user: userWithPasswordHash });',
      errors: [
        {
          messageId: 'passwordHashResponse',
          data: { name: 'userWithPasswordHash' },
        },
      ],
    },
    {
      code: 'NextResponse.json({ userWithPasswordHash });',
      errors: [{ messageId: 'passwordHashResponse' }],
    },
  ],
});
