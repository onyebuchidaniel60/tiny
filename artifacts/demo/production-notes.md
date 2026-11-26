# Tiny demo production notes

- Source: actual Android emulator screenshots from the latest GitHub Actions manual smoke run (recorded in AI_HANDOFF.md).
- Platform: Windows ffmpeg + Pillow + Windows SAPI (Microsoft Zira Desktop).
- TTS: local, free, offline fallback. No Google AI TTS credentials/paid service were used.
- Capture limitation: this is a reviewed screenshot slideshow with narration, not motion screen recording. It does not claim real parent SMS delivery or on-device Gemini Nano inference.
- Build limitation: this render predates the Firebase-enabled APK. It demonstrates the local/offline product and mock SMS flows, not live Firebase Auth, authenticated Firestore sync, App Check enforcement or an app-level cloud AI response. A post-Auth refresh is pending.
- Synthetic data only; no real pupil/guardian data.
- Rendered duration: 149.5s.
- Output: `artifacts/demo/tiny-demo.mp4`.
- Captions: `artifacts/demo/captions.srt`.
