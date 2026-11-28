# Tiny — GitHub Actions Android Build and Distribution

**Status:** Implemented in `.github/workflows/android-ci.yml`; first remote run pending. Local portable-JDK/SDK verification succeeded on 26 November 2026.

**Decision:** GitHub Actions Ubuntu runners are the preferred Android build/test environment. Do **not** install the full Android Studio toolchain on the operator’s Windows machine. Local Windows only needs Git, Node.js/npm, and optionally `adb` platform-tools for device installation.

**Cost boundary:** GitHub Actions standard runners are free for public repositories within GitHub’s published limits. Firebase App Distribution is the preferred preview route. No Firebase Functions deployment, Blaze billing, Cloud Scheduler deployment, paid runner or paid third-party service is authorized. See `OPERATOR_INTAKE.md` for the NGN 0 budget.

## 1. Required repository configuration

| Setting | Required value | Why |
|---|---|---|
| Actions | Enabled | Build/test workflow |
| Workflow permissions | Read repository contents; do not grant write by default | Build only needs checkout and artifact upload |
| `distribution` environment | Protected; required reviewers | Manual approval before judge-facing App Distribution upload |
| Branch | `main` | Authorized implementation branch |
| Repository visibility | Public, unchanged | Operator instruction; no secrets or real data may be committed |
| Fork PR policy | Do not run secret-bearing distribution jobs on fork PRs | Prevent secret exposure |

Workflow-level permissions should normally be:

```yaml
permissions:
  contents: read
```

Use `id-token: write` only in the App Distribution job when using Google Cloud Workload Identity Federation. `actions/upload-artifact` does not require repository write permission.

## 2. Planned build workflow

The exact JDK, Android SDK, Gradle, Compose, Firebase and Node versions must be selected and pinned during Phase 1 after compatibility checks. The workflow should use pinned action major versions and the repository Gradle wrapper.

```yaml
name: android-ci

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: android-ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17' # pin to the selected AGP requirement

      - name: Install Android SDK packages
        run: |
          SDKMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"
          if [ ! -x "$SDKMANAGER" ]; then
            SDKMANAGER="$(find "$ANDROID_HOME/cmdline-tools" -name sdkmanager -type f | head -n 1)"
          fi
          yes | "$SDKMANAGER" --licenses > /dev/null || true
          "$SDKMANAGER" "platform-tools" "platforms;android-36" "build-tools;36.0.0"

      - uses: gradle/actions/setup-gradle@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22' # Functions runtime

      - name: Functions install/test (when functions/ exists)
        run: |
          if [ -f functions/package.json ]; then
            cd functions
            npm ci
            npm run lint --if-present
            npm test --if-present
            npm run build --if-present
          fi

      - name: Android lint and unit tests
        run: ./gradlew lint testDebugUnitTest --stacktrace

      - name: Build debug APK
        run: ./gradlew assembleDebug --stacktrace

      - name: Upload debug APK
        uses: actions/upload-artifact@v4
        with:
          name: tiny-debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk
          retention-days: 14

      - name: Upload test reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: tiny-test-reports
          path: app/build/reports/**
          if-no-files-found: warn
          retention-days: 14
```

### Firebase client configuration

`google-services.json` is public Android client configuration, not a server credential, but it is ignored by Git in this repository. In CI, materialize it from a GitHub secret without printing it:

```yaml
      - name: Materialize Firebase client configuration
        env:
          GOOGLE_SERVICES_JSON_BASE64: ${{ secrets.GOOGLE_SERVICES_JSON_BASE64 }}
        run: |
          if [ -n "$GOOGLE_SERVICES_JSON_BASE64" ]; then
            printf '%s' "$GOOGLE_SERVICES_JSON_BASE64" | base64 --decode > app/google-services.json
          fi
```

Do not echo or archive the decoded file.

### Debug signing, APK verification and install reliability

GitHub-hosted runners start without a persistent Android debug keystore. Gradle therefore generates a new debug key on every run. Two CI APKs with the same package name can then fail to upgrade each other:

```text
INSTALL_FAILED_UPDATE_INCOMPATIBLE: Package ... signatures do not match previously installed version
```

The install may appear slow before that failure because Android copies and verifies the ~31 MB APK first. This is a signing-identity mismatch, not a corrupt download.

The workflow now verifies every build:

```bash
BUILD_TOOLS="$ANDROID_HOME/build-tools/36.0.0"
"$BUILD_TOOLS/zipalign" -c -v 4 app/build/outputs/apk/dev/debug/*.apk
"$BUILD_TOOLS/apksigner" verify --verbose --print-certs app/build/outputs/apk/dev/debug/*.apk
sha256sum app/build/outputs/apk/dev/debug/*.apk
```

The outputs are uploaded as `artifacts/apk-signing.txt`, `artifacts/zipalign.txt` and `artifacts/apk-summary.txt`.

For repeatable upgrades, provision a stable debug keystore (never commit it):

| Secret | Meaning |
|---|---|
| `TINY_DEBUG_KEYSTORE_BASE64` | Base64 of a PKCS#12/JKS debug keystore |
| `TINY_DEBUG_KEYSTORE_PASSWORD` | Store password |
| `TINY_DEBUG_KEY_ALIAS` | Key alias (default `androiddebugkey`) |
| `TINY_DEBUG_KEY_PASSWORD` | Key password |

`app/build.gradle.kts` uses that keystore only when `TINY_DEBUG_KEYSTORE_PATH` points to a materialized file. Without the secrets, the normal Android debug key is used and a fresh install is required between different CI runs.

For a physical phone:

```bash
adb uninstall ng.tiny.education.dev.debug   # only when signatures differ
adb install -r tiny-dev-debug.apk
```

If install still stalls, check USB authorization, free storage, and whether a device-owner/MDM policy blocks debug packages. Do not disable signature verification or use `adb install --bypass-low-target-sdk-block`.

## 3. Firebase App Distribution job

This job is manual and judge-facing. It should run only after the build job passes and the protected `distribution` environment is approved.

```yaml
  distribute:
    needs: build
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-24.04
    environment: distribution
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/download-artifact@v4
        with:
          name: tiny-debug-apk
          path: artifacts

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ vars.GCP_SERVICE_ACCOUNT_EMAIL }}

      - name: Distribute to approved tester groups
        run: |
          npx --yes firebase-tools@PINNED_VERSION appdistribution:distribute \
            artifacts/app-debug.apk \
            --app "${{ vars.FIREBASE_ANDROID_APP_ID }}" \
            --groups "${{ vars.FIREBASE_APP_DISTRIBUTION_GROUPS }}" \
            --release-notes "Tiny build ${{ github.run_number }} (${GITHUB_SHA::7})"
```

`PINNED_VERSION` must be replaced with a tested exact `firebase-tools` version. Do not use `@latest`.

### Authentication options

Preferred: **Google Cloud Workload Identity Federation**.

- Create a Workload Identity Pool/provider for GitHub.
- Grant the selected service account `roles/iam.workloadIdentityUser`.
- Grant the service account the Firebase App Distribution Admin role for the non-production project.
- Store the provider path and service-account email as GitHub Actions **variables** (public identifiers).
- `id-token: write` is required for OIDC.

Fallback only if Workload Identity Federation is unavailable: create a service-account key and store the JSON only in a GitHub Actions **secret** (`FIREBASE_SERVICE_ACCOUNT_JSON` or path). Never commit or echo it. Rotate on exposure.

Legacy `FIREBASE_TOKEN` should be avoided; if used, store it only as a GitHub Actions secret.

## 3.1 Manual emulator smoke job

`.github/workflows/android-ci.yml` includes a manual `emulator-smoke` job. It downloads the CI APK, boots an API 35 Google APIs x86_64 emulator, runs `tools/android-emulator-smoke.sh`, and handles launcher ANRs. A Firebase-enabled build captures the auth gate, signs in with the synthetic test phone number, waits for the Firestore bootstrap, and captures `tiny-04-authenticated.png`; it does not pretend the local journey ran. A non-Firebase build continues through home, classes, class detail, pupil profile, class intelligence, attendance, pupils, follow-ups, lessons, messages, conversation and settings. The job uploads `tiny-emulator-evidence` with redacted logcat. This is emulator evidence only; it does not prove Gemini Nano on a physical device.

`.github/workflows/android-local-demo-smoke.yml` is a separate manual workflow that builds **without** `google-services.json`, so the app uses the canonical local Room seed (2 classes / 8 pupils) instead of the legacy read-only Firestore preview. Run `46095208807` captured the canonical screens into `artifacts/emulator/`.

A separate manual workflow, `.github/workflows/firebase-ai-smoke.yml`, materializes the Firebase config and a registered App Check debug token from GitHub secrets, builds an ephemeral APK, and runs only `AiLogicLiveTest`. It does not upload the APK. Run `45950443728` passed with on-device fallback and SDK source `Cloud Gemini`; the reports contain no token. A companion `.github/workflows/firebase-ai-ui-smoke.yml` installs the public judge APK and captures the actual cloud result/source in `artifacts/emulator/tiny-ai-cloud.png` (run `45950452014`).

`.github/workflows/firebase-sync-smoke.yml` starts local Auth/Firestore/Functions emulators and runs `SyncEmulatorE2ETest` on an Android emulator. Run `45950447844` passed success, idempotency, retry and conflict cases. It uses a separate emulator-only FirebaseApp and never contacts the real project.

`.github/workflows/judge-release.yml` builds a public judge APK with a dedicated judge debug token and publishes a prerelease. The token is intentionally public in that test APK and must be revoked after judging; the private CI token is not used.

The normal Compose instrumentation job also sees `AiLogicLiveTest`; it skips via a JUnit assumption when `google-services.json` is absent, so the local journey remains green. The private AI job supplies the config and runs the test for real.

The first manual run succeeded and produced:
- Language screen: `artifacts/emulator/tiny-01-language.png`
- Welcome: `tiny-02-welcome.png`
- Home: `tiny-03-home.png`
- Classes/attendance/lessons/messages/settings: captured with the current shell
- Logcat: `artifacts/emulator/logcat.txt`

## 3.2 Backend emulator tests

The `Firestore rules (emulator)` job installs Functions dependencies and runs two sequential suites under Firebase Emulator Suite with JDK 21:

- `npm --prefix functions run test:rules` - 8 Firestore rules tests for member/non-member access, write denial, and class-scoped pupil, guardian, link, conversation and message reads.
- `npm --prefix functions run test:emulator` - 10 callable/webhook/scheduler/sync tests covering workspace and class creation, pupil registration, guardian linking and verification, absence-only notification jobs, progress approval, teacher replies, mixed sync batch replay, signed inbound SMS dedupe and the weekly digest.

Both use demo project IDs and synthetic data; no real project, credentials or provider calls are involved.

## 3.3 Compose instrumentation

The `Compose instrumentation` job boots an API 35 Pixel 5 emulator and runs `./gradlew connectedDevDebugAndroidTest`. `TinyNavigationTest` exercises onboarding, Home, the Classes tab, class detail and Attendance, and uploads `tiny-instrumentation-reports`. This is device/emulator navigation evidence, not a physical low-end performance test.

## 4. Firebase App Distribution tester access
### Internal testers

1. Create an `internal-testers` group in Firebase App Distribution.
2. Add approved tester email addresses in the Firebase console.
3. Testers accept the invitation and install the App Tester app or use the direct installation link.
4. Use synthetic data only. Do not distribute builds with real pupil/guardian data.

### Judge-accessible approach

1. Use the public judge release `v0.1.0-preview.2` (`tiny-judge-preview.apk`) for zero-cost, unrestricted access through judging. It uses a dedicated revocable App Check debug token. See `docs/JUDGE_ACCESS.md`.
2. Alternatively, create/use the `judges` App Distribution group and add approved emails privately.
3. Upload the same verified judge APK with release notes containing the build number and commit SHA.
4. Use the protected `distribution` GitHub environment with manual approval for restricted App Distribution uploads.
5. If an invitation expires, re-send it. The public judge release stays available until judging ends.
6. Record the exact release/App Distribution link, build number, commit SHA and tester-group scope in `AI_HANDOFF.md`.

App Distribution is the preferred route; it is independent of Cloud Functions and does not require Blaze. It does require a Firebase Android app registration and a project on the free Spark plan.

## 5. What is deliberately not in CI yet

- No Firebase Functions deployment (`firebase deploy --only functions` is prohibited under Spark/NGN 0).
- No Blaze upgrade, Cloud Scheduler deployment, paid runner or paid service.
- No eSMS sandbox/production calls; `SMS_MODE=mock`.
- No real parent/pupil data.
- No production signing or Play Store release.
- No Firebase MCP state-changing call.

## 6. Phase 1 evidence

- Workflow file: `.github/workflows/android-ci.yml`.
- CI run: latest integration regression `https://github.com/onyebuchidaniel60/tiny/actions/runs/45950400565` (build/test, 9 rules tests, 10 backend E2E tests, Compose instrumentation). The sync and AI workflows have their own runs.
- Pinned stack: JDK 17 for Android, JDK 21 for Firebase emulators, AGP 8.13.2, Gradle 8.13, Kotlin 2.3.0, Compose BOM 2026.06.01, compileSdk/targetSdk 36, minSdk 26, Room 2.7.2, SQLCipher 4.20.0, Functions Node 22.
- APK artifact: `tiny-dev-debug-apk` from run 45950400565; 31,097,300 bytes; SHA-256 `17036AFE1792A2401EBAC359C3C2AD819A63056AAB9616785F35A8ADC2DB145A`.
- Emulator evidence: Firebase-enabled run captured `tiny-03-auth-gate.png` and `tiny-04-authenticated.png` (Home with `Tiny Synthetic E2E`, 1 class / 1 pupil). Pre-Firebase journey images remain in `artifacts/emulator/` and the demo.
- Firestore rules: 9/9 emulator tests pass. Backend E2E: 10/10. Compose instrumentation: see the latest `Compose instrumentation` job.
- App Distribution: groups `internal-testers` and `judges` created; no tester emails or invitation sent yet. The public judge prerelease `v0.1.0-preview.2` is available separately.
- App Check debug tokens are never committed; the raw CI logcat containing the first token was deleted and that token was revoked. A separate private-CI token is stored only in GitHub secrets and used by the non-uploaded AI APK. The smoke script redacts future occurrences.
- Known limitations: no hosted Functions; Note 10+ is general testing only, not Gemini Nano-supported; Hausa/Yoruba/Igbo have complete draft translations pending native review.

