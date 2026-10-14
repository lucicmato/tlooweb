/**
 * Custom ESLint rule `workshop/no-password-hash-response`.
 *
 * Derived from: `eslint-rules/no-password-hash-response.js` in the workshop repo (copied unchanged apart from Prettier
 * line wrapping at printWidth 120).
 *
 * Why: serializing a whole query result into `NextResponse.json()` also sends the bcrypt hash to the browser. This is a
 * name-based check, not a proof: it relies on the convention that objects holding the hash are named
 * `...WithPasswordHash` (workshop: `getUserWithPasswordHashInsecure`, `userWithPasswordHash`). It cannot find a leak
 * under another name, so keep the naming convention and the explicit `{ id, username }` projection in Route Handlers.
 */

/** @type {import('eslint').Rule.RuleModule} */
export const noPasswordHashResponse = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow sending objects named `...WithPasswordHash` in a `NextResponse.json()` response body',
    },
    messages: {
      passwordHashResponse:
        '`{{name}}` includes the password hash and would be sent to the browser. Respond with the needed properties only, eg. `{ username: {{name}}.username }`',
    },
    schema: [],
  },
  create(context) {
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- ESLint visitor keys are ESQuery selectors
      "CallExpression[callee.object.name='NextResponse'][callee.property.name='json'] Property > Identifier.value[name=/WithPasswordHash$/]"(
        node,
      ) {
        context.report({
          node,
          messageId: 'passwordHashResponse',
          data: { name: node.name },
        });
      },
    };
  },
};
