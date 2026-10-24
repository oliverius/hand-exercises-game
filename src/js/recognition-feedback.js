const names = {
  Open_Palm: 'Open palm',
  Closed_Fist: 'Closed fist',
  Pointing_Up: 'Pointing up',
  Thumb_Up: 'Thumb up',
  Thumb_Down: 'Thumb down',
  Victory: 'Victory',
  ILoveYou: 'I love you',
};
const usable = new Set(['Open_Palm', 'Closed_Fist', 'Pointing_Up']);
export function recognitionFeedback(result, threshold) {
  const tracked = Boolean(result.landmarks?.[0]?.length);
  const gesture = result.gestures?.[0]?.[0];
  const hand = result.handedness?.[0]?.[0];
  if (!tracked)
    return {
      gesture: 'No hand detected',
      hand: 'Hand: —',
      explanation: 'Move one hand into view.',
    };
  const score = Number.isFinite(gesture?.score) ? gesture.score : 0;
  const name = names[gesture?.categoryName];
  const label =
    name ??
    (gesture?.categoryName && gesture.categoryName !== 'None'
      ? gesture.categoryName.replaceAll('_', ' ')
      : 'Unclassified posture');
  const handLabel = ['Left', 'Right'].includes(hand?.categoryName)
    ? `${hand.categoryName} hand${Number.isFinite(hand.score) ? ` · ${Math.round(hand.score * 100)}%` : ''}`
    : 'Hand side uncertain';
  let explanation =
    'Hand tracked; posture is unclassified. Try facing your palm toward the camera, or use manual mode.';
  if (usable.has(gesture?.categoryName)) {
    explanation =
      score >= threshold
        ? 'Gesture accepted. Hold it steadily.'
        : `Hand tracked; ${label.toLowerCase()} confidence is ${Math.round(score * 100)}% (needs ${Math.round(threshold * 100)}%). Try a lower confidence threshold in Help.`;
  } else if (name)
    explanation = `${label} is recognised. Use an open palm, closed fist or pointing up for this exercise.`;
  return {
    gesture: `${label} · ${Math.round(score * 100)}%`,
    hand: handLabel,
    explanation,
  };
}
