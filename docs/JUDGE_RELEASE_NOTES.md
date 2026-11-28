# Tiny judge preview

Tiny is an offline-first Android teacher tool for rural primary schools. Parents use ordinary SMS; pupils have no account or app. This is a **synthetic-data preview**, not a production release.

## Install

1. Download `tiny-judge-preview.apk` on an Android phone (Android 8.0 / API 26 or newer).
2. Allow installation from the browser or file manager when prompted (sideloading).
3. Open **Tiny**.
4. On the phone sign-in screen, use the synthetic Firebase test number:
   - Phone: `08000000001`
   - Code: `123456`
5. After sign-in, the app loads the synthetic sample workspace. The non-production Firestore preview currently contains a legacy synthetic workspace (one class, one pupil); the canonical Kofar Primary dataset (two classes, eight pupils) is also bundled locally and is used by the web offline demo and by emulator tests. See `docs/CROSS_PLATFORM_SYNC.md` for the exact limitation.

No real pupil or guardian data is used. Do not enter a real child, parent or guardian phone number.

## What works in this build

- Offline-first teacher flows, local attendance, lessons, progress and mock parent conversations.
- Pupil directory and evidence profile; class intelligence; assessments; follow-ups; AI evidence review and parent draft.
- Deterministic intelligence from recorded attendance, assessment and observation evidence, with traceable evidence IDs and confidence.
- Firebase Phone Auth with the synthetic test account.
- Firestore read/bootstrap of the synthetic workspace.
- Firebase AI Logic with mode selection, SDK-reported source, duration and honest deterministic fallback. On-device Gemini Nano is **not** claimed on unsupported phones.
- Complete interface localization in English, Hausa, Yoruba and Igbo. Hausa/Yoruba/Igbo are complete drafts pending native review; English remains the fallback.
- First-use teacher tour (10 steps), guardian SMS guide (4 steps), Help centre and Android 13+ per-app language support.
- Refreshed light-first dashboard, class/roster, attendance, lesson, progress, family-inbox, sync and settings surfaces; Lucide sprout brand mark and adaptive icon.
- A fifth **Pupils** tab plus Intelligence/Follow-up entry points from Home and Settings.
- The app uses a dedicated App Check debug token for this preview. Firebase AI Logic requires App Check; debug tokens are accepted by the hackathon rules.

## Known limitations

- Cloud Functions are emulator-only under Spark/NGN 0, so live callable sync is unavailable in this APK.
- SMS is mocked; no real message is sent.
- App Check enforcement and Play Integrity are not production-configured.
- The APK is a debug-signed preview, not a Play Store release.
- Native review of the Hausa, Yoruba and Igbo translations is still pending.
- Automated emulator evidence is in `artifacts/emulator/`; physical-device testing (including the Samsung Galaxy Note 10+ / Android 12) is an operator step and is not claimed here.
- On-device Gemini Nano is not supported on the Note 10+; the app reports the SDK source and uses the reviewed offline fallback when needed.
- The demo video is separate: `artifacts/demo/tiny-demo.mp4` in the repository.

## Security and cleanup

The App Check debug token is intentionally embedded in this public preview APK. It is dedicated to judging, limited to the non-production project, and will be revoked after the judging period. It is not a production secret. Do not reuse it for a production build.

Source, setup, architecture and test evidence are in the public repository.
