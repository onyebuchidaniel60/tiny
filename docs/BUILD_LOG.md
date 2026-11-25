# Tiny — Build Log

**Status:** No application implementation has started. Phase 0 read-only inspection and operator confirmations are recorded; intake is **BLOCKED only on the UI reference URLs** for Phase 1 coding. GitHub Actions Ubuntu is the confirmed build path; Firebase project access is a later integration gate.

## Planning baseline

- Product: Tiny, Android-first offline rural teacher-support and parent-engagement platform.
- Blueprint: `../TINY_PROJECT_BLUEPRINT.md`.
- Methodology: `PROPER_VIBE_CODING_WORKFLOW.md`.
- The blueprint preparation made no code changes; Phase 0 documentation updates are recorded below.
- No code, database migration, deployment, live SMS or production action has been performed.

## Blueprint package preparation (25 November 2026)

- Produced the 30-section implementation blueprint and supporting product/architecture/handoff documentation.
- Preserved the operator-supplied workflow file byte-for-byte in `docs/PROPER_VIBE_CODING_WORKFLOW.md`.
- Package validation: 28 Markdown files; local link check passed; fenced code blocks balanced; workflow SHA-256 unchanged.
- No application source code, database migration, cloud resource, preview build, message send or production action was performed.

## Phase 0 checkpoint — 25 November 2026

- Objective: Complete the one consolidated operator intake/readiness check without modifying application code.
- Implementation completed: None. Read-only inspection of the 28-document handoff package, Git state, repository contents and local environment. Updated `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md`, `AI_HANDOFF.md`, `docs/CONFIGURATION.md`, `docs/SETUP.md`, `docs/DEPLOYMENT.md`, `README.md`, `PACKAGE_INDEX.md`, `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`, `docs/CI_ANDROID_BUILD.md`, `.env.example`, `.gitignore` and this log with findings and operator confirmations.
- Tests executed and results: Package validation only — 28 Markdown files present; relative links resolve; fenced code blocks balanced; workflow SHA-256 matches the recorded value. No application build or test was possible because no Android project or CI workflow exists yet.
- Manual verification: Pre-intake `git status` clean at `690beef`; branch `main`; remote reachable; GitHub repository public with admin access; no workflows, secrets or releases; no app code, Firebase configuration, reference links or secret files.
- Commit hash: Documentation checkpoint committed after this update; see Git history for the Phase 0 intake commit.
- Preview artifact/build URL: None. GitHub Actions Ubuntu is the confirmed build/test path; Firebase App Distribution is the preferred preview route. No APK built and no tester group/project supplied yet.
- Reference image/skill status: No exact reference URLs/images supplied yet; operator confirmed URLs will be provided. StageShow not attempted (Phase 6). Firebase Agent Skills not installed (Phase 1), independent of real Firebase project creation.
- Documentation updated: `OPERATOR_INTAKE.md` (confirmations, remaining questions, inspection record); `REFERENCE_ASSETS.md` (pending-URL status); `AI_HANDOFF.md` (readiness, evidence, blockers, Firebase tooling); `.env.example`; `.gitignore`; `docs/CONFIGURATION.md`; `docs/SETUP.md`; `docs/DEPLOYMENT.md`; `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`; `docs/CI_ANDROID_BUILD.md`; `README.md`; `PACKAGE_INDEX.md`; this build log.
- Known limitations: Local Windows machine lacks JDK, Android Studio/SDK, `adb`, Gradle, Firebase CLI and Google Cloud CLI; only 5.5 GB free on `C:`. This is not a build blocker because GitHub Actions Ubuntu is confirmed. No physical Android device connected; no Firebase project/access yet; repository is public. Note 10+ is general testing only, not Gemini Nano-supported.
- Budget/authorization notes: Cloud, AI, SMS, voice and third-party budgets are NGN 0. Production deployment, real SMS, Blaze, paid service activation, destructive operations and real pupil/guardian data remain NOT AUTHORIZED. Mock SMS adapter is authorized. Cloud Functions are emulator-only.
- Next phase/task: Operator supplies exact UI reference URLs. Phase 1 can then proceed with Android scaffolding, Firebase Agent Skills installation, GitHub Actions workflow and Emulator Suite setup. Firebase project ID/access, App Distribution tester emails and a supported Gemini Nano device can follow without blocking those tasks.

## Operator confirmations received (25 November 2026)

- Git: direct commits/pushes to `main` authorized; no force-push, no history rewrite, no branch deletion, no visibility change. Repository remains public.
- UI references: URLs to existing interfaces will be supplied; exact URLs pending. Do not invent or substitute references.
- Device: Samsung Galaxy Note 10+; general testing only, not Gemini Nano-supported. Android version pending.
- Build: GitHub Actions Ubuntu runners preferred; do not install full Android Studio on Windows.
- Firebase: dedicated project to be created; project ID pending; project creation/access is a later integration gate, not a Phase 1 scaffolding blocker. Gemini Developer API free tier; Spark plan; no billing/Blaze/paid service without explicit approval; Emulator Suite and synthetic data.
- Distribution: Firebase App Distribution preferred; tester/judge access requirements documented in `docs/CI_ANDROID_BUILD.md`.
- Functions: emulator-only under Spark/NGN 0; no deploy/Blaze/paid hosting.
- Credentials: complete register in `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`; `.env.example` placeholders only; no credentials through chat.
- Budgets: cloud NGN 0; paid AI NGN 0; SMS/voice NGN 0; paid third-party NGN 0.
- SMS: mock adapter authorized until further authorization.
- Data: synthetic data only; production blocked until privacy/legal/security gates pass.
- Demo: Firebase hackathon judges/product evaluators; 90–150 seconds (max 180); `artifacts/demo/`.
- Autonomy: continue after genuine blockers are resolved; stop for security, destructive actions, unexpected costs, unavailable essential dependencies or out-of-scope actions.

