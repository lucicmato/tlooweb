/**
 * Per-project hook state and the guardrail log.
 *
 * Everything lives in the OS temp directory, not in the repository: a log or
 * state file inside the working tree would show up in `git status`, change the
 * Stop gate's own fingerprint and need a .gitignore entry in every project.
 * Set CLAUDE_GUARDRAILS_STATE_DIR to move it.
 *
 * The log is the answer to the workshop's last exercise step ("Which
 * guardrails reported errors during this task? For each, show the command,
 * file, exact error message, rejected code and correction"): the hooks record
 * what they rejected, so the report does not depend on the agent remembering.
 */
import path from 'node:path';

import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

export function getStateDir(projectDir) {
  if (process.env.CLAUDE_GUARDRAILS_STATE_DIR !== undefined) {
    return process.env.CLAUDE_GUARDRAILS_STATE_DIR;
  }
  const projectId = createHash('sha1').update(path.resolve(projectDir).toLowerCase()).digest('hex').slice(0, 12);
  return path.join(tmpdir(), 'claude-guardrails', projectId);
}

/** File names come from a session id, so anything outside a safe alphabet is replaced. */
function safeName(name) {
  return name.replaceAll(/[^\w.-]/gu, '_');
}

export function readState(projectDir, name) {
  try {
    return JSON.parse(readFileSync(path.join(getStateDir(projectDir), safeName(name)), 'utf8'));
  } catch {
    // Missing or half-written state counts as "no state"; the callers fall back to running the checks
    return undefined;
  }
}

export function writeState(projectDir, name, value) {
  const directory = getStateDir(projectDir);
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, safeName(name)), JSON.stringify(value));
}

export function logPath(projectDir) {
  return path.join(getStateDir(projectDir), 'guardrails.jsonl');
}

/**
 * Appends one entry to the guardrail log. `kind` is `prevent` (a PreToolUse
 * deny or ask), `detect` (a failed lint or check) or `info`. Logging must never
 * break a hook, so write errors are swallowed on purpose.
 */
export function appendLog(projectDir, entry) {
  try {
    mkdirSync(getStateDir(projectDir), { recursive: true });
    appendFileSync(logPath(projectDir), `${JSON.stringify({ time: new Date().toISOString(), ...entry })}\n`);
  } catch {
    // Swallow error: a full disk or a read-only temp directory must not turn a guardrail into a crash
  }
}

export function readLog(projectDir) {
  const file = logPath(projectDir);
  if (!existsSync(file)) {
    return [];
  }
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { kind: 'info', message: line };
      }
    });
}
