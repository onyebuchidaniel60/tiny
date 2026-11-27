# Tiny

**Tiny — Big impact. Small requirements. Accessible everywhere.**

Tiny is an offline-first Android teacher-support and parent-engagement platform designed for rural primary schools in Nigeria. Teachers use the Android app on their existing phones. Parents use ordinary SMS; they do not install an app. Pupils have no accounts or student interface.

An operator-requested **browser companion preview** is deployed at <https://tiny-b9f29.web.app>. It mirrors the teacher workflows for evaluation, including local persistence and Firebase AI Logic. It is not a parent portal, pupil interface or replacement for the native Android app. See [`docs/WEB_APP.md`](docs/WEB_APP.md).

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

- Native Android app for teachers, built with Kotlin and Jetpack Compose; this remains the primary product.
- Browser companion preview for evaluation, with synthetic data and no parent or pupil account.
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
| Browser preview | Vite, React 19, TypeScript, Firebase Web SDK, IndexedDB, PWA |
| Local data | Room + SQLCipher; key protected by Android Keystore (Android); IndexedDB with a localStorage backup (browser preview) |
| Sync | WorkManager + durable outbox + server idempotency |
| Cloud data | Cloud Firestore Standard, `africa-south1` |
| Backend | Firebase Cloud Functions 2nd gen, TypeScript, Node.js 22 |
| Auth | Firebase Phone Authentication for teachers/admins |
| App integrity | Firebase App Check + Play Integrity |
| AI | Firebase AI Logic, Gemini Developer API cloud route + optional on-device SDK |
| Messaging | eSMS Africa Two-Way SMS; sandbox first |
| Testing | JUnit, Firebase Emulator Suite, Vitest, Playwright and axe; Compose instrumentation passes in CI; physical-device testing remains limited |
| CI | GitHub Actions Ubuntu 24.04 (`android-ci.yml`, `web-ci.yml`) |
| Preview | Firebase Hosting browser companion, public judge APK, Firebase App Distribution or protected APK delivery; separate static landing page |

The precise architecture and rationale are in `ARCHITECTURE.md`. Exact versions are pinned during readiness/build after compatibility verification; never use dynamic dependency versions.

## Start here

Phase 0 intake is complete. The Android preview, Firebase client integration, public judge APK and browser companion preview are implemented and verified. Firebase Authentication is initialized with synthetic test numbers, Firestore is deployed in `africa-south1`, and the browser preview is hosted on Firebase Hosting. Read `AI_HANDOFF.md` for exact state, `docs/BUILD_LOG.md` for evidence, `docs/FIREBASE_EVIDENCE.md` for the sanitized Firebase audit and `OPERATOR_INTAKE.md` for the remaining App Distribution and on-device gates. Do not claim production, live SMS, hosted Functions or Gemini Nano completion.

## Documentation map

- Setup: `docs/SETUP.md`
- Browser companion preview: `docs/WEB_APP.md`
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
- Design system: `docs/DESIGN_SYSTEM.md`
- Localization: `docs/LOCALIZATION.md`
- Help centre and tours: `docs/HELP_CENTRE.md`
- Teacher/guardian guide: `docs/USER_GUIDE.md`
- Brand and icon licence: `docs/BRAND_AND_ASSETS.md`
- Visual evidence index: `docs/SCREENSHOTS.md`
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

Browser companion:

```powershell
cd web
npm ci
Copy-Item .env.example .env.local   # fill placeholders locally; never commit
npm run dev
npm run typecheck
npm test
npm run build
```

Live Firebase/AI browser check (manual, uses the synthetic account and a small free-tier request):

```powershell
cd web
$env:TINY_LIVE_FIREBASE='1'; npx playwright test e2e/firebase-live.spec.ts --project=desktop-chromium
```

Landing page:

```powershell
npx --yes serve landing
```

## Current build status

