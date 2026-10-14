/**
 * Rules the PreToolUse file guard applies to Read, Edit, Write, MultiEdit,
 * NotebookEdit, Grep and Glob calls.
 *
 * Split of duties with .claude/settings.json: the permission rules are
 * path-based (which file may be touched at all), these rules look at what an
 * edit changes (an added suppression, a removed test), which a path rule
 * cannot see. Derived from the workshop guardrails
 * `@eslint-community/eslint-comments/require-description`, the capstone prompt
 * ("Fix failures without weakening checks or expectations") and its review
 * step ("check for deleted or skipped tests and weakened assertions").
 */
import path from 'node:path';

import { readFileSync } from 'node:fs';
import {
  isLockfile,
  isPackageJson,
  isSecretPath,
  isTestPath,
  isVendoredOrGitPath,
  toProjectRelative,
} from './paths.mjs';

const WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

const CODE_FILE = /\.(?:[cm]?[jt]sx?|vue|svelte|astro)$/iu;
const DIRECTIVE_LINE = /eslint-disable|@ts-ignore|@ts-nocheck|@ts-expect-error/u;
const SKIP_MARKER = /\b(?:test|it|describe)\.(?:skip|only|fixme|todo|fail)\b|\bx(?:it|describe|test)\s*\(/u;
const TEST_CASE = /\b(?:test|it)(?:\.\w+)*\s*\(/gu;
const ASSERTION = /\bexpect\s*\(|\bassert(?:\.\w+)?\s*\(/gu;

/** Guardrail-relevant keys of package.json: the lint/typecheck scripts, install lifecycle, pinned manager, overrides. */
const GUARDRAIL_PACKAGE_KEYS =
  /"(?:lint|typecheck|format|format:check|preinstall|install|postinstall|prepare|devEngines|packageManager|pnpm|overrides|resolutions)"|--max-warnings/u;

/** Hook scripts mention these words in their own source; they are guarded by the settings `ask` rules instead. */
const SELF_PATH_PREFIX = '.claude/hooks/';

function verdict(decision, ruleId, reason, evidence) {
  return { decision, ruleId, reason, evidence };
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

/** Lines present in `newText` that are not matched by an identical line in `oldText` (multiset difference). */
export function addedLines(oldText, newText, predicate) {
  const remaining = new Map();
  for (const line of oldText.split('\n')) {
    const key = line.trim();
    if (predicate(key)) {
      remaining.set(key, (remaining.get(key) ?? 0) + 1);
    }
  }
  const added = [];
  for (const line of newText.split('\n')) {
    const key = line.trim();
    if (!predicate(key)) {
      continue;
    }
    const count = remaining.get(key) ?? 0;
    if (count > 0) {
      remaining.set(key, count - 1);
    } else {
      added.push(key);
    }
  }
  return added;
}

/**
 * Classifies a line that contains a suppression directive.
 * - `eslint-disable` without ` -- <reason>`: deny (what the workshop's
 *   `require-description` rule rejects at lint time, caught one step earlier)
 * - `eslint-disable -- <reason>`: ask, a justified suppression is a human call
 * - `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error` without a reason: deny
 */
export function classifyDirective(line) {
  const eslint = /eslint-disable(?:-next-line|-line)?\b(.*)$/u.exec(line);
  if (eslint !== null) {
    return /\s--\s+\S/u.test(eslint[1]) ? 'ask' : 'deny';
  }
  if (/@ts-(?:ignore|nocheck)\b/u.test(line)) {
    return 'deny';
  }
  const expectError = /@ts-expect-error\b(.*)$/u.exec(line);
  if (expectError !== null) {
    const reason = expectError[1]
      .replace(/\*\/|\}/gu, '')
      .replace(/^[\s:-]+/u, '')
      .trim();
    return reason === '' ? 'deny' : undefined;
  }
  return undefined;
}

/** The text before and after the edit, per tool. `current` is the file on disk, needed for `Write`. */
export function collectChange(toolName, input, current) {
  if (toolName === 'Edit') {
    return { oldText: input.old_string ?? '', newText: input.new_string ?? '' };
  }
  if (toolName === 'MultiEdit') {
    const edits = Array.isArray(input.edits) ? input.edits : [];
    return {
      oldText: edits.map((edit) => edit.old_string ?? '').join('\n'),
      newText: edits.map((edit) => edit.new_string ?? '').join('\n'),
    };
  }
  if (toolName === 'Write') {
    return { oldText: current ?? '', newText: input.content ?? '' };
  }
  return { oldText: '', newText: input.new_source ?? '' };
}

function readCurrentContent(absolutePath) {
  try {
    return readFileSync(absolutePath, 'utf8');
  } catch {
    // A file that does not exist yet is simply a new file
    return undefined;
  }
}

function checkSuppressions(oldText, newText, relativePath) {
  const added = addedLines(oldText, newText, (line) => DIRECTIVE_LINE.test(line));
  const classified = added
    .map((line) => ({ line, decision: classifyDirective(line) }))
    .filter((item) => item.decision !== undefined);
  if (classified.length === 0) {
    return undefined;
  }
  const evidence = classified
    .map((item) => item.line)
    .slice(0, 3)
    .join('\n');
  if (classified.some((item) => item.decision === 'deny')) {
    return verdict(
      'deny',
      'suppression-added',
      `This edit to ${relativePath} adds a lint or type suppression without a description. Fix the cause of the diagnostic instead of silencing it (workshop rule: eslint-disable without a stated reason is forbidden, \`@eslint-community/eslint-comments/require-description\` fails lint on it). If a suppression is truly justified, write it as \`// eslint-disable-next-line <rule> -- <why>\` and the user will be asked to approve it. \`@ts-ignore\` and \`@ts-nocheck\` are never allowed; \`@ts-expect-error <reason>\` needs a reason.`,
      evidence,
    );
  }
  return verdict(
    'ask',
    'suppression-added',
    `This edit to ${relativePath} adds an eslint-disable with a description. Silencing a diagnostic is the user's decision, not the agent's (workshop slides "Lint suppression": a justified suppression versus an agent silencing a diagnostic).`,
    evidence,
  );
}

function checkTestWeakening(oldText, newText, relativePath) {
  const skipped = addedLines(oldText, newText, (line) => SKIP_MARKER.test(line));
  if (skipped.length > 0) {
    return verdict(
      'ask',
      'tests-weakened',
      `This edit to ${relativePath} skips or isolates tests (skip, only, fixme, todo). Workshop capstone: "Fix failures without weakening checks or expectations", "Preserve existing tests". The user approves it.`,
      skipped.slice(0, 3).join('\n'),
    );
  }
  const removedTests = countMatches(oldText, TEST_CASE) - countMatches(newText, TEST_CASE);
  const removedAssertions = countMatches(oldText, ASSERTION) - countMatches(newText, ASSERTION);
  if (removedTests > 0 || removedAssertions > 0) {
    const what = removedTests > 0 ? `${removedTests} test case(s)` : `${removedAssertions} assertion(s)`;
    return verdict(
      'ask',
      'tests-weakened',
      `This edit to ${relativePath} removes ${what}. Workshop review step: "check for deleted or skipped tests and weakened assertions". Keep the expectation when it still matches the acceptance criteria; the user approves a change to it.`,
      `${what} fewer than before`,
    );
  }
  return undefined;
}

function checkPackageJson(toolName, oldText, newText, relativePath) {
  if (toolName === 'Write') {
    let before;
    let after;
    try {
      before = JSON.parse(oldText);
      after = JSON.parse(newText);
    } catch {
      return verdict(
        'ask',
        'package-json-guardrails',
        `${relativePath} is rewritten as a whole and could not be compared. The user approves it.`,
        relativePath,
      );
    }
    const pick = (json) =>
      JSON.stringify({
        lint: json?.scripts?.lint,
        typecheck: json?.scripts?.typecheck,
        format: json?.scripts?.format,
        formatCheck: json?.scripts?.['format:check'],
        lifecycle: [
          json?.scripts?.preinstall,
          json?.scripts?.install,
          json?.scripts?.postinstall,
          json?.scripts?.prepare,
        ],
        devEngines: json?.devEngines,
        packageManager: json?.packageManager,
        pnpm: json?.pnpm,
        overrides: json?.overrides,
        resolutions: json?.resolutions,
      });
    if (pick(before) === pick(after)) {
      return undefined;
    }
  } else if (!GUARDRAIL_PACKAGE_KEYS.test(`${oldText}\n${newText}`)) {
    return undefined;
  }
  return verdict(
    'ask',
    'package-json-guardrails',
    `This edit to ${relativePath} touches a guardrail: the lint or typecheck script, an install lifecycle script, the pinned package manager or overrides. The user approves it (workshop: \`eslint . --max-warnings 0\`, \`devEngines.packageManager\`).`,
    relativePath,
  );
}

/**
 * Evaluates one tool call. Returns the strictest verdict (`deny` before `ask`)
 * or `undefined` when nothing objects.
 *
 * @param {{ tool_name: string, tool_input?: Record<string, unknown>, cwd?: string }} event
 * @param {{ projectDir: string, config: import('./config.mjs').DEFAULT_CONFIG }} context
 */
export function evaluateFileAccess(event, context) {
  const toolName = event.tool_name;
  const input = event.tool_input ?? {};
  const disabled = new Set(context.config.disabledRules);
  const verdicts = [];

  const targets = [input.file_path, input.notebook_path, input.path].filter(
    (value) => typeof value === 'string' && value !== '',
  );

  for (const target of targets) {
    if (!disabled.has('secret-file') && isSecretPath(target)) {
      verdicts.push(
        verdict(
          'deny',
          'secret-file',
          `\`${path.basename(target)}\` is a credential file. Reading or editing it would put secrets into the model context and the transcript (workshop: \`Read(./app/.env)\`, \`Read(~/.npmrc)\` in permissions.deny). Use \`.env.example\` for variable names and ask the user for anything else.`,
          target,
        ),
      );
    }
  }

  if (WRITE_TOOLS.has(toolName)) {
    for (const target of targets) {
      const relativePath = toProjectRelative(context.projectDir, event.cwd, target);
      if (!disabled.has('lockfile-edit') && isLockfile(target)) {
        verdicts.push(
          verdict(
            'deny',
            'lockfile-edit',
            `${path.basename(target)} is generated by the package manager and is hash-locked. Never edit it by hand: change package.json or .npmrc (with the user's approval) and run \`npm install\`.`,
            target,
          ),
        );
      }
      if (!disabled.has('vendored-edit') && isVendoredOrGitPath(target)) {
        verdicts.push(
          verdict(
            'deny',
            'vendored-edit',
            'Files in node_modules and .git are not part of the project: an edit there disappears on the next install and is not tracked by the lockfile. Change the project code, or ask the user to add a patch.',
            target,
          ),
        );
      }
      if (relativePath === undefined || relativePath.startsWith(SELF_PATH_PREFIX)) {
        continue;
      }
      const current =
        toolName === 'Write' ? readCurrentContent(path.resolve(event.cwd ?? context.projectDir, target)) : undefined;
      const { oldText, newText } = collectChange(toolName, input, current);

      if (!disabled.has('suppression-added') && CODE_FILE.test(target)) {
        const result = checkSuppressions(oldText, newText, relativePath);
        if (result !== undefined) {
          verdicts.push(result);
        }
      }
      if (!disabled.has('tests-weakened') && CODE_FILE.test(target) && isTestPath(target)) {
        const result = checkTestWeakening(oldText, newText, relativePath);
        if (result !== undefined) {
          verdicts.push(result);
        }
      }
      if (!disabled.has('package-json-guardrails') && isPackageJson(target)) {
        const result = checkPackageJson(toolName, oldText, newText, relativePath);
        if (result !== undefined) {
          verdicts.push(result);
        }
      }
    }
  }
  return verdicts.find((item) => item.decision === 'deny') ?? verdicts.find((item) => item.decision === 'ask');
}

/** Names of every rule, for the README table and the config validation test. */
export const FILE_RULE_IDS = Object.freeze([
  'secret-file',
  'lockfile-edit',
  'vendored-edit',
  'suppression-added',
  'tests-weakened',
  'package-json-guardrails',
]);
