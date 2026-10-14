/**
 * Custom ESLint rule `conventions/no-default-export`: named exports only.
 *
 * Origin: personal convention "Exports" in `~/.claude/CLAUDE.md` (named exports, `export default` only where the
 * framework requires it), NOT a workshop rule. Part of the optional conventions layer (`eslint.conventions.js`), which
 * turns the rule off for the files where a default export is needed (Next.js `page.tsx`, `layout.tsx`, ... and
 * `*.config.*`).
 *
 * Why a custom rule: the built-in rules detect the spellings too (checked with ESLint 10.11.0: `no-restricted-exports`
 * with all five `restrictDefaultExports` flags set to `true` finds all six spellings in the unit tests below, while
 * `import-x/no-default-export` misses `export * as default from './x'`), but their messages ("Exporting 'default' is
 * restricted." and "Prefer named exports.") do not tell an agent what to do instead, and an agent that does not
 * understand a lint failure tends to suppress it. If a zero-code setup is preferred, `no-restricted-exports` is the
 * better built-in choice (see README.md, section "Named exports").
 */

/** @type {import('eslint').Rule.RuleModule} */
export const noDefaultExport = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow default exports (`export default`, `export { x as default }`, `export * as default`)',
    },
    messages: {
      noDefaultExport:
        'Use a named export instead of a default export: a named export keeps its name at every import, so a search for the name finds all usages. Default exports are only for files where the framework requires them (eg. Next.js `page.tsx`, `layout.tsx`) and for `*.config.*` files',
    },
    schema: [],
  },
  create(context) {
    /** @param {{ type: string; name?: string; value?: unknown } | null | undefined} exported */
    const isDefault = (exported) => exported?.name === 'default' || exported?.value === 'default';

    return {
      ExportDefaultDeclaration(node) {
        context.report({ node, messageId: 'noDefaultExport' });
      },
      ExportSpecifier(node) {
        // Covers `export { x as default }`, `export { default } from './x'` and `export { x as default } from './x'`
        if (isDefault(node.exported)) {
          context.report({ node, messageId: 'noDefaultExport' });
        }
      },
      ExportAllDeclaration(node) {
        // `export * as default from './x'`
        if (isDefault(node.exported)) {
          context.report({ node, messageId: 'noDefaultExport' });
        }
      },
    };
  },
};
