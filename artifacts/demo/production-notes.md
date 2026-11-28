# Tiny demo production notes

- Source: real Android canonical local-demo emulator screenshots (run `46098222733`) plus real Playwright captures of the web build (`artifacts/demo/screens/`). Both use the synthetic Kofar Primary workspace.
- Platform: Windows ffmpeg + Pillow + Windows SAPI (Microsoft Zira Desktop).
- TTS: local, free, offline fallback. No Google AI TTS credentials/paid service were used.
- Capture limitation: this is a reviewed screenshot slideshow with narration, not motion screen recording. It does not claim real parent SMS delivery or on-device Gemini Nano inference.
- Evidence: Android CI 41 JVM / 19 Functions / 9 rules / 11 backend E2E; web CI 29 Vitest / 41 Playwright passed (7 skipped); canonical dataset guard; signed/aligned APK. Verified AI source is `Cloud Gemini`; Gemini Nano is not claimed.
- Firebase limitation: Auth/Firestore and the app-level cloud AI fallback are verified separately against a non-production project with synthetic data. The SMS adapter remains mocked. App Check enforcement and Play Integrity are not claimed. Deployed callable sync is unavailable on Spark.
- Synthetic data only; no real pupil/guardian data.
- Rendered duration: 133.6s.
- Output: `artifacts/demo/tiny-demo.mp4` (4,742,428 bytes; SHA-256 `74D1FE1538B51278F99170487D240DE407DE884149BD3F53C575BDD941F3A31A`).
- Captions: `artifacts/demo/captions.srt`.
