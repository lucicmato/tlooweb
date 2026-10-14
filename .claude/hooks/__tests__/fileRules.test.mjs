/**
 * Tests for the file rules: credential files, generated files, added
 * suppressions and weakened tests. Run: node --test ".claude/hooks/__tests__/*.test.mjs"
 */
import assert from 'node:assert/strict';
import path from 'node:path';

import { describe, test } from 'node:test';
import { DEFAULT_CONFIG } from '../lib/config.mjs';
import { addedLines, classifyDirective, collectChange, evaluateFileAccess } from '../lib/fileRules.mjs';
import { isLockfile, isSecretPath, isTestPath, toProjectRelative } from '../lib/paths.mjs';

const projectDir = path.resolve('/work/project');

function evaluate(toolName, toolInput, config = DEFAULT_CONFIG) {
  return evaluateFileAccess({ tool_name: toolName, tool_input: toolInput, cwd: projectDir }, { projectDir, config });
}

function edit(filePath, oldString, newString) {
  return evaluate('Edit', { file_path: path.join(projectDir, filePath), old_string: oldString, new_string: newString });
}

describe('paths', () => {
  test('isSecretPath', () => {
    for (const secret of [
      '.env',
      'app/.env',
      'C:\\p\\.env.local',
      '.npmrc',
      '~/.npmrc',
      'a/b/id_rsa',
      'x/cert.pem',
      '/home/me/.ssh/config',
      '.aws/credentials',
    ]) {
      assert.ok(isSecretPath(secret), secret);
    }
    for (const fine of ['.env.example', 'app/.env.sample', '.envrc.md', 'src/env.ts', 'id_rsa.pub', 'README.md']) {
      assert.ok(!isSecretPath(fine), fine);
    }
  });

  test('isLockfile and isTestPath', () => {
    assert.ok(isLockfile('a/package-lock.json'));
    assert.ok(!isLockfile('a/.npmrc'));
    assert.ok(isTestPath('app/playwright/animalPages.spec.ts'));
    assert.ok(isTestPath('app/util/__tests__/dates.test.ts'));
    assert.ok(!isTestPath('app/util/dates.ts'));
  });

  test('toProjectRelative resolves against cwd and rejects outside paths', () => {
    assert.equal(toProjectRelative(projectDir, projectDir, 'app/page.tsx'), 'app/page.tsx');
    assert.equal(toProjectRelative(projectDir, projectDir, path.join(projectDir, 'a', 'b.ts')), 'a/b.ts');
    assert.equal(toProjectRelative(projectDir, projectDir, path.resolve('/elsewhere/x.ts')), undefined);
  });
});

describe('secret and generated files', () => {
  test('denies reading and editing credential files with every tool', () => {
    assert.equal(evaluate('Read', { file_path: path.join(projectDir, 'app/.env') })?.ruleId, 'secret-file');
    assert.equal(evaluate('Grep', { pattern: 'TOKEN', path: '/home/me/.npmrc' })?.ruleId, 'secret-file');
    assert.equal(evaluate('Write', { file_path: path.join(projectDir, '.env'), content: 'A=1' })?.decision, 'deny');
  });

  test('allows the example file', () => {
    assert.equal(evaluate('Read', { file_path: path.join(projectDir, 'app/.env.example') }), undefined);
  });

  test('denies hand edits of lockfiles, node_modules and .git', () => {
    assert.equal(edit('package-lock.json', 'a', 'b')?.ruleId, 'lockfile-edit');
    assert.equal(edit('node_modules/zod/index.js', 'a', 'b')?.ruleId, 'vendored-edit');
    assert.equal(edit('.git/config', 'a', 'b')?.ruleId, 'vendored-edit');
  });

  test('reading a lockfile is fine', () => {
    assert.equal(evaluate('Read', { file_path: path.join(projectDir, 'package-lock.json') }), undefined);
  });
});

