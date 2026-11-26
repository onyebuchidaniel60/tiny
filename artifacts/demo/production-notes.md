# Tiny demo production notes

- Source: actual Android emulator screenshots from the latest GitHub Actions manual smoke run (recorded in AI_HANDOFF.md).
- Platform: Windows ffmpeg + Pillow + Windows SAPI (Microsoft Zira Desktop).
- TTS: local, free, offline fallback. No Google AI TTS credentials/paid service were used.
- Capture limitation: this is a reviewed screenshot slideshow with narration, not motion screen recording. It does not claim real parent SMS delivery or on-device Gemini Nano inference.
- Firebase limitation: Auth/Firestore and the app-level cloud AI fallback are verified separately against a non-production project with synthetic data. The SMS adapter remains mocked. App Check enforcement and Play Integrity are not claimed.
- Synthetic data only; no real pupil/guardian data.
- Rendered duration: 146.0s.
- Output: `artifacts/demo/tiny-demo.mp4`.
- Captions: `artifacts/demo/captions.srt`.
