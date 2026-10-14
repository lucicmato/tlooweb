/**
 * Custom ESLint rule `workshop/no-empty-catch`.
 *
 * Derived from: `eslint-rules/no-empty-catch.js` in the workshop repo (copied unchanged apart from Prettier
 * line wrapping at printWidth 120).
 *
 * Why: an agent that "fixes" a failing request by emptying the `catch` hides the failure from the user and from the
 * next agent run. The only accepted empty `catch` carries an explicit `// Swallow error <description>` comment, so
 * swallowing an error is always a documented decision.
 */

/** @type {import('eslint').Rule.RuleModule} */
export const noEmptyCatch = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow empty `catch` blocks unless they contain a `// Swallow error <description>` comment',
    },
    messages: {
      emptyCatch:
        'Empty `catch` block hides the error. Handle the error or add a `// Swallow error <description>` comment',
    },
    schema: [],
  },
  create(context) {
    return {
      // Ordinary comments do not count as statements, so commented catch blocks also match
      // eslint-disable-next-line @typescript-eslint/naming-convention -- ESLint visitor keys are ESQuery selectors
      'CatchClause > BlockStatement[body.length=0]'(node) {
        if (context.sourceCode.getCommentsInside(node).some((comment) => /^\s*Swallow error \S/.test(comment.value))) {
          return;
        }
        context.report({ node, messageId: 'emptyCatch' });
      },
    };
  },
};
