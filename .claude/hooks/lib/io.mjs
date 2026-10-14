/**
 * Hook I/O helpers: read the JSON event from stdin, print the JSON decision
 * to stdout.
 *
 * Output shapes follow https://code.claude.com/docs/en/hooks (checked
 * 2026-10-05): PreToolUse decisions live in `hookSpecificOutput`, Stop uses a
 * top-level `decision: "block"`. Derived from the workshop idea that a
 * guardrail must hand an error message back to the agent (README.md, "Prevent
 * and Detect": "both: error message back to the agent").
 */
import { stdin, stdout } from 'node:process';

/**
 * Reads the whole stdin stream. `readFileSync(0)` is avoided because it can
 * throw EAGAIN/EOF on Windows pipes; async iteration is portable.
 */
export async function readStdinText() {
  const chunks = [];
  for await (const chunk of stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8').trim();
}

/**
 * Returns the parsed hook event, or `undefined` when nothing was piped in
 * (script started by hand). Invalid JSON throws on purpose: a guard that
 * cannot read its input must not pretend everything is fine.
 */
export async function readHookInput() {
  const text = await readStdinText();
  if (text === '') {
    return undefined;
  }
  return JSON.parse(text);
}

/** Writes one JSON document. A trailing newline keeps the output parseable. */
export function emitJson(value) {
  stdout.write(`${JSON.stringify(value)}\n`);
}

/**
 * PreToolUse decision. `deny` cancels the call and sends the reason to the
 * agent, `ask` shows the normal permission prompt to the human.
 */
export function emitPreToolUseDecision(permissionDecision, reason) {
  emitJson({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision,
      permissionDecisionReason: reason,
    },
  });
}

/** Stop decision: keeps the agent working and tells it why it cannot stop. */
export function emitStopBlock(reason) {
  emitJson({ decision: 'block', reason });
}

/**
 * Keeps the process alive until stdout is flushed. Calling `process.exit()`
 * right after a write can truncate piped output on Windows, so scripts only
 * set `process.exitCode`.
 */
export function setExitCode(code) {
  process.exitCode = code;
}
