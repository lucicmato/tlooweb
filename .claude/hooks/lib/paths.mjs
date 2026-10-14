/**
 * Path classification shared by the shell guard and the file guard.
 *
 * Derived from the workshop permission rules (`Read(./app/.env)`,
 * `Read(~/.npmrc)`, README.md "Prevent: database commands denied" and the
 * archived "Secrets in the transcript" slide), generalised from two concrete
 * files to the classes of files an agent has no business reading or editing.
 */
import path from 'node:path';

const EXAMPLE_ENV_FILE = /^\.env\.(?:example|sample|template|defaults?|dist)$/iu;

const SECRET_BASENAMES = Object.freeze([
  /^\.env(?:\.[\w.-]+)?$/iu,
  /^\.npmrc$/iu,
  /^\.netrc$/iu,
  /^_netrc$/iu,
  /^\.pgpass$/iu,
  /^id_(?:rsa|dsa|ecdsa|ed25519)$/iu,
  /\.(?:pem|p12|pfx|key)$/iu,
]);

const SECRET_DIRECTORIES = Object.freeze(['.ssh', '.aws', '.gnupg']);

const LOCKFILES = Object.freeze([
  'pnpm-lock.yaml',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
]);

const TEST_DIRECTORIES = Object.freeze(['__tests__', 'tests', 'test', 'e2e', 'playwright', 'cypress']);
const TEST_FILE_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/iu;

/** Forward slashes everywhere so the same pattern works for `C:\\a\\b` and `/a/b`. */
export function toPosixPath(filePath) {
  return filePath.replaceAll('\\', '/');
}

/** Name of the last path segment, lower-cased for case-insensitive file systems. */
export function baseNameOf(filePath) {
  return (toPosixPath(filePath).split('/').pop() ?? '').toLowerCase();
}

/**
 * True for files that hold credentials. `.env.example` and similar template
 * files are explicitly not secret: the workshop setup copies them.
 */
export function isSecretPath(filePath) {
  const posix = toPosixPath(filePath);
  const baseName = baseNameOf(posix);
  if (baseName === '' || EXAMPLE_ENV_FILE.test(baseName)) {
    return false;
  }
  const segments = posix.toLowerCase().split('/');
  if (segments.slice(0, -1).some((segment) => SECRET_DIRECTORIES.includes(segment))) {
    return true;
  }
  return SECRET_BASENAMES.some((pattern) => pattern.test(baseName));
}

export function isExampleEnvPath(filePath) {
  return EXAMPLE_ENV_FILE.test(baseNameOf(filePath));
}

export function isLockfile(filePath) {
  return LOCKFILES.includes(baseNameOf(filePath));
}

/** `node_modules` edits vanish on the next install and bypass `patchedDependencies`. */
export function isVendoredOrGitPath(filePath) {
  const segments = toPosixPath(filePath).toLowerCase().split('/');
  return segments.includes('node_modules') || segments.includes('.git');
}

export function isTestPath(filePath) {
  const posix = toPosixPath(filePath);
  if (TEST_FILE_PATTERN.test(posix)) {
    return true;
  }
  return posix
    .toLowerCase()
    .split('/')
    .slice(0, -1)
    .some((segment) => TEST_DIRECTORIES.includes(segment));
}

export function isPackageJson(filePath) {
  return baseNameOf(filePath) === 'package.json';
}

export function extensionOf(filePath) {
  return path.extname(filePath).toLowerCase();
}

/**
 * Project-relative POSIX path, or `undefined` when the file lives outside the
 * project. Relative inputs are resolved against `cwd` first, as the tools do.
 */
export function toProjectRelative(projectDir, cwd, filePath) {
  const absolute = path.resolve(cwd ?? projectDir, filePath);
  const relative = path.relative(projectDir, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return undefined;
  }
  return toPosixPath(relative);
}
