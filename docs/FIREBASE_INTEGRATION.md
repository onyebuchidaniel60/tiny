# Tiny Firebase Integration Runbook

**Project:** `tiny-b9f29` (dedicated non-production project; project ID is public).
**Budget:** Spark / NGN 0. Billing is disabled. Do not upgrade to Blaze.
**Cloud Functions:** Gen2 deployment requires Blaze, so callables, webhooks and scheduled jobs remain emulator-only. Firestore, Auth, App Check and Firebase AI Logic are used on Spark within free quotas.

## 1. Current status (27 November 2026)

| Area | Status | Evidence / note |
|---|---|---|
| Firebase CLI | **AUTHENTICATED** | `firebase-tools` 15.14.0; project owner access verified |
| Project audit | **DONE** | `tiny-b9f29`, project number `1072757481941`, Spark, billing disabled |
| Android app | **REGISTERED** | `Tiny dev debug`, package `ng.tiny.education.dev.debug`, app ID `1:1072757481941:android:2005f8b35944923b20dd5c` |
| Signing fingerprints | **REGISTERED** | Debug SHA-1 and SHA-256 added to the Android app |
| Client config | **LOCAL + CI** | `app/google-services.json` present locally and ignored; GitHub secret `GOOGLE_SERVICES_JSON_BASE64` set |
| Firestore database | **CREATED** | `(default)`, `africa-south1`, Firestore Native/Standard, delete protection enabled |
| Firestore rules | **DEPLOYED** | `cloud.firestore` release updated 2026-11-26 17:26:35 UTC; unauthenticated reads denied |
| Firestore indexes | **DEPLOYED** | Seven indexes READY; unnecessary `messages` collection-group index removed |
| App Check | **PARTIAL** | API and debug token registration verified; first token revoked after the protocol test; private CI token stored in GitHub secrets; enforcement **off**; Play Integrity not configured |
| AI Logic | **PROTOCOL VERIFIED** | Gemini Developer API free tier through the Firebase AI Logic proxy with an App Check token; direct `generativelanguage` access remains blocked |
| Firebase Auth | **INITIALIZED** | Console free-tier setup completed 2026-11-26; config subtype `FIREBASE_AUTH`; Phone provider enabled with two synthetic test numbers |
| Functions | **EMULATOR ONLY** | Backend E2E 10/10; no deployment |
| App-level Auth/Firestore | **VERIFIED** | Test-phone sign-in reached Home; Firestore bootstrap loaded the synthetic workspace (1 class / 1 pupil) |
| App-level AI | **VERIFIED - CLOUD FALLBACK** | `AiLogicLiveTest` passed in the private `firebase-ai-smoke` workflow; on-device unavailable, cloud response, SDK source `Cloud Gemini`; no on-device claim |
| Web app | **REGISTERED** | `Tiny web`, app ID `1:1072757481941:web:10a300a3c9756e1520dd5c` |
| Web Auth | **SYNTHETIC PREVIEW** | Email/Password enabled for `judge@tiny-demo.example`; Android Phone Auth unchanged; no real user data |
| Web Firestore | **READ-ONLY BOOTSTRAP** | Synthetic member UID `wT35e4yAe1PTRZ0BT6UheSsmEdg2` reads `ws_webdemo0001`; existing rules unchanged; web writes remain local |
| Web App Check | **PARTIAL - DEBUG TOKEN** | Dedicated revocable web token registered; embedded in hosted preview for AI Logic; enforcement off; GitHub secret `FIREBASE_WEB_APP_CHECK_DEBUG_TOKEN` |
| Web AI | **VERIFIED - CLOUD FALLBACK** | Hosted `/ai` returned SDK-reported `Cloud Gemini`; evidence `artifacts/web/tiny-web-ai-cloud.png`; no on-device claim |
| Web Hosting | **DEPLOYED** | <https://tiny-b9f29.web.app>; `web/dist`; Spark; no Functions deployment |

**Next verification work:** App Check enforcement, Play Integrity/release fingerprint, hosted Functions when authorized, and supported-device on-device AI. No immediate operator approval is required for the remaining emulator/protocol work; production remains unauthorized.

## 2. Authentication initialization (completed 26 November 2026)

The operator completed the one-time Console **Authentication → Get started** action. The public Identity Platform API had rejected Spark with `BILLING_NOT_ENABLED`; the Console used the free-tier Firebase Auth path. No billing was enabled.

Configuration now verified:

- Config name: `projects/1072757481941/config`.
- Subtype: `FIREBASE_AUTH`.
- Phone provider enabled.
- Test phone numbers: `+2348000000001` → `123456`, `+2348000000002` → `654321`.
- SMS region policy: allowlist with `NG` only.
- Real SMS remains disabled; no real message was sent.

For a future environment, the steps were:

1. Open <https://console.firebase.google.com/project/tiny-b9f29/authentication>.
2. Select **Get started**.
3. Accept the Firebase Authentication terms if prompted.
4. Confirm the page shows the **Users** and **Sign-in method** tabs.
5. Do **not** enable billing, upgrade to Blaze, or add a payment method.

Verify through the Admin API with an OAuth access token (never commit the token):

```powershell
curl.exe -s -H "Authorization: Bearer $env:GOOGLE_OAUTH_ACCESS_TOKEN" `
  "https://identitytoolkit.googleapis.com/admin/v2/projects/tiny-b9f29/config"
```

Expected: a JSON config with `name: projects/tiny-b9f29/config`, not `CONFIGURATION_NOT_FOUND`.

If a future Console action demands billing, stop and report it as a material conflict with the Spark/NGN 0 constraint. Do not upgrade or enable paid services.

### 2.1 Phone Auth and synthetic test numbers (completed)

The Console or Admin API configured:

- Phone provider enabled.
- Synthetic numbers only:

```text
+2348000000001 -> 123456
+2348000000002 -> 654321
```

- SMS region allowlist: `NG`.
- No real parent/guardian number.

Real verification SMS is a Blaze-only feature and is **not authorized**. Never add a real parent or guardian number.

Admin API alternative (do not put an access token in the repository):

```powershell
$body = @{
  signIn = @{
    phoneNumber = @{
      enabled = $true
      testPhoneNumbers = @{
        "+2348000000001" = "123456"
        "+2348000000002" = "654321"
      }
    }
  }
} | ConvertTo-Json -Depth 6

Invoke-RestMethod `
  -Uri "https://identitytoolkit.googleapis.com/admin/v2/projects/tiny-b9f29/config?updateMask=signIn.phoneNumber" `
  -Headers @{ Authorization = "Bearer $env:GOOGLE_OAUTH_ACCESS_TOKEN" } `
  -Method Patch -ContentType "application/json" -Body $body
```

## 3. Firestore

The default database is created in the fixed `africa-south1` region with delete protection enabled. Do not create a second database or change the region without a recorded architecture decision.

Deploy rules and indexes after any change:

```powershell
npx --yes firebase-tools@15.14.0 deploy `
  --only firestore:rules,firestore:indexes `
  --project tiny-b9f29
```

Notes:

- `firestore.indexes.json` no longer contains the `messages` collection-group index. Firestore rejected it as unnecessary for the query shape; the deployment now succeeds.
- `firestore.rules` denies direct client writes to authoritative collections and requires workspace/class membership for reads.
- Do not use `firestore:delete`, imports or destructive operations.

Verified rules behaviour on the live database: unauthenticated `GET` on `workspaces` returns HTTP 403 `Missing or insufficient permissions`, with or without an App Check token. This is the intended `request.auth == null` denial; it is not a delivery or data-read success.

Authenticated check with two real test-phone users against synthetic documents:

- Member user A: workspace/class/pupil reads return 200.
- Non-member user B: all three reads return 403.
- Unauthenticated: 403.

The synthetic test workspace is `workspaces/tiny-synthetic-e2e` with member/class/pupil documents and a user workspace index. It contains synthetic names only. No client writes were attempted; the documents were seeded through the owner-authenticated Admin/REST path solely to test rules.

## 4. App Check

### 4.1 What is configured

- Debug provider in debug builds; Play Integrity provider in release builds.
- App Check API enabled.
- The first protocol-test debug token was registered, exchanged successfully, and then **revoked**. A separate token for the private `firebase-ai-smoke` workflow is registered and stored only in the GitHub secret `FIREBASE_APP_CHECK_DEBUG_TOKEN`.
- App Check enforcement remains **off**. Test-phone Auth, Firestore bootstrap and the private AI smoke work with registered tokens; enabling enforcement is a deliberate next hardening step.
- Play Integrity still needs a Play Console app link and the release SHA-256 before production. The CI debug keystore produced an `INVALID_CERT_HASH` auth-domain warning; register the CI/release fingerprint before claiming Play Integrity.

### 4.2 Register a local debug token

The debug provider logs a UUID on first launch. Treat it as a secret; never commit it, paste it into chat, or upload the raw logcat.

Option A — Console: **App Check → Apps → Manage debug tokens → Add debug token**.

