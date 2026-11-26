# Tiny — Test Strategy and Acceptance

**Current development mode:** SMS tests use the deterministic mock adapter while `SMS_MODE=mock`. eSMS sandbox tests are deferred and require separate authorization. Firebase Functions are emulator-only under Spark/NGN 0; hosted Functions tests are not available.

## 1. Test pyramid

1. Unit tests: pure domain logic, validation, state transitions, locale/segment calculations.
2. Local persistence tests: Room/SQLCipher transaction and outbox durability.
3. Integration tests: Firebase Emulator Suite, callables, Firestore rules, webhook adapter and scheduled jobs.
4. UI tests: Compose UI on small-screen and font-scale configurations.
5. End-to-end tests: teacher/parent mock/sandbox journeys (mock first; eSMS sandbox only when authorized).
6. Physical-device tests: low/mid-range Android performance, real offline behavior and genuine on-device AI.
7. Security tests: tenant isolation, authorization, webhook signature/replay, secret/PII leakage and abuse limits.

## 2. Required test matrix

| Area | Test | Expected |
|---|---|---|
| Auth | Valid test phone/OTP | Teacher authenticated |
| Auth | Invalid/expired OTP | Generic failure; no account enumeration |
| Auth | OTP repeated/rate-limited | Provider quota respected; clear retry guidance |
| Workspace | School and independent creation | Correct role, unique school code and unverified status |
| Membership | Expired/revoked/used invite | Cannot join |
| Authorization | Tampered workspace/class/pupil ID | Server denies cross-tenant/unassigned access |
| Classes | Teacher assigned 2+ classes | Each class visible and scoped correctly |
| Pupil/guardian | Two guardians per pupil; one guardian linked to 2 pupils | Relationships work without duplication |
| Guardian verification | Valid JOIN from intended phone | Verified; invalid/expired/5th failed code is rejected/locked |
| Consent | STOP/opt-out | Non-essential outbound sends suppressed |
| Curriculum | Downloaded pack offline | Lesson opens with correct source/version |
| Lesson | Save/edit offline | Plan survives restart and syncs later |
| Attendance | Airplane mode, mark/submit | Room persists entries and outbox |
| Attendance | One active pupil unmarked | Submit blocked with clear count |
| Attendance | Present/late only | No immediate notification jobs |
| Attendance | An absent pupil | Jobs created only for eligible guardians |
| Attendance | Two concurrent submissions | First commit wins; second conflicts; no overwrite |
| Attendance | Retry same command | One session and one set of notification jobs |
| Attendance | Correction after absence alert | Append-only amendment and correction job |
| Sync | Network loss mid-batch | Retry only unacknowledged/retryable commands |
| Sync | Validation rejection | `needsAttention`; no silent loss or endless retry |
| Sync | App killed | Outbox survives and resumes |
| Messaging | Valid inbound webhook | Exactly one message/conversation created |
| Messaging | Invalid HMAC | Rejected; no message created |
| Messaging | Replayed provider event | Acknowledged idempotently; no duplicate message |
| Messaging | Sender maps to multiple schools | Ask for code; reveal no child details |
| Messaging | Teacher reply | Stored/queued; delivery status accurate |
| Messaging | API accepted, no delivery callback | Status remains accepted/unknown, not delivered |
| Messaging | Budget reached | Send blocked; no automatic override/top-up |
| Digest | Multiple linked pupils in same school | One consolidated guardian digest |
| Digest | Same guardian in two schools | Separate workspace-specific digests |
| Digest | Unapproved progress | Excluded |
| Digest | Incomplete record | Omit/label incomplete; never invent |
| Progress | Edit approved item | New revision and approval reset |
| Progress | `not_assessed` | Not displayed as a negative result |
| AI | Supported physical handset | SDK reports actual on-device source |
| AI | Connected cloud task | SDK reports cloud source |
| AI | Unsupported/offline | Curated fallback; no crash or false source claim |
| AI | Non-English/offline | Static reviewed content or unavailable notice |
| AI | Prompt injection/fabricated output | Rejected or treated as draft; no tool/database action |
| AI privacy | Inspect payload | No pupil/guardian PII in prompt or telemetry |
| Localization | All launch locales | No missing resource keys; placeholders preserved |
| SMS | Unicode segment estimate | Correct segment count and cost guard |
| Local privacy | Inspect storage/logs | SQLCipher DB; no plaintext secrets or PII logs |

