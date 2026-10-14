/**
 * Process helpers for the Detect hooks (format, lint, typecheck).
 *
 * Windows details that shaped this file:
 * - `npm`, `eslint` and `prettier` are `.cmd` shims in `node_modules/.bin`.
 *   Claude Code's exec form cannot spawn those, and `spawn` needs a shell for
 *   them (the workshop's patches.test.ts uses `shell: process.platform ===
 *   'win32'` for the same reason). Tools that ship a JS entry point are run as
 *   `node <entry>` instead, so no shell is involved at all.
 * - A timeout must kill the whole process tree, not only the shell.
 */
import path from 'node:path';

import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const IS_WINDOWS = process.platform === 'win32';

/**
 * Resolves the JS entry point of an installed package's binary, e.g.
 * `resolveBin('/repo', 'eslint', 'eslint')`. `package.json` is read through
 * `<package>/package.json` because that is exported by every package, while
 * the `bin/` folder usually is not. Returns `undefined` when the package is
 * not installed, so a hook can skip the step instead of failing.
 */
export function resolveBin(projectDir, packageName, binName = packageName) {
  try {
    const require = createRequire(path.join(projectDir, 'package.json'));
    const manifestPath = require.resolve(`${packageName}/package.json`);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const relativeBin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.[binName];
    return relativeBin === undefined ? undefined : path.resolve(path.dirname(manifestPath), relativeBin);
  } catch {
    // Not installed (or not resolvable from the project root): the caller decides what that means
    return undefined;
  }
}

/** Clean, colourless environment: `NO_COLOR` and `FORCE_COLOR` together make Node print a warning. */
function cleanEnvironment(extra = {}) {
  const environment = { ...process.env, ...extra, NO_COLOR: '1' };
  delete environment.FORCE_COLOR;
  return environment;
}

/** Quotes an argument for cmd.exe only when it contains characters that need it. */
function quoteForCmd(argument) {
  if (/^[\w:./\\@=+-]+$/u.test(argument)) {
    return argument;
  }
  return `"${argument.replaceAll('"', '\\"')}"`;
}

function killTree(child) {
  if (child.pid === undefined) {
    return;
  }
  if (IS_WINDOWS) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGKILL');
  }
}

/**
 * Runs a command and collects its output. Never rejects: failures to start and
 * timeouts are returned as `{ exitCode: undefined, error }` so the hook can
 * report them in its own words.
 *
 * `shell` is only enabled on Windows, where package manager shims need it. The
 * arguments come from guardrails.config.json or are fixed in the hook, never
 * from the model.
 */
export function runCommand(command, args, { cwd, timeoutSeconds, env } = {}) {
  return new Promise((resolve) => {
    let output = '';
    let timedOut = false;
    const useShell = IS_WINDOWS && command !== process.execPath;
    const options = { cwd, env: cleanEnvironment(env), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true };
    // With `shell: true` and an args array Node 24 warns about unescaped args (DEP0190), so the line is built here
    const child = useShell
      ? spawn([command, ...args.map(quoteForCmd)].join(' '), { ...options, shell: true })
      : spawn(command, args, options);
    const timer =
      timeoutSeconds === undefined
        ? undefined
        : setTimeout(() => {
            timedOut = true;
            killTree(child);
          }, timeoutSeconds * 1000);

    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ exitCode: undefined, output, error: error.message, timedOut });
    });
    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({
        exitCode: timedOut ? undefined : exitCode,
        output,
        timedOut,
        error: timedOut ? `timed out after ${timeoutSeconds}s` : undefined,
      });
    });
  });
}

/** Runs `node <script> ...args`: no shell, so quoting and `.cmd` shims are not an issue. */
export function runNodeScript(projectDir, scriptPath, args, options = {}) {
  return runCommand(process.execPath, [scriptPath, ...args], { cwd: projectDir, ...options });
}

/** Keeps the end of long output, because test and lint summaries print last. */
export function tail(text, maxChars) {
  if (text.length <= maxChars) {
    return text;
  }
  return `[... ${text.length - maxChars} characters cut ...]\n${text.slice(text.length - maxChars)}`;
}

/** Strips ANSI colour escape sequences that tools print even when stdout is not a terminal. */
export function stripAnsi(text) {
  // eslint-disable-next-line no-control-regex -- the escape character is exactly what this pattern has to match
  return text.replace(/\u001B\[[0-9;]*[A-Za-z]/gu, '');
}
