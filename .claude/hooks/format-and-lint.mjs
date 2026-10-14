#!/usr/bin/env node
/**
 * PostToolUse hook: format and lint the file the agent just edited (Detect and
 * correct, immediately).
 *
 * Registered with matcher `Edit|Write|MultiEdit`. Steps for the edited file:
 *   1. `prettier --write` (the project's own Prettier config decides the style)
 *   2. `eslint --fix --max-warnings 0` (workshop lint script: warnings fail)
 *   3. `prettier --write` again only if ESLint changed the file
 * Whatever ESLint cannot fix goes back to the agent on stderr with exit code 2,
 * the documented way for a PostToolUse hook to show a message to Claude (the
 * tool already ran, so this cannot undo the edit). The workshop's loop is the
 * same: the check fails, the diagnostic returns to the agent, the agent
 * corrects (README.md, "Prevent and Detect": "both: error message back to the
 * agent").
 *
 * Only the edited file is checked, so this is fast; the whole-project check
 * is stop-gate.mjs. Edits made through shell commands do not trigger it.
 */
import path from 'node:path';

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { getProjectDir, loadConfig } from './lib/config.mjs';
import { readHookInput, setExitCode } from './lib/io.mjs';
import { extensionOf, toProjectRelative } from './lib/paths.mjs';
import { resolveBin, runNodeScript, stripAnsi, tail } from './lib/run.mjs';
import { appendLog } from './lib/state.mjs';

function contentHash(file) {
  return createHash('sha1').update(readFileSync(file)).digest('hex');
}

async function runPrettier(projectDir, relativeFile, options) {
  const bin = resolveBin(projectDir, 'prettier');
  if (bin === undefined) {
    return undefined;
  }
  return runNodeScript(projectDir, bin, ['--write', '--ignore-unknown', relativeFile], options);
}

async function main() {
  const event = await readHookInput();
  if (event === undefined) {
    return;
  }
  const settings = loadConfig().formatAndLint;
  const target = event.tool_input?.file_path;
  if (!settings.enabled || typeof target !== 'string') {
    return;
  }

  const projectDir = getProjectDir(event);
  const relativeFile = toProjectRelative(projectDir, event.cwd, target);
  if (
    relativeFile === undefined ||
    relativeFile.split('/').some((segment) => settings.ignoredPathSegments.includes(segment))
  ) {
    return;
  }
  const absoluteFile = path.join(projectDir, relativeFile);
  if (!existsSync(absoluteFile)) {
    return;
  }

  const options = { timeoutSeconds: settings.timeoutSeconds };
  const problems = [];
  const infrastructure = [];

  if (settings.prettier) {
    const result = await runPrettier(projectDir, relativeFile, options);
    if (result !== undefined && result.exitCode !== 0) {
      problems.push(
        `prettier could not format ${relativeFile} (usually a syntax error):\n${stripAnsi(result.output).trim()}`,
      );
    }
  }

  const eslintBin =
    settings.eslint && settings.eslintExtensions.includes(extensionOf(relativeFile))
      ? resolveBin(projectDir, 'eslint')
      : undefined;
  if (eslintBin !== undefined && problems.length === 0) {
    const before = contentHash(absoluteFile);
    const result = await runNodeScript(
      projectDir,
      eslintBin,
      ['--fix', '--no-warn-ignored', ...settings.eslintArgs, relativeFile],
      options,
    );
    if (result.exitCode === 1) {
      problems.push(
        `ESLint reports problems in ${relativeFile} that --fix could not fix:\n${stripAnsi(result.output).trim()}\nFix the cause of each diagnostic. Do not add eslint-disable comments or change the lint configuration to make them go away.`,
      );
    } else if (result.exitCode !== 0) {
      // Exit code 2 or a crash is a broken setup (missing env file for SafeQL, invalid config), not a finding about the edit
      infrastructure.push(
        `ESLint could not run on ${relativeFile} (${result.error ?? `exit code ${result.exitCode}`}):\n${stripAnsi(result.output).trim()}`,
      );
    }
    if (settings.prettier && contentHash(absoluteFile) !== before) {
      await runPrettier(projectDir, relativeFile, options);
    }
  }

  if (problems.length > 0) {
    const message = tail(problems.join('\n\n'), settings.maxOutputChars);
    appendLog(projectDir, {
      kind: 'detect',
      hook: 'PostToolUse',
      session: event.session_id,
      tool: event.tool_name,
      file: relativeFile,
      message,
    });
    process.stderr.write(`${message}\n`);
    setExitCode(2);
    return;
  }
  if (infrastructure.length > 0) {
    const message = tail(infrastructure.join('\n\n'), settings.maxOutputChars);
    appendLog(projectDir, {
      kind: 'info',
      hook: 'PostToolUse',
      session: event.session_id,
      file: relativeFile,
      message,
    });
    process.stderr.write(`${message}\n`);
    setExitCode(1);
  }
}

await main();
