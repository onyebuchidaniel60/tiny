/**
 * Environment for emulator-backed suites. These values are only used when the
 * suite is executed under `firebase emulators:exec`; no real project,
 * credential or paid resource is involved.
 */
process.env.FUNCTIONS_EMULATOR = 'true';
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT ?? 'demo-tiny-e2e';
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
process.env.PHONE_HASH_SECRET = process.env.PHONE_HASH_SECRET ?? 'tiny-emulator-test-phone-secret';
process.env.ESMS_WEBHOOK_SECRET = process.env.ESMS_WEBHOOK_SECRET ?? 'tiny-emulator-test-webhook-secret';
