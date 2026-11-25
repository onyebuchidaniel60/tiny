# Tiny — AI Implementation Handoff

**Last updated:** 25 November 2026 (Phase 0 intake update)

**Current status:** Handoff package verified; repository and environment inspected read-only; **application implementation has not started.** Phase 0 intake is **BLOCKED only on the UI reference URLs** for Phase 1 coding; Firebase project access is a later integration gate.

**Current phase:** Phase 0 — consolidated operator intake/readiness.

**Next task:** Operator supplies the exact UI reference URLs in `OPERATOR_INTAKE.md` §9. Then begin Phase 1 using GitHub Actions Ubuntu runners; Firebase project creation, App Distribution tester access and a Gemini Nano-supported device can follow without blocking independent Phase 1 preparation.

## Product/architecture baseline

- Tiny (TIE-nee); “Big impact. Small requirements. Accessible everywhere.”
- Native Android teacher app; Kotlin + Jetpack Compose.
- Personal Android phones are the target teacher device.
- Parents use basic phones through two-way SMS. No parent app or login.
- No student interface or student accounts.
- School-managed or independent teacher-created workspaces; independent teachers have full core functionality.
- Multiple classes/subjects per teacher; multiple guardians per pupil; one guardian may be linked to multiple pupils.
- NERDC Revised Basic Education Curriculum Primary 1–6; 5E lesson framework.
- Teacher UI languages: `en`, `ha`, `yo`, `ig`; parent SMS languages: `en`, `ha`, `yo`, `ig`, `pcm`.
- Immediate attendance notification for absences only; weekly digest Friday 15:00 Africa/Lagos.
- Two-way SMS / parent-initiated messages / teacher inbox / teacher reply.
- Progress indicators and teacher-authored observations; teacher approval before sharing.
- Hybrid AI via Firebase AI Logic: English on-device where compatible; cloud for complex/non-English tasks; no PII in prompts; offline curated fallback.

## Fixed implementation architecture

- Android: Kotlin, Jetpack Compose, MVVM/repository/use-case separation, Coroutines/Flow.
- Local data: Room + SQLCipher, key protected by Android Keystore; Room is local source of truth.
- Sync: WorkManager, durable outbox, UUID idempotency, bounded batches, server acknowledgements/conflicts.
- Cloud: Firestore Standard + Cloud Functions Gen2 TypeScript/Node 22, co-located `africa-south1`.
- Auth: Firebase Phone Auth for teachers/admins; first auth requires internet.
- Integrity: Firebase App Check + Play Integrity.
- AI: Firebase AI Logic/Gemini Developer API globally processed cloud route; optional experimental on-device SDK on supported devices.
- SMS: eSMS Africa Two-Way SMS; mock adapter during development; no live sends until authorized.
- Preview: protected Firebase App Distribution or approved secure APK artifact, not a website.
- No payment system, voice calling, web frontend, parent app or student app.

## Current readiness

| Item | Status | Notes |
|---|---|---|
| Product scope and roles | CONFIRMED | `PROJECT_SPEC.md` |
| Business rules | CONFIRMED | `TINY_PROJECT_BLUEPRINT.md`, `docs/API.md`, `docs/DATA_MODEL.md` |
| Architecture | CONFIRMED | `ARCHITECTURE.md`; Firebase Agent Skills/MCP are developer tooling only |
| Implementation phase plan | CONFIRMED | `IMPLEMENTATION_PLAN.md` |
| Coding-agent rules | READY | `AGENTS.md` |
| Operator intake | BLOCKED — UI refs only | Inspection/confirmations complete; exact UI reference URLs outstanding |
| UI reference links/images | BLOCKED | Operator will supply links; exact URLs/rights not yet received. Do not invent/substitute references |
| Repository/path/branch | CONFIRMED | `C:\Users\User\Documents\Projects\tiny`; `main`; clean at `690beef` before this intake update |
| Git commit/push authorization | CONFIRMED | Direct commits/pushes to `main` authorized; no force-push, history rewrite, branch deletion or visibility change |
| Repository visibility | CONFIRMED PUBLIC | Operator instructed not to change visibility; no secrets or real pupil/guardian data may be committed |
| Android build environment | CONFIRMED — GitHub Actions Ubuntu | Build/test on GitHub Actions `ubuntu-24.04`; no full Android Studio toolchain on Windows. See `docs/CI_ANDROID_BUILD.md` |
| Firebase project/access | PENDING — later integration gate | Dedicated project ID/access not yet supplied; does not block Phase 1 scaffolding, Firebase skills installation or Emulator Suite setup |
| Firebase plan/budget | CONFIRMED | Spark plan; NGN 0 cloud spend; no Blaze, billing account or paid service |
| Hosted Cloud Functions | NOT AUTHORIZED — emulator-only | Do not deploy Functions, activate Blaze or introduce paid hosting; callables/webhooks are emulator-tested |
| Cloud AI | CONFIRMED — free tier | Gemini Developer API free tier on Spark; no paid AI |
| Protected preview distribution | CONFIRMED PREFERRED — App Distribution | `internal-testers`/`judges` groups and Firebase project still needed before first distribution; no public APK |
| Physical Android device | GENERAL TESTING / SEPARATE AI GATE | Samsung Galaxy Note 10+ is general testing only and not on the Gemini Nano supported list. Android version still pending; on-device AI proof is a separate blocked gate |
| eSMS sandbox | NOT REQUIRED NOW | Mock SMS adapter authorized; no live/SMS sandbox sends authorized |
| Credential/configuration register | CONFIRMED | `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`; `.env.example` placeholders only; no secrets requested via chat |
| Production SMS authority/budget | NOT AUTHORIZED | NGN 0; mock adapter only |
| Production deploy authority | NOT AUTHORIZED | Staging/preview only unless explicitly granted later |
| Demo audience/output | CONFIRMED | Firebase hackathon judges/product evaluators; `artifacts/demo/` |
| Demo voice/TTS | PENDING | Recheck free tier/terms at Phase 8 |

