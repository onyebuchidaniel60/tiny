# Tiny — Credential and Configuration Register

**Status:** Phase 0 register. Values are placeholders or safe defaults only. No real secret is recorded here.

**Rule:** Do not request, paste, log or commit secret values. The operator provisions secrets directly in GitHub Actions secrets, Google Secret Manager/Firebase Functions secrets, or an ignored local file. The agent needs only the name, location and confirmation that it exists.

**Safe template:** `.env.example` (committed, placeholders only). Real local values go in `.env` (ignored).

## 1. How to read this register

| Column | Meaning |
|---|---|
| Name | Exact environment variable, GitHub Actions variable/secret, or file name |
| Purpose | What consumes it |
| Where obtained | Operator/console source |
| Where entered | Secure destination |
| Secret? | `Secret` = never display/commit; `Public` = safe project/config identifier; `Restricted` = personal data or sensitive config |
| Timing | `Now`, `Phase 1`, `Before Firebase integration`, `Before distribution`, `Before sandbox SMS`, `Before production`, `Not used` |

## 2. Firebase and Google Cloud

| Name | Purpose | Where obtained | Where entered | Secret? | Timing | Current/default |
|---|---|---|---|---|---|---|
| `FIREBASE_PROJECT_ID` | Android/Firebase project selection; CI and App Distribution | Firebase Console → Project settings → General | `.env`, GitHub Actions variable/config, docs | Public | Before Firebase integration | `tiny-b9f29` |
| `GCLOUD_PROJECT_ID` | Functions runtime project alias | Same Firebase project | Functions config/Secret Manager reference | Public | Before Firebase integration | `tiny-b9f29` |
| `FIREBASE_ANDROID_APP_ID` | App Distribution target app | Firebase Console → Project settings → Your apps | GitHub Actions variable | Public | Before distribution | `1:1072757481941:android:2005f8b35944923b20dd5c` |
| `google-services.json` | Android Firebase client configuration | Firebase Console → Project settings → Your apps → Android | `app/google-services.json` locally or CI-injected | Public client config, not a server secret | Before Firebase-enabled Android build | Present locally; ignored by Git |
| `GOOGLE_SERVICES_JSON_BASE64` | CI transport for the client config | Base64 of the downloaded file | GitHub Actions secret | Restricted/public client config | Before distribution/Firebase build | Set in GitHub Actions 26 Nov 2026 |
| `FIREBASE_REGION` | Firestore/Functions region | Fixed architecture | Functions/Android config | Public | Before Firebase integration | `africa-south1` |
| `FIRESTORE_DATABASE_ID` | Firestore database | Firebase Console | Functions config | Public | Before Firebase integration | `(default)` |
| `APP_ENV` | Environment classification | Project convention | `.env`/Functions config | Public | Before Firebase integration | `development` |
| `FIREBASE_SERVICE_ACCOUNT_JSON_PATH` | Local path to an operator-created admin/CI identity file | Google Cloud Console → IAM → Service accounts → Keys (operator-created) | Path outside repository/ignored local file | Secret | Only if local CLI/App Distribution needs it | `PENDING`; never commit |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | CI secret containing the service-account JSON | Google Cloud Console → IAM → Service accounts → Keys | GitHub Actions secret/Secret Manager | Secret | Before distribution/deploy | `PENDING`; prefer Workload Identity Federation |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Preferred keyless GitHub Actions auth | Google Cloud Console → IAM → Workload Identity Federation | GitHub Actions variable | Public identifier | Before distribution | `PENDING` |
| `GCP_SERVICE_ACCOUNT_EMAIL` | Service account used with Workload Identity Federation | Google Cloud Console | GitHub Actions variable | Public identifier | Before distribution | `PENDING` |
| `FIREBASE_TOKEN` | Legacy Firebase CLI CI token | Firebase CLI `login:ci` | GitHub Actions secret | Secret | Only if Workload Identity Federation unavailable | `NOT REQUIRED` |
| `APP_CHECK_DEBUG_TOKEN` | Local debug App Check attestation | App Check debug-provider log or a generated UUID; register via Console/REST | Ignored local `.env` or `app/src/debug/res/values/firebase_app_check_debug.xml`; never commit | Secret | Before local Firebase/AI integration | No active token; generate/register per session, revoke after use |
| `PLAY_INTEGRITY_SHA256` | App signing certificate fingerprint for App Check | Play Console/keystore inspection | Firebase Console → App Check | Public fingerprint | Before production/connected release | Debug SHA-256 recorded; release SHA-256 still pending |
| `AI_PROVIDER` | AI route selection | Fixed architecture | Android/config | Public | Before AI integration | `firebase-ai-logic` |
| `CLOUD_MODEL_NAME` | Exact Gemini cloud model | Current Firebase AI Logic model docs | Android/config | Public | Before cloud AI integration | `gemini-3.5-flash-lite` (free-tier featured model; verify at runtime) |
| `AI_DAILY_CLOUD_LIMIT_PER_USER` | Conservative cloud request guard | Project policy | Functions/Remote Config/config | Public | Before cloud AI integration | `PENDING — conservative value` |
| `AI_MAX_OUTPUT_TOKENS` | Output-size cap | Product/config policy | Android/Functions config | Public | Before AI integration | `256` |
| `GEMINI_API_KEY` | **Not used** — Firebase AI Logic uses Firebase config + App Check, not an API key in the APK | N/A | N/A | Secret if ever created | Not used | Do not create or embed |

