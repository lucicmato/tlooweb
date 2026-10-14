/**
 * End-to-end tests: every hook script is started as a real process, gets the
 * event JSON on stdin like Claude Code sends it, and its stdout, stderr and
 * exit code are checked against the documented hook contract
 * (https://code.claude.com/docs/en/hooks).
 *
 * Same idea as the workshop's patches.test.ts: run the guardrail for real and
 * assert on what it reports. Run: node --test ".claude/hooks/__tests__/*.test.mjs"
 */
import assert from 'node:assert/strict';
import path from 'node:path';

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const HOOKS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRATCH = mkdtempSync(path.join(tmpdir(), 'claude-hooks-e2e-'));

/** The nearest node_modules above the hooks that has eslint and prettier, i.e. the project's own. */
function findToolsDirectory() {
  let directory = HOOKS_DIR;
  for (;;) {
    const candidate = path.join(directory, 'node_modules');
    if (
      existsSync(path.join(candidate, 'eslint', 'package.json')) &&
      existsSync(path.join(candidate, 'prettier', 'package.json'))
    ) {
      return candidate;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      return undefined;
    }
    directory = parent;
  }
}

after(() => {
  rmSync(SCRATCH, { recursive: true, force: true });
});

function runHook(script, event, { projectDir, stateDir, config, extraEnv = {}, input } = {}) {
  const configPath =
    config === undefined ? undefined : path.join(SCRATCH, `config-${Math.random().toString(36).slice(2)}.json`);
  if (configPath !== undefined) {
    writeFileSync(configPath, JSON.stringify(config));
  }
  const result = spawnSync(process.execPath, [path.join(HOOKS_DIR, script)], {
    input: input ?? JSON.stringify(event),
    encoding: 'utf8',
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: projectDir ?? SCRATCH,
      CLAUDE_GUARDRAILS_STATE_DIR: stateDir ?? path.join(SCRATCH, 'state'),
      ...(configPath === undefined ? {} : { CLAUDE_GUARDRAILS_CONFIG: configPath }),
      ...extraEnv,
    },
  });
  let json;
  try {
    json = result.stdout.trim() === '' ? undefined : JSON.parse(result.stdout);
  } catch {
    json = undefined;
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, json };
}

