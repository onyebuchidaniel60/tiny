# Tiny — Developer Setup

**Status:** Phase 1 preview implemented and Firebase-integrated. Android shell, Room/SQLCipher foundation, Functions/rules backend, Auth/Firestore/AI verification, CI, public judge APK, landing page and browser companion preview exist.

## 0. Pinned Phase 1 stack

| Item | Verified value |
|---|---|
| Android Gradle Plugin | 8.13.2 |
| Gradle wrapper | 8.13 |
| Kotlin | 2.3.0 |
| Compose BOM | 2026.06.01 (newer 2026.09 requires compileSdk 37; AGP 8.13 supports 36.1) |
| compileSdk / targetSdk | 36 |
| minSdk | 26 |
| JDK | 17 |
| Room | 2.7.2 |
| SQLCipher for Android | 4.20.0 |
| Firebase Android BoM | 35.2.0 (dependencies present; client initialization deferred until project config) |
| Functions runtime | Node.js 22 / firebase-functions 6.5.0 / firebase-admin 13.4.0 |
| Browser preview | Vite 7.3.8, React 19.3.1, TypeScript 5.9.3, Firebase Web SDK 13.4.0, idb 8.0.4, vite-plugin-pwa 2.0.0 |
| Browser tests | Vitest 3.2.7, Testing Library, Playwright 1.65.1, axe-core/playwright 4.11.0 |
| CI runner | GitHub Actions `ubuntu-24.04` |

## 1. Prerequisites

- Git repository with operator-authorized branch and write access.
- GitHub Actions Ubuntu runners as the primary Android build/test environment; do not install the full Android Studio toolchain on the Windows operator machine. See `CI_ANDROID_BUILD.md`.
- JDK, Android SDK/build-tools and Gradle versions pinned to the Android Gradle Plugin selected during Phase 1; the GitHub Actions runner installs them.
- Kotlin/Gradle dependency lock and version catalog.
- Android physical device (API 26+) or emulator for routine app tests.
- Separate physically supported Android handset for genuine Firebase on-device AI proof; generic emulator-only evidence is insufficient.
- Node.js 22 and npm for Firebase Functions.
- Firebase CLI authenticated to the non-production project `tiny-b9f29`; Auth, Phone test numbers, Firestore and App Check debug flows are configured. A supported physical device is still needed for on-device Nano proof.
- Firebase Emulator Suite for Auth, Firestore and Functions integration tests.
- GitHub Actions or the approved CI environment.

## 2. First-time setup sequence

1. Complete root `OPERATOR_INTAKE.md` before code changes.
2. Confirm the operator-supplied reference URLs/images and record exact sources in `REFERENCE_ASSETS.md`.
3. Inspect the existing repository and preserve useful work; do not overwrite source, CI or migrations without review.
4. Install/inspect the selected Firebase Agent Skills for OpenCode and verify fresh-session discovery; this does not require a real Firebase project.
5. Set up the GitHub Actions Ubuntu build workflow and credential/configuration placeholders; no full Android Studio installation on Windows.
6. Set up Firebase Emulator Suite with a demo project for local/CI tests. Use the non-production `tiny-b9f29` project for client integration; do not use production credentials.
7. Firebase Authentication is initialized in the Console; Phone Auth is enabled with synthetic test numbers. Real verification SMS is Blaze-only and not authorized.
8. Firestore `(default)` is created in `africa-south1` with delete protection; deploy rules/indexes after changes. Do not change region without an architecture decision.
9. Configure the App Check debug provider for local debug builds; enforcement remains off until the release fingerprint/Play Integrity path is ready.
10. Firebase AI Logic with the Gemini Developer API free tier is enabled; verify quota and App Check proxy behavior before app-level claims.
11. Keep `SMS_MODE=mock`; configure eSMS sandbox secrets only after account access and sandbox authorization are confirmed.
12. At the start of Phase 6, attempt `npx skills add benjitaylor/skills --skill stageshow`; inspect and use relevant instructions.
13. For the browser companion, copy `web/.env.example` to the ignored `web/.env.local`, fill the public Firebase web config and the dedicated App Check debug token, then run the commands in section 4a. Never commit the local environment file.

## 3. Android build

The implementation agent creates/repairs a conventional native Android Gradle project with a version catalog and wrapper. Do not use dynamic dependency versions. The primary build/test path is GitHub Actions on Ubuntu; local Windows commands below are optional and require only the minimal tools, not full Android Studio.

Expected commands (adapt only to the actual wrapper and record selected versions):

```bash
./gradlew clean
./gradlew lint testDebugUnitTest
./gradlew assembleDebug
```

On Windows use the repository's `gradlew.bat` wrapper. Do not require global Gradle if the wrapper is available.

Install to a test device/emulator:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

The final README must document actual verified commands and tool versions, not merely copy these examples.

## 4. Functions build and test

From `functions/`:

```bash
npm ci
npm run lint
npm test
npm run build
```

Use Firebase Emulator Suite for callables, rules and webhook adapter tests. Never point emulator tests at production data or send real SMS.

## 4a. Browser companion

Requirements: Node.js 22, npm and a current Chromium-based browser for Playwright.

```powershell
cd web
npm ci
Copy-Item .env.example .env.local
# Fill the Firebase Web values and the dedicated App Check debug token.
npm run dev
```

Quality checks:

```powershell
npm run typecheck
npm test
npm run build
npx playwright install chromium
npx playwright test
```

The default Playwright journeys use the synthetic offline demo and do not require Firebase credentials. The optional live check uses the synthetic preview account and a small free-tier AI request:

```powershell
$env:TINY_LIVE_FIREBASE='1'; npx playwright test e2e/firebase-live.spec.ts --project=desktop-chromium
```

Deploy the zero-cost preview to the existing Firebase project:

```powershell
npm run build
cd ..
firebase deploy --only hosting --project tiny-b9f29
```

The app uses the existing Firebase Web app and Firestore workspace; do not create a new project. `web/.env.local` is ignored. The App Check debug token is a revocable preview credential and must not be committed. Full architecture, test evidence and limitations are in `docs/WEB_APP.md`.

## 5. Local secrets

- Do not add secrets to tracked files, source, `google-services.json`, build config or logs.
- Use ignored local `.env` files or Functions secret emulators for local tests; never commit `.env`.
- `.env.example` contains names and safe placeholders only; see `CREDENTIALS_AND_CONFIGURATION_REGISTER.md` for ownership and secure delivery.
- The browser uses `web/.env.example` and an ignored `web/.env.local`. The Firebase Web API key is public client configuration; the dedicated web App Check debug token is revocable and must be supplied through the local env or CI secret, never committed.
- Production secrets live in Google Secret Manager/Firebase Functions secrets; CI secrets live in GitHub Actions secrets.
- Rotate any credential accidentally exposed in logs, chat, Git or an artifact.

## 6. Test data

Use synthetic data only. Never import real school registers, pupil names, parent numbers or real reports into development or demo environments. Keep fixtures deterministic, clearly fake and versioned.

## 7. Definition of ready for implementation

Phase 1 may start only after critical intake items are confirmed. The agent may create a screen/route-complete Android shell and distribute a protected debug/staging APK, but must not enable real SMS or production AI services. If App Distribution access is unavailable, use an approved protected APK artifact and record the exact artifact URL/commit; do not claim a preview exists if it does not.