**Note:** `FIREBASE_PROJECT_ID` and `GCLOUD_PROJECT_ID` refer to the same project. The first is the general/CI name; the second is the Functions convention.

## 3. Android build and signing

| Name | Purpose | Where obtained | Where entered | Secret? | Timing | Current/default |
|---|---|---|---|---|---|---|
| `ANDROID_APPLICATION_ID` | App package identity | Project decision; verify ownership | Gradle version config | Public | Phase 1 | `ng.tiny.education` (proposed) |
| `ANDROID_MIN_SDK` | Minimum Android API | Fixed architecture | Gradle config | Public | Phase 1 | `26` |
| `ANDROID_COMPILE_SDK` | Compile SDK | Current stable SDK selected in Phase 1 | Gradle config | Public | Phase 1 | `PENDING — pin` |
| `ANDROID_TARGET_SDK` | Target SDK | Current stable SDK selected in Phase 1 | Gradle config | Public | Phase 1 | `PENDING — pin` |
| `VERSION_CODE` | Build version code | Release/CI convention | Gradle config/CI | Public | Phase 1 | `1` |
| `VERSION_NAME` | User-facing version | Release/CI convention | Gradle config/CI | Public | Phase 1 | `0.1.0` |
| `ANDROID_KEYSTORE_PATH` / `ANDROID_KEYSTORE_BASE64` | Release signing keystore | Generated locally/Play App Signing | GitHub Actions secret or ignored local file | Secret | Before signed release | `PENDING` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | Operator/keystore generation | GitHub Actions secret | Secret | Before signed release | `PENDING` |
| `ANDROID_KEY_ALIAS` | Signing key alias | Operator/keystore generation | GitHub Actions secret | Secret | Before signed release | `PENDING` |
| `ANDROID_KEY_PASSWORD` | Signing key password | Operator/keystore generation | GitHub Actions secret | Secret | Before signed release | `PENDING` |
| `local.properties` / `sdk.dir` | Local Android SDK path | Local machine only | Ignored local file | Not secret | Optional local build | `NOT REQUIRED — CI preferred` |

**Build decision:** Android builds use GitHub Actions Ubuntu runners. Do not install the full Android Studio toolchain on the Windows machine. See `docs/CI_ANDROID_BUILD.md`.

## 4. Functions, messaging and AI limits

| Name | Purpose | Where obtained | Where entered | Secret? | Timing | Current/default |
|---|---|---|---|---|---|---|
| `SMS_MODE` | Adapter mode: `mock`, `sandbox`, or `production` | Project decision | Functions config | Public | Now | `mock` |
| `ESMS_API_KEY` | eSMS provider authentication | eSMS Africa dashboard | Secret Manager only | Secret | Before sandbox SMS | `NOT REQUESTED YET` |
| `ESMS_WEBHOOK_SECRET` | HMAC verification of inbound/delivery webhooks | eSMS Africa dashboard | Secret Manager only | Secret | Before sandbox SMS | `NOT REQUESTED YET` |
| `ESMS_SERVICE_ID` | Shared keyword/service identifier | eSMS Africa dashboard | Functions config | Public | Before sandbox SMS | `PENDING` |
| `ESMS_SENDER_KEYWORD` | Product-level keyword | Fixed decision | Functions config | Public | Before sandbox SMS | `TINY` |
| `ESMS_BASE_URL` | Provider API endpoint | eSMS documentation/account | Functions config | Public | Before sandbox SMS | `PENDING` |
| `SMS_MONTHLY_BUDGET_MINOR` | Server-side spend ceiling in minor units | Operator authorization | Functions config | Public | Now | `0` |
| `SMS_DAILY_SEGMENT_LIMIT` | Daily outbound segment ceiling | Operator authorization | Functions config | Public | Now | `0` |
| `SMS_ALLOWED_RECIPIENTS` | Sandbox-only test recipient allowlist | Operator/test plan | Restricted Functions config | Restricted personal data | Before sandbox SMS | Empty |
| `INVITATION_TTL_DAYS` | Teacher invitation expiry | Fixed business rule | Functions config | Public | Before integration | `7` |
| `SYNC_BATCH_LIMIT` | Max commands per sync call | Fixed architecture | Functions config | Public | Before integration | `20` |
| `DIGEST_TIMEZONE` | Weekly digest timezone | Fixed business rule | Functions config | Public | Before integration | `Africa/Lagos` |
| `DIGEST_CRON` | Weekly digest schedule | Fixed business rule | Functions config | Public | Before integration | `0 15 * * 5` |
| `FUNCTIONS_MIN_INSTANCES` | Cost-safe minimum instances | Cost policy | Functions config | Public | Before deployment (not now) | `0` |
| `FUNCTIONS_MAX_INSTANCES` | Cost-safe maximum instances | Cost policy | Functions config | Public | Before deployment (not now) | `PENDING — conservative` |
| `FUNCTIONS_CONCURRENCY` | Cost-safe concurrency | Cost policy | Functions config | Public | Before deployment (not now) | `PENDING — conservative` |
| `FUNCTIONS_MEMORY` | Function memory | Cost policy | Functions config | Public | Before deployment (not now) | `256MiB` |
| `LOG_LEVEL` | Log verbosity without PII | Operations policy | Functions config | Public | Before integration | `info` |

