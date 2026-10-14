#!/usr/bin/env node
/**
 * SessionStart hook (matcher `compact`): print AGENTS.md again after context
 * compaction.
 *
 * Workshop: "When the context window is full, the harness replaces the
 * conversation with a shorter summary. An early instruction, eg. 'no fallback
 * values', can be missing from it" (slides/archive/slides-old.re.mdx, "Forgotten
 * instructions after compaction"). The workshop hook is
 * `{ "matcher": "compact", "hooks": [{ "type": "command", "command": "cat AGENTS.md" }] }`;
 * this script does the same without `cat`, so it also works where the hook
 * shell is PowerShell. It is guidance, not a guardrail: the model can still
 * skip what it reads again, which is why the lint and type checks stay on.
 *
 * Plain stdout of a SessionStart hook is added to Claude's context
 * (https://code.claude.com/docs/en/hooks-guide, "Re-inject context after compaction").
 */
import path from 'node:path';

import { existsSync, readFileSync } from 'node:fs';
import { getProjectDir, loadConfig } from './lib/config.mjs';
import { readHookInput } from './lib/io.mjs';

const event = await readHookInput();

if (event !== undefined) {
  const projectDir = getProjectDir(event);
  const { files, maxChars } = loadConfig().reinjectInstructions;
  const sections = [];
  for (const file of files) {
    const absolute = path.join(projectDir, file);
    if (existsSync(absolute)) {
      sections.push(`--- ${file} ---\n${readFileSync(absolute, 'utf8').slice(0, maxChars)}`);
    }
  }
  if (sections.length > 0) {
    process.stdout.write(
      `The conversation was compacted, and the summary may have dropped project instructions. Re-read these files and keep following them:\n\n${sections.join('\n\n')}\n`,
    );
  }
}
