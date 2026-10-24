# Hand space

A calm V1 hand-exercise timer. Vanilla HTML, CSS and ES modules, with all application files under `src/`. No runtime build step, account, database, backend or telemetry.

## Try it locally

Use Node.js 24:

```sh
npm ci
npm start
```

Open **http://localhost:5500**. The server serves `src/` only. Camera access requires HTTPS or localhost; a phone visiting an HTTP LAN address will generally not get camera access. Use the HTTPS Pages site for device testing.

In VS Code, use **Terminal → Run Task → Start local server**, matching the task in `gcse-maths`. It runs in a dedicated terminal; stop it with **Ctrl+C** or **Terminal → Terminate Task**.

1. Manual mode is selected initially. Press **Start** and take 10 seconds to get comfortable.
2. Press **Begin open hold**, hold comfortably, then **End hold**. Reaching the target shows quiet feedback; timing continues until you end it.
3. Open **Progress** for statistics, daily history, **Download CSV**, and **Share results**. The share action shares a file where supported and otherwise downloads CSV. Cancelling a share does nothing.
4. For recognition, press **Enable camera** and allow permission. This selects camera mode once the model is ready. Use one hand, well lit, fully in view. Hold `Pointing_Up` continuously for 750 ms for a 3-second countdown, or press **Start** for 10 seconds. Open your palm to begin; close your hand to end. Start gestures have no effect during active practice.
5. Choose a 3, 5 (default), or 10-second target before starting. **Stop / Reset** ends practice and marks any current hold interrupted. Rest freely between holds.

Manual controls measure user-entered timing and do not estimate hand position. Switch modes at any time; doing so ends the current session. Turning off the camera or opening Progress stops practice and releases the camera. Returning to practice requires enabling the camera again, or selecting manual mode.

## Timing and records

Recognition runs in VIDEO mode using Google's **Gesture Recognizer**, not the Hand Landmarker. It uses one hand, a 0.70 entry threshold, 0.55 retention threshold, and 150 ms stability for open/closed transitions. These conservative defaults may interrupt a partially open hand. Unknown or lost recognition ends a hold at the last confirmed sample; inference gaps over 500 ms also interrupt it. Backgrounding the page stops practice, interrupts any hold, and releases the camera. Countdown must be restarted after returning.

Holds use `performance.now()` rather than frame counts. Timing starts after the open gesture stabilizes. Closing is also debounced, so records have recognition/processing latency; they are not clinical measurements. A saved successful hold must end normally and reach its target; an interrupted hold never counts as successful, even if it passed the target. Statistics include all saved attempt durations, including interrupted and manual records. Daily history uses UTC dates. A session begins with a countdown and ends on Stop, mode change, hiding the tab, leaving practice or camera shutdown; one session may contain many holds. Starting then stopping without a hold still counts as a played session.

The versioned `hand-exercises-v1` localStorage record is `{ version: 1, sessions: [{ id, startedAt, attempts: [...] }] }`. Each attempt has ISO `startTime` / `endTime`, `durationMs`, `outcome` (`completed` / `interrupted`), `targetMs` and `detectionMethod` (`camera` / `manual`). Corrupt sessions/attempts are filtered. Storage denial or quota failure leaves results in memory with an export reminder. Clearing browser site data removes saved history. There is no cloud backup or sync.

CSV includes every attempt, session identifiers and ISO timestamps, millisecond durations, outcomes, targets and methods. Values are quoted, quotes escaped, rows separated with CRLF, and spreadsheet formula prefixes neutralized. No email is sent and no `mailto` attachments are claimed.

## GitHub Pages

1. Push this repository to GitHub, with the reviewed implementation on `main`.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. The **Deploy to GitHub Pages** workflow runs checks, uploads `src/`, then deploys on pushes to `main` or manual dispatch. PRs run checks only. Environment approval rules, if configured, still apply.
4. Open the URL reported by the successful workflow, normally `https://oliverius.github.io/hand-exercises-game/`.

