# Tiny — Test Strategy and Acceptance

**Current development mode:** SMS tests use the deterministic mock adapter while `SMS_MODE=mock`. eSMS sandbox tests are deferred and require separate authorization. Firebase Functions are emulator-only under Spark/NGN 0; hosted Functions tests are not available. Browser tests run against the synthetic offline demo by default; the live Firebase/AI check is optional and manual.

## 1. Test pyramid

1. Unit tests: pure domain logic, validation, state transitions, locale/segment calculations.
2. Local persistence tests: Room/SQLCipher transaction and outbox durability.
3. Integration tests: Firebase Emulator Suite, callables, Firestore rules, webhook adapter and scheduled jobs.
4. UI tests: Compose UI on small-screen and font-scale configurations.
5. End-to-end tests: teacher/parent mock/sandbox journeys (mock first; eSMS sandbox only when authorized).
6. Physical-device tests: low/mid-range Android performance, real offline behavior and genuine on-device AI.
7. Browser tests: unit/component tests, Playwright teacher and guardian journeys, IndexedDB refresh recovery, PWA offline reload, responsive screenshots and axe accessibility checks.
8. Security tests: tenant isolation, authorization, webhook signature/replay, secret/PII leakage and abuse limits.

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
| Web persistence | Create class/pupil, attendance draft, lesson edit, refresh | State survives refresh; drafts are not lost |
| Web offline | Service worker active, go offline, reload | App shell loads, offline banner appears, local draft remains |
| Web sync honesty | Hosted build, queued edits | Shows pending/local-only; never claims acknowledged sync |
| Web messaging | Teacher reply and guardian simulator message | Both appear in the same local conversation; mock only |
| Web AI | Generate with SDK source | UI labels only the actual `inferenceSource`; fallback is labelled curated |
| Web accessibility | Home axe scan at desktop/mobile | No serious/critical WCAG 2 A/AA violations |
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

## 6. Phase 1 evidence (27 November 2026)

- Android unit tests: **35 passed, 0 failed** across phone, attendance, SMS segmentation, progress, digest, sync rules, JSON escaping and AI source labels.
- Firestore rules tests: **9 passed, 0 failed** in the Firestore emulator, including class-scoped guardian/link/conversation/message reads.
- Functions domain tests: **19 passed, 0 failed** across 6 Vitest suites; TypeScript build passed.
- Backend emulator E2E: **10 passed, 0 failed** covering workspace/class/pupil/guardian/verification, absence job creation, progress approval, teacher reply, mixed sync batch replay, signed inbound SMS dedupe and weekly digest.
- Android client sync E2E: manual run `45950447844`; `SyncEmulatorE2ETest` **1 passed, 0 failed** against local Auth/Firestore/Functions emulators, covering accepted acknowledgement, idempotent replay, transport retry and conflict.
- Android lint: `lintDevDebug` passed at that checkpoint after deferring the partial-translation `MissingTranslation` backlog. **Superseded 27 November 2026:** all locales are complete and lint passes without the suppression.
- Android debug build: CI `assembleDevDebug` passed; latest Firebase-enabled APK 31,097,300 bytes; SHA-256 `14105D643987805C534621E0F29ABBC8A18DB7F10E52EFD2C8AD5142957625D9`.
- Emulator smoke: API 35 install/launch succeeded; the Firebase-enabled build signed in with a synthetic test phone number, loaded the synthetic Firestore workspace, and captured `artifacts/emulator/tiny-04-authenticated.png`; launcher ANRs were dismissed and the debug token was redacted.
- Compose instrumentation journey: **1 passed, 0 failed** on API 35 Pixel 5 (onboarding to Home, Classes, class detail and Attendance), run by CI without Firebase client config.
- App-level AI smoke: manual private run `45950443728`; `AiLogicLiveTest` **1 passed, 0 failed**; on-device unavailable, cloud fallback, SDK source `Cloud Gemini`; ephemeral APK not uploaded. Public judge APK UI run `45950452014` shows the cloud response and `Source: Cloud Gemini` in `artifacts/emulator/tiny-ai-cloud.png`. In the normal instrumentation job the same test skips when Firebase config is absent.
- Landing page: local link/nav/alt checks passed; responsive desktop/mobile screenshots captured.
- Not yet run: physical-device install, App Distribution invitations (tester emails pending), App Check enforcement, supported-device Gemini Nano.

