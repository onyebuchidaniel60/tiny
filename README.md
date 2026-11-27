# Tiny

**Tiny — Big impact. Small requirements. Accessible everywhere.**

Tiny is an offline-first Android teacher-support and parent-engagement platform designed for rural primary schools in Nigeria. Teachers use the Android app on their existing phones. Parents use ordinary SMS; they do not install an app. Pupils have no accounts or student interface.

Tiny is submitted to **#BuildHybridAI 2026** (Firebase AI Logic hybrid inference). See [`docs/HACKATHON_SUBMISSION.md`](docs/HACKATHON_SUBMISSION.md) for the official-requirements review and risks.

This repository now contains an implementation preview as well as the product handoff. It is not authorization to begin production deployment, spend money, send messages to real parents, or process live pupil data. Current development is mock-only, synthetic-data-only and zero-budget.

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

- The target repository and access (confirmed: public `main`, direct commit/push authorized).
- One or more genuine UI reference URLs/images (confirmed: REF-001 Atelio Studio visual direction and REF-002 PASS structure; reference-only, original Tiny identity).
- GitHub Actions Ubuntu build/test access (confirmed as the preferred build path; no full Android Studio installation on Windows).
- A non-production Firebase project and access (confirmed: `tiny-b9f29`; CLI authenticated; Auth initialized with synthetic test numbers; Spark/NGN 0 means Cloud Functions remain emulator-only).
- Firebase App Distribution tester/judge access for the protected preview.
- A general Android test handset (Samsung Galaxy Note 10+, Android 12) and, separately, a currently supported Gemini Nano device for genuine on-device AI evidence. No second physical device is available.
- Mock SMS adapter approval (confirmed; eSMS sandbox/production remain disabled).
- Demo output location and redaction requirements (confirmed: `artifacts/demo/`, synthetic data).
- Credential/configuration register acknowledgement; secrets are delivered securely, never through chat or Git.

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
| Testing | JUnit, Firebase Emulator Suite, Vitest; Compose instrumentation passes in CI; physical-device testing remains limited |
| CI | GitHub Actions Ubuntu 24.04 |
| Preview | Firebase App Distribution or protected APK delivery; separate static landing page |

The precise architecture and rationale are in `ARCHITECTURE.md`. Exact versions are pinned during readiness/build after compatibility verification; never use dynamic dependency versions.

## Start here

Phase 0 intake is complete and the Phase 1 preview is implemented and CI-verified. Firebase project-side setup is complete except for the one-time Console initialization of Authentication. Read `AI_HANDOFF.md` for exact state, `docs/BUILD_LOG.md` for evidence, `docs/FIREBASE_EVIDENCE.md` for the sanitized Firebase audit and `OPERATOR_INTAKE.md` for the remaining Auth/App Distribution/on-device gates. Do not claim production, live SMS or Gemini Nano completion.

## Documentation map

- Setup: `docs/SETUP.md`
- Environment and secrets: `docs/CONFIGURATION.md`
- Credential/configuration register: `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`
- GitHub Actions Android build and App Distribution: `docs/CI_ANDROID_BUILD.md`
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
- Firebase integration runbook: `docs/FIREBASE_INTEGRATION.md`
- Firebase sanitized audit/evidence: `docs/FIREBASE_EVIDENCE.md`
- Judge APK/App Distribution: `docs/JUDGE_ACCESS.md`
- Hybrid AI verification: `docs/AI_HYBRID_VERIFICATION.md`
- Hackathon submission checklist: `docs/HACKATHON_SUBMISSION.md`
- Demo production: `DEMO_VIDEO_PLAN.md`
- Landing page: `landing/README.md`
- Firebase Agent Skills and MCP developer tooling: `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`

## Local development

Android (primary path is GitHub Actions; local use requires a JDK 17 + Android SDK command-line installation, not full Android Studio):

```bash
./gradlew testDevDebugUnitTest assembleDevDebug
```

Functions:

```bash
cd functions
npm ci
npm run build
npm test
```

Landing page:

```powershell
npx --yes serve landing
```

## Current build status

**Phase 1 preview implemented and CI-verified; Firebase client integration in place.** Kotlin/Compose shell, encrypted Room/SQLCipher foundation, demo data, local attendance/progress/message flows, mock adapters, Functions/rules backend, CI workflow and responsive landing page are present. Verification: **35 Android unit tests**, **19 Functions domain tests**, **9 Firestore rules tests**, **10 backend emulator E2E tests**, **1 Android-to-Functions-emulator sync E2E**, **1 app-level AI cloud test**, **lint**, **debug APK**, **emulator smoke** and a **Compose instrumentation journey**. Latest Firebase-enabled CI run: `https://github.com/onyebuchidaniel60/tiny/actions/runs/45950400565`. The emulator signs in with a synthetic test phone number, reaches Home, and loads a synthetic Firestore workspace (1 class / 1 pupil). App Distribution tester emails and a physical-device run are still pending. Native translations are draft. Production release is not authorized.

A reviewed 146.6-second demo built from the real emulator evidence is at `artifacts/demo/tiny-demo.mp4` with captions, narration script and production notes. It is a narrated screenshot walkthrough, not motion screen recording; the Firebase scene uses the authenticated test-phone/Firestore screenshot and the AI scene shows the judge APK's `Source: Cloud Gemini` result. YouTube upload copy is in `artifacts/demo/youtube-description.md`; the public YouTube URL is still an operator action.

## Judge access

- Public test build: [Tiny judge preview v0.1.0-preview.1](https://github.com/onyebuchidaniel60/tiny/releases/tag/v0.1.0-preview.1) (`tiny-judge-preview.apk`).
- Test phone: `08000000001`; code: `123456`.
- Installation, limitations and the App Distribution alternative: [`docs/JUDGE_ACCESS.md`](docs/JUDGE_ACCESS.md).
- Hybrid AI verification and the on-device hardware gap: [`docs/AI_HYBRID_VERIFICATION.md`](docs/AI_HYBRID_VERIFICATION.md).
- Submission readiness and official-rules risks: [`docs/HACKATHON_SUBMISSION.md`](docs/HACKATHON_SUBMISSION.md).

## License

Apache License 2.0. See [`LICENSE`](LICENSE).

## Firebase integration stage

Firebase project `tiny-b9f29` is configured in `.firebaserc` and the configuration docs. The CLI is authenticated; the dev-debug app and SHA fingerprints are registered; Firestore `(default)` is deployed in `africa-south1` with rules and seven indexes; Auth is initialized; Phone Auth uses two synthetic test numbers; the Android emulator signs in and loads a synthetic Firestore workspace; and a private app-level AI test passed with on-device fallback and SDK-reported source `Cloud Gemini`. Remaining hardening: App Check enforcement, Play Integrity/release fingerprint, and Functions-emulator client sync. Cloud Functions remain emulator-only under Spark/NGN 0. See `docs/FIREBASE_INTEGRATION.md` and `docs/FIREBASE_EVIDENCE.md`.


## Firebase development-agent tooling

The implementation agent must use the selected official Firebase Agent Skills for OpenCode and should use the Firebase MCP server as a controlled companion once non-production project access is authorized. These are developer tools, not app runtime dependencies. Read [`docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`](docs/FIREBASE_AGENT_SKILLS_AND_MCP.md) for the exact skill set, install/verification workflow, MCP scope and authorization restrictions.
