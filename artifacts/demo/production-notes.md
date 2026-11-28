# Tiny demo production notes

- Source: real Android emulator screenshots from the latest GitHub Actions manual smoke run plus real Playwright captures of the hosted-capable web build (`artifacts/demo/screens/`). Both use the synthetic Kofar Primary workspace in local/offline mode where applicable.
- Platform: Windows ffmpeg + Pillow + Windows SAPI (Microsoft Zira Desktop).
- TTS: local, free, offline fallback. No Google AI TTS credentials/paid service were used.
- Capture limitation: this is a reviewed screenshot slideshow with narration, not motion screen recording. It does not claim real parent SMS delivery or on-device Gemini Nano inference.
- Evidence: Android CI 41 JVM / 19 Functions / 9 rules / 11 backend E2E; web CI 29 Vitest / 40 Playwright passed (5 skipped); canonical dataset guard; signed/aligned APK. Verified AI source is `Cloud Gemini`; Gemini Nano is not claimed.
- Firebase limitation: Auth/Firestore and the app-level cloud AI fallback are verified separately against a non-production project with synthetic data. The SMS adapter remains mocked. App Check enforcement and Play Integrity are not claimed. Deployed callable sync is unavailable on Spark.
- Synthetic data only; no real pupil/guardian data.
- Rendered duration: 133.6s.
- Output: `artifacts/demo/tiny-demo.mp4`.
- Captions: `artifacts/demo/captions.srt`.
