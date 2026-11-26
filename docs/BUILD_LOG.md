# Tiny — Build Log

**Status:** Phase 1 implementation in progress. Android shell, local encrypted data layer, Functions/rules scaffold, CI workflow and landing page exist. No production deployment, live SMS or Firebase project resources have been created.

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
  - Built Kotlin/Jetpack Compose app shell with onboarding language selection, preview welcome, Home/Classes/Lessons/Messages/Settings navigation, attendance draft/submit, progress draft/approval, mock conversation/reply, sync center and settings.
  - Added Room schema/entities/DAOs, SQLCipher open-helper, Android Keystore-wrapped database key, DataStore preferences, synthetic demo data, repositories and mock SMS/sync adapters.
  - Added Firebase Functions TypeScript backend scaffold: callables, signed webhook handlers, scheduled digest, Firestore rules/indexes, demo emulator config.
  - Added GitHub Actions Ubuntu workflow for Functions tests, Android lint/unit tests/debug APK, artifact upload and optional App Distribution job.
  - Added responsive landing page (`landing/`) with original warm paper/riso visual system, product walkthrough, build-status disclosure, privacy/security/contact pages and screenshots.
  - Added `.env.example`, `.gitignore` and credential/CI documentation.
- Tests executed and results:
  - Android unit tests: **21 passed, 0 failed** (`PhoneNormalizer`, `AttendanceRules`, `SmsSegments`, `ProgressRules`, `DigestBuilder`, `SyncRules`).
  - Firestore rules tests: **6 passed, 0 failed** in the Firestore emulator.
  - Android CI build: **successful**; APK **27,897,539 bytes**; SHA-256 `1C67BEDF8A24FB0BD36359F77828B945880C7316F4DB99F056D95199BC8D85DD`.
  - Emulator smoke: **successful** on API 35; captured language, welcome, home, classes, class detail, attendance, lessons, messages, conversation and settings screens.
  - Android lint: `lintDevDebug` **successful** after explicitly deferring the partial-translation `MissingTranslation` backlog; no lint errors remain.
  - Functions: `npm run build` **successful**; Vitest **19 passed, 0 failed** across 6 domain suites; rules suite 6/6.
  - Landing page: local link check passed; responsive layout inspected at 1440 px and 390 px; mobile nav toggles correctly; no broken local links; no images without alt.
- Manual verification: Desktop/mobile screenshots saved at `artifacts/screenshots/landing-desktop-full.png`, `landing-mobile-top.png` and `landing-mobile-revealed.png`. References recorded in `REFERENCE_ASSETS.md`.
- Commit hash: Phase 1 implementation commits through `8286d9a`; final checkpoint commit to be recorded after the next push.
- Preview artifact/build URL: GitHub Actions run `45784722613`; artifact `tiny-dev-debug-apk`; APK 27,897,539 bytes; SHA-256 `1C67BEDF8A24FB0BD36359F77828B945880C7316F4DB99F056D95199BC8D85DD`. No App Distribution upload.
- Reference image/skill status: REF-001/REF-002 supplied and recorded. StageShow installation attempted; harness removed the `stageshow` skill ID after a server restart, so it was not used and completion is not claimed. Firebase skills installed and visible in the active tool catalog.
- Documentation updated: `REFERENCE_ASSETS.md`, `OPERATOR_INTAKE.md`, `AI_HANDOFF.md`, `README.md`, `PACKAGE_INDEX.md`, `docs/DESIGN_NOTES.md` (pending), this build log and source docs.
- Known limitations:
  - No physical Android device connected during this checkpoint; Note 10+ is Android 12 and general-testing only, not Gemini Nano-supported.
  - No Firebase project, App Distribution tester access or hosted Functions; Spark/NGN 0 keeps Functions emulator-only.
  - Hausa/Yoruba/Igbo app strings are partial draft resources pending native review; English fallback is active.
  - `syncCommands` validates batches and receipts but the full offline command processor remains scaffolded; direct callables cover the main flows.
  - GitHub Actions and Emulator Suite runtime verification are pending the first push/CI run.
  - StageShow skill unavailable; landing page used direct design-system discipline.
- Budget/authorization notes: NGN 0; mock SMS only; no Blaze, paid hosting, real parent messages or production data.
- Next phase/task: Push Phase 1, run GitHub Actions, fix CI failures, verify the APK artifact, then continue Phase 2 Firebase/emulator/rules testing and Phase 3 domain completion.

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
| 1 — Repo + skeletal Android shell + protected preview | COMPLETE for local/CI scope; App Distribution pending | `9d9b060`, `8286d9a` | CI artifact `tiny-dev-debug-apk`; run 45784722613 | 21 Android tests, 19 Functions tests, 6 rules tests, lint, CI build, emulator smoke/screens | App Distribution/judge access pending; physical-device run pending |
| 2 — Backend/data/auth foundation | PARTIAL | Pending | — | Functions build; rules emulator tests; config/indexes | Real Firebase project/Auth/Firestore integration pending |
| 3 — Core domain + APIs + integrations | PARTIAL | Pending | — | 19 domain tests; callables/webhooks/digest code; 6 rules tests | Callable/webhook/scheduler E2E and sync processor pending |
| 4 — Functional Android integration | PARTIAL | Pending | Local APK | Local Room flows, mock attendance/progress/messages | UI/device QA and cloud integration pending |
| 5 — E2E functionality gate | NOT STARTED | — | — | — | Hosted backend unavailable; on-device AI gate separate |
| 6 — Reference-led final UI | PARTIAL | Pending | Landing page local preview | Original visual system; desktop/mobile screenshots | App final polish and StageShow unavailable |
| 7 — Frontend/docs completeness | IN PROGRESS | Pending | — | Landing legal/security/contact pages; docs updates | Full state/accessibility audit pending |
| 8 — Demo video | NOT STARTED | — | — | — | Needs stable app capture; physical device not connected |
| 9 — Final regression/security/release | NOT STARTED | — | — | — | Production authority not granted; Spark/NGN 0 |

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
