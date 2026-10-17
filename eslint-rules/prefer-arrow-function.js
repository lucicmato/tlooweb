/**
 * Custom ESLint rule `conventions/prefer-arrow-function`: components and functions are arrow functions assigned to a
 * `const`, not `function` declarations.
 *
 * Origin: personal convention "Functions" in `~/.claude/CLAUDE.md`, NOT a workshop rule. Part of the optional
 * conventions layer (`eslint.conventions.js`).
 *
 * Why a custom rule and not `func-style: ['error', 'expression']`: `func-style` has no autofix, does not report
 * `export default function Page()` (the convention wants `const Page = …; export default Page;`), and cannot express
 * the exceptions below, so `route.ts` would need the opposite setting in a separate config object.
 *
 * Not reported, because the convention or the language needs a declaration there:
 * - Route Handlers (`GET`, `POST`, ...) exported from `route.*`: the typed-response selector
 *   `routeHandlerReturnTypeSyntax` only matches `FunctionDeclaration`, an arrow handler would skip it silently
 * - TypeScript overloads and assertion functions (`asserts value is T`): an arrow can only express them with the type
 *   written on the constant
 * - generators and functions that use `this`, `arguments` or `new.target`: an arrow has none of them
 *
 * The autofix is skipped when the name is used above the declaration (a `const` is not hoisted, so the rewrite could
 * throw a TDZ `ReferenceError`), when a comment would be lost, and for an anonymous `export default function`.
 */

import path from 'node:path';

