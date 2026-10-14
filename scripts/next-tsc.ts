#!/usr/bin/env node

// Derived from: `app/scripts/next-tsc.ts` in the workshop repo. Run with `node scripts/next-tsc.ts` as the last part
// of the `typecheck` script (see package.snippet.jsonc). Node has to run TypeScript natively (type stripping),
// the workshop has no `ts-node` or `tsx`.
//
// Why this exists: `tsc` never loads TypeScript language-service plugins, so the Next.js plugin (configured in
// tsconfig `compilerOptions.plugins`) only reports in the editor. This script loads the plugin from the CLI via
// `@typescript-eslint/project-service` and fails on its diagnostics (for example TS71008: a `metadata` export
// must be typed `Metadata`). Needs the `@typescript-eslint/project-service` devDependency.
//
// Paths: the script lives in `scripts/` next to the project root, so `../` is the project root (the tsconfig
// root) and `../app/` is the App Router folder (no `src/` folder). It checks only the files of that folder.
//
// CHANGE against the workshop file (found while testing this kit on Windows): the workshop maps every file name
// through `ts.sys.resolvePath(...)`. That call was needed while `readDirectory('app', ...)` still returned relative
// paths. Since the script passes an ABSOLUTE directory, `readDirectory` already returns absolute paths with forward
// slashes, and on Windows `resolvePath` turns them into backslash paths. With a backslash path the Next.js plugin
// reports NOTHING: a `metadata` export without a type gave TS71008 with the forward-slash path and an empty list
// with the backslash path. So the check was silently inactive on Windows (CI on Linux was not affected). The
// `resolvePath` call is removed here.

// Run the Next.js TypeScript plugin diagnostics, which tsc does not load,
// adapted from https://github.com/karlhorky/poc-next-js-type-checker-cli
import ts from 'typescript';

import { createProjectService } from '@typescript-eslint/project-service';
import { fileURLToPath } from 'node:url';

const appDirectory = fileURLToPath(new URL('../', import.meta.url));
const fileNames = ts.sys.readDirectory(fileURLToPath(new URL('../app/', import.meta.url)), ['.ts', '.tsx']);

const { service } = createProjectService({
  tsconfigRootDir: appDirectory,
  options: { loadTypeScriptPlugins: true },
});

const diagnostics = fileNames.flatMap((fileName) => {
  service.openClientFile(fileName);
  const fileDiagnostics = service
    .getScriptInfo(fileName)!
    .getDefaultProject()
    .getLanguageService(true)
    .getSemanticDiagnostics(fileName);
  service.closeClientFile(fileName);
  // Next.js plugin diagnostic codes, tsc and mdx-tsc report the others
  return fileDiagnostics.filter((diagnostic) => diagnostic.code >= 71000 && diagnostic.code < 72000);
});

if (diagnostics.length > 0) {
  console.error(
    ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => '\n',
    }),
  );
  ts.sys.exit(1);
}