## Phase 0 findings

### Device support

- The Samsung Galaxy Note 10+ is not on the official ML Kit GenAI direct-model-access supported-device list retrieved on 25 November 2026 from `https://developers.google.com/ml-kit/genai`.
- It may still be usable for general app testing if its Android version meets `minSdk 26`, but it cannot provide genuine Gemini Nano/on-device inference evidence. On-device AI proof/demo is blocked until a supported physical device is available.
- Hybrid AI acceptance remains incomplete until both on-device and cloud paths are tested with source evidence. Cloud/fallback work can proceed independently.

### Firebase plan

- Spark plan and NGN 0 are confirmed.
- Official Firebase documentation states Cloud Functions deployment requires Blaze.
- The fixed backend can be built/tested in Emulator Suite while the project remains on Spark/NGN 0. Callables/webhooks can be emulator-tested; scheduled digest logic must be invoked locally/unit-tested. No hosted Functions, webhook endpoint or scheduled digest deployment is available until billing authority changes.
- Gemini Developer API free tier is compatible with Spark within free limits; no paid AI.

### Build and distribution

- GitHub Actions Ubuntu (`ubuntu-24.04`) is the primary Android build/test environment. No full Android Studio installation on the Windows machine.
- Firebase App Distribution is the preferred preview route; `internal-testers` and `judges` groups and a Firebase project are still needed before first distribution. No public APK link.
- Workflow permissions, signing and judge-access requirements are documented in `docs/CI_ANDROID_BUILD.md`.

### Credential handling

- Complete register: `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`.
- Safe template: `.env.example` (placeholders only); `.gitignore` excludes local secrets, keystores and Firebase client config.
- No secret values were requested, displayed or committed. Secrets must be entered in GitHub Actions secrets/Secret Manager/local ignored files only.

## Phase evidence log

| Phase | Status | Commit | Preview build/URL | Tests/evidence | Issues |
|---|---|---|---|---|---|
| 0 — Operator intake/readiness | BLOCKED — UI URLs only | Documentation checkpoint | — | Package validation passed (28 MD, links, fences, workflow hash); repo/environment inspected read-only; no app tests possible | Exact UI reference URLs pending; Firebase project/App Distribution access later; on-device AI separate gate |
| 1 — Repo + skeletal Android shell + protected preview | NOT STARTED — ready after UI URLs | — | — | GitHub Actions Ubuntu build/lint/test + artifact | UI reference URLs pending; workflow to be added |
| 2 — Backend/data/auth foundation | NOT STARTED | — | — | Emulator/Auth/Firestore/rules tests | Firebase project/access later; Functions deployment not authorized |
| 3 — Core domain + APIs + integrations | NOT STARTED | — | — | Unit/integration tests, idempotency and webhook tests | Mock SMS adapter authorized |
| 4 — Functional Android integration | NOT STARTED | — | — | Real Room-backed UI flows | — |
| 5 — E2E functionality gate | NOT STARTED | — | — | Emulator-backed critical E2E + security tests | On-device AI evidence separate blocked gate; hosted backend unavailable |
| 6 — Reference-led final UI | NOT STARTED | — | — | StageShow skill + design notes + UI tests | UI reference URLs pending |
| 7 — Frontend/docs completeness | NOT STARTED | — | — | Accessibility, states, docs and link checks | — |
| 8 — Demo video | NOT STARTED | — | — | Reviewed <=180s MP4, script, production notes | On-device AI proof blocked; TTS availability/terms to check at run time |
| 9 — Final regression/security/release | NOT STARTED | — | — | Full regression, security evidence, authorized release | Production authority not granted; Spark/NGN 0 |

## Firebase Agent Skills and MCP status

- Requirements documented in `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`; skills not installed and MCP not connected.
- Selected baseline: `firebase-basics`, `firebase-local-env-setup`, `firebase-auth-basics`, `firebase-firestore-standard`, `firestore-security-rules-auditor`.
- Installation and fresh-session discovery: Phase 1, after UI reference URLs are supplied; independent of real Firebase project creation.
- Firebase MCP: disabled until non-production project access and operation scope are authorized; state-changing operations require explicit approval.
- No Firebase resources created or modified.
- Firebase Emulator Suite can be set up with a demo project before the real project exists.
- GitHub Actions Ubuntu build documentation: `docs/CI_ANDROID_BUILD.md`; credential register: `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`; safe template: `.env.example`.

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
