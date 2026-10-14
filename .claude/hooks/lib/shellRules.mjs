/**
 * Rules the PreToolUse shell guard applies to Bash and PowerShell commands.
 *
 * Each rule has a stable `id` (switch it off in `disabledRules` of
 * guardrails.config.json), a `decision` (`deny` = never, `ask` = a human
 * approves) and a `source` that says where the idea comes from. Rules marked
 * "kit extension" generalise a workshop guardrail to a class of commands; the
 * workshop file is named in the reason.
 *
 * The permission rules in .claude/settings.json are the enforced floor
 * (https://code.claude.com/docs/en/permissions). These rules look at the
 * parsed command (lib/shellParse.mjs), so they also see wrapped, quoted and
 * path-qualified forms that a prefix rule misses.
 */
import { isExampleEnvPath, isSecretPath, isTestPath } from './paths.mjs';
import { parseCommand, programName } from './shellParse.mjs';

const DATABASE_CLIS = new Set(['psql', 'dropdb', 'dropuser', 'pg_restore']);

/** Programs that run another program given as an argument, e.g. `docker exec db psql`. */
const CARRIER_PROGRAMS = new Set([
  'docker',
  'docker-compose',
  'podman',
  'nerdctl',
  'kubectl',
  'npm',
  'pnpm',
  'npx',
  'yarn',
  'bunx',
]);

/** Programs whose first positional argument is a pattern or script, not a file. */
const PATTERN_FIRST_PROGRAMS = new Set([
  'grep',
  'egrep',
  'fgrep',
  'rg',
  'ag',
  'ack',
  'sed',
  'awk',
  'findstr',
  'select-string',
  'sls',
]);

/** Programs whose arguments are text to print, not files to open. */
const INERT_PROGRAMS = new Set(['echo', 'printf', 'write-host', 'write-output', 'write-error']);

const REMOVAL_PROGRAMS = new Set(['rm', 'rmdir', 'unlink', 'del', 'erase', 'rd', 'ri', 'remove-item']);
const WINDOWS_CMD_REMOVAL_PROGRAMS = new Set(['rmdir', 'del', 'erase', 'rd']);

const PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm', 'bun'];
const INSTALL_SUBCOMMANDS = new Set([
  'install',
  'i',
  'add',
  'ci',
  'update',
  'upgrade',
  'up',
  'remove',
  'rm',
  'uninstall',
  'un',
  'link',
  'ln',
  'dedupe',
  'prune',
]);
const NON_INSTALL_SUBCOMMANDS = new Set([
  'run',
  'run-script',
  'test',
  'exec',
  'x',
  'ls',
  'list',
  'view',
  'info',
  'outdated',
  'audit',
  'pack',
  'publish',
  'why',
  'explain',
  'config',
  'get',
  'cache',
  'version',
  'help',
]);

/** Settings of the project .npmrc install policy (release age, exact versions, no dependency scripts), plus the pnpm names of the workshop. */
const SUPPLY_CHAIN_SETTING =
  /min(?:imum)?[-_]?release[-_]?age|strict[-_]?dep[-_]?builds|allow[-_]?builds|only[-_]?built[-_]?dependencies|save[-_]?prefix|save[-_]?exact|ignore[-_]?scripts/iu;
/** Per-command flags that switch one of those protections off for a single install. */
const POLICY_FLAG = /^--(?:no-)?(?:min(?:imum)?-release-age|save-exact|ignore-scripts|save-prefix)(?:=|$)/iu;
/** The only values of those flags that keep a protection on. */
const POLICY_FLAG_SAFE = /^--(?:ignore-scripts|save-exact)(?:=true)?$/iu;
/** Flags that make an install skip checks npm would otherwise enforce. */
const INSTALL_BYPASS_FLAG = /^--(?:force|legacy-peer-deps|no-package-lock)$|^--package-lock=false$/iu;
const DATABASE_URL =
  /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|rediss|mssql|sqlserver):\/\/(?:[^@\s/]*@)?(\[[^\]]+\]|[^/\s:?'"]+)/giu;
const CHECK_COMMAND_WORDS = /\b(?:lint|typecheck|tsc|eslint|jest|vitest|playwright|build|test|format:check|mdx-tsc)\b/u;

/** Tools the project's own check scripts run; `npx <tool>` for these uses the installed version. */
const LOCAL_CHECK_TOOLS = new Set(['eslint', 'prettier', 'tsc']);

const GIT_OPTIONS_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);

