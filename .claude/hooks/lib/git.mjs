/**
 * Working-tree snapshots for the Stop gate.
 *
 * The workshop AGENTS.md says "Do not repeat or broaden passing checks without
 * a new change" and "For prose-only changes ... Do not run builds, lint, type
 * checks or tests". To follow that deterministically the gate has to know what
 * changed during this session: a snapshot of `git status` plus a content hash
 * per changed file is taken at session start and compared at Stop. Uncommitted
 * work that existed before the session (or belongs to another agent sharing
 * the checkout) is therefore not blamed on this session.
 */
import path from 'node:path';

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';

const MAX_HASHED_BYTES = 5 * 1024 * 1024;

function hashFile(absolutePath) {
  try {
    const stats = statSync(absolutePath);
    if (!stats.isFile()) {
      return 'not-a-file';
    }
    if (stats.size > MAX_HASHED_BYTES) {
      return `large:${stats.size}:${stats.mtimeMs}`;
    }
    return createHash('sha1').update(readFileSync(absolutePath)).digest('hex');
  } catch {
    return 'deleted';
  }
}

/**
 * Parses `git status --porcelain=v1 -z`. Each entry is `XY <path>`; renames and
 * copies are followed by a second NUL-separated field with the old path.
 */
export function parsePorcelain(text) {
  const fields = text.split('\0').filter((field) => field !== '');
  const entries = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const status = field.slice(0, 2);
    entries.push({ status, file: field.slice(3) });
    if (status.includes('R') || status.includes('C')) {
      index += 1;
    }
  }
  return entries;
}

/**
 * Map of project-relative path to content hash for every file git reports as
 * changed or untracked (ignored files are not reported). Returns `undefined`
 * outside a git repository or when git is missing.
 */
export function snapshotWorkingTree(projectDir) {
  const result = spawnSync('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'], {
    cwd: projectDir,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error !== undefined || result.status !== 0) {
    return undefined;
  }
  const snapshot = {};
  for (const { file } of parsePorcelain(result.stdout)) {
    snapshot[file] = hashFile(path.join(projectDir, file));
  }
  return snapshot;
}

/** Paths whose state differs between two snapshots. A path absent from a snapshot is clean. */
export function changedPaths(before, after) {
  const paths = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...paths].filter((file) => (before[file] ?? 'clean') !== (after[file] ?? 'clean')).sort();
}

/** One short hash for a set of changed files and their contents. */
export function fingerprintOf(snapshot, files) {
  const hash = createHash('sha1');
  for (const file of files) {
    hash.update(`${file}\0${snapshot[file] ?? 'clean'}\0`);
  }
  return hash.digest('hex');
}
