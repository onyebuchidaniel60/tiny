# Tiny — Build Log

**Status:** Phase 1 local/CI preview is implemented and verified (Android shell, encrypted local data, CI APK, rules tests, backend E2E, instrumentation, emulator evidence, landing page, demo). Phase 2/3 backend foundations are emulator-tested; the Android client transport remains mock. No production deployment, live SMS or Firebase project resources have been created.

## Planning baseline

- Product: Tiny, Android-first offline rural teacher-support and parent-engagement platform.
- Blueprint: `../TINY_PROJECT_BLUEPRINT.md`.
- Methodology: `PROPER_VIBE_CODING_WORKFLOW.md`.
- The blueprint preparation made no code changes; Phase 0/1 documentation and implementation updates are recorded below.
- No production data, live SMS, Blaze activation or production deployment has been performed.

## Phase 0 checkpoint — 25–26 November 2026

- Objective: Complete the one consolidated operator intake/readiness check without modifying application code.
- Implementation completed: Read-only inspection of the handoff package, Git state, repository contents and local environment. Updated `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md`, `AI_HANDOFF.md`, configuration/setup/deployment docs, credential register, CI guide, `.env.example`, `.gitignore` and this log.
- Tests executed and results: Package validation — 29 Markdown files; relative links resolve; fenced code blocks balanced; workflow SHA-256 matches the recorded value. No app build existed at this checkpoint.
- Manual verification: Repository clean at `690beef` before Phase 0 docs; branch `main`; remote reachable; GitHub repository public with admin access; no secrets or real pupil data.
- Commit hash: `58d1b33`, `342e0cd` (Phase 0 documentation checkpoints).
- Preview artifact/build URL: None at this checkpoint.
- Reference image/skill status: Original references were pending at first, then supplied on 26 November 2026. See Phase 1.
- Documentation updated: Intake, handoff, reference register, configuration/credential register, CI guide, README, package index, build log.
- Known limitations: Firebase project/App Distribution access later; on-device Gemini Nano separate gate; no real Firebase resources.
- Budget/authorization notes: Cloud, AI, SMS, voice and third-party budgets are NGN 0. Production deployment, Blaze, live SMS and real pupil/guardian data remain NOT AUTHORIZED. Mock SMS is authorized.
- Next phase/task: Start Phase 1 after references supplied.

## Phase 1 checkpoint — 26 November 2026

- Objective: Establish a navigable Android preview shell, local encrypted foundation, CI build path, Firebase developer tooling and the public landing page.
- Implementation completed:
  - Installed official Firebase Agent Skills under `.agents/skills/` and preserved `skills-lock.json` (source commit `99954a30898bb5ddc8152ee10e124dc3b4106bf7`).
  - Live catalog renamed selected IDs: `firebase-firestore-standard` → `firebase-firestore`; `firestore-security-rules-auditor` → `firebase-security-rules-auditor`; `firebase-local-env-setup` absent (covered by `firebase-basics` + official emulator docs). Installed `firestore-rules-creation` in addition.
  - Built Kotlin/Jetpack Compose app shell with onboarding language selection, preview welcome, Home/Classes/Lessons/Messages/Settings navigation, attendance draft/submit, progress draft/approval, mock conversation/reply, sync center, settings, local pupil registration and an honest offline AI fallback screen.
  - Added Room schema/entities/DAOs, SQLCipher open-helper, Android Keystore-wrapped database key, DataStore preferences, synthetic demo data, repositories and mock SMS/sync adapters.
  - Added Firebase Functions TypeScript backend scaffold: callables, signed webhook handlers, scheduled digest, Firestore rules/indexes, demo emulator config.
  - Added GitHub Actions Ubuntu workflow for Functions tests, Android lint/unit tests/debug APK, artifact upload and optional App Distribution job.
  - Added responsive landing page (`landing/`) with original warm paper/riso visual system, product walkthrough, build-status disclosure, privacy/security/contact pages and screenshots.
  - Added `.env.example`, `.gitignore` and credential/CI documentation.
