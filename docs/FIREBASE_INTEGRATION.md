# Tiny Firebase Integration Runbook

**Project:** `tiny-b9f29` (dedicated non-production project; project ID is public).
**Budget:** Spark / NGN 0. Do not upgrade to Blaze.
**Constraint:** Cloud Functions Gen2 deployment requires Blaze, so callables, webhooks and scheduled jobs remain emulator-only. Firestore, Auth, App Check and Firebase AI Logic can be used on Spark, subject to quotas.

## 1. Operator authentication (current blocker)

The agent environment has no Firebase CLI account:

```text
! No authorized accounts, run "firebase login"
```

The operator must authenticate once in a terminal on the machine that holds the repository:

```powershell
npx --yes firebase-tools@15.14.0 login
```

If the browser callback cannot reach localhost:

```powershell
npx --yes firebase-tools@15.14.0 login --no-localhost
```

Then verify access:

```powershell
npx --yes firebase-tools@15.14.0 projects:list
npx --yes firebase-tools@15.14.0 apps:list --project tiny-b9f29
```

The authenticated Google account must have at least Firebase Admin/Editor access to `tiny-b9f29`. Do not paste tokens or service-account JSON into chat.

## 2. Register the Android apps

Two application IDs exist because the dev flavor and debug build add suffixes:

- Dev debug: `ng.tiny.education.dev.debug` (current preview APK)
- Release base: `ng.tiny.education`

Register at least the dev debug app now:

```powershell
npx --yes firebase-tools@15.14.0 apps:create ANDROID "Tiny dev debug" `
  --package-name ng.tiny.education.dev.debug `
  --project tiny-b9f29
```

Download client configuration:

```powershell
npx --yes firebase-tools@15.14.0 apps:sdkconfig ANDROID <APP_ID> --project tiny-b9f29 > app/google-services.json
```

`google-services.json` is public client configuration and is ignored by Git. Do not commit it. CI can inject it from a repository secret if a Firebase-enabled build is required.

## 3. Register signing fingerprints

Local Android debug certificate (public):

```text
SHA-1:   B1:5B:80:19:3C:C4:28:38:C2:3A:F9:97:5B:54:62:BB:83:6B:84:7C
SHA-256: 7A:F6:FE:85:20:E7:6A:F5:5A:86:C8:93:52:8D:00:B6:66:B7:42:D9:C4:10:4E:97:57:8E:F4:D3:B9:60:92:52
```

Add them to the Android app in Firebase Console (Project settings -> Your apps) or:

```powershell
npx --yes firebase-tools@15.14.0 apps:android:sha:create <APP_ID> <SHA>
```

These are needed for Phone Auth fallback and Play Integrity App Check.

## 4. Authentication

Firebase Console -> Authentication -> Sign-in method -> enable **Phone**.

**Spark constraint:** verification-code SMS is a Blaze-only feature. On Spark, only Firebase **test phone numbers** can complete phone auth. Add synthetic test numbers under Authentication -> Sign-in method -> Phone numbers for testing. Never add a real parent/guardian number. Suggested synthetic values:

```text
+2348000000001 -> 123456
+2348000000002 -> 654321
```

The app never hardcodes these codes. Real phone SMS remains disabled until the operator authorizes Blaze and a budget, which has not been approved.

## 5. Firestore

Create the default Firestore database in the project. Prefer the fixed region `africa-south1` if the Console offers it; record any incompatibility rather than silently changing region.

Deploy rules and indexes (free):

```powershell
npx --yes firebase-tools@15.14.0 deploy `
  --only firestore:rules,firestore:indexes `
  --project tiny-b9f29
```

Do not use `firestore:delete`, imports or destructive operations.

## 6. App Check

Debug builds install `DebugAppCheckProviderFactory`. On first run, logcat prints:

```text
Enter this debug secret into the allow list in the Firebase Console ... <token>
```

Register that token in App Check -> Apps -> Manage debug tokens. Do not commit it.

Release builds install `PlayIntegrityAppCheckProviderFactory`. Play Integrity requires a Play Console app linked to the Firebase project and the SHA-256 fingerprint above. App Check enforcement for Firestore/Auth should be enabled only after the debug token is registered and the app has been tested.

## 7. Firebase AI Logic

Firebase Console -> AI Services -> AI Logic -> Get started, choose **Gemini Developer API** (free tier, no billing). App Check is enforced by AI Logic.

The Android client is pinned to:

- Cloud model: `gemini-3.5-flash-lite` (featured model, billing not required)
- On-device mode: `PREFER_ON_DEVICE` with `firebase-ai-ondevice`
- Source is read from the SDK response, never inferred from configuration.

On-device inference requires a currently supported physical device with AICore and Android API 26+. The Galaxy Note 10+ (Android 12) is not a supported Gemini Nano device; the app must report the SDK status and fall back to cloud/curated content.

## 8. Functions emulator

Cloud Functions are not deployed. For local/emulator callable testing:

```powershell
npx --yes firebase-tools@15.14.0 emulators:start `
  --only auth,firestore,functions `
  --project demo-tiny
```

Build the debug APK with the emulator target:

```powershell
./gradlew assembleDevDebug -PfunctionsEmulator=true
```

The emulator host is `10.0.2.2:5001` for the Android emulator. This does not contact the real project. The production callable path requires a Blaze deployment, which is **not authorized**.

## 9. Verification checklist

- [ ] CLI account can list project `tiny-b9f29`.
- [ ] Android dev debug app registered; `google-services.json` present locally (ignored).
- [ ] Debug SHA-1/SHA-256 registered.
- [ ] Phone provider enabled; test numbers added; no real SMS.
- [ ] Firestore default database created; rules/indexes deployed.
- [ ] App Check debug token registered.
- [ ] AI Logic enabled with Gemini Developer API; App Check enforced.
- [ ] Local test-phone sign-in succeeds.
- [ ] App Check token accepted by Firestore/Auth/AI Logic.
- [ ] Callable sync works against the Functions emulator.
- [ ] On-device status is checked on supported hardware; no claim for Note 10+.
