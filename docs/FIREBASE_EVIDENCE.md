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

## 4. App Check

| Check | Result |
|---|---|
| API | `firebaseappcheck.googleapis.com` enabled |
| Debug token registration | Created through the App Check v1beta REST API using project number and app ID |
| Debug token exchange | `exchangeDebugToken` returned a signed App Check token with TTL `3600s` |
| Cleanup | Debug token revoked after the protocol test; debug-token list is empty |
| Log handling | The CI artifact containing the raw logcat was deleted; the smoke script now redacts the token |
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

This is protocol-level evidence. The Android UI has not yet made a live AI Logic call because phone Auth is not initialized.

## 6. Authentication

| Check | Result |
|---|---|
| Admin config | `GET /admin/v2/projects/tiny-b9f29/config` → HTTP 404 `CONFIGURATION_NOT_FOUND` |
| Public initialization | `POST /v2/projects/tiny-b9f29/identityPlatform:initializeAuth` → HTTP 400 `BILLING_NOT_ENABLED` |
| User import | Fails with `CONFIGURATION_NOT_FOUND`; no users imported |
| Test phone numbers | Not configured; no real SMS requested or sent |
| Console | **Authentication → Get started** is the required one-time free-tier action |
| App-level result | Firebase-enabled APK correctly stops at the phone sign-in gate |

No billing was enabled to bypass this gate.

## 7. CI and emulator evidence

| Item | Result |
|---|---|
| Run | `https://github.com/onyebuchidaniel60/tiny/actions/runs/45873038243` |
| Build/test | Success |
| Backend emulator E2E | 10/10 |
| Firestore rules | 9/9 |
| Android unit tests | 34/34 |
| Compose instrumentation | Success |
| Firebase-enabled APK | Built with `google-services.json`; Firebase initialized |
| Emulator smoke | Correctly displayed the phone-auth gate; the prior scripted journey did not run |
| Security cleanup | The emulator evidence artifact containing the raw debug token was deleted; the token was revoked |

## 8. Not verified / not claimed

- Firebase Auth initialization, test-phone sign-in, or any real user account.
- Firestore client reads/writes for an authenticated user.
- App-level AI Logic generation or SDK-reported inference source.
- App Check enforcement or Play Integrity attestation.
- On-device Gemini Nano inference; the Note 10+ is unsupported.
- Hosted Cloud Functions, live SMS, App Distribution, production deployment.