- Tests executed and results:
  - Android unit tests: **24 passed, 0 failed** (`PhoneNormalizer`, `AttendanceRules`, `SmsSegments`, `ProgressRules`, `DigestBuilder`, `SyncRules`, `JsonStrings`).
  - Firestore rules tests: **8 passed, 0 failed** in the Firestore emulator, including class-scoped guardian/link/conversation/message access.
  - Backend emulator E2E: **10 passed, 0 failed** (workspace/class/pupil/guardian/verification, attendance absence job, progress approval, teacher reply, mixed sync batch + replay, signed inbound SMS + dedupe, weekly digest).
  - Android CI build: **successful**; final APK **27,922,939 bytes**; SHA-256 `F2EC24590878B0F34777157C2BF97358BC8975E461E055C42ED261504F0BCA25`.
  - Emulator smoke: **successful** on API 35; captured language, welcome, home, classes, class detail, attendance, lessons, AI fallback, messages, conversation and settings screens.
  - Android lint: `lintDevDebug` **successful** after explicitly deferring the partial-translation `MissingTranslation` backlog; no lint errors remain.
  - Functions: `npm run build` **successful**; Vitest **19 passed, 0 failed** across 6 domain suites; rules suite 8/8; backend E2E suite 10/10.
  - Landing page: local link check passed; responsive layout inspected at 1440 px and 390 px; mobile nav toggles correctly; no broken local links; no images without alt.
- Manual verification: Desktop/mobile screenshots saved at `artifacts/screenshots/landing-desktop-full.png`, `landing-mobile-top.png` and `landing-mobile-revealed.png`. References recorded in `REFERENCE_ASSETS.md`.
- Commit hash: Phase 1 commits through `13b7e60`, `7171891`, `00318fc`, `2776ba1`.
- Preview artifact/build URL: GitHub Actions run `45809071551`; artifact `tiny-dev-debug-apk`; APK 27,922,939 bytes; SHA-256 `F2EC24590878B0F34777157C2BF97358BC8975E461E055C42ED261504F0BCA25`. No App Distribution upload.
- Reference image/skill status: REF-001/REF-002 supplied and recorded. StageShow installation attempted; harness removed the `stageshow` skill ID after a server restart, so it was not used and completion is not claimed. Firebase skills installed and visible in the active tool catalog.
- Documentation updated: `REFERENCE_ASSETS.md`, `OPERATOR_INTAKE.md`, `AI_HANDOFF.md`, `README.md`, `PACKAGE_INDEX.md`, `docs/DESIGN_NOTES.md`, this build log and source docs.
- Known limitations:
  - No physical Android device connected during this checkpoint; Note 10+ is Android 12 and general-testing only, not Gemini Nano-supported.
  - No Firebase project, App Distribution tester access or hosted Functions; Spark/NGN 0 keeps Functions emulator-only.
  - Hausa/Yoruba/Igbo app strings are partial draft resources pending native review; English fallback is active.
  - `syncCommands` now dispatches supported offline commands through the same validated callable handlers, writes accepted/rejected receipts, and replays accepted commands idempotently. The Android client still uses the mock sync engine because no Firebase project is configured.
  - GitHub Actions, Emulator Suite, instrumentation and demo evidence are recorded in later checkpoints.
  - StageShow skill unavailable; landing page used direct design-system discipline.
- Budget/authorization notes: NGN 0; mock SMS only; no Blaze, paid hosting, real parent messages or production data.
- Next phase/task: Final external-gate report and any operator-authorized follow-up.

## Phase 2/3/5 checkpoint — 26 November 2026

- Objective: Complete the offline-command backend, tighten data access, and prove the core flows end-to-end in emulators.
- Implementation completed:
  - `syncCommands` now dispatches `pupil.register`, `attendance.submit`, `progress.upsert`, `progress.approve` and `message.reply` through the same validated callable handlers, with per-command receipts and idempotent replay.
  - Added complete Android outbox payloads (attendance entries, progress fields, message client id, pupil registration details) with JSON escaping tests.
  - Guardian verification codes and school codes now use unambiguous 8-character random codes, removing a length flake.
  - Pupil documents store `classId`; guardian documents store `classIds`/`pupilIds`; links store `classId`; inbound conversations store `classId`/`pupilId`.
  - Firestore rules now scope guardian, link, conversation and message reads to an assigned class; direct writes remain denied.
  - Added a 10-test backend emulator suite (callables, webhook, scheduler, sync) and grew rules tests to 8.
  - Startup now waits for the encrypted local seed before composing, fixing a first-launch race that showed zero classes/pending.
  - Added a Compose instrumentation journey (onboarding → Home → Classes → class detail → Attendance) and a CI emulator job.