function verdict(decision, ruleId, reason, evidence) {
  return { decision, ruleId, reason, evidence };
}

function hasSequence(tokens, sequence) {
  return tokens.some((_token, index) => sequence.every((word, offset) => tokens[index + offset] === word));
}

function flatTokens(simple) {
  return [simple.program, ...simple.args];
}

/** Tokens that name files: strips redirection characters and takes the part after `=`. */
function pathCandidates(token) {
  const stripped = token.replace(/^[0-9]*[<>]+&?/u, '');
  const candidates = stripped === '' ? [] : [stripped];
  const equalsIndex = stripped.indexOf('=');
  if (equalsIndex !== -1 && equalsIndex < stripped.length - 1) {
    candidates.push(stripped.slice(equalsIndex + 1));
  }
  return candidates;
}

function redirectTargets(args) {
  const targets = [];
  args.forEach((argument, index) => {
    if (/^[0-9]*>>?&?$/u.test(argument) || argument === '&>' || argument === '<') {
      if (args[index + 1] !== undefined) {
        targets.push(args[index + 1]);
      }
    } else if (/^[0-9]*[<>]+.+/u.test(argument)) {
      targets.push(argument);
    }
  });
  return targets;
}

/**
 * Arguments that can name a file. The message after `-m` and the search
 * pattern of `grep` or `rg` are prose or regular expressions, so
 * `git commit -m "remove .env"` and `rg "\.env" src` must not trigger the
 * secret rule, while `grep TOKEN .env` still does.
 */
function argsThatCanNameFiles(simple) {
  if (simple.program === 'git') {
    const args = [];
    for (let index = 0; index < simple.args.length; index += 1) {
      const argument = simple.args[index];
      if (argument === '-m' || argument === '--message') {
        index += 1;
      } else if (!argument.startsWith('--message=')) {
        args.push(argument);
      }
    }
    return args;
  }
  if (PATTERN_FIRST_PROGRAMS.has(simple.program)) {
    const args = [];
    let patternSeen = false;
    for (let index = 0; index < simple.args.length; index += 1) {
      const argument = simple.args[index];
      if (argument === '-e' || argument === '--regexp') {
        patternSeen = true;
        index += 1;
      } else if (!argument.startsWith('-') && !patternSeen) {
        patternSeen = true;
      } else {
        args.push(argument);
      }
    }
    return args;
  }
  return simple.args;
}

function parseGit(args) {
  let index = 0;
  while (index < args.length && args[index].startsWith('-')) {
    index += GIT_OPTIONS_WITH_VALUE.has(args[index]) ? 2 : 1;
  }
  return { subcommand: args[index], rest: args.slice(index + 1) };
}

function hasShortFlag(tokens, letter) {
  return tokens.some((token) => new RegExp(`^-[a-zA-Z]*${letter}[a-zA-Z]*$`, 'u').test(token));
}

function isBroadRemovalTarget(rawTarget) {
  const target = rawTarget.replace(/[\\/]+$/u, '') === '' ? rawTarget : rawTarget.replace(/[\\/]+$/u, '');
  if (/(?:^|[\\/])\.git$/iu.test(target)) {
    return true;
  }
  return [
    /^[\\/]$/u,
    /^~$/u,
    /^\$\{?home\}?$/iu,
    /^\$env:(?:userprofile|homepath|systemroot)$/iu,
    /^%(?:userprofile|homepath|systemroot)%$/iu,
    /^\.{1,2}$/u,
    /^\$pwd$/iu,
    /^(?:\.{0,2}[\\/])?\*$/u,
    /^[a-z]:[\\/]?\*?$/iu,
    /^[\\/](?:bin|boot|dev|etc|home|lib|lib64|mnt|opt|proc|root|run|sbin|srv|sys|tmp|usr|var|users|windows)$/iu,
  ].some((pattern) => pattern.test(target));
}

