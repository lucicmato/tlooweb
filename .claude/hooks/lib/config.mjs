/**
 * Loads `guardrails.config.json` (next to the hook scripts) and merges it over
 * the defaults below, so a config file that omits a key never disables a guard
 * by accident.
 *
 * Why a JSON file and not constants in each script: `.claude/settings.json`
 * must be strict JSON (no comments), so everything tunable per project lives
 * in one place that the README documents field by field.
 */
import path from 'node:path';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HOOKS_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const CODE_EXTENSIONS = Object.freeze(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts']);

/** Everything a typecheck or lint run can be affected by. */
const CHECK_RELEVANT_EXTENSIONS = Object.freeze([...CODE_EXTENSIONS, '.mdx', '.json']);

export const DEFAULT_CONFIG = Object.freeze({
  // Rule ids (see rules in lib/shellRules.mjs and lib/fileRules.mjs) to switch off
  disabledRules: [],
  // A crashing guard blocks the tool call instead of silently allowing it
  failClosed: true,
  // Package manager the project uses; installers of the others are blocked
  packageManager: 'npm',
  // Hosts a database connection string may point to (Replit lesson: dev and prod must not mix)
  localDatabaseHosts: ['localhost', '127.0.0.1', '::1', 'host.docker.internal'],
  formatAndLint: {
    enabled: true,
    prettier: true,
    eslint: true,
    // `--max-warnings 0` mirrors the workshop `lint` script: a warning fails
    eslintArgs: ['--max-warnings', '0'],
    eslintExtensions: CODE_EXTENSIONS,
    ignoredPathSegments: ['node_modules', '.next', 'dist', 'build', 'coverage', 'out', '.git', '.claude'],
    timeoutSeconds: 100,
    maxOutputChars: 6000,
  },
  stopGate: {
    enabled: true,
    // The hook gives up after this many consecutive blocks (Claude Code's own cap is 8)
    maxConsecutiveBlocks: 3,
    // Workshop AGENTS.md: "For prose-only changes ... Do not run builds, lint, type checks or tests."
    proseExtensions: ['.md', '.txt'],
    maxOutputChars: 6000,
    checks: [
      {
        name: 'typecheck',
        command: 'npm',
        args: ['run', 'typecheck'],
        relevantExtensions: CHECK_RELEVANT_EXTENSIONS,
        timeoutSeconds: 600,
      },
      {
        name: 'lint',
        command: 'npm',
        args: ['run', 'lint'],
        relevantExtensions: CHECK_RELEVANT_EXTENSIONS,
        timeoutSeconds: 600,
      },
    ],
  },
  reinjectInstructions: {
    files: ['AGENTS.md'],
    maxChars: 30000,
  },
});

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Objects merge key by key, arrays and scalars from the override replace the default. */
export function mergeConfig(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override === undefined ? base : override;
  }
  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    merged[key] = key in base ? mergeConfig(base[key], value) : value;
  }
  return merged;
}

/**
 * Reads the config file. A missing file means "defaults"; a file that exists
 * but is not valid JSON throws, because silently ignoring it would drop the
 * project's overrides without anyone noticing. CLAUDE_GUARDRAILS_CONFIG points
 * to another file (used by the end-to-end tests, handy for one-off experiments).
 */
export function loadConfig(
  configPath = process.env.CLAUDE_GUARDRAILS_CONFIG ?? path.join(HOOKS_DIR, 'guardrails.config.json'),
) {
  let text;
  try {
    text = readFileSync(configPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return DEFAULT_CONFIG;
    }
    throw error;
  }
  return mergeConfig(DEFAULT_CONFIG, JSON.parse(text));
}

/** The project root: Claude Code sets CLAUDE_PROJECT_DIR for every hook. */
export function getProjectDir(input) {
  return process.env.CLAUDE_PROJECT_DIR ?? input?.cwd ?? process.cwd();
}
