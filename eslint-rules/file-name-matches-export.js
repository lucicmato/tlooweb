/**
 * Custom ESLint rule `conventions/file-name-matches-export`: a component file exports a name equal to its file name.
 *
 * Origin: personal convention "File names" in `~/.claude/CLAUDE.md` (the file name equals the name of the main export),
 * NOT a workshop rule. Part of the optional conventions layer (`eslint.conventions.js`), where it only runs on `.tsx`
 * files that are not Next.js special files.
 *
 * Why only components: for utilities the convention is fuzzy by design (`fieldStyles.ts` exports `inputClassName` and
 * `labelClassName`, so no export is named like the file), so the rule cannot be applied there without false positives.
 * For a component file `TextField.tsx` one of the named exports has to be `TextField`, which also catches an agent
 * that renames the component but leaves the file, or the other way round. `*.test.tsx` and `*.stories.tsx` style
 * names (more than one dot), barrel files (`export * from`) and default exports are skipped: the latter belong to
 * `conventions/no-default-export`, which would otherwise be reported twice for the same line.
 */

import path from 'node:path';

/**
 * @param {import('estree').Node | undefined | null} declaration
 * @returns {string[]}
 */
function getDeclaredNames(declaration) {
  if (!declaration) {
    return [];
  }

  if (declaration.type === 'VariableDeclaration') {
    return declaration.declarations.flatMap((declarator) =>
      declarator.id.type === 'Identifier' ? [declarator.id.name] : [],
    );
  }

  // Function, class, and the TypeScript declaration kinds (`type`, `interface`, `enum`) all carry an `id`
  if ('id' in declaration && declaration.id && declaration.id.type === 'Identifier') {
    return [declaration.id.name];
  }

  return [];
}

/**
 * @param {import('estree').ExportNamedDeclaration} statement
 * @returns {string[]}
 */
function getExportedNames(statement) {
  const specifierNames = statement.specifiers.map((specifier) =>
    specifier.exported.type === 'Identifier' ? specifier.exported.name : String(specifier.exported.value),
  );

  return [...getDeclaredNames(statement.declaration), ...specifierNames];
}

/**
 * @param {import('estree').Program} program
 * @returns {Set<string> | undefined} Names of the named exports, `undefined` for a barrel file (`export * from`), whose
 *   exported names live in other modules
 */
function getNamedExports(program) {
  /** @type {Set<string>} */
  const exportedNames = new Set();

  for (const statement of program.body) {
    if (statement.type === 'ExportAllDeclaration') {
      return undefined;
    }

    if (statement.type === 'ExportNamedDeclaration') {
      for (const name of getExportedNames(statement)) {
        exportedNames.add(name);
      }
    }
  }

  return exportedNames;
}

/** @type {import('eslint').Rule.RuleModule} */
export const fileNameMatchesExport = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require a named export that matches the file name',
    },
    messages: {
      mismatch:
        'The file name `{{fileName}}` has to match the name of a named export. Exports found: {{exported}}. Rename the file or the export, so that one of them is `{{fileName}}`',
    },
    schema: [],
  },
  create(context) {
    const fileName = path.basename(context.filename).replace(/\.[^.]+$/, '');

    // Names with more dots (`Button.test.tsx`, `Button.stories.tsx`) are not component files
    if (fileName.includes('.')) {
      return {};
    }

    return {
      Program(node) {
        const exportedNames = getNamedExports(node);

        if (!exportedNames || exportedNames.size === 0 || exportedNames.has(fileName)) {
          return;
        }

        context.report({
          node,
          loc: { line: 1, column: 0 },
          messageId: 'mismatch',
          data: { fileName, exported: [...exportedNames].join(', ') },
        });
      },
    };
  },
};
