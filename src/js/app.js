import { Exercise } from './engine.js';
import { load, persist } from './storage.js';
import { summary } from './stats.js';
import { csv, download, share } from './export.js';
import { openCamera, closeCamera } from './camera.js';
import { createRecognizer, draw } from './recognizer.js';
import { recognitionFeedback } from './recognition-feedback.js';

const $ = (id) => document.getElementById(id);
let storage;
try {
  storage = window.localStorage;
} catch {
  /* In-memory fallback below. */
}
const data = load(storage);
let session = null;
let recognizer = null;
let cameraReady = false;
let cameraPending = false;
let cameraGeneration = 0;
let lastVideoTime = -1;
let lastInference = 0;
let lastStatus = '';
let reached = false;
let prediction = null;
const notice = (text) => {
  $('notice').textContent = text;
};
const cameraStatus = (text) => {
  if ($('camera-state').textContent !== text)
    $('camera-state').textContent = text;
};
const engine = new Exercise({
  save: (attempt) => {
    if (!session) return;
    session.attempts.push(attempt);
    const saved = persist(storage, data);
    notice(
      `${attempt.outcome === 'completed' ? 'Hold saved' : 'Interrupted hold saved'}: ${(attempt.durationMs / 1000).toFixed(1)} seconds.${saved ? '' : ' Storage unavailable: export before leaving this page.'}`,
    );
  },
});

function ensureSession() {
  if (session) return;
  session = {
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
    startedAt: new Date().toISOString(),
    attempts: [],
  };
  data.sessions.push(session);
  if (!persist(storage, data))
    notice(
      'Storage unavailable. Results stay in memory; export before leaving.',
    );
}
function stop() {
  engine.stop(performance.now());
  session = null;
  reached = false;
}
function start() {
  if (!cameraReady) {
    notice('Enable the camera to begin.');
    return;
  }
  ensureSession();
  engine.start(performance.now());
}
$('start').onclick = start;
$('stop').onclick = stop;
$('target').onchange = () => {
  engine.targetMs = Number($('target').value);
};
$('animation').onchange = () => {
  const choice = $('animation').value;
  const imageMode = choice !== 'gauge';
  $('gauge').classList.toggle('image-reveal', imageMode);
  $('preview-image').hidden = !imageMode;
  $('reveal-image').hidden = !imageMode;
  if (imageMode) {
    $('preview-image').src = `./img/${choice}.png`;
    $('reveal-image').src = `./img/${choice}.png`;
  }
};
$('sensitivity').onchange = () => {
  stop();
  engine.entryThreshold = Number($('sensitivity').value);
  notice('Recognition setting changed. Press Start when you are ready.');
};

function shutdownCamera() {
  cameraGeneration++;
  cameraReady = false;
  closeCamera($('video'));
  $('placeholder').hidden = false;
  $('camera').textContent = 'Enable camera';
  cameraStatus('Camera is off');
  $('preview-label').textContent = 'CAMERA OFF';
  draw($('landmarks'), $('video'));
  lastVideoTime = -1;
  prediction = null;
  $('recognised-gesture').textContent = 'Gesture: Camera off';
  $('recognised-hand').textContent = 'Hand: —';
  $('debug').textContent = 'Camera off. No current prediction.';
}
$('camera').onclick = async () => {
  if (cameraPending) return;
  if (cameraReady) {
    stop();
    shutdownCamera();
    return;
  }
  cameraPending = true;
  $('camera').disabled = true;
  const generation = ++cameraGeneration;
  try {
    cameraStatus('Waiting for camera permission…');
    await openCamera($('video'));
    if (generation !== cameraGeneration || document.hidden) {
      closeCamera($('video'));
      return;
    }
    $('placeholder').hidden = true;
    cameraStatus('Loading gesture model…');
    recognizer ??= await createRecognizer();
    if (generation !== cameraGeneration || document.hidden) {
      closeCamera($('video'));
      return;
    }
    cameraReady = true;
    lastInference = 0;
    cameraStatus('Checking for a hand…');
    $('camera').textContent = 'Turn camera off';
    stop();
    $('preview-label').textContent = 'MIRRORED · LOCAL CAMERA';
    notice('Point up for ¾ second, or press Start. Use one hand.');
    $('video')
      .srcObject.getVideoTracks()[0]
      .addEventListener(
        'ended',
        () => {
          if (!cameraReady) return;
          stop();
          shutdownCamera();
          notice('Camera disconnected. Reconnect it to continue.');
        },
        { once: true },
      );
  } catch (error) {
    shutdownCamera();
    const message =
      error.message.includes('Camera') || error.message.includes('camera')
        ? error.message
        : 'Gesture model could not load. Retry Enable camera.';
    cameraStatus(message);
    notice(message);
  } finally {
    cameraPending = false;
    $('camera').disabled = false;
  }
};