function hostOf(connection) {
  return connection.replace(/^\[|\]$/gu, '').toLowerCase();
}

/**
 * Rules evaluated once per simple command (a command after splitting at
 * `&&`, `|`, `;` and unwrapping `sudo`, `bash -c`, `$( ... )`).
 */
const SIMPLE_RULES = [
  {
    id: 'database-cli',
    // Workshop: permissions.deny `Bash(psql:*)` (README.md, "Prevent: database commands denied")
    check(simple) {
      const names = CARRIER_PROGRAMS.has(simple.program) ? flatTokens(simple).map(programName) : [simple.program];
      const hit = names.find((name) => DATABASE_CLIS.has(name));
      if (hit === undefined) {
        return undefined;
      }
      return verdict(
        'deny',
        'database-cli',
        `\`${hit}\` is blocked: an agent must not run SQL against a database directly (the workshop's Replit example: instructions did not stop the delete, a rejected command would have). Change the schema with a numbered migration file, or ask the user to run the command in their own terminal.`,
        simple.raw,
      );
    },
  },
  {
    id: 'migrate-down',
    // Workshop: permissions.deny `Bash(pnpm migrate down:*)` (here `npm run migrate down`); the same destructive step for other tools is a kit extension
    check(simple) {
      // `npm run migrate -- down` passes the same argument as `npm run migrate down`, so the separator must not hide it
      const tokens = flatTokens(simple).filter((token) => token !== '--');
      // `npm run migrate -w app down` puts workspace flags between the script and its argument, so look at everything after `migrate`
      const migrateIndex = tokens.indexOf('migrate');
      const isDown =
        (migrateIndex !== -1 &&
          tokens.slice(migrateIndex + 1).some((token) => token === 'down' || token === 'reset')) ||
        hasSequence(tokens, ['ley', 'down']) ||
        tokens.includes('--force-reset');
      if (!isDown) {
        return undefined;
      }
      return verdict(
        'deny',
        'migrate-down',
        'Rolling a database back (`migrate down`, `migrate reset`, `--force-reset`) is blocked. Add a new numbered migration instead, and ask the user to run a rollback if one is really needed.',
        simple.raw,
      );
    },
  },
  {
    id: 'non-local-database',
    // Kit extension of the workshop's Replit lesson: development and production shared one database
    check(simple, context) {
      const localHosts = new Set(context.config.localDatabaseHosts.map((host) => host.toLowerCase()));
      const texts = [...simple.args, ...simple.assignments, ...(simple.code === undefined ? [] : [simple.code])];
      for (const text of texts) {
        for (const match of text.matchAll(DATABASE_URL)) {
          if (!localHosts.has(hostOf(match[1]))) {
            return verdict(
              'deny',
              'non-local-database',
              `A database connection to \`${hostOf(match[1])}\` is blocked: only local hosts (${[...localHosts].join(', ')}) are allowed from an agent session. Development and production must not share a database; ask the user to run commands against anything else.`,
              match[0],
            );
          }
        }
      }
      const pgHost = simple.assignments.find((assignment) => /^PGHOST=/iu.test(assignment));
      if (pgHost !== undefined && !localHosts.has(hostOf(pgHost.slice(pgHost.indexOf('=') + 1)))) {
        return verdict(
          'deny',
          'non-local-database',
          'PGHOST points at a non-local database host; only local hosts are allowed.',
          pgHost,
        );
      }
      return undefined;
    },
  },
  {
    id: 'secret-files',
    // Workshop: permissions.deny `Read(./app/.env)` and `Read(~/.npmrc)`; slide "Secrets in the transcript"
    check(simple) {
      const isCopyFromExample =
        ['cp', 'copy', 'copy-item'].includes(simple.program) &&
        simple.args.filter((argument) => !argument.startsWith('-')).length === 2 &&
        isExampleEnvPath(simple.args.filter((argument) => !argument.startsWith('-'))[0]);
      if (isCopyFromExample) {
        return undefined;
      }
      const scanned = INERT_PROGRAMS.has(simple.program)
        ? redirectTargets(simple.args)
        : [...argsThatCanNameFiles(simple), ...redirectTargets(simple.args)];
      for (const token of scanned) {
        const secret = pathCandidates(token).find((candidate) => isSecretPath(candidate));
        if (secret !== undefined) {
          return verdict(
            'deny',
            'secret-files',
            `\`${secret}\` looks like a credential file. Reading it would put the secret into the model context and the session transcript (the workshop's \`cat ~/.npmrc\` example), so the command is blocked. Use \`.env.example\` for variable names, and ask the user to read or change real secrets.`,
            simple.raw,
          );
        }
      }
      if (simple.code !== undefined) {
        const mentions =
          simple.code.match(/(?:^|[^\w.-])(\.env(?:\.[\w-]+)*|\.npmrc|\.netrc|\.pgpass)(?![\w-])/giu) ?? [];
        const secret = mentions
          .map((mention) => mention.replace(/^[^.]/u, ''))
          .find((mention) => isSecretPath(mention));
        if (secret !== undefined) {
          return verdict(
            'deny',
            'secret-files',
            `Inline code mentions \`${secret}\`, a credential file. Reading secrets from an agent session is blocked.`,
            simple.raw,
          );
        }
      }
      return undefined;
    },
  },
  {
    id: 'foreign-package-manager',
    // Kit extension of the workshop's supply-chain rules: the install policy and the lockfile only protect installs made with the project's package manager
    check(simple, context) {
      if (!PACKAGE_MANAGERS.includes(simple.program) || simple.program === context.config.packageManager) {
        return undefined;
      }
      const isBareYarn = simple.program === 'yarn' && simple.args.length === 0;
      let installs = isBareYarn;
      for (const argument of simple.args) {
        if (NON_INSTALL_SUBCOMMANDS.has(argument)) {
          break;
        }
        if (INSTALL_SUBCOMMANDS.has(argument)) {
          installs = true;
          break;
        }
      }
      if (!installs) {
        return undefined;
      }
      return verdict(
        'deny',
        'foreign-package-manager',
        `\`${simple.program}\` installs are blocked: this project installs with ${context.config.packageManager}, whose install policy (the project .npmrc: release age, exact versions, no dependency scripts) and lockfile the other package managers ignore. Use ${context.config.packageManager} instead.`,
        simple.raw,
      );
    },
  },
  {
    id: 'supply-chain-override',
    // Workshop: pnpm-workspace.yaml minimumReleaseAge, strictDepBuilds and allowBuilds are a human decision ("explicit human approval path"); here the project .npmrc (`min-release-age`, `ignore-scripts`, `save-exact`)
    check(simple) {
      const tokens = flatTokens(simple);
      const isPackageManager = PACKAGE_MANAGERS.includes(simple.program);
      const writesConfig = hasSequence(tokens, ['config', 'set']) || (isPackageManager && simple.args[0] === 'set');
      const overridesSetting =
        (writesConfig && tokens.some((token) => SUPPLY_CHAIN_SETTING.test(token))) ||
        (isPackageManager &&
          simple.args.some((argument) => POLICY_FLAG.test(argument) && !POLICY_FLAG_SAFE.test(argument))) ||
        simple.args.some((argument) => argument.startsWith('--config.') && SUPPLY_CHAIN_SETTING.test(argument)) ||
        simple.assignments.some(
          (assignment) => /^(?:npm|pnpm)_config_/iu.test(assignment) && SUPPLY_CHAIN_SETTING.test(assignment),
        );
      // `npm rebuild` runs the install scripts that `ignore-scripts=true` skipped: it is the approval step, like pnpm's `approve-builds`
      const runsDependencyScripts =
        hasSequence(tokens, ['approve-builds']) || (isPackageManager && ['rebuild', 'rb'].includes(simple.args[0]));
      if (overridesSetting || runsDependencyScripts) {
        return verdict(
          'deny',
          'supply-chain-override',
          'Changing the package install policy from the command line (`min-release-age`, `ignore-scripts`, `save-exact`, `npm rebuild`) is blocked. Approving a young release or a dependency install script is a human decision: explain which exact version or package you need and why, and ask the user to change .npmrc or to run the install themselves.',
          simple.raw,
        );
      }
      return undefined;
    },
  },
  {
    id: 'install-bypass-flag',
    // Kit extension: `--force` and `--legacy-peer-deps` install what npm refused (engine or peer conflicts) instead of fixing the conflict
    check(simple) {
      if (!PACKAGE_MANAGERS.includes(simple.program)) {
        return undefined;
      }
      const subcommand = simple.args.find((argument) => !argument.startsWith('-'));
      if (subcommand === undefined || !INSTALL_SUBCOMMANDS.has(subcommand)) {
        return undefined;
      }
      const flag = simple.args.find((argument) => INSTALL_BYPASS_FLAG.test(argument) || argument === '-f');
      if (flag === undefined) {
        return undefined;
      }
      return verdict(
        'deny',
        'install-bypass-flag',
        `\`${flag}\` makes the install skip checks (engine and peer dependency conflicts, the lockfile). Fix the conflict instead, or tell the user which package needs it.`,
        simple.raw,
      );
    },
  },
  {
    id: 'download-and-run',
    // Kit extension: the workshop's package rules assume dependencies are reviewed before they execute
    check(simple) {
      const runsDlx = PACKAGE_MANAGERS.includes(simple.program) && simple.args.includes('dlx');
      const runsNpmExec = simple.program === 'npm' && ['exec', 'x'].includes(simple.args[0]);
      const runsNpx = simple.program === 'npx';
      // The first positional argument of `npx` is the tool. Tools of the project's own checks resolve from node_modules/.bin;
      // when one is not installed, npx without a TTY cancels instead of downloading it (npm 10.6.0, "npx canceled due to missing packages and no YES option")
      const tool = simple.args.slice(runsNpmExec ? 1 : 0).find((argument) => !argument.startsWith('-'));
      const usesYes = simple.args.some((argument) => argument === '-y' || argument === '--yes');
      if (runsNpx && !usesYes && LOCAL_CHECK_TOOLS.has(tool)) {
        return undefined;
      }
      if (runsNpx || runsNpmExec || simple.program === 'bunx' || runsDlx) {
        return verdict(
          'ask',
          'download-and-run',
          '`npx`, `npm exec` and `dlx` can download and execute a package version nobody reviewed, outside the lockfile. Use `npm run <script>` or `npx <installed tool>` (eslint, prettier, tsc), or pin an exact reviewed version.',
          simple.raw,
        );
      }
      return undefined;
    },
  },
  {
    id: 'encoded-command',
    // Kit extension: an encoded PowerShell payload cannot be inspected by any rule
    check(simple) {
      if (simple.encodedCommand === true) {
        return verdict(
          'deny',
          'encoded-command',
          'PowerShell `-EncodedCommand` hides the command from every guard and is blocked. Pass the command as plain text.',
          simple.raw,
        );
      }
      return undefined;
    },
  },
  {
    id: 'eslint-weakening',
    // Workshop: "eslint . --max-warnings 0" and "Fix failures without weakening checks or expectations"
    check(simple) {
      const tokens = flatTokens(simple);
      const isLint =
        tokens.includes('eslint') || (PACKAGE_MANAGERS.includes(simple.program) && tokens.includes('lint'));
      if (!isLint) {
        return undefined;
      }
      const weakening = simple.args.find((argument, index) => {
        if (
          // `--suppress-all` and `--suppress-rule` (listed by `eslint --help`) record the current violations in a suppressions file, so lint passes without fixing them
          /^--(?:quiet|rule|no-config-lookup|ignore-pattern|suppress-all|suppress-rule)(?:=|$)/u.test(argument) ||
          argument === '-c' ||
          argument === '--config'
        ) {
          return true;
        }
        if (argument.startsWith('--max-warnings=')) {
          return argument !== '--max-warnings=0';
        }
        return argument === '--max-warnings' && simple.args[index + 1] !== '0';
      });
      if (weakening === undefined) {
        return undefined;
      }
      return verdict(
        'deny',
        'eslint-weakening',
        `\`${weakening}\` makes ESLint report less than the project's \`lint\` script does (\`eslint . --max-warnings 0\`). Run \`npm run lint\` unchanged and fix the cause of each diagnostic.`,
        simple.raw,
      );
    },
  },
  {
    id: 'git-force-push',
    // Kit extension: rewriting or deleting remote history is never an agent decision
    check(simple) {
      if (simple.program !== 'git') {
        return undefined;
      }
      const { subcommand, rest } = parseGit(simple.args);
      if (subcommand !== 'push') {
        return undefined;
      }
      const isForce =
        rest.some((token) =>
          /^--(?:force|force-with-lease|force-if-includes|mirror|delete|prune)(?:=|$)/u.test(token),
        ) ||
        rest.some((token) => token.startsWith('+') || (token.startsWith(':') && token.length > 1)) ||
        hasShortFlag(rest, 'f') ||
        hasShortFlag(rest, 'd');
      if (!isForce) {
        return undefined;
      }
      return verdict(
        'deny',
        'git-force-push',
        'Force-pushing or deleting remote refs is blocked. Ask the user to run it.',
        simple.raw,
      );
    },
  },
  {
    id: 'git-push',
    // Workshop AGENTS.md: "Commit each change on `main` with only the touched files ... Do not push"
    check(simple) {
      if (simple.program !== 'git') {
        return undefined;
      }
      if (parseGit(simple.args).subcommand !== 'push') {
        return undefined;
      }
      return verdict(
        'ask',
        'git-push',
        'The workshop AGENTS.md says "Do not push". The user approves each push.',
        simple.raw,
      );
    },
  },
  {
    id: 'git-discard-work',
    // Workshop AGENTS.md: "other agents may share the checkout"; exercises/animal-favorites/README.md allows `git restore .` and `git clean -fd app` in the disposable export only ("Never run this reset on unrelated work in the main workshop checkout")
    check(simple) {
      if (simple.program !== 'git') {
        return undefined;
      }
      const { subcommand, rest } = parseGit(simple.args);
      const discardsEverything =
        (subcommand === 'reset' && rest.includes('--hard')) ||
        (subcommand === 'clean' && (hasShortFlag(rest, 'f') || rest.includes('--force'))) ||
        (subcommand === 'checkout' && (rest.includes('.') || rest.includes(':/') || hasShortFlag(rest, 'f'))) ||
        (subcommand === 'restore' &&
          (rest.includes('.') || rest.includes(':/') || rest.includes('*')) &&
          (!rest.includes('--staged') || rest.includes('--worktree')));
      if (!discardsEverything) {
        return undefined;
      }
      return verdict(
        'deny',
        'git-discard-work',
        'Discarding all uncommitted work (`reset --hard`, `clean -f`, `checkout .`, `restore .`) is blocked: other agents or the user may have uncommitted changes in this checkout. Restore only a file you changed yourself, by explicit path.',
        simple.raw,
      );
    },
  },
  {
    id: 'git-no-verify',
    // Kit extension: git hooks are guardrails too
    check(simple) {
      if (simple.program !== 'git') {
        return undefined;
      }
      const { subcommand, rest } = parseGit(simple.args);
      const skipsHooks =
        rest.includes('--no-verify') ||
        (subcommand === 'commit' && hasShortFlag(rest, 'n')) ||
        rest.includes('--no-gpg-sign');
      if (!skipsHooks) {
        return undefined;
      }
      return verdict(
        'deny',
        'git-no-verify',
        'Skipping git hooks or signing (`--no-verify`, `-n`, `--no-gpg-sign`) is blocked. Fix what the hook reports.',
        simple.raw,
      );
    },
  },
  {
    id: 'git-stage-all',
    // Workshop AGENTS.md: "Commit each change on `main` with only the touched files (other agents may share the checkout)"
    check(simple) {
      if (simple.program !== 'git') {
        return undefined;
      }
      const { subcommand, rest } = parseGit(simple.args);
      const stagesAll =
        (subcommand === 'add' &&
          (rest.includes('-A') ||
            rest.includes('--all') ||
            rest.includes('.') ||
            rest.includes(':/') ||
            rest.includes('-u') ||
            rest.includes('--update'))) ||
        (subcommand === 'commit' && (hasShortFlag(rest, 'a') || rest.includes('--all')));
      if (!stagesAll) {
        return undefined;
      }
      return verdict(
        'ask',
        'git-stage-all',
        'Stage and commit only the files you touched (other agents may share the checkout): `git add <file>...`.',
        simple.raw,
      );
    },
  },
  {
    id: 'git-hide-work',
    // Workshop AGENTS.md: "other agents may share the checkout"; a stash or a force-deleted branch moves work out of sight
    check(simple) {
      if (simple.program !== 'git') {
        return undefined;
      }
      const { subcommand, rest } = parseGit(simple.args);
      const stashes = subcommand === 'stash' && !['list', 'show'].includes(rest[0]);
      const deletesBranch = subcommand === 'branch' && rest.some((token) => /^-[a-zA-Z]*D[a-zA-Z]*$/u.test(token));
      if (!stashes && !deletesBranch) {
        return undefined;
      }
      return verdict(
        'ask',
        'git-hide-work',
        `\`git ${subcommand}\` can hide or delete work that is not yours. The user approves it.`,
        simple.raw,
      );
    },
  },
  {
    id: 'remove-broad',
    // Kit extension of the workshop's "destructive actions" section (README.md): a recursive delete of a root, home or whole tree
    check(simple) {
      if (!REMOVAL_PROGRAMS.has(simple.program)) {
        return undefined;
      }
      const isWindowsCommand = WINDOWS_CMD_REMOVAL_PROGRAMS.has(simple.program);
      const flags = simple.args.filter(
        (argument) => argument.startsWith('-') || (isWindowsCommand && /^\/[a-z]$/iu.test(argument)),
      );
      // PowerShell flags are words (`-Force` contains an `r`), so only a prefix of `-Recurse` counts there
      const isRecursiveFlag =
        simple.shell === 'powershell'
          ? (flag) => /^-r(?:e(?:c(?:u(?:r(?:s(?:e)?)?)?)?)?)?$/iu.test(flag)
          : (flag) => /^-[a-zA-Z]*[rR][a-zA-Z]*$/u.test(flag) || flag === '--recursive';
      const recursive = flags.some((flag) => isRecursiveFlag(flag) || (isWindowsCommand && /^\/s$/iu.test(flag)));
      const operands = simple.args.filter((argument) => !flags.includes(argument));
      if (flags.includes('--no-preserve-root')) {
        return verdict('deny', 'remove-broad', '`--no-preserve-root` is blocked.', simple.raw);
      }
      const broad = recursive ? operands.find((operand) => isBroadRemovalTarget(operand)) : undefined;
      if (broad !== undefined) {
        return verdict(
          'deny',
          'remove-broad',
          `Recursively deleting \`${broad}\` is blocked. Delete a specific build directory by name instead.`,
          simple.raw,
        );
      }
      return undefined;
    },
  },
  {
    id: 'delete-test-file',
    // Workshop review prompt: "check for deleted or skipped tests and weakened assertions"
    check(simple) {
      const isGitRemoval = simple.program === 'git' && parseGit(simple.args).subcommand === 'rm';
      if (!REMOVAL_PROGRAMS.has(simple.program) && !isGitRemoval) {
        return undefined;
      }
      const target = simple.args.find((argument) => !argument.startsWith('-') && isTestPath(argument));
      if (target === undefined) {
        return undefined;
      }
      return verdict(
        'ask',
        'delete-test-file',
        `Deleting \`${target}\` removes tests. The user approves it (workshop capstone: "Preserve existing tests", "ask me before changing a requirement or its test expectation").`,
        simple.raw,
      );
    },
  },
];