Option B — REST (replace placeholders; keep the access token in the environment):

```powershell
$projectNumber = "1072757481941"
$appId = "1:1072757481941:android:2005f8b35944923b20dd5c"
$body = @{
  displayName = "Tiny local debug"
  token = $env:APP_CHECK_DEBUG_TOKEN
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://firebaseappcheck.googleapis.com/v1beta/projects/$projectNumber/apps/$appId/debugTokens" `
  -Headers @{ Authorization = "Bearer $env:GOOGLE_OAUTH_ACCESS_TOKEN" } `
  -Method Post -ContentType "application/json" -Body $body
```

The `firebase-tools` 15.14.0 build in this environment does not expose `appcheck:debugtokens:*` commands. Use the Console or the REST API.

For the manual `firebase-ai-smoke` workflow, a registered debug token is stored only as the GitHub Actions secret `FIREBASE_APP_CHECK_DEBUG_TOKEN`. The workflow builds an ephemeral APK, runs the test, and does not upload the APK. Rotate the token if the secret is exposed; never add it to a public build artifact.

To pin a local token without hardcoding it in source, create the ignored file:

```text
app/src/debug/res/values/firebase_app_check_debug.xml
```

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="firebase_app_check_debug_token" translatable="false">YOUR_REGISTERED_DEBUG_TOKEN</string>
</resources>
```

The debug provider loads this string resource automatically. The file is ignored by Git. Delete or revoke the token when finished.

### 4.3 Enforcement order

1. Register a fresh debug token for the test build.
2. Confirm App Check token exchange succeeds.
3. Complete Firebase Auth and verify the signed-in app.
4. Only then enable enforcement for Firestore/Auth.
5. Configure Play Integrity and release fingerprints before any production build.

Never disable App Check or weaken rules to make a demo work.

## 5. Firebase AI Logic

The Android client uses Firebase AI Logic with:

- Backend: Google AI / Gemini Developer API (free tier)
- Cloud model: `gemini-3.5-flash-lite`
- On-device mode: `PREFER_ON_DEVICE`
- App Check limited-use tokens
- SDK-reported inference source, never inferred from configuration

Project-side setup completed:

- `firebasevertexai.googleapis.com`, `generativelanguage.googleapis.com` and `firebaseml.googleapis.com` enabled.
- Firebase AI Logic service identities created:
  - `service-1072757481941@gcp-sa-firebasevertexai.iam.gserviceaccount.com`
  - `service-1072757481941@gcp-sa-firebaseml.iam.gserviceaccount.com`
- `roles/firebaseml.serviceAgent` (Firebase AI Logic Service Agent) granted to the service identities.
- The Android API key retains its Firebase-generated allowlist without a direct `generativelanguage.googleapis.com` target.

Protocol verification (26 November 2026): a `generateContent` request to

```text
https://firebasevertexai.googleapis.com/v1beta/projects/tiny-b9f29/models/gemini-3.5-flash-lite:generateContent
```

with `x-goog-api-key`, `X-Firebase-AppCheck` and a synthetic English prompt returned a candidate and usage metadata (`promptTokenCount: 22`, `candidatesTokenCount: 50`, `totalTokenCount: 72`). The direct `generativelanguage.googleapis.com` endpoint returned 403 after the temporary key target was removed. This proves the proxy + App Check path, not the Android UI flow.

The app-level SDK path is verified by the manual `firebase-ai-smoke` workflow (`45950443728`): it builds an ephemeral debug APK with a registered App Check debug token from a GitHub secret, runs `AiLogicLiveTest`, and does not upload the APK. The test passed: the SDK tried the on-device provider, logged `FirebaseAIOnDeviceNotAvailableException`, fell back to the cloud provider, and reported `Cloud Gemini`; the test also asserted the emulator did not report on-device `Available`. The judge-APK UI smoke (`45950452014`) also showed `Source: Cloud Gemini` in `artifacts/emulator/tiny-ai-cloud.png`. Do not weaken App Check or hardcode a registered token into a public artifact. The on-device path is still unverified. The Samsung Galaxy Note 10+ (Android 12) is not a supported Gemini Nano device; an emulator does not prove physical Nano inference. Never claim on-device inference from configuration or from a cloud response.

## 6. Cloud Functions and client sync

Cloud Functions Gen2 cannot be deployed on Spark. The backend remains emulator-only:

```powershell
npx --yes firebase-tools@15.14.0 emulators:start `
  --only auth,firestore,functions `
  --project demo-tiny
