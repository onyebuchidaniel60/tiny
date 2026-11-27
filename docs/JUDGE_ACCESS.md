# Judge Access and Installation

**Status (27 November 2026):** Browser preview live; public judge APK published; App Distribution groups created but waiting for judge/tester emails.

## 1. Fastest: browser preview (no install)

Open <https://tiny-b9f29.web.app> in a current browser. No account creation, download or Google account is required.

- Synthetic email: `judge@tiny-demo.example`
- Synthetic password: `TinyDemo2026!`
- Or choose **Continue in offline demo** to use the bundled synthetic workspace without Firebase.

What judges can test:

- Teacher home, two classes, eight synthetic pupils and class rosters.
- Attendance drafts, full-roster submission, history and local pending state.
- Lessons, progress observations, approval and guardian links.
- Two-way synthetic messaging through the guardian SMS simulator.
- IndexedDB persistence across refresh, offline banner and PWA app-shell reload.
- Firebase sign-in, Firestore workspace bootstrap and Firebase AI Logic cloud fallback with the SDK-reported source.
- Responsive desktop/mobile layout, large-text toggle and reduced motion.

Limitations:

- Browser writes stay local; Cloud Functions are emulator-only under Spark/NGN 0. Cross-device sync is not claimed.
- The guardian view is a simulator, not a parent account or real SMS.
- On-device Gemini Nano was not verified; the verified hosted source is `Cloud Gemini`.
- App Check enforcement is off.
- Synthetic data only; do not enter real pupil or guardian information.
- The preview is hosted on Firebase Hosting, not Vercel.

Full architecture, security notes and manual test steps: [`WEB_APP.md`](WEB_APP.md).

## 2. Recommended Android install: public GitHub Release APK (zero cost)

The official hackathon rules require a test build that is free and available through the judging period. A public GitHub Release is the simplest zero-cost route and does not require a Google account.

- Release page: `https://github.com/onyebuchidaniel60/tiny/releases/tag/v0.1.0-preview.2`
- APK: `https://github.com/onyebuchidaniel60/tiny/releases/download/v0.1.0-preview.2/tiny-judge-preview.apk`
- Size: 31,536,119 bytes
- SHA-256: `8bfdbb3d9479b3b5fc0ef9e8ac5502f3d6211b598e5b36b9c4b8a4790d6d922f`
- Source: this public repository, Apache-2.0.

The release APK is a **debug-signed preview** built with a dedicated, registered App Check debug token. The token is intentionally embedded because Firebase AI Logic requires App Check and the hackathon rules accept debug tokens. It is limited to the non-production `tiny-b9f29` project and will be revoked after judging. Do not reuse it for production.

### Install

1. On an Android phone (Android 8.0 / API 26+), open the release page.
2. Download `tiny-judge-preview.apk`.
3. Allow installs from the browser or file manager when prompted.
4. Open **Tiny**.
5. Sign in with the synthetic test account:
   - Phone: `08000000001`
   - Code: `123456`
6. The app loads the synthetic sample workspace (displayed as `Kofar Primary`) with one class and one pupil.

No real pupil/guardian data is used. Do not enter real child, parent or guardian numbers.

### What judges can test

- Onboarding, local teacher flows and synthetic workspace.
- Language switching between English, Hausa, Yoruba and Igbo, with persistence across restart.
- First-use teacher tour, guardian SMS guide and Help centre.
- Test-phone sign-in and Firestore bootstrap.
- Firebase AI Logic cloud fallback with SDK-reported source.
- Mock SMS conversations (nothing is sent).
- Local attendance, lessons and progress.

### Limitations

- Cloud Functions are emulator-only under Spark/NGN 0; live callable sync is not available in the APK.
- SMS is mocked.
- On-device Gemini Nano is hardware-dependent and is not claimed on unsupported phones.
- Hausa, Yoruba and Igbo are complete draft translations pending native review; English remains the fallback.
- App Check enforcement and Play Integrity are not production-configured.
- The APK is not a Play Store release.
- Physical-device testing (including the Samsung Galaxy Note 10+ / Android 12) is an operator step; the published build is validated in the CI emulator, not claimed as physically tested.

## 3. Alternative: Firebase App Distribution (zero cost, access-controlled)

App Distribution is free on Spark and preferable when judge emails can be supplied privately.

Groups already created in `tiny-b9f29`:

- `internal-testers`
- `judges`

Add approved judge emails in **Firebase Console → App Distribution → Testers & Groups**, or with the CLI. Do not commit emails.

To upload the judge APK manually (operator-authenticated CLI):

```powershell
npx --yes firebase-tools@15.14.0 appdistribution:distribute `
  tiny-judge-preview.apk `
  --app 1:1072757481941:android:2005f8b35944923b20dd5c `
  --groups judges `
  --release-notes "Tiny synthetic judge preview. Test phone 08000000001 / 123456. No live SMS." `
  --project tiny-b9f29
```

Judges install the Firebase App Tester app, accept the invitation, and download the build. App Distribution invitations are tied to the approved tester accounts.

The CI `distribute` job remains a placeholder until Google Cloud/App Distribution credentials and tester emails are configured. Do not put tester emails in the repository.

## 4. Why not an unrestricted APK without a token?

The app's AI route uses Firebase AI Logic, which requires App Check. A public APK without a registered debug token can sign in and read Firestore only while App Check enforcement is off, but **AI Logic fails**. A release build with Play Integrity would need a Play Console app, release signing and registered fingerprints. The dedicated judge debug token is the only zero-cost route that lets judges test hybrid cloud fallback now, and the rules explicitly accept debug tokens.

## 5. Revocation

After the judging period (ends 16 December 2026):

1. Revoke the judge debug token in App Check → Apps → Manage debug tokens.
2. Delete the public release APK or mark it superseded.
3. Archive the App Distribution release.
4. Revoke the dedicated **web** debug token used by the browser preview.
5. Rebuild/redeploy the hosting site without the web token if it remains online.
6. Disable or delete the synthetic web demo account if it is no longer needed.

Do not revoke either token before judging ends; judges need the previews to remain functional. The browser token is embedded in the hosted client and is revocable but not confidential; never reuse it for production.
