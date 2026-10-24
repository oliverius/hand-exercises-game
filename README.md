# Hand space

[![Open live demo](https://img.shields.io/badge/Open-Live_Demo-4f7c82?style=for-the-badge)](https://oliverius.github.io/hand-exercises-game/)

A calm hand-exercise timer, with optional camera recognition and manual controls.

## Why this exists

This was built to help my daughter that has cerebral palsy. Her right side is more affected and she struggles to keep her right hand fully open. With this I am aiming to track the improvement without being a chore to her. You can also save the results to csv (Excel) to see the progress.

## iPad and Android

Designed for recent iPad Safari and Android Chrome, with large controls, safe-area padding, a side-by-side landscape preview/gauge, and a stacked portrait fallback. Portrait and the Help panel can scroll. On very short landscape screens, decorative copy is reduced to keep controls visible. Browser text enlargement or very small split-screen windows can still require scrolling.

Fullscreen uses the browser Fullscreen API where available; it can be absent or rejected on iPad Safari. In Safari, use **Share → Add to Home Screen**, then launch the icon for a standalone view. The manifest and icons are included; no service worker/offline installation guarantee is provided. File sharing and camera policies depend on the browser/OS. No real iPad or Android camera tests have been performed; see [device checklist](docs/manual-testing.md).

## Privacy and comfort

Camera images stay on your device and are never saved. Practice history is stored only in your browser. Use manual mode if gesture recognition is unreliable, and move at a comfortable pace. This is a practice aid, not a clinical measurement.

## More information

See the [documentation](docs/README.md) for instructions, local setup, deployment, privacy details and testing.
