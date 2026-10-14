/**
 * Tests for the shell parser. They pin the behaviours the rules depend on:
 * wrappers are unwrapped, quotes make words inert, nested commands are found.
 * Run: node --test ".claude/hooks/__tests__/*.test.mjs"
 */
import assert from 'node:assert/strict';

import { describe, test } from 'node:test';
import { parseCommand, programName, splitSegments, stripHeredocBodies, tokenize } from '../lib/shellParse.mjs';

function programs(command, shell) {
  return parseCommand(command, shell).map((simple) => simple.program);
}

describe('programName', () => {
  test('ignores directory, case and extension', () => {
    assert.equal(programName('/usr/bin/RM'), 'rm');
    assert.equal(programName('C:\\Program Files\\Git\\cmd\\git.exe'), 'git');
    assert.equal(programName('./script.ps1'), 'script');
  });
});

describe('splitSegments', () => {
  test('splits at unquoted separators only', () => {
    const { segments } = splitSegments('npm run lint && echo "a; b" | tail -1; ls');
    assert.deepEqual(segments, ['npm run lint', 'echo "a; b"', 'tail -1', 'ls']);
  });

  test('keeps 2>&1 inside its segment', () => {
    const { segments } = splitSegments('npm run lint 2>&1 | tail -5');
    assert.deepEqual(segments, ['npm run lint 2>&1', 'tail -5']);
  });

  test('cuts out command substitutions', () => {
    const { segments, substitutions } = splitSegments('echo $(git log -1) done');
    assert.deepEqual(segments, ['echo   done']);
    assert.deepEqual(substitutions, ['git log -1']);
  });

  test('does not treat $( inside single quotes as a substitution', () => {
    const { substitutions } = splitSegments("echo '$(rm -rf /)'");
    assert.deepEqual(substitutions, []);
  });
});

describe('tokenize', () => {
  test('removes quotes and joins quoted parts', () => {
    assert.deepEqual(tokenize(`git commit -m "a b" 'c d'`), ['git', 'commit', '-m', 'a b', 'c d']);
  });

  test('keeps backslashes of Windows paths', () => {
    assert.deepEqual(tokenize('cat C:\\Users\\me\\.npmrc'), ['cat', 'C:\\Users\\me\\.npmrc']);
  });

  test('understands the PowerShell backtick escape', () => {
    assert.deepEqual(tokenize('Write-Host a` b', 'powershell'), ['Write-Host', 'a b']);
  });
});

describe('stripHeredocBodies', () => {
  test('drops the body of a heredoc', () => {
    const command = ["git commit -m \"$(cat <<'EOF'", 'psql is mentioned here', 'EOF', ')"'].join('\n');
    assert.ok(!stripHeredocBodies(command).includes('psql'));
  });

  test('keeps a here-string', () => {
    assert.ok(stripHeredocBodies("cat <<< 'psql'").includes('psql'));
  });
});

describe('parseCommand', () => {
  test('unwraps sudo, env assignments, timeout and a full path', () => {
    assert.deepEqual(programs('FOO=1 sudo -n timeout 30 /usr/bin/psql -c x'), ['psql']);
  });

  test('keeps environment assignments on the simple command', () => {
    const [simple] = parseCommand('PGHOST=prod.example.com npm run migrate up');
    assert.deepEqual(simple.assignments, ['PGHOST=prod.example.com']);
  });

  test('follows bash -c payloads', () => {
    assert.deepEqual(programs(`bash -lc "git push && psql"`), ['bash', 'git', 'psql']);
  });

  test('follows PowerShell -Command payloads', () => {
    assert.deepEqual(programs(`pwsh -NoProfile -Command "Remove-Item -Recurse x"`), ['pwsh', 'remove-item']);
  });

  test('follows $( ) and eval', () => {
    assert.deepEqual(programs('echo $(psql -c x)'), ['echo', 'psql']);
    assert.deepEqual(programs(`eval "psql -c x"`), ['eval', 'psql']);
  });

  test('records inline interpreter code', () => {
    const [simple] = parseCommand(`node -e "console.log(1)"`);
    assert.equal(simple.code, 'console.log(1)');
  });

  test('flags an encoded PowerShell command', () => {
    const [simple] = parseCommand('powershell -EncodedCommand AAAA', 'powershell');
    assert.equal(simple.encodedCommand, true);
  });

  test('stops at the nesting limit instead of recursing forever', () => {
    const command = 'bash -c "'.repeat(10) + 'psql' + '"'.repeat(10);
    assert.ok(parseCommand(command).length > 0);
  });
});