describe('suppressions (workshop: @eslint-community/eslint-comments/require-description)', () => {
  test('classifyDirective', () => {
    assert.equal(classifyDirective('// eslint-disable-next-line react/no-array-index-key'), 'deny');
    assert.equal(classifyDirective('/* eslint-disable */'), 'deny');
    assert.equal(classifyDirective('// eslint-disable-next-line no-console -- logs the failed request'), 'ask');
    assert.equal(
      classifyDirective('{/* eslint-disable-next-line jsx-a11y-x/label-has-associated-control -- shadcn Label */}'),
      'ask',
    );
    assert.equal(classifyDirective('// @ts-ignore'), 'deny');
    assert.equal(classifyDirective('// @ts-nocheck'), 'deny');
    assert.equal(classifyDirective('// @ts-expect-error'), 'deny');
    assert.equal(classifyDirective('// @ts-expect-error the argument is invalid on purpose'), undefined);
    assert.equal(classifyDirective('const x = 1;'), undefined);
  });

  test('denies an added eslint-disable without a description', () => {
    const result = edit(
      'app/page.tsx',
      'const a = 1;',
      'const a = 1;\n// eslint-disable-next-line no-console\nconsole.log(a);',
    );
    assert.equal(result?.decision, 'deny');
    assert.equal(result?.ruleId, 'suppression-added');
  });

  test('asks for an added eslint-disable with a description', () => {
    const result = edit(
      'app/page.tsx',
      'x',
      '// eslint-disable-next-line no-console -- logs the failed request\nconsole.error(x);',
    );
    assert.equal(result?.decision, 'ask');
  });

  test('does not object to suppressions that were already there', () => {
    const line = '// eslint-disable-next-line no-console';
    assert.equal(edit('app/page.tsx', `${line}\nconsole.log(1);`, `${line}\nconsole.log(2);`), undefined);
  });

  test('Write compares against the file on disk, so a new file counts fully', () => {
    const result = evaluate('Write', {
      file_path: path.join(projectDir, 'does-not-exist-yet.ts'),
      content: '// @ts-ignore\nconst a: number = "x";',
    });
    assert.equal(result?.decision, 'deny');
  });

  test('MultiEdit edits are combined', () => {
    const result = evaluate('MultiEdit', {
      file_path: path.join(projectDir, 'app/page.tsx'),
      edits: [
        { old_string: 'a', new_string: 'b' },
        { old_string: 'c', new_string: '// @ts-ignore\nd' },
      ],
    });
    assert.equal(result?.ruleId, 'suppression-added');
  });

  test('prose files may talk about eslint-disable', () => {
    assert.equal(edit('docs/notes.md', 'x', '// eslint-disable-next-line no-console'), undefined);
  });

  test('the hook scripts themselves are exempt (settings ask-rules guard them)', () => {
    assert.equal(edit('.claude/hooks/lib/x.mjs', 'a', '// eslint-disable-next-line no-console'), undefined);
  });
});

describe('tests (workshop review step: deleted or skipped tests, weakened assertions)', () => {
  const spec = 'app/playwright/animalPages.spec.ts';

  test('asks when an edit skips or isolates a test', () => {
    assert.equal(edit(spec, "test('a', async () => {", "test.skip('a', async () => {")?.ruleId, 'tests-weakened');
    assert.equal(edit(spec, "test('a'", "test.only('a'")?.decision, 'ask');
  });

  test('asks when an edit removes a test case or an assertion', () => {
    const removedTest = edit(
      spec,
      "test('a', () => {\n  expect(1).toBe(1);\n});\ntest('b', () => {});",
      "test('b', () => {});",
    );
    assert.equal(removedTest?.ruleId, 'tests-weakened');
    const removedAssertion = edit(spec, 'expect(a).toBe(1);\nexpect(b).toBe(2);', 'expect(a).toBe(1);');
    assert.equal(removedAssertion?.ruleId, 'tests-weakened');
  });

  test('allows adding tests and assertions', () => {
    assert.equal(
      edit(spec, "test('a', () => {});", "test('a', () => {});\ntest('b', () => { expect(1).toBe(1); });"),
      undefined,
    );
  });

  test('does not apply to non-test files', () => {
    assert.equal(edit('app/util/dates.ts', 'expect(a)', ''), undefined);
  });
});

describe('package.json (workshop: eslint . --max-warnings 0, devEngines.packageManager)', () => {
  test('asks when an edit touches the lint script or install lifecycle', () => {
    assert.equal(
      edit('package.json', '"lint": "eslint . --max-warnings 0"', '"lint": "eslint ."')?.ruleId,
      'package-json-guardrails',
    );
    assert.equal(
      edit('package.json', '"scripts": {', '"scripts": {\n"postinstall": "node x.js",')?.ruleId,
      'package-json-guardrails',
    );
  });

  test('ignores ordinary edits', () => {
    assert.equal(edit('package.json', '"version": "1.0.0"', '"version": "1.0.1"'), undefined);
  });
});

describe('helpers', () => {
  test('addedLines is a multiset difference', () => {
    assert.deepEqual(
      addedLines('a\na', 'a\na\na\nb', (line) => line === 'a'),
      ['a'],
    );
  });

  test('collectChange per tool', () => {
    assert.deepEqual(collectChange('Edit', { old_string: 'a', new_string: 'b' }), { oldText: 'a', newText: 'b' });
    assert.deepEqual(collectChange('Write', { content: 'n' }, 'o'), { oldText: 'o', newText: 'n' });
  });

  test('disabledRules switches a rule off', () => {
    const config = { ...DEFAULT_CONFIG, disabledRules: ['lockfile-edit'] };
    assert.equal(
      evaluate(
        'Edit',
        { file_path: path.join(projectDir, 'package-lock.json'), old_string: 'a', new_string: 'b' },
        config,
      ),
      undefined,
    );
  });
});
