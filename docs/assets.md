# Pinned recognition assets

The repository includes the complete runtime and model, so camera use does not depend on a CDN. No hand images are sent to these upstream sources.

| Asset                                       | Pinned source                                                                                                             | SHA-256                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| MediaPipe npm archive                       | `https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-0.10.22-rc.20250304.tgz`                               | `22394f64b4ad92d1e97a586ea08002d73735a390b726af40beac9bb3b0cc6563` |
| Gesture Recognizer model, float16 version 1 | `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task` | `97952348cf6a6a4915c2ea1496b4b37ebabc50cbbf80571435643c455f2b0482` |

The npm package declares Apache-2.0, and MediaPipe is [Apache-2.0 licensed](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE). The standard license text is included at `src/vendor/mediapipe/LICENSE`; Google MediaPipe attribution is in the adjacent NOTICE. Model attribution is also included under `src/models/`. The [gesture classifier model card](https://storage.googleapis.com/mediapipe-assets/gesture_recognizer/model_card_hand_gesture_classification_with_faireness_2022.pdf) documents limitations and intended use.

To reproduce the vendored files from repository root (PowerShell, internet required):

```powershell
New-Item -ItemType Directory -Force temp/mediapipe, src/vendor/mediapipe, src/models | Out-Null
Invoke-WebRequest 'https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-0.10.22-rc.20250304.tgz' -OutFile temp/mediapipe.tgz
Get-FileHash temp/mediapipe.tgz -Algorithm SHA256
# Verify the archive hash above before extracting.
tar -xf temp/mediapipe.tgz -C temp/mediapipe
Copy-Item temp/mediapipe/package/vision_bundle.mjs src/vendor/mediapipe/
Copy-Item temp/mediapipe/package/vision_bundle.mjs.map src/vendor/mediapipe/vision_bundle_mjs.js.map
Copy-Item temp/mediapipe/package/package.json src/vendor/mediapipe/
Copy-Item -Recurse -Force temp/mediapipe/package/wasm src/vendor/mediapipe/
Invoke-WebRequest 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task' -OutFile src/models/gesture_recognizer.task
Get-FileHash src/models/gesture_recognizer.task -Algorithm SHA256
# Verify the model hash above. Keep the tracked LICENSE and NOTICE files.
```

Both SIMD and non-SIMD WASM variants are included for runtime feature detection. There is no need to install the MediaPipe npm package to run the app. The model and runtime occupy about 28 MB on disk. Icons are original vector artwork with native raster variants; no third-party icon pack is used.