/** Rules that need the whole command line, because they look at pipes and exit codes. */
const COMMAND_RULES = [
  {
    id: 'swallowed-exit-code',
    // exercises/animal-favorites/rehearsals/2026-09-30-haiku-off.md: pipelines through `tail` hide the exit status of the check
    check(command) {
      if (!CHECK_COMMAND_WORDS.test(command)) {
        return undefined;
      }
      if (/\|\|\s*(?:true|exit\s+0|:)(?:\s|$|;|&)/u.test(command) || /;\s*true\s*$/u.test(command)) {
        return verdict(
          'deny',
          'swallowed-exit-code',
          'A check must be allowed to fail the command: `|| true` / `; true` hides the failure from you and from the transcript. Run the check as is.',
          command,
        );
      }
      return undefined;
    },
  },
  {
    id: 'piped-check-output',
    // exercises/animal-favorites/rehearsals/2026-09-30-haiku-off.md: "their pipeline exit status alone is not evidence"
    check(rawCommand) {
      if (/\bpipefail\b/u.test(rawCommand)) {
        return undefined;
      }
      // `2>&1` contains an `&`, which would end the match below
      const command = rawCommand.replaceAll(/\d?>&\d?/gu, ' ');
      const pipesCheck =
        /\b(?:pnpm|npm|yarn|bun)\s+(?:run\s+)?(?:lint|typecheck|build|test|jest|playwright|vitest|format:check)\b[^|;&\n]*\|\s*(?:tail|head|grep|egrep|sed|awk|cut|less|more)\b/u.test(
          command,
        ) ||
        /\b(?:eslint|tsc|jest|vitest|playwright)\b[^|;&\n]*\|\s*(?:tail|head|grep|egrep|sed|awk|cut|less|more)\b/u.test(
          command,
        );
      if (!pipesCheck) {
        return undefined;
      }
      return verdict(
        'deny',
        'piped-check-output',
        'A check piped through `tail`/`head`/`grep` reports the exit status of the last command in the pipe, so a failing check looks green. Run it without the pipe, or start the command with `set -o pipefail;`.',
        rawCommand,
      );
    },
  },
  {
    id: 'download-and-pipe-to-shell',
    // Kit extension: running a downloaded script that nobody read
    check(command) {
      const posix = /\b(?:curl|wget)\b[^|;&\n]*\|\s*(?:sudo\s+)?(?:ba|z|da|k)?sh\b/u.test(command);
      const powershell =
        /\b(?:iwr|irm|invoke-webrequest|invoke-restmethod)\b/iu.test(command) &&
        /\b(?:iex|invoke-expression)\b/iu.test(command);
      if (!posix && !powershell) {
        return undefined;
      }
      return verdict(
        'deny',
        'download-and-pipe-to-shell',
        'Piping a download into a shell is blocked. Download the file, read it, then ask the user to run it.',
        command,
      );
    },
  },
];

/** Names of every rule, for the README table and the config validation test. */
export const SHELL_RULE_IDS = Object.freeze([...SIMPLE_RULES, ...COMMAND_RULES].map((rule) => rule.id));

/**
 * Evaluates a Bash or PowerShell command. Returns the strictest verdict
 * (`deny` before `ask`) or `undefined` when no rule objects.
 *
 * @param {string} command
 * @param {{ shell?: 'bash' | 'powershell', config: import('./config.mjs').DEFAULT_CONFIG }} context
 */
export function evaluateShellCommand(command, context) {
  const disabled = new Set(context.config.disabledRules);
  const verdicts = [];

  for (const rule of COMMAND_RULES) {
    if (!disabled.has(rule.id)) {
      const result = rule.check(command, context);
      if (result !== undefined) {
        verdicts.push(result);
      }
    }
  }
  for (const simple of parseCommand(command, context.shell ?? 'bash')) {
    for (const rule of SIMPLE_RULES) {
      if (!disabled.has(rule.id)) {
        const result = rule.check(simple, context);
        if (result !== undefined) {
          verdicts.push(result);
        }
      }
    }
  }
  return verdicts.find((item) => item.decision === 'deny') ?? verdicts.find((item) => item.decision === 'ask');
}