## Operator confirmations received (25 November 2026)

- Git: commit and push directly to `main`; do not force-push or rewrite history; do not delete branches or change repository visibility. Repository remains public.
- UI references: operator will supply URLs to existing interfaces as design references; exact URLs pending. Do not invent, generate or substitute references without authorization.
- Test device: Samsung Galaxy Note 10+; general testing only, not Gemini Nano-supported. Android version to be supplied after checking Settings.
- Build: GitHub Actions Ubuntu runners are the preferred Android build environment. Do not install the full Android Studio toolchain on the Windows machine.
- Firebase: dedicated Tiny project will be created and project ID supplied; project creation/access is a later integration gate and must not block Phase 1 scaffolding, Firebase skills installation or Emulator Suite setup. Gemini Developer API free tier; Spark plan; no billing/Blaze/paid model/paid service without explicit approval.
- Distribution: Firebase App Distribution is the preferred initial testing route; tester/judge access requirements and judge-accessible approach are documented in `docs/CI_ANDROID_BUILD.md`.
- Cloud Functions: emulator-only under Spark/NGN 0. Do not deploy Functions, activate Blaze, introduce paid hosting or replace the backend architecture.
- Credentials: complete register in `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`; `.env.example` contains placeholders only; do not request credentials through chat.
- Budget: cloud NGN 0; paid AI NGN 0; SMS/voice NGN 0; paid third-party NGN 0; mock SMS adapter until further authorization.
- Data: synthetic pupil/teacher/guardian data only; no real children’s data; production blocked until privacy/legal/security gates pass.
- Demo: Firebase hackathon judges/product evaluators; 90–150 seconds (max 180); output `artifacts/demo/`.
- Autonomy: continue after intake and genuine blockers are resolved; maintain handoff/build log; stop for security risks, destructive actions, unexpected costs, unavailable essential dependencies or out-of-scope actions.

## Phase 0 inspection evidence (25 November 2026)

### Package
- 28 Markdown documents present, including `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`, `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md` and `docs/CI_ANDROID_BUILD.md`; relative links resolve; code fences balanced.
- `docs/PROPER_VIBE_CODING_WORKFLOW.md` SHA-256 matches the recorded value `11607c448d9803ef27ab69d7e20d53730c2f535fc8b2b97559c9f464b66cacdb`.
- Documentation-only repository; no app code, Android project, Functions code, migrations, tests, CI workflow or Firebase config.
- No image/logo asset present. No `.env`, `google-services.json`, `.firebaserc` or service-account file found. No secrets read or displayed.

### Repository
- Path `C:\Users\User\Documents\Projects\tiny`; remote `https://github.com/onyebuchidaniel60/tiny.git`; branch `main`.
- Pre-intake HEAD `690beef609d4620610611df737252615b7652f23` (`added firebase skills`); clean working tree before this documentation update.
- GitHub CLI authenticated with repository admin permission. Repository is public; `main` is not branch-protected.
- No GitHub Actions workflows, secrets, variables, releases or deployment configuration.
- No `app/`, `functions/`, `firebase/`, `tests/`, `.github/` or `artifacts/` implementation tree exists yet.

