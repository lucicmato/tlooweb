#!/usr/bin/env node
/**
 * PreToolUse guard for file tools (Prevent).
 *
 * Registered in .claude/settings.json with matcher
 * `Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob`. Blocks credential files
 * and hand edits of lockfiles and node_modules, and looks at the content of an
 * edit: an added `eslint-disable` without a description, `@ts-ignore`, a
 * skipped or deleted test. Rules and their sources: lib/fileRules.mjs.
 */
import { evaluateFileAccess } from './lib/fileRules.mjs';
import { runPreToolUseGuard } from './lib/guardRunner.mjs';

await runPreToolUseGuard((event, context) => evaluateFileAccess(event, context));