```

The Android client uses `10.0.2.2:5001` when built with the Functions emulator flag:

```powershell
./gradlew assembleDevDebug -PfunctionsEmulator=true
```

Backend E2E is green (10/10). The live `syncCommands` callable is not deployed and must not be claimed as a live sync.

## 7. Build and CI

The build job optionally materializes `app/google-services.json` from the GitHub secret `GOOGLE_SERVICES_JSON_BASE64`. The secret is set. Do not print, commit or attach the decoded file.

Latest Firebase-enabled CI run: `https://github.com/onyebuchidaniel60/tiny/actions/runs/45950400565` — **success**. The emulator smoke captured the auth gate, signed in with the synthetic test phone number, reached Home, and loaded the synthetic Firestore workspace. Evidence: `artifacts/emulator/tiny-03-auth-gate.png` and `artifacts/emulator/tiny-04-authenticated.png`. The smoke script handles launcher ANRs and redacts the App Check debug token from logcat; the latest artifact contains no unredacted token.

The manual `firebase-ai-smoke` workflow (`https://github.com/onyebuchidaniel60/tiny/actions/runs/45950443728`) builds an ephemeral APK with the GitHub secret `FIREBASE_APP_CHECK_DEBUG_TOKEN`, runs `AiLogicLiveTest`, and does not upload the APK. It passed with on-device fallback and SDK source `Cloud Gemini`.

The manual `judge-release` workflow publishes a public prerelease with a **dedicated** judge App Check token (`FIREBASE_JUDGE_DEBUG_TOKEN`). The token is intentionally embedded in the public test APK and must be revoked after judging. See `docs/JUDGE_ACCESS.md`.

## 8. Verification checklist

- [x] CLI can list `tiny-b9f29` and the Android app.
- [x] Android dev debug app registered; `google-services.json` present locally (ignored).
- [x] Debug SHA-1/SHA-256 registered.
- [x] Firestore default database created; rules/indexes deployed.
- [x] App Check debug token registration/exchange verified, then revoked.
- [x] AI Logic proxy call with App Check verified.
- [x] Firestore rules deny unauthenticated reads on the live database.
- [x] Firebase Auth initialized in the Console (free-tier path, no billing).
- [x] Phone provider enabled; two synthetic test numbers added; SMS region allowlist `NG`; no real SMS.
- [x] App-level test-phone sign-in succeeds and reaches Home.
- [x] App-level Firestore bootstrap reads the synthetic workspace/class/pupil (no client writes).
- [x] App-level AI Logic call reports its source correctly (cloud fallback verified; on-device not claimed).
- [ ] Callable sync works against the Functions emulator from the Android client.
- [ ] App Check enforcement enabled after the above.
- [ ] Play Integrity/release fingerprint configured before production.
- [ ] On-device status checked on supported hardware; no claim for Note 10+.

## 9. Troubleshooting

| Symptom | Cause | Action |
|---|---|---|
| `CONFIGURATION_NOT_FOUND` | Auth was not initialized (historical) | The Console **Get started** action is now complete; verify the Admin config endpoint |
| `BILLING_NOT_ENABLED` from `initializeAuth` | Public Identity Platform API on Spark | Use the Console action; stop if it demands billing |
| App Check token registration returns 404 | Wrong project identifier | Use project **number** `1072757481941` and the app ID in the path |
| AI Logic `USER_PROJECT_DENIED` | Missing AI Logic service-agent role | Grant `roles/firebaseml.serviceAgent` to the `gcp-sa-firebaseml` identity; retry after propagation |
| AI Logic `SERVICE_DISABLED` | `aiplatform` endpoint used instead of the proxy | Use the `firebasevertexai.googleapis.com` Google AI path, not the Vertex `locations/.../publishers/...` path |
| Firestore 403 for a signed-in user | User is not a workspace/class member, or rules are correct | Verify membership; never weaken rules for a demo |
| Functions callable unavailable | Functions not deployed on Spark | Use the emulator only; do not deploy |

## 10. Secret handling

- Never commit `app/google-services.json`, App Check debug tokens, service-account JSON, OAuth access tokens or real phone numbers.
- GitHub Actions secrets currently used: `GOOGLE_SERVICES_JSON_BASE64` and `FIREBASE_APP_CHECK_DEBUG_TOKEN`.
- The token that appeared in the first CI emulator log was revoked and the artifact containing it was deleted. The active CI token is stored only in GitHub secrets and is used by an ephemeral, non-uploaded APK.
- Do not upload raw logcat that contains App Check debug tokens. The smoke script and AI reports redact the token.
