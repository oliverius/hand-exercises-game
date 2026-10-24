# Device acceptance checklist

Automated browser checks are not proof of real camera accuracy or iPad/Android compatibility. Complete this checklist on recent iPad Safari and Android Chrome before a public demonstration.

- Open the HTTPS Pages project URL. Confirm icons, model and WASM load without a root-path 404. Initially no permission prompt should appear.
- Enable camera: allow permission; check model-loading and ready states. Reload and deny permission; confirm understandable feedback and working manual mode. Try a device without a camera or with it occupied elsewhere.
- Verify video and overlay align in portrait and landscape, including letterboxed preview. Hold up a known right hand and then a known left hand; debug must report anatomical handedness correctly. CSS mirrors the preview, not classifier labels. No data decisions depend on handedness.
- Point up briefly, release, then point up continuously for 750 ms. Only the continuous gesture should start the 3-second countdown. Press Start for a 10-second countdown instead. Pointing during ACTIVE must not restart it.
- Open a hand for longer than the selected target. Confirm calm target feedback and continued elapsed timing. Close it and confirm actual duration is saved. Rest, then try another hold in the same session.
- Remove the hand, cover the camera, use an unclassified gesture, and pause the camera stream. Each must interrupt the hold rather than add unseen time. Try a partially extended hand and use manual mode if recognition fails.
- While holding, switch apps / tabs and return. The camera should be off, current attempt interrupted, and a new Start required. Try camera disconnection, Stop / Reset, mode changes, and Progress during a hold.
- Check 3, 5 and 10-second targets. Confirm changing target is disabled during countdown/active practice.
- Record in manual mode without camera permission. Export CSV; inspect ISO times, milliseconds, method and interrupted outcomes. Reload and confirm progress persists. Try private browsing/storage denial; export in-memory results before leaving.
- Check a completed short hold, completed long hold and interrupted long hold: only the completed long hold counts as successful. Daily rows use UTC.
- Try Share with file sharing available, unavailable and cancelled. Unsupported sharing must download CSV; cancellation should not create a download. No email is automatically sent.
- Test keyboard operation, visible focus, screen-reader status announcements, browser zoom / enlarged text, safe areas and orientation changes. Landscape exercise controls must remain visible at ordinary text size; Help and portrait can scroll. Check that camera and gauge content is not merely clipped.
- Test Fullscreen, denial/rejection, and Safari Share → Add to Home Screen. Open the home-screen icon; do not assume iPad supports programmatic fullscreen or offline use.
- In browser network tools, verify all app requests stay on the site's origin and no pixels are transmitted. No audio should be requested or played.

Validation performed during implementation: Node unit tests; ESLint; Prettier; headless desktop Edge with a synthetic camera; real vendored CPU WASM/model initialization; manual timing through success, persistence across reload, progress and CSV download; project-subpath requests; landscape 1180×820, 1024×768 and 844×390 plus portrait 390×844. No physical hand accuracy, real mobile device, native file-share sheet or Home Screen installation has been tested.
