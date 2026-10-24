import test from 'node:test';
import assert from 'node:assert/strict';
import { recognitionFeedback } from '../src/js/recognition-feedback.js';
const result = (gesture = 'Open_Palm', score = 0.62, hand = 'Right') => ({
  landmarks: [[{ x: 0.5, y: 0.5 }]],
  gestures: [[{ categoryName: gesture, score }]],
  handedness: [[{ categoryName: hand, score: 0.98 }]],
});
test('visible readout distinguishes a tracked palm from an accepted posture', () => {
  const feedback = recognitionFeedback(result(), 0.7);
  assert.equal(feedback.gesture, 'Open palm · 62%');
  assert.equal(feedback.hand, 'Right hand · 98%');
  assert.match(feedback.explanation, /needs 70%/);
  assert.match(recognitionFeedback(result(), 0.55).explanation, /accepted/);
});
test('anatomical left/right labels are retained for the mirrored display', () => {
  assert.equal(
    recognitionFeedback(result('Closed_Fist', 0.9, 'Left'), 0.7).hand,
    'Left hand · 98%',
  );
});
test('points alone never imply an open palm, and unsupported gestures explain what to use', () => {
  assert.match(
    recognitionFeedback(result('None', 0.8), 0.7).gesture,
    /Unclassified/,
  );
  assert.match(
    recognitionFeedback(result('Thumb_Up', 0.8), 0.7).explanation,
    /Use an open palm/,
  );
  assert.equal(
    recognitionFeedback({ ...result(), landmarks: [] }, 0.7).gesture,
    'No hand detected',
  );
  assert.equal(
    recognitionFeedback({ landmarks: [[{}]] }, 0.7).hand,
    'Hand side uncertain',
  );
});