const httpMethods = new Set(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']);
const routeFileName = /^route\.[cm]?[jt]sx?$/;

// Statement lists where a `function` declaration can become a `const` without changing what the code means
const fixableParentTypes = new Set([
  'Program',
  'BlockStatement',
  'StaticBlock',
  'TSModuleBlock',
  'ExportNamedDeclaration',
  'ExportDefaultDeclaration',
]);

/**
 * @param {import('estree').Node} statement
 * @returns {import('estree').Node}
 */
function unwrapExport(statement) {
  return (statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration') &&
    statement.declaration
    ? statement.declaration
    : statement;
}

/**
 * @param {import('estree').FunctionDeclaration} node
 * @param {string} name
 */
function hasOverloads(node, name) {
  const statement = node.parent.type.startsWith('Export') ? node.parent : node;
  const siblings = 'body' in statement.parent && Array.isArray(statement.parent.body) ? statement.parent.body : [];

  return siblings.some((sibling) => {
    /** @type {any} `TSDeclareFunction` is a typescript-eslint node, estree does not know it */
    const declaration = unwrapExport(sibling);

    return declaration.type === 'TSDeclareFunction' && declaration.id?.name === name;
  });
}

/**
 * @param {import('estree').FunctionDeclaration} node
 */
function isAssertionFunction(node) {
  /** @type {any} `returnType` is a typescript-eslint property */
  const tsNode = node;
  const typeAnnotation = tsNode.returnType?.typeAnnotation;

  return typeAnnotation?.type === 'TSTypePredicate' && typeAnnotation.asserts === true;
}

/**
 * @param {import('estree').FunctionDeclaration} node
 * @param {string} name
 * @param {string} filename
 */
function isRouteHandler(node, name, filename) {
  return (
    node.parent.type === 'ExportNamedDeclaration' &&
    routeFileName.test(path.basename(filename)) &&
    httpMethods.has(name)
  );
}

/**
 * Looks for `this`, `arguments` and `new.target` that belong to `node` itself, not to a nested non-arrow function.
 *
 * @param {import('estree').FunctionDeclaration} node
 * @param {import('eslint').SourceCode} sourceCode
 */
function usesOwnFunctionContext(node, sourceCode) {
  // A typed `this` parameter (`function handle(this: Window)`) only exists on non-arrow functions
  if (node.params[0]?.type === 'Identifier' && node.params[0].name === 'this') {
    return true;
  }

  const argumentsVariable = sourceCode.getScope(node).set.get('arguments');

  if (argumentsVariable && argumentsVariable.references.length > 0) {
    return true;
  }

  /** @param {import('estree').Node} current */
  const visit = (current) => {
    if (current.type === 'ThisExpression') {
      return true;
    }

    if (current.type === 'MetaProperty' && current.meta.name === 'new') {
      return true;
    }

    if (current.type === 'FunctionDeclaration' || current.type === 'FunctionExpression') {
      return false;
    }

    const keys = sourceCode.visitorKeys[current.type] ?? [];

    return keys.some((key) => {
      /** @type {unknown} */
      const child = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (current))[key];
      const children = Array.isArray(child) ? child : [child];

      return children.some(
        (item) => item !== null && typeof item === 'object' && 'type' in item && visit(/** @type {any} */ (item)),
      );
    });
  };

  return visit(node.body);
}

/**
 * @param {import('estree').FunctionDeclaration} node
 * @param {string} name
 * @param {import('eslint').SourceCode} sourceCode
 */
function isUsedBeforeDeclaration(node, name, sourceCode) {
  const [start] = /** @type {[number, number]} */ (node.range);

  return sourceCode
    .getDeclaredVariables(node)
    .filter((variable) => variable.name === name)
    .some((variable) => variable.references.some((reference) => reference.identifier.range[0] < start));
}

/**
 * Builds `const Name = async <T,>(params): ReturnType => body;`, or `undefined` when a comment sits between the parts
 * that are copied and would be dropped.
 *
 * @param {import('estree').FunctionDeclaration} node
 * @param {string} name
 * @param {import('eslint').SourceCode} sourceCode
 * @param {string} filename
 */
function buildArrowDeclaration(node, name, sourceCode, filename) {
  /** @type {any} `typeParameters` and `returnType` are typescript-eslint properties */
  const tsNode = node;
  const typeParameters = tsNode.typeParameters;
  const returnType = tsNode.returnType;
  const openParen = sourceCode.getTokenAfter(typeParameters ?? node.id);
  const closeParen = sourceCode.getTokenBefore(returnType ?? node.body);

  if (!openParen || !closeParen) {
    return undefined;
  }

  /** @type {[number, number][]} */
  const copiedRanges = [[openParen.range[0], closeParen.range[1]], /** @type {[number, number]} */ (node.body.range)];

  if (typeParameters) {
    copiedRanges.push(typeParameters.range);
  }

  if (returnType) {
    copiedRanges.push(returnType.range);
  }

  const losesComment = sourceCode.getCommentsInside(node).some((comment) => {
    const [commentStart, commentEnd] = /** @type {[number, number]} */ (comment.range);

    return !copiedRanges.some(([from, to]) => commentStart >= from && commentEnd <= to);
  });

  if (losesComment) {
    return undefined;
  }

  let typeParametersText = typeParameters ? sourceCode.getText(typeParameters) : '';

  // Without the comma TSX reads `<T>` as a JSX tag
  if (
    filename.endsWith('.tsx') &&
    typeParameters?.params.length === 1 &&
    !typeParameters.params[0].constraint &&
    !/,\s*>$/.test(typeParametersText)
  ) {
    typeParametersText = `${typeParametersText.slice(0, -1)},>`;
  }

  const paramsText = sourceCode.text.slice(openParen.range[0], closeParen.range[1]);
  const returnTypeText = returnType ? sourceCode.getText(returnType) : '';
  const asyncText = node.async ? 'async ' : '';

  return `const ${name} = ${asyncText}${typeParametersText}${paramsText}${returnTypeText} => ${sourceCode.getText(node.body)};`;
}

/** @type {import('eslint').Rule.RuleModule} */
export const preferArrowFunction = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require components and functions to be arrow functions assigned to a `const`',
    },
    fixable: 'code',
    messages: {
      preferArrow:
        'Write `{{name}}` as an arrow function assigned to a `const`: `const {{name}} = (…) => …`. Declarations are only for Route Handlers in `route.ts`, overloads, assertion functions, generators and functions that use `this` or `arguments`',
      anonymousDefault:
        'Name the default export and write it as an arrow function: `const Page = (…) => …;` with `export default Page;` at the bottom of the file',
    },
    schema: [],
  },
  create(context) {
    const { sourceCode, filename } = context;

    return {
      FunctionDeclaration(node) {
        // estree types `id` as always set, but `export default function () {}` has none
        const id = /** @type {import('estree').Identifier | null} */ (node.id);

        if (node.generator || isAssertionFunction(node) || usesOwnFunctionContext(node, sourceCode)) {
          return;
        }

        if (!id) {
          context.report({ node, messageId: 'anonymousDefault' });
          return;
        }

        const { name } = id;

        if (isRouteHandler(node, name, filename) || hasOverloads(node, name)) {
          return;
        }

        const replacement =
          fixableParentTypes.has(node.parent.type) && !isUsedBeforeDeclaration(node, name, sourceCode)
            ? buildArrowDeclaration(node, name, sourceCode, filename)
            : undefined;

        context.report({
          node: id,
          messageId: 'preferArrow',
          data: { name },
          fix:
            replacement === undefined
              ? null
              : (fixer) => {
                  if (node.parent.type !== 'ExportDefaultDeclaration') {
                    return fixer.replaceText(node, replacement);
                  }

                  // `export default const` is not valid syntax, so the export moves to the bottom of the file
                  // The file's own line ending, so a CRLF checkout on Windows does not end up with mixed endings
                  const { text } = sourceCode;
                  const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
                  const separator = text.endsWith(lineEnding) ? lineEnding : lineEnding.repeat(2);

                  return [
                    fixer.replaceText(node.parent, replacement),
                    fixer.insertTextAfterRange(
                      [text.length, text.length],
                      `${separator}export default ${name};${lineEnding}`,
                    ),
                  ];
                },
        });
      },
    };
  },
};
