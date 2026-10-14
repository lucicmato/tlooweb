/**
 * A small, quote-aware shell command parser for the PreToolUse guard.
 *
 * Why not just regexes over the raw command: the permission rules documented
 * at https://code.claude.com/docs/en/permissions only match the command text
 * Claude writes ("What a Bash rule doesn't match": `/bin/rm`, `sh -c '...'`,
 * `git -C . push`). Splitting the command into simple commands, unwrapping
 * `sudo`/`timeout`/`bash -c` and looking at `$( ... )` lets the guard apply
 * rules to what would actually run, while words that only appear inside an
 * `echo` or a commit message stay inert (no false positives for
 * `git commit -m "block psql"`).
 *
 * This is not a full shell grammar. It is deliberately conservative and is
 * covered by __tests__/shellParse.test.mjs. Derived from the workshop idea
 * that Prevent must happen before the tool runs (README.md, "Prevent and
 * Detect").
 */

const MAX_DEPTH = 4;

const WRAPPER_PROGRAMS = new Set([
  'sudo',
  'doas',
  'time',
  'nice',
  'nohup',
  'command',
  'builtin',
  'exec',
  'stdbuf',
  'setsid',
  'xargs',
]);
const SHELL_PROGRAMS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh', 'fish']);
const POWERSHELL_PROGRAMS = new Set(['pwsh', 'powershell']);
const INTERPRETER_PROGRAMS = new Set([
  'node',
  'nodejs',
  'python',
  'python3',
  'py',
  'deno',
  'bun',
  'ruby',
  'perl',
  'php',
]);

/** Characters that bash lets a backslash escape. Other backslashes stay literal (Windows paths). */
const BASH_ESCAPABLE = ' "\'\\$`\n';

/**
 * Lower-cased program name without directory, extension or call operator, so
 * `/usr/bin/RM`, `C:\\tools\\git.exe` and `rm` are the same program.
 */
export function programName(token) {
  const base = token.replaceAll('\\', '/').split('/').pop() ?? '';
  return base.toLowerCase().replace(/\.(?:exe|cmd|bat|ps1|com)$/u, '');
}

function isAssignment(token) {
  return /^[A-Za-z_][A-Za-z0-9_]*=/u.test(token) || /^\$env:[A-Za-z_][A-Za-z0-9_]*=/iu.test(token);
}

/**
 * Removes heredoc bodies. A heredoc is data for another program, not a
 * command, and the common `git commit -m "$(cat <<'EOF' ... EOF)"` pattern
 * would otherwise put a whole commit message through the rules.
 */
