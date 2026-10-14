/**
 * Custom ESLint rule `conventions/english-only`: comments and identifiers are written in English.
 *
 * Origin: personal convention "Comments" in `~/.claude/CLAUDE.md` (comments and identifiers in English), NOT a workshop
 * rule. Part of the optional conventions layer (`eslint.conventions.js`).
 *
 * This is a HEURISTIC. It reports Croatian diacritics in comments and identifiers, which catches nearly every Croatian
 * sentence, but Croatian written without diacritics and other languages pass. String literals, template literals and
 * JSX text are never checked, because user-facing copy may be Croatian.
 */

const DEFAULT_CHARACTERS = 'čćžšđČĆŽŠĐ';

/** @type {import('eslint').Rule.RuleModule} */
export const englishOnly = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Reports Croatian diacritics in comments and identifiers (heuristic for "write code in English")',
    },
    messages: {
      comment: 'Comments have to be in English (found `{{character}}`). Write it in English and explain why, not what',
      identifier: 'Identifiers have to be in English (found `{{character}}` in `{{name}}`)',
    },
    schema: [
      {
        type: 'object',
        properties: {
          // Characters that mark non-English text. Replace for another language
          characters: { type: 'string', minLength: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const [{ characters = DEFAULT_CHARACTERS } = {}] = context.options;
    const escapedCharacters = characters.replaceAll(/[\\\]^-]/g, String.raw`\$&`);
    const pattern = new RegExp(`[${escapedCharacters}]`, 'u');

    /** @param {import('estree').Identifier | { name: string; type: string }} node */
    function checkIdentifier(node) {
      const match = pattern.exec(node.name);

      if (match) {
        context.report({
          node,
          messageId: 'identifier',
          data: { character: match[0], name: node.name },
        });
      }
    }

    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const match = pattern.exec(comment.value);

          if (match && comment.loc) {
            context.report({
              loc: comment.loc,
              messageId: 'comment',
              data: { character: match[0] },
            });
          }
        }
      },
      Identifier: checkIdentifier,
      JSXIdentifier: checkIdentifier,
    };
  },
};
