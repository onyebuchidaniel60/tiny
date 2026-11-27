# Tiny Firebase Evidence — 26 November 2026

Sanitized evidence for the non-production project `tiny-b9f29`. No access tokens, debug tokens, service-account keys, real phone numbers or pupil/guardian data are recorded here. Project and app identifiers are public.

## 1. Access and plan

| Check | Result |
|---|---|
| Firebase CLI | Authenticated as the project owner; `firebase-tools` 15.14.0 |
| Project | `tiny-b9f29`, number `1072757481941`, state `ACTIVE` |
| Billing | `billingEnabled: false`; no billing account linked |
| Plan constraint | Spark / NGN 0; no Blaze, paid API, SMS, AI or hosting |

## 2. Android registration and signing

| Item | Value |
|---|---|
| Firebase app | `Tiny dev debug` |
| App ID | `1:1072757481941:android:2005f8b35944923b20dd5c` |
| Package | `ng.tiny.education.dev.debug` |
| SHA-1 | `B1:5B:80:19:3C:C4:28:38:C2:3A:F9:97:5B:54:62:BB:83:6B:84:7C` |
| SHA-256 | `7A:F6:FE:85:20:E7:6A:F5:5A:86:C8:93:52:8D:00:B6:66:B7:42:D9:C4:10:4E:97:57:8E:F4:D3:B9:60:92:52` |
| Client config | `app/google-services.json` present locally; ignored by Git |
| CI transport | GitHub Actions secret `GOOGLE_SERVICES_JSON_BASE64` set 2026-11-26 |

## 3. Firestore

| Check | Result |
|---|---|
| Database | `projects/tiny-b9f29/databases/(default)` |
| Location | `africa-south1` |
| Type | `FIRESTORE_NATIVE` (Standard) |
| Delete protection | `DELETE_PROTECTION_ENABLED` |
| Rules release | `projects/tiny-b9f29/releases/cloud.firestore` |
| Ruleset | `projects/tiny-b9f29/rulesets/c2c94984-9cd2-4a8b-9222-3f4a3e717ec5` |
| Rules update time | `2026-11-26T17:26:35.953837Z` |
| Indexes | Seven collection indexes `READY` |
| Removed index | `messages` collection-group index rejected as unnecessary; removed from `firestore.indexes.json` and redeployed |

Index groups: `guardianVerificationChallenges`, `conversations`, `progressEntries`, `pupils`, `attendanceSessions`, `pupilGuardianLinks`, `notificationJobs`.

### Rules enforcement check

Read-only `GET` on `workspaces` with the Android API key returned:

```text
HTTP 403
{"error":{"code":403,"message":"Missing or insufficient permissions.","status":"PERMISSION_DENIED"}}
```

The same result occurred with and without an App Check token. This is the expected denial for an unauthenticated request; no document was read and nothing was written.

### Authenticated rules check (real test-phone sign-in)

A synthetic workspace was seeded through the owner-authenticated Admin/REST path (not through the app) with these clearly marked documents:

- `workspaces/tiny-synthetic-e2e`
- `workspaces/tiny-synthetic-e2e/members/{testUserA}`
- `workspaces/tiny-synthetic-e2e/classes/p4-blue`
- `workspaces/tiny-synthetic-e2e/pupils/synthetic-pupil-001`
- `users/{testUserA}/workspaces/tiny-synthetic-e2e`

Two synthetic users were created through Firebase test phone numbers (`+2348000000001` and `+2348000000002`). Results with their real ID tokens:

| Caller | Workspace | Class | Pupil |
|---|---|---|---|
| Member test user A | 200 | 200 | 200 |
| Non-member test user B | 403 | 403 | 403 |
| Unauthenticated | 403 | — | — |

No client writes were attempted or allowed. The documents contain synthetic names only; no real pupil/guardian data.

## 4. App Check

| Check | Result |
|---|---|
| API | `firebaseappcheck.googleapis.com` enabled |
| Debug token registration | Created through the App Check v1beta REST API using project number and app ID |
| Debug token exchange | `exchangeDebugToken` returned a signed App Check token with TTL `3600s` |
| Cleanup | The first debug token was revoked and its log artifact deleted. A separate token for the private `firebase-ai-smoke` workflow is stored only in the GitHub secret `FIREBASE_APP_CHECK_DEBUG_TOKEN` and used by an ephemeral, non-uploaded APK. A dedicated `FIREBASE_JUDGE_DEBUG_TOKEN` is intentionally embedded in the public judge APK and must be revoked after judging |
| Log handling | The CI smoke logcat is redacted; the AI test reports contain no token |
| Enforcement | Not enabled |
| Play Integrity | Not configured yet; requires Play Console link and release fingerprint |

## 5. Firebase AI Logic

Enabled services: `firebasevertexai.googleapis.com`, `generativelanguage.googleapis.com`, `firebaseml.googleapis.com`.

Service identities created:

- `service-1072757481941@gcp-sa-firebasevertexai.iam.gserviceaccount.com`
- `service-1072757481941@gcp-sa-firebaseml.iam.gserviceaccount.com`

IAM: `roles/firebaseml.serviceAgent` granted to the Firebase AI Logic service identities.

### Proxy call

Endpoint:

```text
POST https://firebasevertexai.googleapis.com/v1beta/projects/tiny-b9f29/models/gemini-3.5-flash-lite:generateContent
```

Headers: `x-goog-api-key`, `X-Firebase-AppCheck`, `X-Firebase-AppId`.