### Environment
- Windows 11 Pro 10.0.26200; Git 2.55.0; Node.js v24.20.0; npm 11.19.0; `fnm`, `winget`, Chocolatey and GitHub CLI available.
- JDK, Android Studio, Android SDK, `adb`, Gradle, Firebase CLI and Google Cloud CLI are absent.
- No physical Android device detected via USB/PnP; ADB unavailable. Only 5.5 GB free on `C:`.
- No Firebase/eSMS/Google environment variables present.

### Build and credential handling
- GitHub Actions Ubuntu is the confirmed Android build/test path; no full Android Studio toolchain is required on Windows. See `docs/CI_ANDROID_BUILD.md`.
- Firebase App Distribution is the preferred preview route; tester/judge groups and project access are pending.
- `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md` and `.env.example` define secret/public/config ownership and secure delivery. No secret values are recorded.
- `.gitignore` excludes local env files, keystores and Firebase client configuration from accidental commits.

### Device support finding
- Hybrid AI acceptance is **not complete** until both a supported on-device path and a cloud path have been tested with source evidence. Cloud AI/fallback work can proceed independently; do not claim on-device inference on unsupported hardware.
- Samsung Galaxy Note 10+ is **not** on the official ML Kit GenAI direct-model-access supported-device list retrieved on 25 November 2026 from `https://developers.google.com/ml-kit/genai`.
- The device may still support general app testing if its Android version meets `minSdk 26`, but it cannot provide genuine Gemini Nano/on-device inference evidence. Do not claim on-device inference ran on this device.

### Firebase budget/plan finding
- Spark plan and NGN 0 are confirmed. Official Firebase documentation states Cloud Functions deployment requires Blaze.
- The fixed backend can be built and tested in Firebase Emulator Suite while the project remains on Spark/NGN 0. Callables/webhooks can be emulator-tested; scheduled digest logic must be invoked locally/unit-tested. No hosted staging backend, webhook endpoint or scheduled digest deployment is available until billing authority changes.
- Gemini Developer API free tier is compatible with Spark for cloud AI within free limits. No paid AI.

### Scope evidence
- No implementation command, dependency installation, Firebase/eSMS call, SMS send, APK build, preview deployment or device inference was performed.
- The documentation changes are `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md`, this handoff, `docs/BUILD_LOG.md`, `docs/CONFIGURATION.md`, `docs/SETUP.md`, `docs/DEPLOYMENT.md`, `README.md`, `PACKAGE_INDEX.md`, `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`, `docs/CI_ANDROID_BUILD.md`, `.env.example` and `.gitignore`. They are not application code.
- No real secret values were requested, read, displayed or committed. `.env.example` contains placeholders only.

## Blockers and minimum operator action

| Blocker | Why it matters | Minimum operator action |
|---|---|---|
| UI reference URLs | Required by the workflow before code phases and Phase 6 | Supply exact URL(s), ownership/usage notes and intended screens |
| App Distribution tester/judge access | Required before first judge-facing preview; not a Phase 1 scaffolding blocker | Supply Firebase project ID, create/confirm `internal-testers`/`judges` groups and approved judge-email delivery method |
| Firebase project/access | Required before real Firebase integration tests and App Distribution; not a Phase 1 scaffolding blocker | Supply project ID and least-privilege access method; no secrets in chat |
| Supported on-device AI device | Note 10+ is general testing only; separate acceptance gate | Provide a currently supported physical device, or explicitly accept on-device demo blocked and use cloud/fallback evidence |
| Note 10+ Android version | Needed for general compatibility/Play services verification, not scaffolding | Provide version from Settings > About phone |
| Optional pilot/legal gates | Required before real-school pilot, not synthetic development | Identify DPIA/legal/translation/NERDC approvers and timing |

**Resolved/removed blockers:** local Android Studio toolchain (GitHub Actions Ubuntu is confirmed), hosted Cloud Functions on Spark (emulator-only is confirmed and not authorized), eSMS sandbox (mock adapter authorized), credential register (created), and repository/Git permissions (confirmed).

## Handoff package validation

- [x] 28 Markdown documents present, including `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`, `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md` and `docs/CI_ANDROID_BUILD.md`.
- [x] `docs/PROPER_VIBE_CODING_WORKFLOW.md` matches the recorded SHA-256 `11607c448d9803ef27ab69d7e20d53730c2f535fc8b2b97559c9f464b66cacdb`.
- [x] Internal Markdown links resolve within the package.
- [x] Markdown fenced code blocks are balanced.
- [x] Package contains documentation only; no application source code, migrations or executable implementation.
- [ ] Historical ZIP-integrity claim could not be re-verified; the ZIP is not present in this repository.