- Tests executed and results:
  - Android unit: **24 passed, 0 failed**.
  - Functions domain: **19 passed, 0 failed**; TypeScript build passed.
  - Firestore rules: **8 passed, 0 failed**.
  - Backend E2E: **10 passed, 0 failed**.
  - Compose instrumentation: **1 passed, 0 failed** on API 35 Pixel 5.
  - GitHub Actions run `45809071551`: **success** for build/test, backend, rules, instrumentation and manual emulator smoke.
- Manual verification: reviewed demo video frames; identified and fixed the Home zero-classes race before final recapture.
- Commit hash: `13b7e60`, `7171891`, `00318fc`, `2776ba1`, `0082163`.
- Preview artifact/build URL: `https://github.com/onyebuchidaniel60/tiny/actions/runs/45809071551`.
- Known limitations: Android sync transport still mock; no live Firebase project, Auth, Firestore, App Check, App Distribution or hosted Functions; no physical device run; no on-device Gemini Nano.
- Budget/authorization notes: Spark/NGN 0; emulator and synthetic data only.
- Next phase/task: final emulator recapture/demo, docs polish, physical-device/App Distribution gates.

## Operator confirmations received

- Git: direct commits/pushes to public `main` authorized; no force-push, history rewrite, branch deletion or visibility change.
- UI references: Framer Atelio Studio (visual direction) and PASS landing page (structure/storytelling) supplied 26 November 2026; reference-only rights. Original Tiny identity required.
- Device: Samsung Galaxy Note 10+, Android 12, only physical device; general testing only, not Gemini Nano-supported. No second device is planned.
- Build: GitHub Actions Ubuntu preferred; no full Android Studio installation on Windows.
- Firebase: dedicated non-production project to be created/supplied; project access is a later integration gate. Gemini Developer API free tier; Spark; no billing/Blaze/paid service without explicit approval; Emulator Suite and synthetic data.
- Distribution: Firebase App Distribution preferred; tester/judge access still pending.
- Functions: emulator-only under Spark/NGN 0; no deploy/Blaze/paid hosting.
- Credentials: complete register; `.env.example` placeholders only; no credentials through chat.
- Budgets: cloud NGN 0; paid AI NGN 0; SMS/voice NGN 0; paid third-party NGN 0.
- SMS: mock adapter authorized; no live sends.
- Data: synthetic only; production blocked until privacy/legal/security gates pass.
- Demo: Firebase hackathon judges/product evaluators; 90–150 seconds (max 180); `artifacts/demo/`.

## Phase 0/1 findings

### Device support

- Samsung Galaxy Note 10+ (Android 12) is not on the official ML Kit GenAI direct-model-access supported-device list retrieved 25 November 2026 from `https://developers.google.com/ml-kit/genai`.
- It is a general testing device only. Emulators do not prove physical Gemini Nano inference.
- Hybrid AI acceptance remains incomplete until both on-device and cloud paths are tested with source evidence.

### Firebase plan

- Spark plan and NGN 0 are confirmed.
- Official Firebase documentation states Cloud Functions deployment requires Blaze.
- Backend/functions are emulator-only; no hosted Functions, webhook endpoint or scheduled digest deployment is available.
- Gemini Developer API free tier is compatible with Spark within free limits; no paid AI.

### Build and distribution

- GitHub Actions `ubuntu-24.04` is the primary Android build/test environment.
- Firebase App Distribution is the preferred preview route; `internal-testers`/`judges` groups and a Firebase project are still needed before first distribution. No public APK link.
- Workflow permissions, signing and judge-access requirements are in `docs/CI_ANDROID_BUILD.md`.

### Credential handling

- Complete register: `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`.
- Safe template: `.env.example`; `.gitignore` excludes local secrets, keystores and Firebase client config.
- No secret values were requested, displayed or committed.

