# Tiny — Build Log

**Status:** No application implementation has started. Phase 0 read-only inspection and partial operator intake are complete; intake is **BLOCKED** on remaining inputs.

## Planning baseline

- Product: Tiny, Android-first offline rural teacher-support and parent-engagement platform.
- Blueprint: `../TINY_PROJECT_BLUEPRINT.md`.
- Methodology: `PROPER_VIBE_CODING_WORKFLOW.md`.
- The blueprint preparation made no code changes; Phase 0 documentation updates are recorded below.
- No code, database migration, deployment, live SMS or production action has been performed.

## Blueprint package preparation (25 November 2026)

- Produced the 30-section implementation blueprint and supporting product/architecture/handoff documentation.
- Preserved the operator-supplied workflow file byte-for-byte in `docs/PROPER_VIBE_CODING_WORKFLOW.md`.
- Package validation: 26 Markdown files; local link check passed; fenced code blocks balanced; workflow SHA-256 unchanged.
- No application source code, database migration, cloud resource, preview build, message send or production action was performed.

## Phase 0 checkpoint — 25 November 2026

- Objective: Complete the one consolidated operator intake/readiness check without modifying application code.
- Implementation completed: None. Read-only inspection of the 26-document handoff package, Git state, repository contents and local environment. Updated `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md`, `AI_HANDOFF.md` and this log with findings and operator confirmations.
- Tests executed and results: Package validation only — 26 Markdown files present; relative links resolve; fenced code blocks balanced; workflow SHA-256 matches the recorded value. No application build or test was possible because no Android project/toolchain exists.
- Manual verification: Pre-intake `git status` clean at `690beef`; branch `main`; remote reachable; GitHub repository public with admin access; no workflows, secrets or releases; no app code, Firebase configuration, reference links or secret files.
- Commit hash: Documentation checkpoint committed after this update; see Git history for the Phase 0 intake commit.
- Preview artifact/build URL: None. No APK built; no distribution channel supplied.
- Reference image/skill status: No exact reference links/images supplied yet; operator confirmed links will be provided. StageShow not attempted (Phase 6). Firebase Agent Skills not installed (Phase 1).
- Documentation updated: `OPERATOR_INTAKE.md` (confirmations, remaining questions, inspection record); `REFERENCE_ASSETS.md` (pending-link status); `AI_HANDOFF.md` (readiness, evidence, blockers, Firebase tooling); this build log.
- Known limitations: No JDK, Android Studio/SDK, `adb`, Gradle, Firebase CLI or Google Cloud CLI; Node 24.20.0 active vs Node 22 target; only 5.5 GB free on `C:`; no physical Android device connected; no Firebase project/access; repository is public.
- Budget/authorization notes: Cloud, AI, SMS, voice and third-party budgets are NGN 0. Production deployment, real SMS, Blaze, paid service activation, destructive operations and real pupil/guardian data remain NOT AUTHORIZED. Mock SMS adapter is authorized.
- Next phase/task: Operator supplies UI reference links, build-environment decision, Firebase project ID/access and protected distribution path. Phase 1 remains blocked until those are resolved. A supported on-device AI device is also required for the on-device proof.

## Operator confirmations received (25 November 2026)

- Git: direct commits/pushes to `main` authorized; no force-push, no history rewrite, no branch deletion, no visibility change.
- UI references: links to existing interfaces will be supplied; exact URLs pending.
- Device: Samsung Galaxy Note 10+; Android version pending.
- Firebase: dedicated project to be created; project ID pending; Gemini Developer API free tier; Spark plan; no billing/Blaze/paid service without explicit approval; Emulator Suite and synthetic data.
- Budgets: cloud NGN 0; paid AI NGN 0; SMS/voice NGN 0; paid third-party NGN 0.
- SMS: mock adapter authorized until further authorization.
- Data: synthetic data only; production blocked until privacy/legal/security gates pass.
- Demo: Firebase hackathon judges/product evaluators; 90–150 seconds (max 180); `artifacts/demo/`.
- Autonomy: continue after genuine blockers are resolved; stop for security, destructive actions, unexpected costs, unavailable essential dependencies or out-of-scope actions.

## Phase 0 findings

### Device support

- The Samsung Galaxy Note 10+ is not on the official ML Kit GenAI direct-model-access supported-device list retrieved on 25 November 2026 from `https://developers.google.com/ml-kit/genai`.
- It may still be usable for general app testing if its Android version meets `minSdk 26`, but it cannot provide genuine Gemini Nano/on-device inference evidence. On-device AI proof/demo is blocked until a supported physical device is available.

### Firebase plan

- Spark plan and NGN 0 are confirmed.
- Official Firebase documentation states Cloud Functions deployment requires Blaze.
- The fixed backend can be built/tested in Emulator Suite while the project remains on Spark/NGN 0. Callables/webhooks can be emulator-tested; scheduled digest logic must be invoked locally/unit-tested. No hosted Functions, webhook endpoint or scheduled digest deployment is available until billing authority changes.
- Gemini Developer API free tier is compatible with Spark within free limits; no paid AI.

## Phase evidence log

| Phase | Status | Commit | Preview build/URL | Tests/evidence | Issues |
|---|---|---|---|---|---|
| 0 — Operator intake/readiness | BLOCKED — partial confirmations | Documentation checkpoint | — | Package validation passed (26 MD, links, fences, workflow hash); repo/environment inspected read-only; no app tests possible | UI links, build toolchain, Firebase project/access, distribution, supported on-device device and Spark/Functions scope pending |
| 1 — Repo + skeletal Android shell + protected preview | NOT STARTED | — | — | Build/lint + install/launch + route/screen shell | Blocked by UI links and build environment |
| 2 — Backend/data/auth foundation | NOT STARTED | — | — | Emulator/Auth/Firestore/rules tests | Firebase project/access pending; Functions deployment blocked by Spark |
| 3 — Core domain + APIs + integrations | NOT STARTED | — | — | Unit/integration tests, idempotency and webhook tests | Mock SMS adapter authorized |
| 4 — Functional Android integration | NOT STARTED | — | — | Real Room-backed UI flows | — |
| 5 — E2E functionality gate | NOT STARTED | — | — | Emulator-backed critical E2E + security tests | On-device AI evidence blocked; hosted backend unavailable |
| 6 — Reference-led final UI | NOT STARTED | — | — | StageShow skill + design notes + UI tests | UI reference links pending |
| 7 — Frontend/docs completeness | NOT STARTED | — | — | Accessibility, states, docs and link checks | — |
| 8 — Demo video | NOT STARTED | — | — | Reviewed <=180s MP4, script, production notes | On-device AI proof blocked; TTS availability/terms to check at run time |
| 9 — Final regression/security/release | NOT STARTED | — | — | Full regression, security evidence, authorized release | Production authority not granted; Spark/NGN 0 |

## Firebase Agent Skills and MCP status

- Requirements documented in `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`; skills not installed and MCP not connected.
- Selected baseline: `firebase-basics`, `firebase-local-env-setup`, `firebase-auth-basics`, `firebase-firestore-standard`, `firestore-security-rules-auditor`.
- Installation and fresh-session discovery: Phase 1, after UI/build blockers are resolved.
- Firebase MCP: disabled until non-production project access and operation scope are authorized; state-changing operations require explicit approval.
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
