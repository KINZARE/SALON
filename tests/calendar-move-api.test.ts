import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/server-imports.mjs';
const { POST } = await import('../src/app/api/internal/move/route.ts');

test('calendar move returns 400 for malformed input without accessing database', async () => {
  for (const body of ['null', '[]', '{}', '{']) {
    const response = await POST(new Request('http://localhost/api/internal/move', { method: 'POST', headers: { 'content-type': 'application/json' }, body }));
    assert.equal(response.status, 400, body);
  }
});
