#!/usr/bin/env node
/**
 * SessionStart hook (matcher `startup|resume|clear|fork`): remember what the
 * working tree looked like when the session began.
 *
 * stop-gate.mjs compares against this snapshot, so only changes made during
 * the session decide whether checks run. Nothing is printed: SessionStart
 * stdout would be added to the model's context
 * (https://code.claude.com/docs/en/hooks, "Exit code 0").
 */
import { getProjectDir } from './lib/config.mjs';
import { snapshotWorkingTree } from './lib/git.mjs';
import { readHookInput } from './lib/io.mjs';
import { writeState } from './lib/state.mjs';

const event = await readHookInput();

if (event !== undefined && event.source !== 'compact') {
  const projectDir = getProjectDir(event);
  const files = snapshotWorkingTree(projectDir);
  if (files !== undefined) {
    writeState(projectDir, `baseline-${event.session_id ?? 'unknown'}.json`, {
      takenAt: new Date().toISOString(),
      files,
    });
    writeState(projectDir, `stop-blocks-${event.session_id ?? 'unknown'}.json`, { count: 0 });
  }
}
