#!/usr/bin/env node
/**
 * Prints what the guardrail hooks rejected or reported in this project: the
 * evidence for the workshop's last exercise step.
 *
 *   node .claude/hooks/guardrails-report.mjs [--session <id>] [--json] [--info]
 *
 * Workshop prompt: "Which guardrails reported errors during this task? For
 * each, show the command, file, exact error message, rejected code and
 * correction. Explain what the check prevented. Include errors you fixed
 * earlier. If none occurred, say so." (README.md, "animal type filter:
 * guardrail errors"). The log is written by the hooks themselves, so it also
 * contains the errors the agent fixed before its final checks.
 *
 * The project is the folder two levels above this script, so the script finds
 * the same log directory the hooks wrote to, whatever the working directory is.
 */
import path from 'node:path';

import { fileURLToPath } from 'node:url';
import { logPath, readLog } from './lib/state.mjs';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const sessionIndex = args.indexOf('--session');
const session = sessionIndex === -1 ? undefined : args[sessionIndex + 1];
const asJson = args.includes('--json');
const includeInfo = args.includes('--info');

const entries = readLog(projectDir).filter(
  (entry) => (session === undefined || entry.session === session) && (includeInfo || entry.kind !== 'info'),
);

if (asJson) {
  process.stdout.write(`${JSON.stringify(entries, null, 2)}\n`);
} else if (entries.length === 0) {
  process.stdout.write(`No guardrail errors recorded in ${logPath(projectDir)}.\n`);
} else {
  const lines = [`Guardrail log: ${logPath(projectDir)}`, ''];
  for (const entry of entries) {
    const heading =
      entry.kind === 'prevent'
        ? `PREVENT ${entry.decision} [${entry.rule}] ${entry.tool ?? ''}`
        : `${String(entry.kind).toUpperCase()} ${entry.hook ?? ''} ${entry.tool ?? ''}`;
    lines.push(`## ${entry.time ?? ''} ${heading.trim()}`);
    if (entry.file !== undefined) {
      lines.push(`file: ${entry.file}`);
    }
    if (entry.rejected !== undefined && entry.rejected !== '') {
      lines.push('rejected:', entry.rejected);
    }
    lines.push('message:', entry.message ?? '', '');
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}
