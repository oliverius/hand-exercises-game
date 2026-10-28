import test from 'node:test';
import assert from 'node:assert/strict';
import { Exercise } from '../src/js/engine.js';

function fixture() {
  const records = [];
  const engine = new Exercise({
    save: (a) => records.push(a),
    wall: () => Date.parse('2026-01-01T12:00:00Z'),
  });
  const sample = (g, t, score = 0.9, tracked = true) =>
    engine.sample(g, score, t, tracked);
  const open = (t = 10000) => {
    sample('Open_Palm', t);
    sample('Open_Palm', t + 150);
  };
  const holdUntil = (t) => {
    for (let n = 10300; n <= t; n += 100) sample('Open_Palm', n);
  };
  return { engine, records, sample, open, holdUntil };
}
test('gesture recognition defaults to 50% confidence', () => {
  const { engine } = fixture();
  assert.equal(engine.entryThreshold, 0.5);
});
test('pointing must be continuous for 750ms, then counts down three seconds', () => {
  const { engine: e, sample } = fixture();
  sample('Pointing_Up', 0);
  sample('Pointing_Up', 400);
  sample('None', 500);
  sample('Pointing_Up', 600);
  sample('Pointing_Up', 1000);
  assert.equal(e.phase, 'WAITING');
  sample('Pointing_Up', 1350);
  assert.equal(e.phase, 'COUNTDOWN');
  e.tick(4349);
  assert.equal(e.phase, 'COUNTDOWN');
  e.tick(4350);
  assert.equal(e.phase, 'ACTIVE');
});
test('button start uses ten seconds; a repeated Start does not restart countdown', () => {
  const { engine: e } = fixture();
  e.start(0);
  e.start(5000);
  e.tick(9999);
  assert.equal(e.phase, 'COUNTDOWN');
  e.tick(10000);
  assert.equal(e.phase, 'ACTIVE');
});
test('debounces open, measures beyond target, saves actual duration on close', () => {
  const { engine: e, records, sample, open, holdUntil } = fixture();
  e.start(0);
  e.tick(10000);
  sample('Open_Palm', 10000);
  assert.equal(e.hold, undefined);
  open();
  holdUntil(17000);
  assert.equal(e.elapsed(17000), 6850);
  assert.equal(records.length, 0);
  sample('Closed_Fist', 17100);
  sample('Closed_Fist', 17250);
  assert.equal(records.length, 1);
  assert.equal(records[0].durationMs, 7100);
  assert.equal(records[0].outcome, 'completed');
  assert.equal(records[0].endTime, '2026-01-01T12:00:07.100Z');
});
test('unknown/lost tracking immediately interrupts at last confirmed sample', () => {
  for (const tracked of [true, false]) {
    const { engine: e, sample, records, open } = fixture();
    e.start(0);
    e.tick(10000);
    open();
    sample('Open_Palm', 10400);
    sample('None', 10500, 0, tracked);
    assert.equal(records[0].durationMs, 250);
    assert.equal(records[0].outcome, 'interrupted');
    assert.equal(e.hold, null);
  }
});
test('stalled inference cannot count unseen time', () => {
  const { engine: e, records, open } = fixture();
  e.start(0);
  e.tick(10000);
  open();
  e.tick(20000);
  assert.equal(records[0].durationMs, 0);
  assert.equal(e.tracking, 'lost');
});
test('confidence hysteresis retains palm at 0.6, rejects a new gesture at 0.6', () => {
  const { engine: e, sample, records, open } = fixture();
  e.entryThreshold = 0.7;
  e.start(0);
  e.tick(10000);
  open();
  sample('Open_Palm', 10300, 0.6);
  assert.ok(e.hold);
  sample('Closed_Fist', 10400, 0.6);
  assert.equal(records[0].outcome, 'interrupted');
});
test('more tolerant accepts a steady lower-confidence palm but never an unclassified or missing hand', () => {
  const { engine: e, sample, records } = fixture();
  e.entryThreshold = 0.55;
  e.start(0);
  e.tick(10000);
  sample('Open_Palm', 10000, 0.6);
  sample('Open_Palm', 10150, 0.6);
  assert.ok(e.hold);
  sample('Open_Palm', 10300, 0.45);
  assert.ok(e.hold);
  sample('None', 10400, 0.99);
  assert.equal(records[0].outcome, 'interrupted');
  sample('Open_Palm', 10500, 0.99, false);
  sample('Open_Palm', 10700, 0.99, false);
  assert.equal(e.hold, null);
});
test('pointing while active cannot start another countdown', () => {
  const { engine: e, sample } = fixture();
  e.start(0);
  e.tick(10000);
  for (let n = 10000; n <= 12000; n += 100) sample('Pointing_Up', n);
  assert.equal(e.phase, 'ACTIVE');
});
test('stopping a camera hold interrupts once', () => {
  const { engine: e, records, sample } = fixture();
  e.start(0);
  sample('Open_Palm', 10000);
  sample('Open_Palm', 10200);
  e.stop(10300);
  e.stop(10400);
  assert.equal(records.length, 1);
  assert.equal(records[0].detectionMethod, 'camera');
  assert.equal(records[0].outcome, 'interrupted');
  assert.equal(e.phase, 'WAITING');
});