function frame(now) {
  engine.tick(now);
  if (
    cameraReady &&
    !document.hidden &&
    !$('exercise').hidden &&
    now - lastInference >= 80 &&
    $('video').readyState >= 2 &&
    $('video').currentTime !== lastVideoTime
  ) {
    lastInference = now;
    lastVideoTime = $('video').currentTime;
    try {
      const result = recognizer.recognizeForVideo($('video'), now);
      cameraStatus(
        result.landmarks.length > 0 ? 'Hand detected' : 'No hand detected',
      );
      const gesture = result.gestures[0]?.[0];
      const hand = result.handedness[0]?.[0];
      prediction = recognitionFeedback(
        result,
        engine.thresholdFor(gesture?.categoryName),
      );
      $('recognised-gesture').textContent = `Gesture: ${prediction.gesture}`;
      $('recognised-hand').textContent = prediction.hand;
      draw($('landmarks'), $('video'), result.landmarks[0]);
      if (engine.method === 'camera') {
        const previous = engine.phase;
        engine.sample(
          gesture?.categoryName ?? 'None',
          gesture?.score ?? 0,
          now,
          Boolean(result.landmarks.length),
        );
        if (previous === 'WAITING' && engine.phase === 'COUNTDOWN')
          ensureSession();
      }
      // Input pixels are unmirrored. MediaPipe Tasks handedness stays anatomical;
      // mirroring the display changes positions, never the classification label.
      $('debug').textContent =
        `Gesture: ${gesture?.categoryName ?? 'None'} · confidence: ${((gesture?.score ?? 0) * 100).toFixed(0)}% · handedness: ${hand?.categoryName ?? '—'} (${((hand?.score ?? 0) * 100).toFixed(0)}%) · tracking: ${engine.tracking}`;
    } catch {
      stop();
      shutdownCamera();
      notice(
        'Recognition stopped unexpectedly. Enable the camera to try again.',
      );
    }
  }
  if (cameraReady && lastInference > 0 && now - lastInference > 500) {
    prediction = null;
    cameraStatus('Camera frames paused');
    $('recognised-gesture').textContent = 'Gesture: Waiting for camera frames';
    $('recognised-hand').textContent = 'Hand: —';
    $('debug').textContent = 'Camera frames paused. No current prediction.';
  }
  render(now);
  requestAnimationFrame(frame);
}
function render(now) {
  const elapsed = engine.elapsed(now);
  const target = engine.targetMs / 1000;
  const elapsedText = (elapsed / 1000).toFixed(1);
  if ($('elapsed').firstChild.nodeValue !== elapsedText)
    $('elapsed').firstChild.nodeValue = elapsedText;
  $('target-copy').textContent = `of ${target} seconds`;
  $('fill').style.height =
    `${Math.min(100, (elapsed / engine.targetMs) * 100)}%`;
  $('reveal-image').style.clipPath =
    `inset(${100 - Math.min(100, (elapsed / engine.targetMs) * 100)}% 0 0)`;
  $('gauge').setAttribute('aria-valuemax', String(target));
  $('gauge').setAttribute(
    'aria-valuenow',
    String(Math.min(target, elapsed / 1000).toFixed(1)),
  );
  $('gauge').setAttribute(
    'aria-valuetext',
    `${(elapsed / 1000).toFixed(1)} of ${target} seconds`,
  );
  $('achievement').textContent =
    elapsed >= engine.targetMs
      ? 'Target reached · take your time'
      : 'A little at a time';
  $('countdown').hidden = engine.phase !== 'COUNTDOWN';
  const countdown = String(
    Math.max(1, Math.ceil((engine.deadline - now) / 1000)),
  );
  if ($('countdown').textContent !== countdown && engine.phase === 'COUNTDOWN')
    $('countdown').textContent = countdown;
  $('start').disabled = engine.phase !== 'WAITING' || !cameraReady;
  $('target').disabled = engine.phase !== 'WAITING';
  let status = 'Ready when you are.';
  let instruction =
    'Start, then open your hand comfortably. Close it to finish the hold.';
  if (engine.phase === 'COUNTDOWN') {
    status = 'Take a moment to get comfortable.';
    instruction = 'Your practice will begin after the countdown.';
  }
  if (engine.phase === 'ACTIVE') {
    status = engine.hold
      ? 'Hold comfortably.'
      : 'Open your hand when you’re ready.';
    instruction =
      'Keep one hand in view. Close your hand to save the actual duration.';
    if (
      ['lost', 'unknown'].includes(engine.tracking) &&
      engine.method === 'camera'
    ) {
      status =
        engine.tracking === 'lost'
          ? 'Waiting for your hand.'
          : 'Hand tracked; posture uncertain.';
      instruction =
        prediction?.explanation ??
        'No unseen time is counted. Reposition your hand in the camera view.';
    }
    if (elapsed >= engine.targetMs) {
      status = 'Target reached. Nicely done.';
      reached = true;
    }
    if (!engine.hold && reached) {
      status = 'Hold recorded. Rest as long as you like.';
      reached = false;
    }
  }
  if (status !== lastStatus) {
    $('status').textContent = status;
    lastStatus = status;
  }
  if ($('instruction').textContent !== instruction)
    $('instruction').textContent = instruction;
}

