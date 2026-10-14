#!/usr/bin/env node
/**
 * Stop hook: run the project checks before the agent may finish (Detect).
 *
 * The workshop's CI runs the full suite because "Repository instructions help
 * agents follow the workshop, while lint, type checks, and builds enforce the
 * code rules" (.agents/plans/2026-09-28-scaffold.md). This hook is the local
 * copy of that gate, scoped by the workshop AGENTS.md "Checks" policy:
 *   - nothing changed in this session            -> no checks
 *   - only prose changed (README, notes, AGENTS.md) -> no checks
 *   - the same change already passed              -> no repeat ("Do not repeat
 *                                                    or broaden passing checks
 *                                                    without a new change")
 *   - otherwise run the checks from guardrails.config.json (default: `npm run
 *     typecheck` and `npm run lint`) and, if one fails, block the stop with the
 *     diagnostics so the agent fixes the cause ("reproduce the failure and fix
 *     the cause before rerunning it").
 *
 * "This session" is measured against the snapshot snapshot-session.mjs took at
 * session start, so uncommitted work from before the session is not blamed on
 * the agent. The gate gives up after `maxConsecutiveBlocks` so a check that
 * cannot be fixed (for example a red baseline) never traps the session.
 */
import { getProjectDir, loadConfig } from './lib/config.mjs';
import { changedPaths, fingerprintOf, snapshotWorkingTree } from './lib/git.mjs';
import { emitJson, emitStopBlock, readHookInput } from './lib/io.mjs';
import { extensionOf } from './lib/paths.mjs';
import { runCommand, stripAnsi, tail } from './lib/run.mjs';
import { appendLog, readState, writeState } from './lib/state.mjs';

function commandLine(check) {
  return [check.command, ...check.args].join(' ');
}

function describeFailure(check, result, maxChars) {
  const status = result.error === undefined ? `exited with code ${result.exitCode}` : result.error;
  return `--- ${check.name}: \`${commandLine(check)}\` ${status} ---\n${tail(stripAnsi(result.output).trim(), maxChars)}`;
}

/** Without a baseline every uncommitted file counts as changed, so the checks err on the side of running. */
function changedSince(baseline, snapshot) {
  return baseline === undefined ? Object.keys(snapshot).sort() : changedPaths(baseline.files, snapshot);
}

async function main() {
  const event = await readHookInput();
  if (event === undefined) {
    return;
  }
  const gate = loadConfig().stopGate;
  if (!gate.enabled) {
    return;
  }

  const projectDir = getProjectDir(event);
  const session = event.session_id ?? 'unknown';
  const blocksFile = `stop-blocks-${session}.json`;

  const current = snapshotWorkingTree(projectDir);
  if (current === undefined) {
    // Without git there is no way to tell what this session changed, and running the checks on every stop would be worse than not running them
    appendLog(projectDir, {
      kind: 'info',
      hook: 'Stop',
      session,
      message: 'Stop gate skipped: not a git repository or git is not available.',
    });
    return;
  }

  const baseline = readState(projectDir, `baseline-${session}.json`);
  const changed = changedSince(baseline, current);

  const proseOnly = changed.length > 0 && changed.every((file) => gate.proseExtensions.includes(extensionOf(file)));
  const relevantChecks = gate.checks.filter((check) =>
    changed.some((file) => check.relevantExtensions.includes(extensionOf(file))),
  );
  if (changed.length === 0 || proseOnly || relevantChecks.length === 0) {
    writeState(projectDir, blocksFile, { count: 0 });
    return;
  }

  const fingerprint = fingerprintOf(current, changed);
  const last = readState(projectDir, 'last-result.json');
  let failures = [];
  if (last?.fingerprint === fingerprint && last.ok) {
    writeState(projectDir, blocksFile, { count: 0 });
    return;
  }
  if (last?.fingerprint === fingerprint && !last.ok) {
    // Same change, same failure: the agent tried to stop without touching anything, so the checks are not run again
    failures = last.failures;
  } else {
    for (const check of relevantChecks) {
      const result = await runCommand(check.command, check.args, {
        cwd: projectDir,
        timeoutSeconds: check.timeoutSeconds,
      });
      if (result.exitCode !== 0) {
        failures.push(describeFailure(check, result, gate.maxOutputChars));
      }
    }
    // The checks can write files of their own (build output, route types, caches), so the result is
    // stored under the fingerprint of the tree as it is after the run, which is what the next Stop sees
    const after = snapshotWorkingTree(projectDir) ?? current;
    writeState(projectDir, 'last-result.json', {
      fingerprint: fingerprintOf(after, changedSince(baseline, after)),
      ok: failures.length === 0,
      failures,
    });
  }

  if (failures.length === 0) {
    writeState(projectDir, blocksFile, { count: 0 });
    appendLog(projectDir, {
      kind: 'info',
      hook: 'Stop',
      session,
      message: `Checks passed: ${relevantChecks.map((check) => check.name).join(', ')}`,
    });
    return;
  }

  const blocks = readState(projectDir, blocksFile)?.count ?? 0;
  if (blocks >= gate.maxConsecutiveBlocks) {
    writeState(projectDir, blocksFile, { count: 0 });
    appendLog(projectDir, {
      kind: 'detect',
      hook: 'Stop',
      session,
      message: `Gate gave up after ${blocks} blocks. Failures:\n${failures.join('\n')}`,
    });
    emitJson({
      systemMessage: `Stop gate: the project checks still fail after ${blocks} attempts. The agent was allowed to stop; run the checks yourself and review the changes.`,
    });
    return;
  }

  writeState(projectDir, blocksFile, { count: blocks + 1 });
  const reason = [
    `The project checks fail after your changes (attempt ${blocks + 1} of ${gate.maxConsecutiveBlocks}). Reproduce each failure, fix its cause without weakening checks or expectations, and do not disable a rule to make it pass. Then finish again.`,
    ...failures,
  ].join('\n\n');
  appendLog(projectDir, { kind: 'detect', hook: 'Stop', session, message: failures.join('\n') });
  emitStopBlock(reason);
}

await main();
