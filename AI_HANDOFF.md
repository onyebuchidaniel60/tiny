# Tiny — AI Implementation Handoff

**Last updated:** 25 November 2026 (Phase 0 intake update)

**Current status:** Handoff package verified; repository and environment inspected read-only; **application implementation has not started.** Phase 0 intake is **BLOCKED** on remaining hard inputs.

**Current phase:** Phase 0 — consolidated operator intake/readiness.

**Next task:** Operator supplies the remaining inputs in `OPERATOR_INTAKE.md` §9. Then re-check Phase 0 exit criteria and begin Phase 1 only when the UI references and build path are available.

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
| Operator intake | BLOCKED | Inspection complete; remaining hard inputs outstanding |
| UI reference links/images | BLOCKED | Operator will supply links; exact URLs/rights not yet received |
| Repository/path/branch | CONFIRMED | `C:\Users\User\Documents\Projects\tiny`; `main`; clean at `690beef` before this intake update |
| Git commit/push authorization | CONFIRMED | Direct commits/pushes to `main` authorized; no force-push, history rewrite, branch deletion or visibility change |
| Repository visibility | CONFIRMED PUBLIC | Operator instructed not to change visibility; no secrets or real pupil/guardian data may be committed |
| Android build toolchain | BLOCKED | No JDK, Android Studio, Android SDK, `adb` or Gradle; only 5.5 GB free on `C:` |
| Firebase project/access | BLOCKED | Dedicated project ID and least-privilege access method not yet supplied |
| Firebase plan/budget | CONFIRMED | Spark plan; NGN 0 cloud spend; no Blaze, billing account or paid service |
| Hosted Cloud Functions | BLOCKED by Spark/NGN 0 | Functions Gen2 deployment requires Blaze; backend is emulator-only until authorized |
| Cloud AI | CONFIRMED — free tier | Gemini Developer API free tier on Spark; no paid AI |
| Protected preview distribution | PENDING | No App Distribution tester group or approved artifact destination |
| Physical Android device | BLOCKED for on-device AI | Samsung Galaxy Note 10+ supplied; not on current Gemini Nano supported list. Android version still pending for general testing |
| eSMS sandbox | NOT REQUIRED NOW | Mock SMS adapter authorized; no live/SMS sandbox sends authorized |
| Production SMS authority/budget | NOT AUTHORIZED | NGN 0; mock adapter only |
| Production deploy authority | NOT AUTHORIZED | Staging/preview only unless explicitly granted later |
| Demo audience/output | CONFIRMED | Firebase hackathon judges/product evaluators; `artifacts/demo/` |
| Demo voice/TTS | PENDING | Recheck free tier/terms at Phase 8 |

## Operator confirmations received (25 November 2026)

- Git: commit and push directly to `main`; do not force-push or rewrite history; do not delete branches or change repository visibility.
- UI references: operator will supply links to existing interfaces as design references; exact links pending.
- Test device: Samsung Galaxy Note 10+; Android version to be supplied after checking Settings.
- Firebase: dedicated Tiny project will be created and project ID supplied; Gemini Developer API free tier; Spark plan; no billing/Blaze/paid model/paid service without explicit approval; Emulator Suite and synthetic data for development; no production deployment.
- Budget: cloud NGN 0; paid AI NGN 0; SMS/voice NGN 0; paid third-party NGN 0; mock SMS adapter until further authorization.
- Data: synthetic pupil/teacher/guardian data only; no real children’s data; production blocked until privacy/legal/security gates pass.
- Demo: Firebase hackathon judges/product evaluators; 90–150 seconds (max 180); output `artifacts/demo/`.
- Autonomy: continue after intake and genuine blockers are resolved; maintain handoff/build log; stop for security risks, destructive actions, unexpected costs, unavailable essential dependencies or out-of-scope actions.

## Phase 0 inspection evidence (25 November 2026)

### Package
- 26 Markdown documents present, including `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`; relative links resolve; code fences balanced.
- `docs/PROPER_VIBE_CODING_WORKFLOW.md` SHA-256 matches the recorded value `11607c448d9803ef27ab69d7e20d53730c2f535fc8b2b97559c9f464b66cacdb`.
- Documentation-only repository; no app code, Android project, Functions code, migrations, tests, CI or Firebase config.
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