## 3. Required end-to-end journeys

### E2E-01 — Independent teacher

Sign in → create independent workspace → create two classes → register pupil → add two guardians with different locales → issue verification challenge → parent mock JOIN from target phone → download curriculum pack.

### E2E-02 — Offline lesson and attendance

Download pack → airplane mode → open lesson → mark full roster → submit → terminate/restart app → confirm records/outbox survive → restore network → sync → confirm server session exactly once.

### E2E-03 — Absence notification

Submit mixed present/late/absent register → verify only absent creates jobs → mock adapter records accepted/failed/unknown status → verify guardian dedupe and localized template. eSMS sandbox is a later authorized variant.

### E2E-04 — Parent-initiated conversation

Send mock `TINY <school-code> <message>` through the deterministic adapter → signature/dedupe path exercised → sender resolves to guardian → message appears in teacher inbox → teacher replies → outbound status updates. eSMS sandbox is a later authorized variant.

### E2E-05 — Progress and digest

Create progress draft → preview → approve → run deterministic digest → approved item included, unapproved excluded, same-school siblings consolidated.

### E2E-06 — Hybrid AI proof

On physically supported handset run short English on-device request and record SDK source → connected cloud request and record source → unsupported handset falls back to curated resource.

## 4. Performance and low-resource verification

Measure on at least one low-end supported Android device from target community:
- Cold/warm startup.
- APK download/install and app size.
- Storage after bounded curriculum pack download.
- RAM during attendance list and lesson view.
- Battery use during normal class workflow.
- Data consumed during bootstrap and one sync batch.
- Behavior during intermittent network transitions.
- Readability at large system font scale.

Targets in `PROJECT_SPEC.md` are proposed engineering targets, not measured claims. Confirm or revise them based on a real baseline device before pilot. Avoid image/video/audio downloads in MVP.

## 5. Evidence retention

Store test reports, screenshots, device/API information, build hashes, emulator logs with PII redacted and sandbox provider event IDs in `artifacts/test-evidence/`. Link evidence from `AI_HANDOFF.md` and `docs/BUILD_LOG.md`.

## 6. Phase 1 evidence (26 November 2026)

- Android unit tests: **24 passed, 0 failed** across phone, attendance, SMS segmentation, progress, digest, sync rules and JSON escaping.
- Firestore rules tests: **9 passed, 0 failed** in the Firestore emulator, including class-scoped guardian/link/conversation/message reads.
- Functions domain tests: **19 passed, 0 failed** across 6 Vitest suites; TypeScript build passed.
- Backend emulator E2E: **10 passed, 0 failed** covering workspace/class/pupil/guardian/verification, absence job creation, progress approval, teacher reply, mixed sync batch replay, signed inbound SMS dedupe and weekly digest.
- Android lint: `lintDevDebug` passed after deferring the partial-translation `MissingTranslation` backlog.
- Android debug build: CI `assembleDevDebug` passed; final APK 31,094,724 bytes; SHA-256 `E124B01C005C93FF272A6B0617FF5A319C81442F165BCD09984ABEDC69327F72`.
- Emulator smoke: API 35 install/launch succeeded; 11 screens captured including the offline AI fallback; no Tiny fatal exception in logcat.
- Compose instrumentation journey: **1 passed, 0 failed** on API 35 Pixel 5 (onboarding to Home, Classes, class detail and Attendance), run by CI.
- Landing page: local link/nav/alt checks passed; responsive desktop/mobile screenshots captured.
- Not yet run: physical-device install, App Distribution, real Firebase project integration.