**Current constraint:** Cloud Functions are emulator-only under Spark/NGN 0. No deployment, Blaze activation or paid hosting.

## 5. GitHub Actions and Firebase App Distribution

| Name | Purpose | Where obtained | Where entered | Secret? | Timing | Current/default |
|---|---|---|---|---|---|---|
| `FIREBASE_APP_DISTRIBUTION_GROUPS` | Tester groups, including judges | Firebase App Distribution console | GitHub Actions variable/workflow input | Public group aliases | Before distribution | `internal-testers,judges` (proposed) |
| Tester email addresses | App Distribution invitations | Operator/judge list | Firebase App Distribution group membership only | Restricted personal data | Before distribution | `PENDING — do not commit` |
| `GITHUB_TOKEN` | Built-in GitHub workflow token | GitHub automatically | Workflow | Automatic; not stored by us | Always | No setup |
| Repository Actions permission | Allow workflow runs/artifact upload | GitHub repository settings | Settings → Actions → General | Public/operational | Phase 1 | Verify read-only workflow permissions |

**GitHub Actions permissions:**

- Workflow-level `permissions: contents: read` is sufficient for checkout, build and artifact upload.
- Add `id-token: write` only when using Google Cloud Workload Identity Federation for App Distribution.
- Do not grant `contents: write`, `packages: write`, `actions: write` or `pull-requests: write` unless a concrete need is reviewed.
- Use a protected GitHub `distribution` environment for App Distribution; require manual approval for judge-facing builds.
- Do not expose secrets to fork pull requests. Build on `push`/`workflow_dispatch`; use `pull_request` without secrets for untrusted changes.

## 6. Local files and paths

| File | Purpose | Where obtained | Where entered | Secret? | Timing | Notes |
|---|---|---|---|---|---|---|
| `.env` | Local development overrides | Copy `.env.example` | Repository root, ignored | Secret/restricted | As needed | Never commit |
| `.env.example` | Safe placeholder template | This repository | Repository root | Public | Now | No real values |
| `.gitignore` | Prevents accidental secret/build commits | This repository | Repository root | Public | Now | Keep updated |
| `local.properties` | Local Android SDK path | Local machine | Repository root, ignored | Not secret | Optional local build | CI does not need it |
| `functions/.secret.local` | Emulator-only function secrets | Operator/local test setup | Functions directory, ignored | Secret | Before Emulator Suite secret tests | Never commit |
| `.firebaserc` | Firebase project alias | Operator/Firebase CLI | Repository root | Public | Before Firebase integration | Project ID is not a secret |
| `firebase.json` | Firebase emulator/deploy configuration | Project implementation | Repository root | Public | Before Firebase integration | No credentials |
| `skills-lock.json` | Firebase Agent Skills lockfile | Skills CLI | Repository root | Public | Phase 1 | Commit if generated |
| `google-services.json` | Android Firebase client config | Firebase Console | `app/` locally or CI injection | Public client config | Before Firebase-enabled build | Ignored by Git |
| `GOOGLE_SERVICES_JSON_PATH` | Local path to the client config file | Firebase Console download | `.env`/local ignored file | Public path/config | Before Firebase-enabled local build | Not required in CI |

## 7. Not used or not authorized now

- `GEMINI_API_KEY` in the APK — not used; Firebase AI Logic uses Firebase config and App Check.
- eSMS API key, webhook secret and service ID — not requested while `SMS_MODE=mock`.
- Production signing/Play Console credentials — later, not now.
- Real pupil/guardian data, real phone numbers, raw production exports — prohibited.
- Paid AI, paid third-party APIs, Blaze billing, Cloud Scheduler deployment — not authorized (NGN 0).
- Firebase MCP state-changing operations — require explicit per-action approval.

## 8. Request protocol

1. Do not send secret values in chat or Markdown.
2. Operator enters secrets directly in GitHub Actions secrets/Google Secret Manager/ignored local files.
3. The agent verifies only the name/location and that the value is non-empty, never the value itself.
4. If a secret is exposed in logs, chat, Git or an artifact, rotate it immediately and record the incident.
5. Public configuration (project ID, app ID, region) may be shared in documentation.
6. `SMS_MODE`, budgets and AI limits must remain closed-by-default until explicitly authorized.
