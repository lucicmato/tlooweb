#!/usr/bin/env node
/**
 * PreToolUse guard for Bash and PowerShell commands (Prevent).
 *
 * Registered in .claude/settings.json with matcher `Bash|PowerShell`. Rejects
 * the command before it runs and returns the reason to the agent, the same
 * mechanism as the workshop's permissions.deny rules (README.md, "Prevent:
 * database commands denied": `Bash(psql:*)`, `Bash(npm run migrate down:*)`,
 * `Read(./app/.env)`) but on the parsed command, so `/usr/bin/psql`,
 * `sudo psql`, `bash -c 'psql'` and `git -C . push` are seen as well.
 * Rules and their sources: lib/shellRules.mjs.
 */
import { runPreToolUseGuard } from './lib/guardRunner.mjs';
import { evaluateShellCommand } from './lib/shellRules.mjs';

await runPreToolUseGuard((event, context) => {
  const isShellTool = event.tool_name === 'Bash' || event.tool_name === 'PowerShell';
  const command = event.tool_input?.command;
  if (!isShellTool || typeof command !== 'string') {
    return undefined;
  }
  return evaluateShellCommand(command, {
    shell: event.tool_name === 'PowerShell' ? 'powershell' : 'bash',
    config: context.config,
  });
});