## Firebase Agent Skills and MCP status

- Requirement: use official Firebase Agent Skills as progressive Firebase-specific implementation guidance in OpenCode.
- Selected baseline IDs: `firebase-basics`, `firebase-local-env-setup`, `firebase-auth-basics`, `firebase-firestore-standard`, `firestore-security-rules-auditor`.
- Installation: **pending Phase 1**, independent of real Firebase project creation; project-local copied files; inspect selected `SKILL.md` files/scripts; verify fresh-session discovery; preserve `skills-lock.json` if generated.
- Optional `firebase-crashlytics` requires a product/privacy decision before installation/use.
- `firebase-ai-logic-basics` is web-focused and not authoritative for native Android hybrid inference. Use current Android-specific Firebase docs.
- Firebase MCP: **not configured/connected**. Keep disabled until operator authorizes non-production project access and bounded tool permissions. State-changing operations require explicit approval.
- Emulator Suite can be set up with a demo project before the real Firebase project exists.
- Detailed policy: `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`.

## Preview / deployment evidence

- Preview URL: **Not created**.
- Build path: **GitHub Actions Ubuntu runners** (`docs/CI_ANDROID_BUILD.md`). No full Android Studio toolchain on the Windows machine.
- Distribution channel: **Firebase App Distribution preferred**. No tester group, judge emails or project ID supplied yet; no public APK link.
- Build: **Not attempted** — no workflow or Android project yet.
- Deployed commit: **None — implementation has not started**.
- Hosted backend: **Not deployed** — Spark/NGN 0 prohibits Cloud Functions deployment; emulator-only.
- Production deployment: **Not authorized**.

## Skill status

- Required UI skill command: `npx skills add benjitaylor/skills --skill stageshow`.
- Installation/inspection: **Not attempted; must occur at the start of UI work (Phase 6)**.
- Reference links/images: **Pending**; no UI implementation has started.
- Additional UI skills: optional, evaluate for relevance and trustworthiness.

## Documentation status

- [x] Product spec
- [x] Architecture
- [x] Implementation plan
- [x] Agent instructions
- [x] Operator intake updated with Phase 0 findings/confirmations
- [x] Reference asset register updated with pending-link status
- [x] API design
- [x] Data model
- [x] Security design
- [x] Setup/configuration/testing/deployment/operations/troubleshooting guides
- [x] Firebase Agent Skills/MCP guide
- [x] Credential/configuration register and safe `.env.example`
- [x] GitHub Actions Android build/App Distribution guide
- [x] Phase 0 inspection recorded in this handoff and `docs/BUILD_LOG.md`
- [ ] Implementation README updated with actual build commands/results
- [ ] Design notes completed against actual reference links/images
- [ ] Build log populated with implementation evidence

## Demo status

- Video: Not produced; requires completed real application, working build path and capture device.
- Target length: 90–150 seconds; absolute maximum 180 seconds.
- Demo data: synthetic only.
- Demo journeys: offline lesson, offline attendance and sync, mock absence SMS, parent inbound message/teacher reply, approved progress/digest, cloud AI evidence; on-device AI evidence blocked until a supported device is available.
- Output location: `artifacts/demo/` (confirmed).
- Voice/TTS: verify current free Google AI option/quota/terms at production time; use permitted free fallback if unavailable; no charges without authority.

## Authorization boundaries

- Do not reveal or commit secrets, real pupil/guardian data or private URLs. Do not request credentials through chat; use `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md` and the approved secure destinations.
- Do not incur unapproved charges. Cloud, AI, SMS, voice and third-party budgets are NGN 0.
- Do not send live SMS to real parents. Use the mock adapter until further written authorization.
- Do not process real pupil/guardian data in development or demos.
- Do not deploy production, migrate/destructively alter production data, or enable irreversible actions without explicit authority.
- Do not deploy Cloud Functions, enable Blaze or create paid Firebase resources without explicit approval. Functions are emulator-only.
- Do not install the full Android Studio toolchain on the Windows machine; use GitHub Actions Ubuntu runners.
- A Firebase API key or provider credential is not unlimited spending or sending authority.
- A staging/preview authorization does not imply production release authorization.
- Do not force-push, rewrite history, delete branches or change repository visibility.
- Do not bypass App Check, encryption or authorization to make a demo work.

## Documentation inconsistencies observed

