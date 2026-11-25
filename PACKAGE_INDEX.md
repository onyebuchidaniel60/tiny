# Tiny — Project Handoff Package Index

**Package status:** Complete planning/handoff documentation; no application code included.  
**Document count:** 28 Markdown files (including the Firebase Agent Skills/MCP guide, credential register and CI guide).

**Blueprint date:** 25 November 2026  
**Product:** Tiny — Big impact. Small requirements. Accessible everywhere.

## Read first

1. [`README.md`](README.md) — package overview, source-of-truth order and build prerequisites.
2. [`AGENTS.md`](AGENTS.md) — persistent coding-agent rules and safety boundaries.
3. [`PROJECT_SPEC.md`](PROJECT_SPEC.md) — canonical product requirements and acceptance criteria.
4. [`ARCHITECTURE.md`](ARCHITECTURE.md) — fixed Android/Firebase architecture and stack.
5. [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) — autonomous Phase 0–9 build order and evidence gates.
6. [`TINY_PROJECT_BLUEPRINT.md`](TINY_PROJECT_BLUEPRINT.md) — complete 30-section consolidated blueprint and final coding-agent start point.
7. [`OPERATOR_INTAKE.md`](OPERATOR_INTAKE.md) and [`REFERENCE_ASSETS.md`](REFERENCE_ASSETS.md) — complete once, before application code changes.
8. [`AI_HANDOFF.md`](AI_HANDOFF.md) and [`docs/BUILD_LOG.md`](docs/BUILD_LOG.md) — current execution state and checkpoint evidence.
9. [`docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`](docs/FIREBASE_AGENT_SKILLS_AND_MCP.md) — official Firebase skills, OpenCode setup, MCP scope and authorization policy.
10. [`docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`](docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md) and [`docs/CI_ANDROID_BUILD.md`](docs/CI_ANDROID_BUILD.md) — secure configuration/credential ownership, GitHub Actions Ubuntu builds and App Distribution/judge access.

## Root handoff documents

| File | Purpose |
|---|---|
| `TINY_PROJECT_BLUEPRINT.md` | Complete product, UX, architecture, data, API, security, AI, testing, implementation and audit blueprint |
| `PROJECT_SPEC.md` | Product scope, user roles, FR-001…FR-030, business rules and acceptance criteria |
| `ARCHITECTURE.md` | Fixed Android client, Room/SQLCipher, WorkManager, Firebase and integration architecture |
| `IMPLEMENTATION_PLAN.md` | Phase 0–9 autonomous implementation plan, dependencies, deliverables and verification evidence |
| `AGENTS.md` | Persistent implementation instructions; agent is an executor, not a product architect |
| `AI_HANDOFF.md` | Initial pre-implementation status, unresolved inputs, limitations and resume instructions |
| `OPERATOR_INTAKE.md` | One consolidated intake for repository, references, credentials, budget, access, integrations, demo and authorization |
| `REFERENCE_ASSETS.md` | Exact reference-image inventory and design-inspection record; no image was supplied with the brief |
| `DEMO_VIDEO_PLAN.md` | <=180-second demo story, native capture, narration, sync/editing and final review |
| `README.md` | Project orientation and technical documentation map |

## `docs/` reference documents