### Device support finding
- Samsung Galaxy Note 10+ is **not** on the official ML Kit GenAI direct-model-access supported-device list retrieved on 25 November 2026 from `https://developers.google.com/ml-kit/genai`.
- The device may still support general app testing if its Android version meets `minSdk 26`, but it cannot provide genuine Gemini Nano/on-device inference evidence. Do not claim on-device inference ran on this device.

### Firebase budget/plan finding
- Spark plan and NGN 0 are confirmed. Official Firebase documentation states Cloud Functions deployment requires Blaze.
- The fixed backend can be built and tested in Firebase Emulator Suite while the project remains on Spark/NGN 0. Callables/webhooks can be emulator-tested; scheduled digest logic must be invoked locally/unit-tested. No hosted staging backend, webhook endpoint or scheduled digest deployment is available until billing authority changes.
- Gemini Developer API free tier is compatible with Spark for cloud AI within free limits. No paid AI.

### Scope evidence
- No implementation command, dependency installation, Firebase/eSMS call, SMS send, APK build, preview deployment or device inference was performed.
- The only modifications are `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md`, this handoff and `docs/BUILD_LOG.md`. They are documentation updates, not application code.

## Blockers and minimum operator action

| Blocker | Why it matters | Minimum operator action |
|---|---|---|
| UI reference links | Required by the workflow before code phases and Phase 6 | Supply exact URL(s), ownership/usage notes and intended screens |
| Android build toolchain / disk | Phase 1 cannot build, lint or install an APK without JDK/Android SDK/Gradle | Authorize minimal CLI toolchain installation and free disk space, or provide an approved CI/other build machine |
| Firebase project/access | Required for Phase 2, App Distribution, App Check/AI Logic and Firebase tooling | Supply project ID and least-privilege access method; no secrets in chat |
| Protected preview distribution | Required for Phase 1 early preview | Provide App Distribution tester group/access or approved protected artifact destination |
| Supported on-device AI device | Note 10+ cannot run Gemini Nano; emulator is insufficient | Provide a currently supported physical device, or explicitly accept on-device demo blocked and use cloud/fallback evidence |
| Hosted Functions on Spark | Cloud Functions deployment requires Blaze; NGN 0 prohibits it | Confirm emulator-only backend scope, or explicitly authorize Blaze with a bounded budget |
| Optional pilot/legal gates | Required before real-school pilot, not synthetic development | Identify DPIA/legal/translation/NERDC approvers and timing |

## Handoff package validation

- [x] 26 Markdown documents present, including `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`.
- [x] `docs/PROPER_VIBE_CODING_WORKFLOW.md` matches the recorded SHA-256 `11607c448d9803ef27ab69d7e20d53730c2f535fc8b2b97559c9f464b66cacdb`.
- [x] Internal Markdown links resolve within the package.
- [x] Markdown fenced code blocks are balanced.
- [x] Package contains documentation only; no application source code, migrations or executable implementation.
- [ ] Historical ZIP-integrity claim could not be re-verified; the ZIP is not present in this repository.

## Firebase Agent Skills and MCP status

- Requirement: use official Firebase Agent Skills as progressive Firebase-specific implementation guidance in OpenCode.
- Selected baseline IDs: `firebase-basics`, `firebase-local-env-setup`, `firebase-auth-basics`, `firebase-firestore-standard`, `firestore-security-rules-auditor`.
- Installation: **pending Phase 1**; project-local copied files; inspect selected `SKILL.md` files/scripts; verify fresh-session discovery; preserve `skills-lock.json` if generated.
- Optional `firebase-crashlytics` requires a product/privacy decision before installation/use.
- `firebase-ai-logic-basics` is web-focused and not authoritative for native Android hybrid inference. Use current Android-specific Firebase docs.
- Firebase MCP: **not configured/connected**. Keep disabled until operator authorizes non-production project access and bounded tool permissions. State-changing operations require explicit approval.
- Detailed policy: `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`.

## Preview / deployment evidence