1. **Environment-variable names:** `TINY_PROJECT_BLUEPRINT.md` §23 uses `SMS_MONTHLY_BUDGET_USD` and `AI_DAILY_CLOUD_LIMIT_PER_TEACHER`; `docs/CONFIGURATION.md` and `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md` use `SMS_MONTHLY_BUDGET_MINOR` and `AI_DAILY_CLOUD_LIMIT_PER_USER`. The register treats the latter names as canonical for implementation; no code exists yet.
2. **SMS mode:** the target architecture uses `SMS_MODE=sandbox|production`; current development uses `SMS_MODE=mock` per operator authorization. The mock mode is a development adapter, not a production architecture change.
3. **Demo output path:** `IMPLEMENTATION_PLAN.md` Phase 8 narrative mentions `demo/`; the artifact table and `DEMO_VIDEO_PLAN.md` use `artifacts/demo/`. Operator confirmed `artifacts/demo/`; treat that as canonical.
4. **Time-sensitive AI versions:** blueprint SDK/Compose versions are provisional and must be checked against current official documentation and pinned/tested in Phase 1.
5. **Historical ZIP claim:** the ZIP is not in the repository; the claim was not re-verified.

## Known limitations / risks

1. Firebase Android on-device hybrid inference is experimental/beta and only works on selected devices; a physical compatible handset is required for proof. This is a separate acceptance gate and does not block non-AI work.
2. The supplied Samsung Galaxy Note 10+ is not on the current official ML Kit Gemini Nano supported-device list. It is a general testing device only; on-device AI proof/demo is blocked until a supported device is available.
3. The project is on Spark with NGN 0. Cloud Functions Gen2 cannot be deployed; backend integration/E2E is emulator-only until billing authority changes. Do not deploy Functions, activate Blaze or introduce paid hosting.
4. The Windows machine lacks JDK, Android Studio/SDK, `adb`, Gradle, Firebase CLI and Google Cloud CLI; only 5.5 GB is free on `C:`. This is not a build blocker because GitHub Actions Ubuntu is the confirmed build path. Local `adb` is optional for device installation/capture.
5. The GitHub repository is public. Implementation, commit history and CI artifacts will be publicly visible. Never commit secrets or real data.
6. Node.js 24.20.0 is active; Functions requires Node.js 22. `fnm` is available to pin the required version.
7. `minSdk 26` is an explicit architecture compromise; connected production operations also require a Play Integrity-compatible Google Play environment.
8. Firestore `africa-south1` is Johannesburg, not Nigeria; cross-border processing review/DPIA required.
9. Gemini Developer API cloud processing is global; do not send PII.
10. eSMS production activation may require KYC, shared keyword provisioning and recurring costs; mock only until validated/authorized.
11. Parent number can map to multiple schools/pupils; require school/pupil routing hints, never guess.
12. Curriculum seed scope and usage rights must be checked against the exact current NERDC source files.

## Independent Phase 1 preparation

After the UI reference URLs are supplied, these tasks can proceed without the real Firebase project or a Gemini Nano-supported device:

1. Install/inspect the selected Firebase Agent Skills for OpenCode; verify fresh-session discovery and preserve the lockfile.
2. Create the Android Gradle scaffold, theme/navigation/localization scaffolding and labelled placeholders.
3. Add the GitHub Actions Ubuntu workflow for lint, unit tests, debug APK and artifact upload.
4. Set up Firebase Emulator Suite with a demo project for local/CI backend tests.
5. Implement local Room/SQLCipher, repositories and UI flows that do not depend on live Firebase resources, using mocks/emulators.
6. Document/prepare App Distribution groups and judge access; actual upload waits for the Firebase project and approved tester emails.

These tasks do not authorize Functions deployment, Blaze, paid services, live SMS, production resources or real pupil/guardian data. They also do not satisfy the separate on-device Gemini Nano gate.

## Checkpoint template

At each phase checkpoint update this file and `docs/BUILD_LOG.md`:

```text
Current phase:
Completed:
Tests and evidence:
Preview URL:
Deployed commit:
Reference image/skill status:
Firebase Agent Skills / MCP status:
Documentation status:
Demo video status:
Known issues:
Authorization boundaries:
Next task:
Blocked by:
```

## Resume instruction

If context/session ends, inspect Git status, this file, `OPERATOR_INTAKE.md` §9 and §10, `docs/BUILD_LOG.md`, `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`, `docs/CI_ANDROID_BUILD.md` and the latest commits. Begin Phase 1 once the UI reference URLs are supplied; Firebase project creation, App Distribution tester access and a Gemini Nano-supported device can follow without blocking independent Phase 1 preparation. Do not deploy Functions, activate Blaze, send live SMS or process real pupil/guardian data. Do not redo completed work or ask for routine phase approval.