function git(cwd, ...args) {
  const result = spawnSync('git', ['-c', 'user.name=tester', '-c', 'user.email=tester@example.invalid', ...args], {
    cwd,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout;
}

describe('guard-shell.mjs (PreToolUse, Bash and PowerShell)', () => {
  const stateDir = path.join(SCRATCH, 'state-shell');

  test('denies a database CLI with the documented JSON output and exit code 0', () => {
    const { status, json } = runHook(
      'guard-shell.mjs',
      { tool_name: 'Bash', tool_input: { command: 'psql -c "DROP TABLE animals"' } },
      { stateDir },
    );
    assert.equal(status, 0);
    assert.equal(json.hookSpecificOutput.hookEventName, 'PreToolUse');
    assert.equal(json.hookSpecificOutput.permissionDecision, 'deny');
    assert.match(json.hookSpecificOutput.permissionDecisionReason, /^\[database-cli\]/u);
  });

  test('asks for a push', () => {
    const { json } = runHook(
      'guard-shell.mjs',
      { tool_name: 'Bash', tool_input: { command: 'git push origin main' } },
      { stateDir },
    );
    assert.equal(json.hookSpecificOutput.permissionDecision, 'ask');
  });

  test('checks PowerShell commands too', () => {
    const { json } = runHook(
      'guard-shell.mjs',
      { tool_name: 'PowerShell', tool_input: { command: 'Get-Content .env' } },
      { stateDir },
    );
    assert.equal(json.hookSpecificOutput.permissionDecision, 'deny');
  });

  test('prints nothing for a harmless command and for other tools', () => {
    assert.equal(
      runHook('guard-shell.mjs', { tool_name: 'Bash', tool_input: { command: 'npm run lint' } }, { stateDir }).stdout,
      '',
    );
    assert.equal(
      runHook('guard-shell.mjs', { tool_name: 'Read', tool_input: { file_path: 'x' } }, { stateDir }).stdout,
      '',
    );
  });

  test('records the rejection in the guardrail log', () => {
    const log = readFileSync(path.join(stateDir, 'guardrails.jsonl'), 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    assert.ok(log.some((entry) => entry.kind === 'prevent' && entry.rule === 'database-cli'));
  });

  test('fails closed when the input is not JSON', () => {
    const { json, stderr } = runHook('guard-shell.mjs', undefined, { stateDir, input: '{not json' });
    assert.equal(json.hookSpecificOutput.permissionDecision, 'deny');
    assert.match(stderr, /Guard script failed/u);
  });

  test('failClosed false lets a crash through', () => {
    const { stdout } = runHook('guard-shell.mjs', undefined, {
      stateDir,
      input: '{not json',
      config: { failClosed: false },
    });
    assert.equal(stdout, '');
  });

  test('does nothing when started without input', () => {
    assert.equal(runHook('guard-shell.mjs', undefined, { stateDir, input: '' }).stdout, '');
  });
});

describe('guard-files.mjs (PreToolUse, file tools)', () => {
  const stateDir = path.join(SCRATCH, 'state-files');

  test('denies reading a credential file', () => {
    const { json } = runHook(
      'guard-files.mjs',
      { tool_name: 'Read', tool_input: { file_path: path.join(SCRATCH, 'app', '.env') }, cwd: SCRATCH },
      { stateDir },
    );
    assert.equal(json.hookSpecificOutput.permissionDecision, 'deny');
  });

  test('denies an undescribed eslint-disable in an Edit', () => {
    const { json } = runHook(
      'guard-files.mjs',
      {
        tool_name: 'Edit',
        cwd: SCRATCH,
        tool_input: {
          file_path: path.join(SCRATCH, 'a.ts'),
          old_string: 'x',
          new_string: '// eslint-disable-next-line no-console\nx',
        },
      },
      { stateDir },
    );
    assert.equal(json.hookSpecificOutput.permissionDecision, 'deny');
    assert.match(json.hookSpecificOutput.permissionDecisionReason, /suppression-added/u);
  });

  test('allows a plain edit', () => {
    const { stdout } = runHook(
      'guard-files.mjs',
      {
        tool_name: 'Edit',
        cwd: SCRATCH,
        tool_input: { file_path: path.join(SCRATCH, 'a.ts'), old_string: 'x', new_string: 'y' },
      },
      { stateDir },
    );
    assert.equal(stdout, '');
  });
});

describe('reinject-instructions.mjs (SessionStart, compact)', () => {
  test('prints AGENTS.md so it is added to the context', () => {
    const projectDir = path.join(SCRATCH, 'reinject');
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(path.join(projectDir, 'AGENTS.md'), '# Rules\nNo fallback values.\n');
    const { status, stdout } = runHook(
      'reinject-instructions.mjs',
      { hook_event_name: 'SessionStart', source: 'compact' },
      { projectDir },
    );
    assert.equal(status, 0);
    assert.match(stdout, /--- AGENTS\.md ---/u);
    assert.match(stdout, /No fallback values\./u);
  });

  test('prints nothing when there is no instruction file', () => {
    const projectDir = path.join(SCRATCH, 'reinject-empty');
    mkdirSync(projectDir, { recursive: true });
    assert.equal(runHook('reinject-instructions.mjs', { source: 'compact' }, { projectDir }).stdout, '');
  });
});

describe('snapshot-session.mjs and stop-gate.mjs', () => {
  const projectDir = path.join(SCRATCH, 'gate-project');
  const stateDir = path.join(SCRATCH, 'state-gate');
  const counterFile = path.join(SCRATCH, 'check-runs.txt');
  const session = 'session-1';

  function gateConfig(exitCode) {
    return {
      stopGate: {
        maxConsecutiveBlocks: 2,
        checks: [
          {
            name: 'fake-check',
            command: process.execPath,
            args: [
              '-e',
              `require('fs').appendFileSync(${JSON.stringify(counterFile)}, 'run\\n'); console.error('boom: a.ts:1 failing'); process.exit(${exitCode})`,
            ],
            relevantExtensions: ['.ts'],
            timeoutSeconds: 60,
          },
        ],
      },
    };
  }

  function stop(exitCode, sessionId = session) {
    return runHook(
      'stop-gate.mjs',
      { hook_event_name: 'Stop', session_id: sessionId, cwd: projectDir },
      { projectDir, stateDir, config: gateConfig(exitCode) },
    );
  }

  function runs() {
    return existsSync(counterFile) ? readFileSync(counterFile, 'utf8').split('\n').filter(Boolean).length : 0;
  }

  before(() => {
    mkdirSync(projectDir, { recursive: true });
    git(projectDir, 'init', '--initial-branch=main');
    writeFileSync(path.join(projectDir, 'README.md'), '# project\n');
    writeFileSync(path.join(projectDir, 'a.ts'), 'export const a = 1;\n');
    git(projectDir, 'add', '.');
    git(projectDir, 'commit', '-m', 'init');
    // Uncommitted work that exists before the session starts must not be blamed on the agent
    writeFileSync(path.join(projectDir, 'preexisting.ts'), 'export const old = 1;\n');
    const snapshot = runHook(
      'snapshot-session.mjs',
      { hook_event_name: 'SessionStart', source: 'startup', session_id: session },
      { projectDir, stateDir },
    );
    assert.equal(snapshot.status, 0);
    assert.equal(snapshot.stdout, '');
  });

  test('no change in this session: no checks run', () => {
    const result = stop(1);
    assert.equal(result.stdout, '');
    assert.equal(runs(), 0);
  });

  test('prose-only change: no checks run (workshop AGENTS.md)', () => {
    writeFileSync(path.join(projectDir, 'README.md'), '# project\nMore prose.\n');
    const result = stop(1);
    assert.equal(result.stdout, '');
    assert.equal(runs(), 0);
  });

  test('code change with a failing check: blocks and returns the diagnostics', () => {
    writeFileSync(path.join(projectDir, 'a.ts'), 'export const a = 2;\n');
    const result = stop(1);
    assert.equal(result.status, 0);
    assert.equal(result.json.decision, 'block');
    assert.match(result.json.reason, /fake-check/u);
    assert.match(result.json.reason, /boom: a\.ts:1 failing/u);
    assert.match(result.json.reason, /attempt 1 of 2/u);
    assert.equal(runs(), 1);
  });

  test('same change, same failure: reports again without re-running the check', () => {
    const result = stop(1);
    assert.equal(result.json.decision, 'block');
    assert.match(result.json.reason, /attempt 2 of 2/u);
    assert.equal(runs(), 1);
  });

  test('gives up after maxConsecutiveBlocks instead of trapping the session', () => {
    const result = stop(1);
    assert.equal(result.json.decision, undefined);
    assert.match(result.json.systemMessage, /still fail after 2 attempts/u);
  });

  test('a fix that passes: no output, and the pass is remembered', () => {
    writeFileSync(path.join(projectDir, 'a.ts'), 'export const a = 3;\n');
    const result = stop(0);
    assert.equal(result.stdout, '');
    assert.equal(runs(), 2);
    const again = stop(0);
    assert.equal(again.stdout, '');
    assert.equal(runs(), 2, 'a passing change is not checked twice (workshop: do not repeat passing checks)');
  });

  test('a new change is checked again', () => {
    writeFileSync(path.join(projectDir, 'a.ts'), 'export const a = 4;\n');
    stop(0);
    assert.equal(runs(), 3);
  });

  test('without a baseline every uncommitted file counts, so the checks run', () => {
    const before = runs();
    const result = stop(1, 'session-without-baseline');
    assert.equal(result.json.decision, 'block');
    assert.equal(runs(), before + 1);
  });

  test('outside a git repository the gate stays out of the way', () => {
    const plain = path.join(SCRATCH, 'not-a-repo');
    mkdirSync(plain, { recursive: true });
    const result = runHook(
      'stop-gate.mjs',
      { session_id: 's', cwd: plain },
      { projectDir: plain, stateDir, config: gateConfig(1) },
    );
    assert.equal(result.stdout, '');
  });
});

describe('format-and-lint.mjs (PostToolUse, Edit|Write)', () => {
  const projectDir = path.join(SCRATCH, 'lint-project');
  const stateDir = path.join(SCRATCH, 'state-lint');
  const toolsDir = findToolsDirectory();
  const hasTools = toolsDir !== undefined;

  before(() => {
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(
      path.join(projectDir, 'package.json'),
      JSON.stringify({ name: 'lint-project', private: true, type: 'module' }),
    );
    writeFileSync(
      path.join(projectDir, '.prettierrc'),
      JSON.stringify({ singleQuote: true, semi: true, printWidth: 120 }),
    );
    writeFileSync(
      path.join(projectDir, 'eslint.config.mjs'),
      "export default [{ files: ['**/*.js'], rules: { 'no-unused-vars': 'error', 'no-var': 'error' } }];\n",
    );
    if (hasTools) {
      // A junction needs no admin rights on Windows and lets the hook resolve eslint and prettier from the project root
      symlinkSync(toolsDir, path.join(projectDir, 'node_modules'), 'junction');
    }
  });

  function edited(file) {
    return runHook(
      'format-and-lint.mjs',
      { tool_name: 'Edit', session_id: 's', cwd: projectDir, tool_input: { file_path: path.join(projectDir, file) } },
      { projectDir, stateDir },
    );
  }

  test(
    'formats, applies ESLint fixes and stays silent when nothing is left',
    { skip: !hasTools && 'eslint and prettier are not installed above the hooks' },
    () => {
      writeFileSync(path.join(projectDir, 'fixable.js'), 'var greeting = "hello"\nexport { greeting }\n');
      const result = edited('fixable.js');
      assert.equal(result.status, 0, result.stderr);
      assert.equal(
        readFileSync(path.join(projectDir, 'fixable.js'), 'utf8'),
        "let greeting = 'hello';\nexport { greeting };\n",
      );
    },
  );

  test(
    'returns what --fix cannot fix to the agent with exit code 2',
    { skip: !hasTools && 'eslint and prettier are not installed above the hooks' },
    () => {
      writeFileSync(path.join(projectDir, 'broken.js'), "const unused = 1;\nexport const ok = 'x';\n");
      const result = edited('broken.js');
      assert.equal(result.status, 2);
      assert.match(result.stderr, /no-unused-vars/u);
      assert.match(result.stderr, /Do not add eslint-disable/u);
    },
  );

  test(
    'reports a syntax error from Prettier',
    { skip: !hasTools && 'eslint and prettier are not installed above the hooks' },
    () => {
      writeFileSync(path.join(projectDir, 'syntax.js'), 'const = ;\n');
      const result = edited('syntax.js');
      assert.equal(result.status, 2);
      assert.match(result.stderr, /prettier could not format/u);
    },
  );

  test('skips ignored folders, missing files and files outside the project', () => {
    assert.equal(edited('node_modules/zod/index.js').status, 0);
    assert.equal(edited('does-not-exist.js').status, 0);
    const outside = runHook(
      'format-and-lint.mjs',
      { tool_name: 'Write', cwd: projectDir, tool_input: { file_path: path.resolve('/elsewhere/x.js') } },
      { projectDir, stateDir },
    );
    assert.equal(outside.status, 0);
  });
});

describe('guardrails-report.mjs', () => {
  test('prints nothing found when the log is empty, then the entries', () => {
    const empty = spawnSync(process.execPath, [path.join(HOOKS_DIR, 'guardrails-report.mjs')], {
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_GUARDRAILS_STATE_DIR: path.join(SCRATCH, 'state-empty') },
    });
    assert.match(empty.stdout, /No guardrail errors recorded/u);

    const filled = spawnSync(process.execPath, [path.join(HOOKS_DIR, 'guardrails-report.mjs'), '--json'], {
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_GUARDRAILS_STATE_DIR: path.join(SCRATCH, 'state-shell') },
    });
    assert.ok(JSON.parse(filled.stdout).some((entry) => entry.rule === 'database-cli'));
  });
});