Prompt: one short Primary 4 science teaching tip about water; no pupil data.

Result: HTTP 200 with a candidate of 50 tokens and usage metadata:

```json
{"promptTokenCount":22,"candidatesTokenCount":50,"totalTokenCount":72,"promptTokensDetails":[{"modality":"TEXT","tokenCount":22}],"serviceTier":"standard"}
```

Short response excerpt:

> When teaching Primary 4 pupils about the states of water, use the terms "melting", "evaporation", "condensation" and "freezing" strictly with regard to heat gain or heat loss...

After removing the temporary `generativelanguage.googleapis.com` target from the Android API key, the proxy still succeeded and a direct `generativelanguage.googleapis.com` request returned HTTP 403. This is the intended posture: the app key uses the Firebase AI Logic proxy, and the raw Gemini endpoint is not open through the client key.

This is protocol-level evidence. The app-level SDK path is covered separately below; on-device inference remains blocked.

### App-level SDK test (passed)

The manual `firebase-ai-smoke` workflow (`45894574508`) built an ephemeral debug APK with a registered debug token from a GitHub secret, ran `AiLogicLiveTest` on an API 35 emulator, and did **not** upload the APK. Result: **1 test passed, 0 failed**.

- The SDK first tried the on-device provider and logged `FirebaseAIOnDeviceNotAvailableException`.
- It fell back to the cloud provider and returned text.
- `AiLogicLiveTest` asserted the SDK-reported source was `Cloud Gemini`; the test report is `tiny-firebase-ai-reports` for run `45894574508`.
- The test also asserted the emulator did not report on-device Nano `Available`.
- The public judge APK UI smoke (`45948484744`) showed the cloud result and `Source: Cloud Gemini`; screenshot `artifacts/emulator/tiny-ai-cloud.png`.
- The logcat/report artifacts contain no unredacted App Check debug token.

This verifies the app-level cloud AI path and honest source reporting. It does **not** prove on-device Gemini Nano.

## 6. Authentication

| Check | Result |
|---|---|
| Console initialization | Completed by the operator on 26 November 2026 (Spark/free-tier path; no billing) |
| Admin config | `GET /admin/v2/projects/tiny-b9f29/config` returns `projects/1072757481941/config`, subtype `FIREBASE_AUTH` |
| Phone provider | Enabled |
| Test phone numbers | `+2348000000001` → `123456`; `+2348000000002` → `654321` (synthetic only) |
| SMS region policy | `allowlistOnly.allowedRegions: ["NG"]` |
| Real SMS | Not enabled; no real SMS requested or sent |
| REST test sign-in | `sendVerificationCode` + `signInWithPhoneNumber` with the test code created a synthetic user and returned a 3600-second ID token |
| App-level sign-in | CI emulator smoke entered the synthetic number/code and reached the authenticated Home screen; `artifacts/emulator/tiny-04-authenticated.png` |
| App-level Firestore bootstrap | After adding the synthetic user workspace index, the app loaded `Tiny Synthetic E2E` with 1 class / 1 pupil from Firestore; same screenshot |
| Play Integrity/reCAPTCHA | Logcat shows `INVALID_CERT_HASH` from the reCAPTCHA/auth-domain path because the CI debug keystore differs from the registered local SHA; test-phone auth still succeeded. Register the CI/release fingerprint before claiming Play Integrity |
| Auth UID | Synthetic test user; no real identity is used |

No billing was enabled to initialize or test Auth.

## 7. CI and emulator evidence

| Item | Result |
|---|---|
| Run | `https://github.com/onyebuchidaniel60/tiny/actions/runs/45891064395` (latest auth/bootstrap smoke) |
| Build/test | Success |
| Backend emulator E2E | 10/10 |
| Firestore rules | 9/9 |
| Android unit tests | 35/35 |
| Compose instrumentation | Success |
| Firebase-enabled APK | Built with `google-services.json`; Firebase initialized |
| Emulator smoke | Auth gate captured, then test-phone sign-in reached Home; Firestore bootstrap loaded the synthetic workspace; `tiny-04-authenticated.png` |
| App-level AI smoke | Manual run `45894574508`: `AiLogicLiveTest` passed; on-device unavailable, cloud fallback, SDK source `Cloud Gemini`; ephemeral APK not uploaded |
| Android sync E2E | Manual run `45943527674`: `SyncEmulatorE2ETest` passed; real Android Firebase Functions SDK/`SyncProcessor` against Auth/Firestore/Functions emulators; accepted, idempotent replay, retry and conflict |
| Judge build | Public prerelease `v0.1.0-preview.1`: `tiny-judge-preview.apk` (31,097,336 bytes; SHA-256 `5c7dc73d6384691ac5714af0240ad826897d28d41f6cdbb84896b4d85c7ea64b`); dedicated App Check debug token; no private CI token |
| Final regression | Run `45942661936`: all jobs green; normal instrumentation shows the live AI and sync tests skipped when Firebase/emulator config is absent, and the navigation test passed |
| Log redaction | The logcat and AI test artifacts contain no unredacted App Check debug token |
| Security cleanup | The earlier emulator evidence artifact containing the raw debug token was deleted; that token was revoked. The active private CI token is in GitHub secrets only; the AI APK was not uploaded |

## 8. Not verified / not claimed

- App Check enforcement or Play Integrity attestation.
- On-device Gemini Nano inference; the Note 10+ is unsupported.
- Hosted Cloud Functions, live SMS, App Distribution, production deployment.
- Real parent/guardian communication or real pupil data.
