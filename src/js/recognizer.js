// Runtime, WASM and model are served locally; no camera data leaves the browser.
export async function createRecognizer() {
  const { FilesetResolver, GestureRecognizer } =
    await import('../vendor/mediapipe/vision_bundle.mjs');
  const files = await FilesetResolver.forVisionTasks(
    new URL('../vendor/mediapipe/wasm/', import.meta.url).href,
  );
  return GestureRecognizer.createFromOptions(files, {
    baseOptions: {
      modelAssetPath: new URL(
        '../models/gesture_recognizer.task',
        import.meta.url,
      ).href,
      delegate: 'CPU',
    },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.6,
  });
}
const edges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
];
export function draw(canvas, video, landmarks) {
  // Same intrinsic aspect ratio + object-fit:contain + CSS mirror on both layers.
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!landmarks) return;
  ctx.strokeStyle = '#f4d789';
  ctx.lineWidth = 3;
  for (const [a, b] of edges) {
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * canvas.width, landmarks[a].y * canvas.height);
    ctx.lineTo(landmarks[b].x * canvas.width, landmarks[b].y * canvas.height);
    ctx.stroke();
  }
  ctx.fillStyle = '#a64f38';
  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