function progress() {
  stop();
  shutdownCamera();
  $('exercise').hidden = true;
  $('progress-screen').hidden = false;
  $('progress').textContent = 'Back to practice';
  const s = summary(data.sessions);
  const items = [
    ['Sessions played', s.sessions],
    ['Attempts', s.attempts],
    ['Successful holds', s.successful],
    ['Success rate', `${Math.round(s.rate * 100)}%`],
    ['Average duration', `${(s.average / 1000).toFixed(1)}s`],
    ['Best duration', `${(s.best / 1000).toFixed(1)}s`],
  ];
  $('stats').replaceChildren(
    ...items.map(([label, value]) => {
      const div = document.createElement('div');
      div.className = 'stat';
      div.append(
        Object.assign(document.createElement('span'), { textContent: label }),
        Object.assign(document.createElement('strong'), { textContent: value }),
      );
      return div;
    }),
  );
  $('history').replaceChildren(
    ...s.daily.map((row) => {
      const tr = document.createElement('tr');
      for (const value of [
        row.day,
        row.attempts,
        row.successful,
        `${(row.best / 1000).toFixed(1)}s`,
      ])
        tr.append(
          Object.assign(document.createElement('td'), { textContent: value }),
        );
      return tr;
    }),
  );
  $('empty').hidden = s.attempts > 0;
  $('progress-title').focus();
}
$('progress').onclick = () => {
  if ($('progress-screen').hidden) {
    progress();
    return;
  }
  $('progress-screen').hidden = true;
  $('exercise').hidden = false;
  $('progress').textContent = 'Progress';
  $('progress').focus();
};
const exportFile = () =>
  new File([csv(data.sessions)], 'hand-space-results.csv', {
    type: 'text/csv;charset=utf-8',
  });
$('download').onclick = () => {
  download(exportFile());
  $('export-status').textContent = 'CSV downloaded';
};
$('share').onclick = async () => {
  $('export-status').textContent = await share(exportFile());
};
$('fullscreen').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen)
      await document.documentElement.requestFullscreen();
    else
      notice(
        'Fullscreen is unavailable here. On iPad, use Safari Share → Add to Home Screen, then open from the Home Screen.',
      );
  } catch {
    notice(
      'Fullscreen is unavailable here. On iPad, try Add to Home Screen from Safari’s Share menu.',
    );
  }
};
document.addEventListener('fullscreenchange', () => {
  const active = Boolean(document.fullscreenElement);
  $('fullscreen').textContent = active ? 'Exit fullscreen' : 'Fullscreen';
  $('fullscreen').setAttribute('aria-pressed', String(active));
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stop();
    shutdownCamera();
    notice(
      'Practice paused because the page was hidden. Enable camera if needed, then press Start to begin again.',
    );
  }
});
window.addEventListener('pagehide', () => {
  stop();
  shutdownCamera();
});
if (!storage)
  notice(
    'Browser storage is unavailable. You can practice and export results before leaving.',
  );
requestAnimationFrame(frame);
