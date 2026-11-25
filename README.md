# Tiny

**Tiny — Big impact. Small requirements. Accessible everywhere.**

Tiny is an offline-first Android teacher-support and parent-engagement platform designed for rural primary schools in Nigeria. Teachers use the Android app on their existing phones. Parents use ordinary SMS; they do not install an app. Pupils have no accounts or student interface.

This repository is an implementation handoff package. It is not authorization to begin production deployment, spend money, send messages to real parents, or process live pupil data. The coding agent must complete `OPERATOR_INTAKE.md` before modifying application code.

## Source of truth

Start with [`PACKAGE_INDEX.md`](PACKAGE_INDEX.md) for the complete handoff map.

Read these files in this order:

1. `AGENTS.md` — persistent execution and safety rules.
2. `PROJECT_SPEC.md` — product requirements and acceptance criteria.
3. `ARCHITECTURE.md` — fixed MVP architecture and technology decisions.
4. `IMPLEMENTATION_PLAN.md` — autonomous implementation phases and gates.
5. `TINY_PROJECT_BLUEPRINT.md` — consolidated product, engineering, business, UX and security blueprint.
6. `docs/PROPER_VIBE_CODING_WORKFLOW.md` — operator-supplied methodology; preserve its workflow.
7. `OPERATOR_INTAKE.md` and `REFERENCE_ASSETS.md` — complete these before implementation.
8. `AI_HANDOFF.md` and `docs/BUILD_LOG.md` — update at every checkpoint.

When documents conflict, `PROJECT_SPEC.md` controls product behavior, `ARCHITECTURE.md` controls the fixed architecture, and the uploaded workflow controls execution order and operator authorization. Record a conflict; do not silently change a decision.

## Product boundaries

- Native Android app for teachers, built with Kotlin and Jetpack Compose.
- Parents communicate through SMS; no parent app or parent login.
- No student view, login or app.
- Primary 1–6, using verified NERDC Revised Basic Education Curriculum material.
- Teacher UI: English, Hausa, Yoruba and Igbo.
- Parent SMS: English, Hausa, Yoruba, Igbo and Nigerian Pidgin.
- Offline lesson resources, attendance capture, pupil records and durable sync are core.
- Immediate attendance notifications are for absences only; present and late do not trigger immediate alerts.
- Weekly digests contain only approved and available information.
- Parent-initiated two-way SMS is part of MVP.
- Teacher approval is mandatory before pupil progress content is shared.
- Hybrid AI demonstrates actual on-device and cloud inference, but on-device AI is hardware-dependent and must never gate core functionality.
- No payments, voice calling, student accounts, examination platform or full school ERP in MVP.

## Build prerequisites

The required input and authorization inventory is in `OPERATOR_INTAKE.md`. At minimum the operator must supply or approve:

- The target repository and access.
- One or more genuine UI reference images (or explicitly authorize generation of a reference image).
- A Firebase project and staging/dev access with billing boundary understood.
- A compatible Android test handset for verifying true on-device hybrid inference, plus representative low-cost target phones to check Android version and Play Integrity/Google Play services compatibility.
- eSMS Africa sandbox credentials or approval to use the sandbox; production KYC, spend and sending permissions are separate.
- Preview distribution access (Firebase App Distribution or an agreed protected APK destination).
- Demo output location and any redaction requirements.

The absence of any critical input must be recorded as a blocker in the consolidated intake. Noncritical preferences have documented defaults.

## Technology summary

| Layer | Choice |
|---|---|
| Android | Kotlin, Jetpack Compose, Material 3 |
| Local data | Room + SQLCipher; key protected by Android Keystore |
| Sync | WorkManager + durable outbox + server idempotency |
| Cloud data | Cloud Firestore Standard, `africa-south1` |
| Backend | Firebase Cloud Functions 2nd gen, TypeScript, Node.js 22 |
| Auth | Firebase Phone Authentication for teachers/admins |
| App integrity | Firebase App Check + Play Integrity |
| AI | Firebase AI Logic, Gemini Developer API cloud route + optional on-device SDK |
| Messaging | eSMS Africa Two-Way SMS; sandbox first |
| Testing | JUnit, MockK, Turbine, Compose UI tests, Firebase Emulator Suite |
| CI | GitHub Actions |
| Preview | Firebase App Distribution or protected APK delivery; no web frontend in MVP |

The precise architecture and rationale are in `ARCHITECTURE.md`. Exact versions are pinned during readiness/build after compatibility verification; never use dynamic dependency versions.

## Start here

The coding agent's first and only initial task is to read the handoff, inspect the repository without modifying it, and complete the consolidated Operator Intake/Readiness Check. It must not start coding until critical inputs and reference images are present and validated. See the `CODING AGENT START POINT` at the end of `TINY_PROJECT_BLUEPRINT.md`.

## Documentation map

- Setup: `docs/SETUP.md`
- Environment and secrets: `docs/CONFIGURATION.md`
- API contracts: `docs/API.md`
- Database/data model: `docs/DATA_MODEL.md`
- Security and privacy: `docs/SECURITY.md`
- Tests and acceptance: `docs/TESTING.md`
- Deployment and release: `docs/DEPLOYMENT.md`
- Operations: `docs/OPERATOR_GUIDE.md`
- Curriculum and localization: `docs/CURRICULUM_AND_LOCALIZATION.md`
- SMS operations and costs: `docs/MESSAGING.md`
- Troubleshooting: `docs/TROUBLESHOOTING.md`
- Design evidence: `docs/DESIGN_NOTES.md`
- Build evidence: `docs/BUILD_LOG.md`
- Demo production: `DEMO_VIDEO_PLAN.md`

## Current build status

**Planning/handoff only. No application code has been implemented.** Reference images, repository access, service credentials and deployment permissions are pending consolidated operator intake. Production release is not authorized by default.