| File | Purpose |
|---|---|
| `docs/PROPER_VIBE_CODING_WORKFLOW.md` | Exact byte-for-byte copy of the operator-supplied workflow methodology |
| `docs/API.md` | Callable Functions, request envelopes, validation, idempotency, webhook contracts and error behavior |
| `docs/DATA_MODEL.md` | Firestore entities, relationships, constraints, indexes, visibility and local Room model |
| `docs/SECURITY.md` | Threat model, authentication, authorization, tenant isolation, webhook, AI and child-data safeguards |
| `docs/MESSAGING.md` | Two-way SMS routing, verification, absence notifications, weekly digest, parent replies, consent, webhook and cost controls |
| `docs/CURRICULUM_AND_LOCALIZATION.md` | NERDC source controls, 5E structure, language set, translation and localization rules |
| `docs/SETUP.md` | Local development and emulator setup |
| `docs/CONFIGURATION.md` | Environment variables, secret handling, build flavors and cost guards |
| `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md` | Exact credential/config names, ownership, secure delivery locations, secret/public classification and timing |
| `docs/CI_ANDROID_BUILD.md` | GitHub Actions Ubuntu build/test permissions, workflow configuration, App Distribution and judge access |
| `docs/TESTING.md` | Unit, integration, emulator, E2E, security and acceptance test strategy |
| `docs/DEPLOYMENT.md` | Protected native APK preview, staging, CI, release gates and rollback |
| `docs/OPERATOR_GUIDE.md` | Operator responsibilities, workspace support, messaging operations and incident handling |
| `docs/TROUBLESHOOTING.md` | Common local, Firebase, sync, AI and messaging failures |
| `docs/DESIGN_NOTES.md` | Pending reference-image inspection and future visual decisions |
| `docs/BUILD_LOG.md` | Implementation phase and verification evidence log |
| `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md` | Official Firebase Agent Skills selection, OpenCode installation, Firebase MCP configuration, permissions and usage guardrails |

## Confirmed product baseline

- Native Android teacher app; personal Android smartphones are the intended device.
- Parent channel is basic-phone SMS; no parent app or parent login.
- No pupil-facing interface or pupil accounts.
- School-managed and independent teacher-created workspaces; full core access for independent teachers.
- Teachers can manage multiple classes and subjects.
- Multiple guardian contact endpoints can link to a pupil; one endpoint can link to multiple pupils. A shared handset is one contact endpoint.
- Teacher UI locales: English, Hausa, Yoruba, Igbo. Parent SMS locales: English, Hausa, Yoruba, Igbo, Nigerian Pidgin.
- NERDC Revised Basic Education Curriculum Primary 1–6; 5E lesson-planning scaffold.
- Offline lesson resources, attendance, local storage and queued synchronization.
- Immediate absence alerts only; weekly digest contains approved available information.
- Parents can initiate SMS conversations; teachers reply through Tiny.
- Child progress is teacher-recorded and teacher-approved before sharing.
- Firebase AI Logic hybrid inference is real but non-blocking and device-dependent. MVP minimum is Android API 26; connected production operations also require a Play Integrity-compatible Google Play environment.
- No payments, voice calling, examinations, student app or full school ERP in MVP.

## Readiness blockers

The package is ready for an implementation-agent handoff, but **Phase 0 is not complete**. Git commit/push to `main` is authorized and the repository remains public. UI reference URLs are still pending. Android builds use GitHub Actions Ubuntu runners, not a local Android Studio toolchain. Firebase project creation/access is a later integration gate and does not block independent Phase 1 scaffolding, Firebase skills installation or Emulator Suite setup. The supplied Samsung Galaxy Note 10+ is a general testing device only, not a Gemini Nano-supported device; on-device AI evidence remains a separate blocked acceptance gate. Firebase App Distribution is the preferred preview route, with tester/judge access still to be configured. eSMS remains mock-only. Cloud/AI/SMS/third-party budgets are NGN 0; production deployment, Blaze, paid hosting and live SMS are not authorized.

## Integrity of supplied methodology

`docs/PROPER_VIBE_CODING_WORKFLOW.md` is intended to preserve the uploaded methodology exactly. The file must remain unchanged unless the operator supplies a revised methodology.

## Firebase developer tooling baseline

- Install the selected official Firebase Agent Skills for OpenCode during Phase 1; verify skill discovery and preserve the generated lockfile when available.
- Recommended Firebase MCP server is configured only after non-production Firebase access is authorized; state-changing calls need explicit approval.
- `firebase-ai-logic-basics` is web-focused and does not replace Android-specific Firebase AI Logic hybrid-inference documentation.
- See `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`.
