/**
 * Shared body of the two PreToolUse guards (guard-shell.mjs, guard-files.mjs).
 *
 * A guard that crashes would otherwise exit with a non-blocking error and let
 * the tool call through (https://code.claude.com/docs/en/hooks, "Exit code
 * output": only exit 2 or a JSON decision blocks). With `failClosed` (default)
 * a crash is turned into a deny, so a bug in a guard is loud instead of silent.
 */
import { DEFAULT_CONFIG, getProjectDir, loadConfig } from './config.mjs';
import { emitPreToolUseDecision, readHookInput } from './io.mjs';
import { appendLog } from './state.mjs';

const MAX_EVIDENCE_CHARS = 600;

/**
 * @param {(event: any, context: { config: any, projectDir: string }) => ({ decision: 'deny' | 'ask', ruleId: string, reason: string, evidence?: string } | undefined)} evaluate
 */
export async function runPreToolUseGuard(evaluate) {
  let failClosed = DEFAULT_CONFIG.failClosed;
  try {
    const config = loadConfig();
    failClosed = config.failClosed;
    const event = await readHookInput();
    if (event === undefined) {
      return;
    }
    const projectDir = getProjectDir(event);
    const result = evaluate(event, { config, projectDir });
    if (result === undefined) {
      return;
    }
    appendLog(projectDir, {
      kind: 'prevent',
      hook: 'PreToolUse',
      session: event.session_id,
      tool: event.tool_name,
      decision: result.decision,
      rule: result.ruleId,
      rejected: (result.evidence ?? '').slice(0, MAX_EVIDENCE_CHARS),
      message: result.reason,
    });
    emitPreToolUseDecision(result.decision, `[${result.ruleId}] ${result.reason}`);
  } catch (error) {
    process.stderr.write(`Guard script failed: ${error instanceof Error ? error.stack : String(error)}\n`);
    if (failClosed) {
      emitPreToolUseDecision(
        'deny',
        'The guard script crashed, so the tool call is blocked (failClosed). Ask the user to check .claude/hooks or to set "failClosed": false in .claude/hooks/guardrails.config.json.',
      );
    }
  }
}
