# Tiny Firebase Integration Runbook

**Project:** `tiny-b9f29` (dedicated non-production project; project ID is public).
**Budget:** Spark / NGN 0. Billing is disabled. Do not upgrade to Blaze.
**Cloud Functions:** Gen2 deployment requires Blaze, so callables, webhooks and scheduled jobs remain emulator-only. Firestore, Auth (subject to the Console gate below), App Check and Firebase AI Logic are used on Spark within free quotas.

## 1. Current status (26 November 2026)

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
| App Check | **PARTIAL** | API and debug token registration verified; token revoked after the protocol test; enforcement is **off**; Play Integrity not configured |
| AI Logic | **PROTOCOL VERIFIED** | Gemini Developer API free tier through the Firebase AI Logic proxy with an App Check token; direct `generativelanguage` access remains blocked |
| Firebase Auth | **BLOCKED — CONSOLE ACTION** | Project has no Auth configuration; public `initializeAuth` rejects Spark with `BILLING_NOT_ENABLED` |
| Functions | **EMULATOR ONLY** | Backend E2E 10/10; no deployment |
| App-level Auth/Firestore/AI | **NOT YET VERIFIED** | The Firebase-enabled CI APK correctly stops at the phone-auth gate |

**Only immediate blocker:** initialize Firebase Authentication in the Firebase Console. See section 2. Do not enable billing to work around it.

## 2. Operator action: initialize Firebase Authentication (required)

The public Identity Platform API cannot initialize Auth on a Spark project:

```text
POST https://identitytoolkit.googleapis.com/v2/projects/tiny-b9f29/identityPlatform:initializeAuth
HTTP 400 BILLING_NOT_ENABLED
```

The Firebase Console uses a separate free-tier provisioning path. Perform this one-time action in a signed-in browser:

1. Open <https://console.firebase.google.com/project/tiny-b9f29/authentication>.
2. Select **Get started**.
3. Accept the Firebase Authentication terms if prompted.
4. Confirm the page shows the **Users** and **Sign-in method** tabs.
5. Do **not** enable billing, upgrade to Blaze, or add a payment method.

After this action, the agent can verify and continue:

```powershell
# Read the Auth config through the Admin API.
$token = (gcloud auth print-access-token)  # or an equivalent OAuth access token
curl.exe -s -H "Authorization: Bearer $token" `
  "https://identitytoolkit.googleapis.com/admin/v2/projects/tiny-b9f29/config"
```

Expected: a JSON config with `name: projects/tiny-b9f29/config`, not `CONFIGURATION_NOT_FOUND`.

If the Console itself says billing is required, stop and report it as a material conflict with the Spark/NGN 0 constraint. Do not upgrade or enable paid services.

### 2.1 Enable Phone Auth and synthetic test numbers

After Auth initialization, use the Console (simplest) or the Admin API:

- Console: **Authentication → Sign-in method → Phone → Enable**.
- Console: **Authentication → Sign-in method → Phone → Phone numbers for testing**.
- Add synthetic numbers only, for example:

```text
+2348000000001 -> 123456
+2348000000002 -> 654321
```

Real verification SMS is a Blaze-only feature and is **not authorized**. The app must use Firebase test phone numbers. Never add a real parent or guardian number.

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

## 4. App Check

### 4.1 What is configured

- Debug provider in debug builds; Play Integrity provider in release builds.
- App Check API enabled.
- A debug token was registered during the first protocol test, exchanged successfully, and then **revoked**. No debug token is currently registered.
- App Check enforcement remains **off** for Firestore, Auth and AI Logic until the app-level Auth flow is verified and release fingerprints are configured.
- Play Integrity still needs a Play Console app link and the release SHA-256 before production.

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

The on-device path is still unverified. The Samsung Galaxy Note 10+ (Android 12) is not a supported Gemini Nano device; an emulator does not prove physical Nano inference. Never claim on-device inference from configuration or from a cloud response.

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

Latest Firebase-enabled CI run: `https://github.com/onyebuchidaniel60/tiny/actions/runs/45873038243` — **success**. The emulator smoke run correctly stopped at the phone-auth gate because Auth is not initialized; its screenshots are not a completed journey. The smoke script now detects that gate, captures `tiny-03-auth-gate.png`, skips the local journey, and redacts the App Check debug token from logcat.

## 8. Verification checklist

- [x] CLI can list `tiny-b9f29` and the Android app.
- [x] Android dev debug app registered; `google-services.json` present locally (ignored).
- [x] Debug SHA-1/SHA-256 registered.
- [x] Firestore default database created; rules/indexes deployed.
- [x] App Check debug token registration/exchange verified, then revoked.
- [x] AI Logic proxy call with App Check verified.
- [x] Firestore rules deny unauthenticated reads on the live database.
- [ ] Firebase Auth initialized (Console action).
- [ ] Phone provider enabled; synthetic test numbers added; no real SMS.
- [ ] App-level test-phone sign-in succeeds.
- [ ] Firestore client reads/writes succeed for a signed-in synthetic user.
- [ ] App-level AI Logic call reports its source correctly.
- [ ] Callable sync works against the Functions emulator from the Android client.
- [ ] App Check enforcement enabled after the above.
- [ ] Play Integrity/release fingerprint configured before production.
- [ ] On-device status checked on supported hardware; no claim for Note 10+.

## 9. Troubleshooting

| Symptom | Cause | Action |
|---|---|---|
| `CONFIGURATION_NOT_FOUND` | Auth not initialized | Complete Console **Get started**; do not enable billing |
| `BILLING_NOT_ENABLED` from `initializeAuth` | Public Identity Platform API on Spark | Use the Console action; stop if it demands billing |
| App Check token registration returns 404 | Wrong project identifier | Use project **number** `1072757481941` and the app ID in the path |
| AI Logic `USER_PROJECT_DENIED` | Missing AI Logic service-agent role | Grant `roles/firebaseml.serviceAgent` to the `gcp-sa-firebaseml` identity; retry after propagation |
| AI Logic `SERVICE_DISABLED` | `aiplatform` endpoint used instead of the proxy | Use the `firebasevertexai.googleapis.com` Google AI path, not the Vertex `locations/.../publishers/...` path |
| Firestore 403 for a signed-in user | User is not a workspace/class member, or rules are correct | Verify membership; never weaken rules for a demo |
| Functions callable unavailable | Functions not deployed on Spark | Use the emulator only; do not deploy |

## 10. Secret handling

- Never commit `app/google-services.json`, App Check debug tokens, service-account JSON, OAuth access tokens or real phone numbers.
- GitHub Actions secrets currently used: `GOOGLE_SERVICES_JSON_BASE64`.
- The debug token that appeared in the first CI emulator log was revoked and the artifact containing it was deleted.
- Do not upload raw logcat that contains App Check debug tokens. The smoke script now redacts the token.