export function stripHeredocBodies(command) {
  const output = [];
  const delimiters = [];
  for (const line of command.split('\n')) {
    if (delimiters.length > 0) {
      if (line.trim() === delimiters[0]) {
        delimiters.shift();
      }
      continue;
    }
    output.push(line);
    for (const match of line.matchAll(/(?<!<)<<(?!<)-?\s*(['"]?)([A-Za-z_][\w-]*)\1/gu)) {
      delimiters.push(match[2]);
    }
  }
  return output.join('\n');
}

/** Index of the `)` that closes the `(` at `openIndex`, honouring quotes and nesting. */
function findClosingParenthesis(text, openIndex) {
  let depth = 0;
  let quote = null;
  for (let index = openIndex; index < text.length; index += 1) {
    const character = text[index];
    if (quote !== null) {
      if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return text.length - 1;
}

/**
 * Splits a command line at unquoted `;`, `&&`, `||`, `|`, `&` and newlines.
 * `$( ... )` (and backticks in bash) are cut out and returned separately,
 * because the shell runs them as commands of their own.
 */
export function splitSegments(command, shell = 'bash') {
  const segments = [];
  const substitutions = [];
  let current = '';
  let quote = null;

  const flush = () => {
    if (current.trim() !== '') {
      segments.push(current.trim());
    }
    current = '';
  };

  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];
    const next = command[index + 1];

    if (quote === "'") {
      current += character;
      if (character === "'") {
        quote = null;
      }
      continue;
    }
    if (shell === 'bash' && character === '\\' && next !== undefined && BASH_ESCAPABLE.includes(next)) {
      current += character + next;
      index += 1;
      continue;
    }
    if (shell === 'powershell' && character === '`' && next !== undefined) {
      current += character + next;
      index += 1;
      continue;
    }
    if (character === '$' && next === '(') {
      const end = findClosingParenthesis(command, index + 1);
      substitutions.push(command.slice(index + 2, end));
      current += ' ';
      index = end;
      continue;
    }
    if (shell === 'bash' && character === '`') {
      const end = command.indexOf('`', index + 1);
      const closing = end === -1 ? command.length : end;
      substitutions.push(command.slice(index + 1, closing));
      current += ' ';
      index = closing;
      continue;
    }
    if (quote === '"') {
      current += character;
      if (character === '"') {
        quote = null;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }
    if (character === '\n' || character === ';') {
      flush();
      continue;
    }
    if (character === '&' && next === '&') {
      flush();
      index += 1;
      continue;
    }
    if (character === '|') {
      flush();
      if (next === '|' || next === '&') {
        index += 1;
      }
      continue;
    }
    if (character === '&') {
      // `2>&1` and `&>file` are redirections, not command separators
      const previous = command[index - 1];
      if (previous === '>' || previous === '<' || next === '>') {
        current += character;
        continue;
      }
      flush();
      continue;
    }
    current += character;
  }
  flush();
  return { segments, substitutions };
}

/** Splits one segment into words and removes the quotes around them. */
export function tokenize(text, shell = 'bash') {
  const tokens = [];
  let current = '';
  let hasToken = false;
  let quote = null;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (quote !== null) {
      if (character === quote) {
        quote = null;
      } else if (
        shell === 'bash' &&
        quote === '"' &&
        character === '\\' &&
        next !== undefined &&
        '"\\$`'.includes(next)
      ) {
        current += next;
        index += 1;
      } else if (shell === 'powershell' && quote === '"' && character === '`' && next !== undefined) {
        current += next;
        index += 1;
      } else {
        current += character;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      hasToken = true;
      continue;
    }
    if (shell === 'bash' && character === '\\' && next !== undefined && BASH_ESCAPABLE.includes(next)) {
      current += next;
      index += 1;
      hasToken = true;
      continue;
    }
    if (shell === 'powershell' && character === '`' && next !== undefined) {
      current += next;
      index += 1;
      hasToken = true;
      continue;
    }
    if (/\s/u.test(character)) {
      if (hasToken) {
        tokens.push(current);
        current = '';
        hasToken = false;
      }
      continue;
    }
    current += character;
    hasToken = true;
  }
  if (hasToken) {
    tokens.push(current);
  }
  return tokens;
}

/** Wrapper options that take a value, so `sudo -u postgres psql` does not make `postgres` the program. */
const WRAPPER_OPTIONS_WITH_VALUE = {
  sudo: ['-u', '-g', '-U', '-h', '-p', '-C', '-D', '-R', '-r', '-t', '-T'],
  doas: ['-u', '-C'],
  nice: ['-n'],
  timeout: ['-s', '-k'],
  env: ['-u', '-C', '-S'],
  stdbuf: ['-i', '-o', '-e'],
  xargs: ['-n', '-I', '-P', '-d', '-L', '-s', '-E'],
};

/** Drops the options that follow a wrapper such as `sudo -n` or `nice -n 10`. */
function skipWrapperOptions(wrapper, tokens) {
  const rest = [...tokens];
  const withValue = WRAPPER_OPTIONS_WITH_VALUE[wrapper] ?? [];
  while (rest.length > 0 && rest[0].startsWith('-')) {
    const option = rest.shift();
    if (option === '--') {
      break;
    }
    if (withValue.includes(option) && rest.length > 0) {
      rest.shift();
    }
  }
  return rest;
}

function unwrap(wrapper, tokens) {
  const rest = skipWrapperOptions(wrapper, tokens);
  if (wrapper === 'timeout' && rest.length > 0 && /^\d+(?:\.\d+)?[smhd]?$/u.test(rest[0])) {
    return rest.slice(1);
  }
  return rest;
}

function findBashPayload(args) {
  const flagIndex = args.findIndex((argument) => /^-[a-z]*c[a-z]*$/u.test(argument));
  return flagIndex === -1 ? undefined : args[flagIndex + 1];
}

function findPowerShellPayload(args) {
  const flagIndex = args.findIndex((argument) => /^-c(?:o(?:m(?:m(?:a(?:n(?:d)?)?)?)?)?)?$/iu.test(argument));
  return flagIndex === -1 ? undefined : args.slice(flagIndex + 1).join(' ');
}

function findInterpreterCode(args) {
  const flagIndex = args.findIndex((argument) => /^(?:-e|-c|-p|--eval|--print)$/u.test(argument));
  return flagIndex === -1 ? undefined : args.slice(flagIndex + 1).join(' ');
}

function simplesFromTokens(tokens, shell, depth) {
  let rest = [...tokens];
  const assignments = [];

  for (;;) {
    if (rest.length === 0) {
      return [];
    }
    if (isAssignment(rest[0])) {
      assignments.push(rest.shift());
      continue;
    }
    const name = programName(rest[0]);
    if (WRAPPER_PROGRAMS.has(name) || name === 'timeout' || name === 'env') {
      rest = unwrap(name, rest.slice(1));
      continue;
    }
    break;
  }

  const program = programName(rest[0]);
  const args = rest.slice(1);
  const simple = { program, args, assignments, shell, raw: rest.join(' ') };
  const results = [simple];

  if (SHELL_PROGRAMS.has(program)) {
    const payload = findBashPayload(args);
    if (payload !== undefined) {
      results.push(...parseCommand(payload, 'bash', depth + 1));
    }
  } else if (POWERSHELL_PROGRAMS.has(program)) {
    const payload = findPowerShellPayload(args);
    if (payload !== undefined) {
      results.push(...parseCommand(payload, 'powershell', depth + 1));
    }
    simple.encodedCommand = args.some((argument) => /^-e(?:c|nc|ncodedcommand)?$/iu.test(argument));
  } else if (program === 'cmd') {
    const flagIndex = args.findIndex((argument) => /^\/[ck]$/iu.test(argument));
    if (flagIndex !== -1) {
      results.push(...parseCommand(args.slice(flagIndex + 1).join(' '), 'bash', depth + 1));
    }
  } else if (program === 'eval') {
    results.push(...parseCommand(args.join(' '), shell, depth + 1));
  } else if (INTERPRETER_PROGRAMS.has(program)) {
    simple.code = findInterpreterCode(args);
  }
  return results;
}

/**
 * Parses a command line into a flat list of simple commands:
 * `{ program, args, assignments, raw, code? }`. Nested commands (`bash -c`,
 * `$( ... )`, `eval`) are included, with the same shape.
 */
export function parseCommand(command, shell = 'bash', depth = 0) {
  if (depth > MAX_DEPTH) {
    return [];
  }
  const { segments, substitutions } = splitSegments(stripHeredocBodies(command), shell);
  const simples = [];
  for (const segment of segments) {
    simples.push(...simplesFromTokens(tokenize(segment, shell), shell, depth));
  }
  for (const inner of substitutions) {
    simples.push(...parseCommand(inner, shell, depth + 1));
  }
  return simples;
}
