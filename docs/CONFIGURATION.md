# Tiny — Configuration and Environment Variables

## 1. Rules

- No secret is stored in source control, Android resources, Gradle BuildConfig, Room, DataStore, Firestore or logs.
- Android Firebase app configuration is public client configuration; it is not a server credential. Never include a service-account private key in the APK.
- Cloud credentials are held in Secret Manager / Firebase Functions secrets.
- Use distinct Firebase projects for development/staging and production when available.
- Never reuse production provider secrets in local or CI tests.

## 2. Firebase client configuration

| Item | Purpose | Handling |
|---|---|---|
| `google-services.json` | Firebase Android client configuration | Generated for exact app ID; not a server credential; include only per repo policy or retrieve using approved CI flow |
| Firebase project ID | Select Firebase project | Build flavor config; dev/staging only for preview |
| Android application ID | Package identity | Proposed safe default `ng.tiny.education`; verify ownership/conflict before pinning |
| App Check debug token | Local attestation | Local ignored file/CI secret; never production |
| Play Integrity | Production App Check | Firebase Console configuration, not app secret |

## 3. Cloud Functions configuration

| Name | Type | Required | Secret? | Purpose/default |
|---|---|---:|---:|---|
| `GCLOUD_PROJECT_ID` | Config | Yes | No | Non-production Firebase project ID |
| `FIREBASE_REGION` | Config | Yes | No | `africa-south1` |
| `FIRESTORE_DATABASE_ID` | Config | Yes | No | `(default)` unless approved otherwise |
| `APP_ENV` | Config | Yes | No | `development|staging|production` |
| `SMS_MODE` | Config | Yes | No | `sandbox` by default; production requires explicit authority |
| `ESMS_API_KEY` | Secret Manager | SMS only | Yes | eSMS API credential |
| `ESMS_WEBHOOK_SECRET` | Secret Manager | Webhook only | Yes | HMAC verification secret |
| `ESMS_SERVICE_ID` | Config | SMS only | No | Provider's approved shared-keyword service ID |
| `ESMS_SENDER_KEYWORD` | Config | Yes | No | `TINY` |
| `SMS_MONTHLY_BUDGET_MINOR` | Config | Yes | No | `0` until approved; integer in selected billing minor unit |
| `SMS_DAILY_SEGMENT_LIMIT` | Config | Yes | No | Conservative sandbox limit; production set by operator |
| `SMS_ALLOWED_RECIPIENTS` | Restricted config | Sandbox only | Personal data | Approved test numbers; no real parent numbers |
| `AI_DAILY_CLOUD_LIMIT_PER_USER` | Config | Yes | No | Conservative request cap; set during intake |
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
