import test from 'node:test';
import assert from 'node:assert/strict';
import { load, persist, KEY } from '../src/js/storage.js';
import { summary } from '../src/js/stats.js';
import { csv, cell } from '../src/js/export.js';
const attempt = {
  startTime: '2026-01-01T12:00:00.000Z',
  endTime: '2026-01-01T12:00:06.000Z',
  durationMs: 6000,
  targetMs: 5000,
  outcome: 'completed',
  detectionMethod: 'camera',
};
const session = {
  id: 'one',
  startedAt: attempt.startTime,
  attempts: [attempt],
};
test('storage roundtrip and malformed records are resilient', () => {
  const mem = new Map();
  const storage = {
    getItem: (k) => mem.get(k),
    setItem: (k, v) => mem.set(k, v),
  };
  const data = { version: 1, sessions: [session] };
  assert.equal(persist(storage, data), true);
  assert.deepEqual(load(storage), data);
  for (const corrupt of [
    'invalid json',
    '{"version":2,"sessions":[]}',
    'null',
    '{"version":1,"sessions":[null,{}]}',
  ]) {
    mem.set(KEY, corrupt);
    assert.deepEqual(load(storage).sessions, []);
  }
  mem.set(
    KEY,
    JSON.stringify({
      version: 1,
      sessions: [
        {
          ...session,
          attempts: [
            null,
            { ...attempt, durationMs: -1 },
            { ...attempt, detectionMethod: 'alien' },
            attempt,
          ],
        },
      ],
    }),
  );
  assert.equal(load(storage).sessions[0].attempts.length, 1);
  assert.deepEqual(load(undefined).sessions, []);
  assert.equal(persist(undefined, data), false);
});
test('summaries include interrupted attempts but only completed targets succeed', () => {
  const sessions = [
    session,
    {
      ...session,
      id: 'two',
      attempts: [
        { ...attempt, durationMs: 10000, outcome: 'interrupted' },
        { ...attempt, durationMs: 2000 },
      ],
    },
  ];
  const s = summary(sessions);
  assert.equal(s.sessions, 2);
  assert.equal(s.attempts, 3);
  assert.equal(s.successful, 1);
  assert.equal(s.rate, 1 / 3);
  assert.equal(s.average, 6000);
  assert.equal(s.best, 10000);
  assert.equal(s.daily[0].attempts, 3);
  assert.equal(s.daily[0].successful, 1);
  assert.equal(summary([]).average, 0);
  assert.equal(summary([]).rate, 0);
});
test('CSV includes headers, milliseconds, ISO times, escaped quotes/newlines, and formula protection', () => {
  assert.equal(cell('a,"b"\nc'), '"a,""b""\nc"');
  assert.equal(cell('=1+1'), '"\'=1+1"');
  const output = csv([{ ...session, id: 'a,"b"' }]);
  assert.match(output, /^"sessionId","sessionStartedAt"/);
  assert.ok(output.includes('"6000","completed","5000","camera"'));
  assert.ok(output.includes('"a,""b"""'));
  assert.ok(output.includes(attempt.startTime));
  assert.ok(output.endsWith('\r\n'));
  assert.equal(csv([]).split('\r\n').length, 2);
});