**Final product-polish pass implemented and CI-verified.** Native Android and the hosted web teacher companion now share a complete localization system, design system, teacher/guardian tours, Help centre and open-source brand mark. Android verification: **37 Android JVM tests** (including localization parity), **19 Functions domain tests**, **9 Firestore rules tests**, **10 backend emulator E2E tests**, **lint**, **debug APK**, **Compose instrumentation journey** and **1 Android-to-Functions-emulator sync E2E**. CI run [45999218913](https://github.com/onyebuchidaniel60/tiny/actions/runs/45999218913) passed build/lint/unit/APK, rules, backend E2E and Compose instrumentation. The emulator signs in with a synthetic test phone number and loads a synthetic Firestore workspace. App Distribution tester emails, physical-device testing and native translation review remain pending. Production release is not authorized.

**Localization:** English is the source; Hausa, Yoruba and Igbo are complete drafts (754 keys each) with **native review pending**. The UI labels them as drafts and falls back to English. The old partial-translation implementation is replaced by a generated catalogue; see [`docs/LOCALIZATION.md`](docs/LOCALIZATION.md).

**Web verification:** typecheck/build passed; **23 Vitest tests**; **36 Playwright journeys passed, 3 live checks skipped** at desktop, tablet and mobile widths; **0 serious/critical axe** violations; **60 localized screenshots** in `artifacts/web/i18n/`. Latest web CI run [45999218456](https://github.com/onyebuchidaniel60/tiny/actions/runs/45999218456) passed. The manual Android emulator run is [46000347482](https://github.com/onyebuchidaniel60/tiny/actions/runs/46000347482); screenshots are uploaded as `tiny-emulator-evidence`.

A reviewed 146.6-second demo built from the real emulator evidence is at `artifacts/demo/tiny-demo.mp4` with captions, narration script and production notes. It is a narrated screenshot walkthrough, not motion screen recording; the Firebase scene uses the authenticated test-phone/Firestore screenshot and the AI scene shows the judge APK's `Source: Cloud Gemini` result. YouTube upload copy is in `artifacts/demo/youtube-description.md`; the public YouTube URL is still an operator action.

### Browser companion status

The browser companion is live at <https://tiny-b9f29.web.app>. It is a teacher-only, synthetic-data evaluation workspace with a synthetic Firebase email/password account (`judge@tiny-demo.example` / `TinyDemo2026!`) and an offline workspace mode. Verified flows include Firebase sign-in, read-only Firestore bootstrap, multiple classes and pupils, attendance with drafts and submission, lessons, progress approval, guardians, two-way synthetic messaging, IndexedDB refresh recovery, outbox states, PWA offline shell, teacher/guardian tours, Help centre, language switching with reload persistence and responsive desktop/tablet/mobile layouts. Browser tests: **23 unit/component tests**, **36 Playwright journeys** across desktop, tablet and mobile (the three live checks skip by default), **1 live Firebase/AI check** and **0 serious/critical axe violations**. The hosted AI result was SDK-reported `Cloud Gemini`; on-device Gemini Nano is not claimed. Browser writes remain local because Cloud Functions are emulator-only. See [`docs/WEB_APP.md`](docs/WEB_APP.md) and [`docs/LOCALIZATION.md`](docs/LOCALIZATION.md).

## Judge access

- Browser preview (no install): <https://tiny-b9f29.web.app>; synthetic account `judge@tiny-demo.example` / `TinyDemo2026!`.
- Public test build: [Tiny judge preview v0.1.0-preview.1](https://github.com/onyebuchidaniel60/tiny/releases/tag/v0.1.0-preview.1) (`tiny-judge-preview.apk`).
- Test phone: `08000000001`; code: `123456`.
- Installation, limitations and the App Distribution alternative: [`docs/JUDGE_ACCESS.md`](docs/JUDGE_ACCESS.md).
- Hybrid AI verification and the on-device hardware gap: [`docs/AI_HYBRID_VERIFICATION.md`](docs/AI_HYBRID_VERIFICATION.md).
- Submission readiness and official-rules risks: [`docs/HACKATHON_SUBMISSION.md`](docs/HACKATHON_SUBMISSION.md).

## License

Apache License 2.0. See [`LICENSE`](LICENSE).

## Firebase integration stage

Firebase project `tiny-b9f29` is configured in `.firebaserc` and the configuration docs. The CLI is authenticated; the dev-debug app and SHA fingerprints are registered; Firestore `(default)` is deployed in `africa-south1` with rules and seven indexes; Auth is initialized; Phone Auth uses two synthetic test numbers; the Android emulator signs in and loads a synthetic Firestore workspace; and a private app-level AI test passed with on-device fallback and SDK-reported source `Cloud Gemini`. A registered Firebase Web app and a synthetic Email/Password preview account support the browser companion; its hosted AI request also returned SDK-reported `Cloud Gemini`. Remaining hardening: App Check enforcement, Play Integrity/release fingerprint, hosted callable sync and revocation of the preview debug tokens after judging. Cloud Functions remain emulator-only under Spark/NGN 0. See `docs/FIREBASE_INTEGRATION.md`, `docs/FIREBASE_EVIDENCE.md` and `docs/WEB_APP.md`.


## Firebase development-agent tooling

The implementation agent must use the selected official Firebase Agent Skills for OpenCode and should use the Firebase MCP server as a controlled companion once non-production project access is authorized. These are developer tools, not app runtime dependencies. Read [`docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`](docs/FIREBASE_AGENT_SKILLS_AND_MCP.md) for the exact skill set, install/verification workflow, MCP scope and authorization restrictions.
