# Tiny — Developer Setup

**Status:** Guide for the implementation phase. No application code has been generated yet.

## 1. Prerequisites

- Git repository with operator-authorized branch and write access.
- Android Studio and Android SDK matching the Android Gradle Plugin versions selected and pinned during Phase 0/1.
- JDK required by the pinned AGP; use the Gradle wrapper toolchain.
- Kotlin/Gradle dependency lock and version catalog.
- Android physical device (API 26+) or emulator for routine app tests.
- Separate physically supported Android handset for genuine Firebase on-device AI proof; generic emulator-only evidence is insufficient.
- Node.js 22 and npm for Firebase Functions.
- Firebase CLI authenticated to the non-production project with least privilege.
- Firebase Emulator Suite for Auth, Firestore and Functions integration tests.
- GitHub Actions or the approved CI environment.

## 2. First-time setup sequence

1. Complete root `OPERATOR_INTAKE.md` before code changes.
2. Confirm reference image files and record exact paths in `REFERENCE_ASSETS.md`.
3. Inspect the existing repository and preserve useful work; do not overwrite source, CI or migrations without review.
4. Create/select a development or staging Firebase project. Do not use production credentials for local development.
5. Enable Phone Authentication and configure Nigeria (+234) region policy/test numbers.
6. Create Firestore Standard in `africa-south1` only after billing/region approval.
7. Configure App Check debug provider for local emulator only.
8. Enable Firebase AI Logic in the development project and validate quotas.
9. Configure eSMS sandbox secrets only after account access and sandbox authorization are confirmed.
10. At the start of Phase 6, attempt `npx skills add benjitaylor/skills --skill stageshow`; inspect and use relevant instructions.

## 3. Android build

The implementation agent creates/repairs a conventional native Android Gradle project with a version catalog and wrapper. Do not use dynamic dependency versions.

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

## 5. Local secrets

- Do not add secrets to tracked `.env`, source files, `google-services.json` or build config.
- Use ignored local environment files or Functions secret emulators for local tests.
- Include `.env.example` with names and safe placeholders only.
- Production secrets live in Google Secret Manager/Firebase Functions secrets.
- Rotate any credential accidentally exposed in logs, chat, Git or an artifact.

## 6. Test data

Use synthetic data only. Never import real school registers, pupil names, parent numbers or real reports into development or demo environments. Keep fixtures deterministic, clearly fake and versioned.

## 7. Definition of ready for implementation

Phase 1 may start only after critical intake items are confirmed. The agent may create a screen/route-complete Android shell and distribute a protected debug/staging APK, but must not enable real SMS or production AI services. If App Distribution access is unavailable, use an approved protected APK artifact and record the exact artifact URL/commit; do not claim a preview exists if it does not.
