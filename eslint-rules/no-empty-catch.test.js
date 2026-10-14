// Unit tests for `workshop/no-empty-catch`.
//
// Derived from: `eslint-rules/no-empty-catch.test.js` in the workshop repo (copied unchanged).
// Run from the project root: `node --test "eslint-rules/*.test.js"` (double quotes, see README.md).

import { RuleTester } from 'eslint';
import { describe, it } from 'node:test';
import { noEmptyCatch } from './no-empty-catch.js';

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester().run('no-empty-catch', noEmptyCatch, {
  valid: [
    'try { run(); } catch (error) { console.error(error); }',
    'try { run(); } catch { // Swallow error missing optional config file\n}',
    'try { run(); } catch { /* Swallow error missing optional config file */ }',
  ],
  invalid: [
    {
      code: 'try { run(); } catch {}',
      errors: [{ messageId: 'emptyCatch' }],
    },
    {
      code: 'try { run(); } catch (error) { // Ignore\n}',
      errors: [{ messageId: 'emptyCatch' }],
    },
    {
      code: 'try { run(); } catch { // Swallow error\n}',
      errors: [{ messageId: 'emptyCatch' }],
    },
  ],
});
