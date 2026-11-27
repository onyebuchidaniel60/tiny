# Tiny — Configuration and Environment Variables

**Credential register:** See `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md` for exact ownership, secure delivery locations and timing. Safe placeholders are in `.env.example`; real values never belong in Git.

## 1. Rules

- No secret is stored in source control, Android resources, Gradle BuildConfig, Room, DataStore, Firestore, browser source or logs.
- Android Firebase app configuration and Firebase Web configuration are public client configuration; they are not server credentials. Never include a service-account private key in the APK or browser bundle.
- Cloud credentials are held in Secret Manager / Firebase Functions secrets.
- Use distinct Firebase projects for development/staging and production when available.
- Never reuse production provider secrets in local or CI tests.

## 2. Firebase client configuration

| Item | Purpose | Handling |
|---|---|---|
| `google-services.json` | Firebase Android client configuration | Generated for exact app ID; not a server credential; include only per repo policy or retrieve using approved CI flow |
| Firebase project ID | Select Firebase project | `tiny-b9f29`; Spark/NGN 0; Functions emulator-only |
| Android application ID | Package identity | Proposed safe default `ng.tiny.education`; verify ownership/conflict before pinning |
| App Check debug token | Local attestation | Local ignored file/CI secret; never production |
| Play Integrity | Production App Check | Firebase Console configuration, not app secret |

## 2a. Browser companion configuration

The browser preview uses `web/.env.example` as its safe template and an ignored `web/.env.local` for local builds. The Firebase Web API key, app ID, project ID, Auth domain, sender ID and storage bucket are public client configuration, not server credentials.

| Variable | Required | Secret? | Purpose |
|---|---:|---:|---|
| `VITE_FIREBASE_API_KEY` | Yes | No | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | No | `tiny-b9f29.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Yes | No | `tiny-b9f29` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | No | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | No | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | No | Registered web app ID |
| `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` | Preview only | Revocable | Dedicated web App Check debug token |
| `VITE_RECAPTCHA_SITE_KEY` | No | No | Optional real reCAPTCHA Enterprise site key |
| `VITE_DEMO_EMAIL` | No | Synthetic | Prefilled preview email |
| `VITE_DEMO_PASSWORD` | No | Synthetic | Prefilled preview password |
| `VITE_FUNCTIONS_EMULATOR` | No | No | `true` only for local Functions-emulator sync |

Handling rules:

- Never commit `web/.env.local`; it is ignored by `.gitignore`.
- The web App Check debug token is registered for the synthetic preview and embedded in the hosted client so judges can use AI Logic. It is revocable, not a server secret and must be revoked after judging.
- CI uses the GitHub secret `FIREBASE_WEB_APP_CHECK_DEBUG_TOKEN`; the token is never printed in logs or committed.
- The synthetic demo email/password is public preview information only. Do not reuse the password for a real account.
- The hosted build uses `VITE_FUNCTIONS_EMULATOR=false`; it must never claim hosted callable sync.
- Do not add service-account JSON, private keys or production credentials to the web build.
- The hosting domains (`tiny-b9f29.web.app` and `tiny-b9f29.firebaseapp.com`) must remain in Firebase Auth authorized domains; do not disable them to make local testing pass.

## 3. Cloud Functions configuration

| Name | Type | Required | Secret? | Purpose/default |
|---|---|---:|---:|---|
| `GCLOUD_PROJECT_ID` | Config | Yes | No | `tiny-b9f29` (non-production) |
| `FIREBASE_REGION` | Config | Yes | No | `africa-south1` |
| `FIRESTORE_DATABASE_ID` | Config | Yes | No | `(default)` unless approved otherwise |
| `APP_ENV` | Config | Yes | No | `development|staging|production` |
| `SMS_MODE` | Config | Yes | No | `mock` for current development; `sandbox` or `production` requires explicit authority |
| `ESMS_API_KEY` | Secret Manager | SMS only | Yes | eSMS API credential; not required while `SMS_MODE=mock` |
| `ESMS_WEBHOOK_SECRET` | Secret Manager | Webhook only | Yes | HMAC verification secret; not required while `SMS_MODE=mock` |
| `ESMS_SERVICE_ID` | Config | SMS only | No | Provider's approved shared-keyword service ID |
| `ESMS_SENDER_KEYWORD` | Config | Yes | No | `TINY` |
| `SMS_MONTHLY_BUDGET_MINOR` | Config | Yes | No | `0` until approved; integer in selected billing minor unit |
| `SMS_DAILY_SEGMENT_LIMIT` | Config | Yes | No | `0` until approved; sandbox/test limit set by operator |
| `SMS_ALLOWED_RECIPIENTS` | Restricted config | Sandbox only | Personal data | Approved test numbers; no real parent numbers |
| `AI_DAILY_CLOUD_LIMIT_PER_USER` | Config | Yes | No | Conservative request cap; `PENDING` until AI integration; `0` disables |
| `AI_MAX_OUTPUT_TOKENS` | Config | Yes | No | Small task cap; target <=256 where model supports |
| `INVITATION_TTL_DAYS` | Config | Yes | No | `7` |
| `SYNC_BATCH_LIMIT` | Config | Yes | No | `20` |
| `DIGEST_TIMEZONE` | Config | Yes | No | `Africa/Lagos` |
| `DIGEST_CRON` | Config | Yes | No | Friday 15:00 local time |

## 4. Functions secret provisioning

Use Firebase Functions secrets / Google Secret Manager. Document exact CLI or Console steps and verify secret versions without printing values. Grant access only to the Functions runtime service account. CI may deploy a secret reference but must not expose values in logs.

## 5. Android build flavors

Expected flavors: `dev`, `staging`, optionally `prod`. Use distinct application ID suffixes for non-production variants where appropriate. `dev` points only to Emulator Suite or development Firebase; `staging` points to the non-production project. Production release remains disabled until explicitly authorized.

No SMS API key is compiled into any flavor. AI requests use Firebase AI Logic and App Check; no Gemini API key is copied into Kotlin source or local client resources.

## 6. Cost safety

Google Cloud/Firebase budget alerts are not hard spending caps. Use quotas, conservative instance limits, provider send guards, request limits and manual production activation. Do not rely on billing alerts alone. No unapproved top-ups, SMS commitments or cloud spend.

## 7. Configuration acceptance

- Every variable has a real consumer and input validation.
- `.env.example` contains safe placeholders only.
- Startup fails closed if production mode is selected without budget, allowlist and release authorization.
- Logs redact secrets and personal data.
- CI/local builds use separate project configuration.
- Production configuration is never the default.