- Preview URL: **Not created**.
- Distribution channel: Pending intake; default Firebase App Distribution. No tester group/access or approved protected artifact destination supplied.
- Build: **Not attempted** — no JDK/Android SDK/Gradle/adb toolchain on this machine.
- Deployed commit: **None — implementation has not started**.
- Hosted backend: **Not deployed** — Spark/NGN 0 prohibits Cloud Functions deployment.
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

- Do not reveal or commit secrets, real pupil/guardian data or private URLs.
- Do not incur unapproved charges. Cloud, AI, SMS, voice and third-party budgets are NGN 0.
- Do not send live SMS to real parents. Use the mock adapter until further written authorization.
- Do not process real pupil/guardian data in development or demos.
- Do not deploy production, migrate/destructively alter production data, or enable irreversible actions without explicit authority.
- Do not deploy Cloud Functions, enable Blaze or create paid Firebase resources without explicit approval.
- A Firebase API key or provider credential is not unlimited spending or sending authority.
- A staging/preview authorization does not imply production release authorization.
- Do not force-push, rewrite history, delete branches or change repository visibility.
- Do not bypass App Check, encryption or authorization to make a demo work.

## Documentation inconsistencies observed

1. **Environment-variable names:** `TINY_PROJECT_BLUEPRINT.md` §23 uses `SMS_MONTHLY_BUDGET_USD` and `AI_DAILY_CLOUD_LIMIT_PER_TEACHER`; `docs/CONFIGURATION.md` uses `SMS_MONTHLY_BUDGET_MINOR` and `AI_DAILY_CLOUD_LIMIT_PER_USER`. Resolution belongs in Phase 2; no code exists yet.
2. **Demo output path:** `IMPLEMENTATION_PLAN.md` Phase 8 narrative mentions `demo/`; the artifact table and `DEMO_VIDEO_PLAN.md` use `artifacts/demo/`. Operator confirmed `artifacts/demo/`; treat that as canonical.
3. **Time-sensitive AI versions:** blueprint SDK/Compose versions are provisional and must be checked against current official documentation and pinned/tested in Phase 1.
4. **Historical ZIP claim:** the ZIP is not in the repository; the claim was not re-verified.

## Known limitations / risks

1. Firebase Android on-device hybrid inference is experimental/beta and only works on selected devices; a physical compatible handset is required for proof.
2. The supplied Samsung Galaxy Note 10+ is not on the current official ML Kit Gemini Nano supported-device list. On-device AI proof/demo is blocked until a supported device is available.
3. The project is on Spark with NGN 0. Cloud Functions Gen2 cannot be deployed; backend integration/E2E is emulator-only until billing authority changes.
4. The local machine lacks JDK, Android Studio/SDK, `adb`, Gradle, Firebase CLI and Google Cloud CLI; only 5.5 GB is free on `C:`. Phase 1 build/test is blocked until this is resolved.
5. The GitHub repository is public. Implementation, commit history and CI artifacts will be publicly visible. Never commit secrets or real data.
6. Node.js 24.20.0 is active; Functions requires Node.js 22. `fnm` is available to pin the required version.
7. `minSdk 26` is an explicit architecture compromise; connected production operations also require a Play Integrity-compatible Google Play environment.
8. Firestore `africa-south1` is Johannesburg, not Nigeria; cross-border processing review/DPIA required.
9. Gemini Developer API cloud processing is global; do not send PII.
10. eSMS production activation may require KYC, shared keyword provisioning and recurring costs; mock only until validated/authorized.
11. Parent number can map to multiple schools/pupils; require school/pupil routing hints, never guess.
12. Curriculum seed scope and usage rights must be checked against the exact current NERDC source files.

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

If context/session ends, inspect Git status, this file, `OPERATOR_INTAKE.md` §9 and §10, `docs/BUILD_LOG.md`, and the latest commits. Do not begin Phase 1 until the UI references, build-environment/toolchain decision, Firebase project/access and protected distribution path are resolved. On-device AI proof additionally requires a supported physical device; hosted Functions remain emulator-only under Spark/NGN 0. Do not redo completed work or ask for routine phase approval.