## Phase evidence log

| Phase | Status | Commit | Preview build/URL | Tests/evidence | Issues |
|---|---|---|---|---|---|
| 0 — Operator intake/readiness | COMPLETE — current scope | `58d1b33`, `342e0cd` | — | Package validation; repo/environment inspected; budget/authority explicit | Firebase project/App Distribution later; on-device AI separate gate |
| 1 - Repo + skeletal Android shell + protected preview | COMPLETE for local/CI scope; App Distribution pending | `9d9b060`, `13b7e60`, `00318fc` | CI artifact `tiny-dev-debug-apk`; run 45809071551 | 24 Android unit tests, 19 Functions tests, 8 rules tests, 10 backend E2E tests, lint, CI build, instrumentation, emulator smoke/screens | App Distribution/judge access pending; physical-device run pending |
| 2 - Backend/data/auth foundation | EMULATOR-VERIFIED; live project pending | `13b7e60` | - | Functions build; 8 rules tests; demo project aliases; config/indexes | Real Firebase project/Auth/Firestore integration pending |
| 3 - Core domain + APIs + integrations | SERVER IMPLEMENTED + E2E; Android transport pending | `13b7e60` | - | 19 domain tests; 10 callable/webhook/scheduler/sync E2E tests; sync dispatcher | Android WorkManager transport needs a configured Firebase project |
| 4 - Functional Android integration | PARTIAL | `13b7e60`, `00318fc` | CI APK | Local Room flows, mock attendance/progress/messages, pupil registration, startup seed gate, instrumentation journey | Cloud integration and broader device QA pending |
| 5 - E2E functionality gate | PARTIAL - emulator-level | `13b7e60` | CI backend job | 10 backend E2E tests + instrumentation + manual smoke | Hosted backend and physical low-end device unavailable; on-device AI gate separate |
| 6 - Reference-led final UI | PARTIAL | `2776ba1` | Landing page + app screenshots | Original visual system, responsive landing, app screens, AI card fix | StageShow unavailable; final visual/accessibility pass on a physical device pending |
| 7 - Frontend/docs completeness | COMPLETE for preview scope | `2776ba1` | - | README, API/data/security/testing/setup/deployment docs, landing legal/security/contact, demo notes | Native translation review and pilot legal gates pending |
| 8 - Demo video | COMPLETE for preview; motion capture not claimed | `2776ba1` | `artifacts/demo/tiny-demo.mp4` | 146.2s 1080p H.264/AAC slideshow from real emulator screenshots incl. AI fallback; captions/script/notes | No motion screen recording; physical-device capture absent |
| 9 - Final regression/security/release | PARTIAL - release blocked | `2776ba1` | - | Unit/domain/rules/E2E/instrumentation green; rules tightened; secrets scan; zero-spend boundaries | Production authority not granted; Spark/NGN 0; no App Distribution or physical-device release validation |

## Firebase Agent Skills and MCP status

- Installed: `firebase-basics`, `firebase-auth-basics`, `firebase-firestore`, `firebase-security-rules-auditor`, `firestore-rules-creation`.
- Source: official `firebase/agent-skills`; commit `99954a30898bb5ddc8152ee10e124dc3b4106bf7`; lockfile preserved.
- Live catalog mapping: `firebase-firestore-standard` → `firebase-firestore`; `firestore-security-rules-auditor` → `firebase-security-rules-auditor`; `firebase-local-env-setup` not present in live catalog (covered by `firebase-basics` + official emulator docs).
- Discovery: Firebase skills are visible in the active OpenCode tool catalog. The `opencode` CLI is not on PATH, so a separate fresh-session CLI check was not possible; this limitation is recorded.
- StageShow: install attempted; harness removed the skill ID after restart. Not used; not claimed complete.
- Firebase MCP: disabled until non-production project/access and operation scope are authorized.
- No Firebase resources created or modified.

## Checkpoint entry template

### YYYY-MM-DD — Phase N

- Objective:
- Implementation completed:
- Tests executed and results:
- Manual verification:
- Commit hash:
- Preview artifact/build URL:
- Reference image/skill status:
- Documentation updated:
- Known limitations:
- Budget/authorization notes:
- Next phase/task:


