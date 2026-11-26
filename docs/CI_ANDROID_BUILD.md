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

      - uses: android-actions/setup-android@v3

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

## 4. Firebase App Distribution tester access

### Internal testers

1. Create an `internal-testers` group in Firebase App Distribution.
2. Add approved tester email addresses in the Firebase console.
3. Testers accept the invitation and install the App Tester app or use the direct installation link.
4. Use synthetic data only. Do not distribute builds with real pupil/guardian data.

### Judge-accessible approach

1. Create a dedicated `judges` group in Firebase App Distribution for the non-production project.
2. Collect judge email addresses through the operator’s approved channel; do not commit them.
3. Add judges to the `judges` group and send the App Distribution invitation link.
4. Upload the verified debug/staging APK with release notes containing the build number and commit SHA.
5. Use the protected `distribution` GitHub environment with manual approval so judge-facing uploads are deliberate.
6. If an invitation expires, re-send it; do not publish a public APK link.
7. If a judge cannot use App Distribution, use an approved protected artifact destination with access control. Do not make the APK public.
8. Record the exact distribution link, build number, commit SHA and tester-group scope in `AI_HANDOFF.md`.

App Distribution is the preferred route; it is independent of Cloud Functions and does not require Blaze. It does require a Firebase Android app registration and a project on the free Spark plan.

## 5. What is deliberately not in CI yet

- No Firebase Functions deployment (`firebase deploy --only functions` is prohibited under Spark/NGN 0).
- No Blaze upgrade, Cloud Scheduler deployment, paid runner or paid service.
- No eSMS sandbox/production calls; `SMS_MODE=mock`.
- No real parent/pupil data.
- No production signing or Play Store release.
- No Firebase MCP state-changing call.

## 6. Phase 1 evidence to record

- Workflow file path and commit.
- JDK, Android SDK/build-tools, Gradle, Compose and Firebase versions actually pinned.
- GitHub Actions run URL and result.
- APK artifact name/hash and size.
- App Distribution release/build number, tester group and invitation link (redacted where needed).
- Confirmation that no secrets appeared in logs.
- Known limitations: no hosted Functions; Note 10+ is general testing only, not Gemini Nano-supported.