All entrypoint, icon, manifest, module, WASM and model URLs are relative to the document/module, so project subpaths work. No site has been published by this implementation session. Protect `main` with the Checks job if reviews are required.

## iPad and Android

Designed for recent iPad Safari and Android Chrome, with large controls, safe-area padding, a side-by-side landscape preview/gauge, and a stacked portrait fallback. Portrait and the Help panel can scroll. On very short landscape screens, decorative copy is reduced to keep controls visible. Browser text enlargement or very small split-screen windows can still require scrolling.

Fullscreen uses the browser Fullscreen API where available; it can be absent or rejected on iPad Safari. In Safari, use **Share → Add to Home Screen**, then launch the icon for a standalone view. The manifest and icons are included; no service worker/offline installation guarantee is provided. File sharing and camera policies depend on the browser/OS. No real iPad or Android camera tests have been performed; see [device checklist](docs/manual-testing.md).

## Privacy and limitations

Camera pixels are processed locally by MediaPipe. No frames, photos, recordings or landmarks are saved or transmitted. Only session/attempt data is stored. The JS runtime, WASM and model are vendored and fetched from the same static site; there are no external runtime requests, analytics or remote fonts. Standard hosting access logs may record asset requests.

This is a simple practice aid, not a clinical measurement or treatment recommendation. The generic classifier may miss a partially extended hand or a hand with limited range of movement. Use manual mode when needed. The camera preview always shows the predicted gesture, confidence and anatomical left/right hand (with its confidence). Hand points confirm tracking; they do not mean a posture is recognised. When a predicted palm falls below the acceptance threshold, the status explains the required confidence. In **Help → Gesture recognition**, choose an entry threshold from 40% to 70% in 5-point steps (default 70%). The retention threshold is 15 points lower, with a minimum of 40%. Lower thresholds can help lower-confidence predictions but may accept more mistakes. Changing the setting stops practice, and the setting resets on reload. Unclassified or missing hands still interrupt holds. The optional debug panel includes raw predictions and tracking status. Camera pixels are unmirrored for inference; only the video and landmark overlay are mirrored together for display. MediaPipe Tasks' anatomical left/right labels are retained, not swapped because of CSS mirroring. Verify both hands on real devices using the checklist.

Future work: personal calibration and landmark-based openness, device performance tuning, and broader accessibility/device evaluation. CPU inference is throttled to about 12.5 samples/second and runs synchronously on the main thread; slower devices may pause the preview and interrupt timing. This V1 has no custom training, posture tracking, photographs or flower game.

## Development and provenance

```sh
npm run check
```

Node's test runner covers state transitions, debounce, confidence thresholds, fake monotonic timing, tracking interruptions, manual recording, storage corruption, CSV escaping and summary calculations. `--test-isolation=none` follows the reference and allows the runner in restricted Windows environments. ESLint and Prettier check application and tooling code; generated/vendor assets and `temp/` are excluded.

The actual palette and button conventions come from [oliverius/gcse-maths](https://github.com/oliverius/gcse-maths), inspected at commit `8957bc48662ed53e72205c53b86dc7a779d8ac3e`: `src/css/styles.css`, `src/js/presentation.js`, `server.js`, package/config files, tests, LICENSE and Pages workflow. Tokens include page `#faf9f5`, surface `#fffefa`, text `#302f2b`, muted `#68655e`, accent `#a64f38`, and selected `#f3e5dc`. The server, MIT license, Node test/lint/format conventions, large button/pressed/focus styles, fullscreen feedback and Pages action versions follow that repository. It had a Pages workflow but no separate PR-check workflow, so this project adds one.

MediaPipe setup follows the [official Gesture Recognizer Web guide](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js). See [asset provenance and reproduction](docs/assets.md). Application code is MIT licensed; vendored MediaPipe assets retain Apache-2.0 licensing.