## 7. Browser companion evidence (27 November 2026)

- Typecheck: `npm run typecheck` passed with no TypeScript errors.
- Unit/component tests: **14 passed, 0 failed** across 5 Vitest files (domain validation, phone normalization, synthetic seed integrity, IndexedDB/localStorage persistence, AI source labels and the AI page source display).
- Production build: passed; PWA generated `dist/sw.js` with precache, `skipWaiting`, `clientsClaim` and an SPA navigation fallback.
- Playwright: **10 passed, 2 skipped** across desktop Chromium and mobile Chromium. The skipped tests are the live Firebase/AI checks, which require `TINY_LIVE_FIREBASE=1`.
- Live Firebase/AI: **1 passed, 0 failed** manually. The browser signed in with the synthetic Firebase account, bootstrapped `Tiny Web Demo Primary`, generated a strategy and displayed SDK-reported `Cloud Gemini`.
- Journeys covered: class creation and refresh recovery; full attendance submission; progress approval; teacher/guardian message exchange; offline banner and service-worker-backed reload with a preserved draft; desktop/mobile screenshots; home axe scan.
- Accessibility: **0 serious or critical** axe WCAG 2 A/AA violations on the home page at desktop and mobile widths.
- Responsive evidence: `artifacts/web/desktop-chromium-home.png`, `desktop-chromium-class.png`, `mobile-chromium-home.png`, `mobile-chromium-class.png`.
- Hosted AI evidence: `artifacts/web/tiny-web-ai-cloud.png` shows the result plus `Cloud Gemini` and `The SDK reported cloud inference.`
- Offline-startup regression: the offline demo now initializes without waiting for Firebase Auth, so a slow or unavailable Auth iframe cannot block the local workspace. The Playwright suite waits for service-worker control before simulating disconnection.
- Test-environment note: Firebase Auth creates a hidden iframe. On a slow network the browser `load` event can lag after the app is already usable, so browser tests wait for DOM readiness and assert visible UI rather than relying on `load`.
- CI: `.github/workflows/web-ci.yml` runs install, typecheck, unit tests, build, Playwright Chromium and accessibility checks, and uploads screenshots/report. Web run [45975389944](https://github.com/onyebuchidaniel60/tiny/actions/runs/45975389944) and Android/backend regression run [45975389893](https://github.com/onyebuchidaniel60/tiny/actions/runs/45975389893) passed on commit `86c9717`.
- CI hardening: the first web run (`45973072502`) exposed an immediate-navigation persistence race and a headless mobile fixed-nav hit-test issue. The app persists at action time and reads the synchronous recovery copy first; browser tests open routes directly while the responsive test verifies the mobile nav and href. The rerun is green.
- Not claimed: on-device Gemini Nano, hosted callable sync, live SMS, App Check enforcement, production deployment or cross-device synchronization.

See `docs/WEB_APP.md` for the full browser architecture and manual test guide.

## 8. Final polish, localization and tour evidence (27 November 2026)

- **Translation parity:** `node tools/generate-i18n.mjs --check` → **754 keys × 4 languages**, placeholders and plural pairs aligned, generated files current.
- **Hardcoded-string guard:** `node tools/check-ui-strings.mjs` → **0 findings** across web TSX and Android Compose.
- **Web typecheck/build:** `npm run typecheck` and `npm run build` passed.
- **Web unit/component:** **23 passed, 0 failed** across 6 Vitest files. Includes catalogue parity, placeholder parity, immediate language re-render, persistence, plural/date output, AI source, IndexedDB, seed and domain tests.
- **Web Playwright:** **36 passed, 0 failed, 3 skipped** across desktop 1440, tablet 820 and mobile Pixel 5. Covered class creation/refresh, attendance, progress approval, teacher/guardian messages, offline banner/reload, teacher tour persistence/replay, guardian guide, language switch/persistence and 60 per-language screenshots. The skipped tests are the opt-in live Firebase/AI checks.
- **Accessibility:** **0 serious/critical** axe WCAG 2 A/AA violations on Home at all tested widths.
- **Responsive:** no horizontal overflow (`scrollWidth - innerWidth <= 1`) in any language at any tested width.
- **Android:** compile passed in CI after fixing resource-name, `UiMessage`, icon and locale-observability defects; lint/unit/APK and emulator evidence are recorded in `docs/BUILD_LOG.md` and the GitHub Actions run.
- **Android JVM:** **37 passed, 0 failed** in CI run [46011216901](https://github.com/onyebuchidaniel60/tiny/actions/runs/46011216901), including the two `LocalizationTest` cases that compare all four resource files for string/plural keys, non-empty values and interpolation placeholders.
- **Visual evidence:** `artifacts/web/i18n/` (60 files). Android emulator evidence is generated by the manual `android-ci` emulator job.
- **Android sync E2E:** run [46021037254](https://github.com/onyebuchidaniel60/tiny/actions/runs/46021037254) passed against local Auth/Firestore/Functions emulators (accepted acknowledgement, idempotent replay, retry and conflict).
- **Live private AI:** run [46022015152](https://github.com/onyebuchidaniel60/tiny/actions/runs/46022015152) passed; on-device unavailable, cloud fallback used, SDK source reported; ephemeral APK not uploaded.
- **Not run:** physical-device installation/TalkBack, native-language review, App Check enforcement, Play Integrity, hosted Functions, live SMS or on-device Nano.

## 9. Shared intelligence and cross-platform evidence (28 November 2026)

- **Canonical dataset guard:** `node tools/check-canonical-dataset.mjs` → `20 Android ids shared with web; 8 pupils, 2 classes, 7 attendance dates, 24 assessments, 10 observations, 4 follow-ups.` Runs in both CI workflows.
- **Web unit/component:** **29 passed, 0 failed** across 7 files, including 6 deterministic-intelligence tests for attendance, statuses, trends, class gaps, follow-up suggestions, de-identified prompts and parent drafts.
- **Web browser:** **41 passed, 0 failed, 7 skipped** across desktop 1440, tablet 820 and mobile Pixel 5. New evidence/intelligence screenshots and a desktop axe sweep cover `/pupils`, `/pupils/pupil_amina`, `/classes/class_p4_blue/intelligence`, `/followups` and `/intelligence`. Skips are 3 opt-in live Firebase/AI checks, 2 duplicate non-desktop axe sweeps and 2 non-desktop demo captures.
- **Shared numbers:** both engines return the same whole-number values: Amina 100% / 87% / strong, Musa 43% / 51% / needs attention, Ngozi 70% / +12 points / improving, P4 class 79% attendance / 61% assessment / `plant_parts` gap.
- **Android JVM:** **41 passed, 0 failed**, including 4 `IntelligenceEngineTest` cases that mirror the web fixtures and assert status, confidence, evidence counts and fingerprint changes.
- **Functions domain:** **19 passed, 0 failed**. **Rules:** **9 passed, 0 failed**. **Backend emulator E2E:** **11 passed, 0 failed**, adding `lesson.upsert`, `assessment.record`, `followup.upsert` and `followup.status`, accepted replay and a stale-version conflict.
- **Android build:** lint, JVM tests and `assembleDevDebug` passed; the workflow now runs `zipalign -c` and `apksigner verify --print-certs` and uploads `apk-signing.txt`, `zipalign.txt` and `apk-summary.txt`.
- **Cross-platform limitation:** a single deployed browser↔Android run is still blocked by emulator-only Functions on Spark. The exact operations verified at the emulator contract layer, and those not run end-to-end, are listed in `docs/CROSS_PLATFORM_SYNC.md` section 6. Do not report the blocked rows as passing.

