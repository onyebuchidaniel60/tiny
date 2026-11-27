# Tiny — Autonomous Implementation Plan

This plan follows `docs/PROPER_VIBE_CODING_WORKFLOW.md`. Phase boundaries are internal checkpoints, not approval gates. The agent continues automatically after tests, inspection, fixes, commit and handoff update.

## Global execution rules

- Complete one consolidated Operator Intake before modifying code.
- Do not re-ask questions answered by repository, handoff or operator.
- Use safe defaults for noncritical omissions; block only for genuinely required missing inputs.
- Do not invent credentials, access, reference assets, project IDs, domains or successful deployments.
- Do not create a mockup/prototype phase. Implement actual screens directly from reference image(s) during Phase 6.
- Do not deploy production or send real parent messages without exact authorization.
- Keep work in small commits. Every checkpoint updates `AI_HANDOFF.md` and `docs/BUILD_LOG.md`.

## Phase 0 — Operator intake and readiness

**Objective:** prove that product inputs, reference images, access, budgets and authority are available before implementation.

**Tasks:**
1. Read all handoff files and the attached workflow copy.
2. Inspect repository/Git status, manifests, current code, Firebase config, tests, CI and deployment files read-only.
3. Complete `OPERATOR_INTAKE.md` in one consolidated pass.
4. Confirm repository/branch and permitted changes. Git direct commit/push to public `main` is confirmed.
5. Confirm one or more UI reference URLs/images and record exact sources/ownership/usage. If absent, request them as one intake blocker; do not fabricate or substitute.
6. Record the Firebase project/access as a later integration gate. Spark/NGN 0 is confirmed; Functions are emulator-only. Project creation must not block Phase 1 scaffolding, Firebase Agent Skills installation or Emulator Suite setup.
7. Record acceptance of the `africa-south1` data location and global Gemini Developer API processing for de-identified AI inputs, subject to legal/DPIA review. Do not deploy or send real data.
8. Confirm eSMS status. Mock SMS adapter is authorized; sandbox/production remain disabled. Production budget is zero.
9. Confirm the general test device (Samsung Galaxy Note 10+) and Android version. Treat on-device Gemini Nano validation as a separate gate requiring a currently supported physical device.
10. Confirm the GitHub Actions Ubuntu build/test path and pinned tool versions. Do not install the full Android Studio toolchain on the Windows machine.
11. Confirm production release authority (default: not granted), NGN 0 spend ceilings, domains, data handling, destructive actions and prohibited actions.
12. Confirm demo audience, pronunciation (TIE-nee), output location (`artifacts/demo/`) and redaction rules.

**Deliverables:** completed intake table and readiness status; no app code changes.  
**Exit criteria:** critical product/technical inputs and UI reference URLs available; build path confirmed; budget/authorization boundaries explicit. Firebase project access may remain a later integration gate if Phase 1 can proceed independently. Mock SMS is acceptable for current development. On-device AI remains a separate gate. If a blocker exists, document the exact blocker and minimum operator action.

## Firebase development tooling prerequisite

Before Firebase integration work in Phase 2, install and verify the selected official Firebase Agent Skills for OpenCode as defined in `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`. This is developer tooling, not application code. Inspect the selected `SKILL.md` files and scripts, use project-local copied skills, preserve `skills-lock.json` if generated, and verify discovery in a fresh OpenCode session. Do not use the web-focused `firebase-ai-logic-basics` skill as authority for the native Android hybrid AI implementation.

The Firebase MCP server is the recommended companion but must remain disabled until the operator authorizes use against a non-production Firebase project and its allowed operation scope. Configure only the relevant feature groups. Start with read-only inspection/validation; state-changing operations require explicit per-action approval. Detailed setup and restrictions: `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`.

## Phase 1 — Repository foundation + skeletal native UI distribution

**Objective:** a navigable, clearly unfinished Android app shell exists and can be installed by approved testers early.

**Tasks:**
- Install and verify selected official Firebase Agent Skills for OpenCode; inspect the skill instructions/scripts and record the source commit, install path and lockfile status. This does not require the real Firebase project.
- Create/repair Gradle project with Kotlin, Compose and pinned dependencies. Use GitHub Actions Ubuntu runners as the primary build/test path; do not install the full Android Studio toolchain on the Windows operator machine.
- Establish package structure, theme tokens, navigation, route placeholders and localization scaffolding.
- Implement startup, language selection, auth placeholder, home/classes/lessons/messages/settings navigation.
- Clearly label unfinished routes and disable unsafe controls; no fake data that looks production-backed.
- Configure Firebase project flavors/build configs for dev/staging with placeholders; do not embed service credentials. Real project creation/access is a later integration gate and is not a Phase 1 blocker.
- Set up Firebase Emulator Suite with a demo project and the credential/configuration register (`.env.example`, no real secrets).
- Build debug APK through GitHub Actions and distribute through Firebase App Distribution protected testers when the project/tester access exists. If distribution access is not ready, keep the verified CI artifact and record the limitation.
- Record exact release/invitation URL, build number and Git commit in `AI_HANDOFF.md`.

**Tests:** Gradle build, lint baseline, startup smoke test, navigation route test, app icon/manifest validation.  
**Commit:** `feat: establish Android shell and preview distribution`.  
**Exit:** CI-built APK installs and navigates; App Distribution tester/judge access configured when project/tester inputs exist. No production data or actions.

## Phase 2 — Backend, data and auth foundation

**Tasks:**
- Create/select the dedicated non-production Firebase project when real Firebase integration tests begin; this is a later integration gate, not a Phase 1 prerequisite.
- Configure Firebase Auth phone provider with +234 region policy and test numbers in the non-production project.
- Configure Firestore Standard in `africa-south1`; do not create production data before approval.
- Add Firestore rules and indexes; default deny; server-only writes.
- Configure Functions 2nd gen in `africa-south1`, Node 22 TypeScript, for **Emulator Suite only**. Do not deploy Functions, enable Blaze or create paid hosting under Spark/NGN 0.
- Configure callable Auth + App Check enforcement and debug provider for local emulator only.
- Add Room + SQLCipher local schema and Android Keystore key management.
- Add repository layer and disable Firestore disk persistence.
- Add Firebase Emulator Suite and deterministic fixtures; use a demo project before the real project exists.
- Configure Secret Manager stubs/placeholders; do not commit actual credentials. Follow `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`.

**Tests:** auth emulator flow, rules tests, database migration, encrypted DB open/close, no Firestore direct write.  
**Commit:** `feat: add Firebase and encrypted local data foundation`.  
**Exit:** tested auth/database foundation in Emulator Suite/demo environment; no hosted Functions deployment.

## Phase 3 — Domain logic and APIs

Implement in this order:
1. Workspace and membership.
2. Classes, teacher assignments and pupils.
3. Guardians, pupil links, verification and consent.
4. Curriculum metadata, lessons and teaching resources.
5. Attendance sessions and entries.
6. Command receipts, sync processor and conflict logic.
7. Progress entries and approval.
8. Conversations/messages and eSMS adapter in sandbox.
9. Absence notification jobs and delivery receipts.
10. Weekly digest generator/scheduler.
11. AI task schemas, prompt builders and output validation.
12. Audit events, rate limits and operational usage counters.

**Tests:** every state transition; Zod schema tests; transaction/idempotency; access checks; webhook HMAC/dedupe; eSMS mocked adapter; digest golden tests.  
**Commit cadence:** small meaningful commits by domain; do not combine all domain behavior into one commit.  
**Exit:** server business logic independently testable; no UI-only enforcement.

## Phase 4 — Functional UI integration

**Tasks:**
- Connect onboarding and workspace switcher.
- Connect class/pupil/guardian flows to local Room and sync commands.
- Implement offline lesson planner and strategy library.
- Implement attendance draft/review/submit/correction screens.
- Implement sync center and conflict/needs-attention resolution.
- Implement teacher inbox, conversations, replies and status.
- Implement pupil progress capture, review and approval.
- Implement weekly digest preview.
- Add AI actions with capability check, language routing, inference-source result and non-AI fallback.

**Tests:** feature-level UI tests and repository tests.  
**Commit:** feature-specific commits.  
**Exit:** all MVP screens connected to actual local/backend behavior using temporary coherent visual design.

## Phase 5 — End-to-end functionality gate

**Required complete journeys:**
- School onboarding + invite teacher.
- Independent teacher onboarding.
- Multi-class teacher.
- Register pupil + multiple guardians + verification/consent.
- Offline lesson plan access.
- Offline attendance, app restart, reconnect and one-time commit.
- Absence-only notification job and mock adapter send; eSMS sandbox only if later authorized.
- Parent-initiated mock SMS to correct workspace/inbox.
- Teacher reply through mock adapter.
- Progress draft + approval + digest inclusion.
- Cloud AI with source evidence, plus unsupported-device/fallback behavior. On-device Gemini Nano evidence is a separate gate when a supported physical device is available.
- Cross-workspace denial and revoked membership behavior.

**Gate:** unit/integration and critical E2E tests pass; no unresolved critical/high security issue; mock provider only; preview APK and commit recorded.

**Commit:** `test: verify critical Tiny user journeys`.

**Exit:** core behavior is proven before final visual refinement; hybrid AI is not claimed complete until both on-device and cloud paths are tested.

## Phase 6 — Reference-image-led final UI and StageShow

**Tasks:**
- Run `npx skills add benjitaylor/skills --skill stageshow`.
- Inspect installed skill file and use only relevant guidance.
- Optionally find additional trusted mobile UI/UX skills if they materially help.
- Inspect supplied reference URL(s)/image(s), capture exact sources and notes in `REFERENCE_ASSETS.md`.
- Implement real screen UI directly; map visual direction to Tiny's screen inventory, mobile-first and accessibility constraints.
- Do not create separate mockups or ask for mockup approval.
- Record principles, deviations and decisions in `docs/DESIGN_NOTES.md`.
- Re-run UI tests and device screenshots.

**Exit:** final visual UI implemented from real references; screens remain functional and tests pass.  
**Commit:** `feat: implement reference-led Tiny interface`.

## Phase 7 — Frontend and documentation completeness

- Responsive layouts for common phone sizes and landscape/tablet as appropriate.
- Large touch targets, font scaling, TalkBack labels, semantics, focus and contrast.
- Loading, empty, offline, pending sync, validation, success, error, permission-denied, conflict and not-found states.
- Real routes and working controls; no dead buttons/links.
- App icon, display name, version, privacy notice, support destination and metadata.
- README plus setup/configuration/testing/deployment/troubleshooting/operator guide.
- Documentation links in any companion landing/help surface only if such a surface is authorized and real. The original MVP had no web surface; the operator authorized a teacher-only browser companion preview on 27 November 2026 (`docs/WEB_APP.md`). It does not add a parent or pupil account and does not replace the native app.

**Exit:** no inert controls, broken navigation or missing required states; docs are actionable.  
**Commit:** `docs: complete implementation and operator documentation`.

## Phase 8 — Demo video (<=180 seconds)

**Target:** 90–150 seconds.  
**Story:** Tiny philosophy → teacher offline lesson → offline attendance → reconnect/absence SMS mock → parent initiates message → teacher replies → positive progress update/digest → cloud AI source proof and honest on-device fallback (unless a supported device is available).

**Capture:** use Android UIAutomator/Maestro/Espresso or equivalent native UI automation, deterministic demo data, controlled network toggle, and `adb screenrecord` or equivalent. Use Playwright if a browser-based provider/App Distribution console is shown, with secrets redacted. Do not show real emails or private URLs. Generate concise narration with a free Google AI TTS option only after checking current access, quotas, terms and credential availability. Do not incur charges. If unavailable, use a permitted genuinely free TTS alternative and document it. Align narration to visible action; add captions where feasible; remove dead air; balance audio; render and review. Verify MP4 plays, audio is present, duration <=180s and no personal data/secrets/private URLs.

**Outputs:** `artifacts/demo/tiny-demo.mp4`, narration script, capture plan, production notes and review checklist.

**Commit:** `docs: add reviewed product demo video` (or LFS/artifact pointer if repo policy forbids large video files; exact location recorded).

## Phase 9 — Final regression/security/release

- Full unit/integration/E2E test suite on target SDK and representative physical handset.
- Security review of IDOR, rules, callable validation, HMAC, replay, prompt privacy, local DB encryption, rate limits, OTP and data export.
- Review dependency vulnerabilities and license notices.
- Review Firestore/Functions/AI/SMS costs and quotas.
- Verify Firebase project region and no production data in preview.
- Confirm release signing and Play policy requirements.
- Deploy only if operator explicitly authorized production release during Phase 0. Otherwise distribute verified staging APK and provide exact release runbook.
- Smoke-test and update `AI_HANDOFF.md`.

**Exit:** complete verified product, documentation and demo; known limitations and release boundary explicit.

## Blocker handling

If one integration is blocked, keep completing unaffected phases with safe mocks/adapters. Stop only the blocked operation when no safe fallback exists. Do not fabricate credentials, pay unexpected bills, weaken rules or bypass production authority. Report blocker, evidence, completed work and minimum operator action in both handoff and build log.

## Phase artifact and acceptance map

The agent must record actual files changed and the evidence for each phase. Filenames below are expected targets; if an existing repository uses an equivalent conventional layout, preserve it and document the mapping rather than duplicating files.

| Phase | Expected artifacts / changes | Verification evidence | Git checkpoint / acceptance |
|---|---|---|---|
| 0 | Updated `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md`; repo inspection summary in `AI_HANDOFF.md`; no code changes | Confirmed repository/branch, references, Firebase project/roles, billing, provider sandbox, test handset, budgets, distribution and authority | No code commit. Phase exits only when critical inputs are confirmed; optional missing preferences use documented defaults |
| 1 | `settings.gradle.kts`, root/app Gradle files, `gradle/libs.versions.toml`, wrapper, `app/src/main`, manifest, theme/navigation/localization resources, `.gitignore`, GitHub Actions Ubuntu workflow, dev/staging Firebase app config placeholders | Clean CI Android build, lint, unit tests, install/launch smoke test, navigation tests, APK artifact; App Distribution when access exists | `feat: establish Android shell and preview distribution`; `AI_HANDOFF.md` records exact artifact/URL, commit and tester access |
| 2 | `app/.../data/local` Room entities/DAOs/migrations; SQLCipher key provider; repository interfaces; Firebase config; `firebase/firebase.json`, `firestore.rules`, `firestore.indexes.json`; `functions/package.json`, TypeScript config and base function entry; emulator config | Room migration/encryption tests, Auth emulator, rules deny-by-default tests, callable Auth/App Check test, clean Functions build | `feat: add Firebase and encrypted local data foundation`; all sensitive cloud access tests pass |
| 3 | `functions/src/domain`, `callables`, `webhooks`, `jobs`, `providers`, `shared`; Zod schemas; server transaction/idempotency code; `docs/API.md` and `docs/DATA_MODEL.md` updated from implementation | State-transition tests, role/class scope tests, duplicate and concurrency tests, HMAC/replay tests, provider adapter tests, digest fixtures | Domain-specific small commits; every command and side effect has test evidence |
| 4 | `app/src/main/.../feature/*` for workspace/classes/pupils/attendance/lessons/progress/messages/AI/settings; Room migrations; repositories/use cases/ViewModels; localization resources | Compose UI tests, offline repository tests, manual airplane-mode flows, no dead buttons or fake success | Feature commits; every primary screen reads local Room state and creates durable sync commands |
| 5 | `tests/e2e`, emulator fixtures, test evidence artifacts, final E2E adjustments | All E2E-01…06 in `docs/TESTING.md`, cross-tenant/IDOR denial, cloud AI source/fallback evidence, mock messaging evidence; on-device AI evidence is a separate gate | `test: verify critical Tiny user journeys`; no unresolved critical/high security/functional issue |
| 6 | Actual composables/styles/assets in `app/src/main`; `docs/DESIGN_NOTES.md`; installed skill package metadata/instructions as applicable | Reference URL/image inventory, screen screenshots, Compose UI and accessibility tests, device visual inspection | `feat: implement reference-led Tiny interface`; no mockup/prototype deliverable or approval step |
| 7 | Final app icon/metadata/privacy/support destinations; `README.md`, all `docs/*.md`, user/operator help and build config polish | Link checker, accessibility checks, font scaling, all state inventory, navigation test, doc setup dry-run | `docs: complete implementation and operator documentation`; no broken links/inert controls |
| 8 | `artifacts/demo/tiny-demo.mp4`, `narration-script.md`, captions if feasible, `production-notes.md`, capture assets | Full rendered playback, duration <=180s, synchronized narration, captions check, secret/PII review | Video commit or approved artifact/LFS pointer; `AI_HANDOFF.md` records exact path and review evidence |
| 9 | Release tag, security/dependency reports, release notes, verified staging or production artifact, rollback instructions | Full regression, security pass, cost review, smoke tests, release authorization record | `release: ...` or final docs commit; production only when exact authority exists |

## Dependency order and parallelizable work

- Phase 0 is a hard prerequisite for any repository modifications.
- Phase 1 can proceed with a CI/local app shell while Firebase configuration is prepared; the real Firebase project is not required for scaffolding, Firebase Agent Skills installation or Emulator Suite setup. App Distribution is blocked until project/tester access exists; use the verified CI artifact and report the limitation rather than inventing a URL.
- Phase 2 foundation should precede shared backend writes; use Emulator Suite under Spark/NGN 0 and do not deploy Functions.
- Within Phase 3, independent domain modules may be implemented in bounded parallel branches only if the agent preserves the API/data contracts and integrates/tests them sequentially. Attendance and messaging side effects must be transactionally integrated before E2E.
- Phase 4 can integrate completed domain slices progressively using the temporary coherent visual system.
- Phase 5 is a hard gate before Phase 6 final visual refinement.
- Phase 6 is blocked until reference URLs/images are actually available or the operator has explicitly authorized generated references. Do not invent or substitute references.
- Phase 8 is blocked until all narrated flows are real and verified.
- Phase 9 may complete staging/emulator regression without production authority, but must stop before any unauthorized production action.

## Stop conditions vs safe continuation

| Blocker | What must stop | What may continue safely |
|---|---|---|
| Missing UI reference URL/image | Phase 6 final UI; and implementation start if the workflow treats it as a critical intake asset | No code phase until resolved under the supplied methodology; agent may complete read-only repository inspection/intake |
| Firebase billing not enabled/approved | Billable cloud deployment, including hosted Functions | GitHub Actions Android shell, Emulator Suite, mocks and unit work; no paid resource provisioning |
| eSMS credentials unavailable | Provider sandbox calls and inbound webhook live test | Mock SMS adapter, provider contract and all unrelated domain/UI tests; sandbox later if authorized |
| Compatible on-device handset unavailable | Claim/demo of genuine on-device inference | Implement capability detection, cloud route and fallback; mark hybrid proof incomplete |
| Production SMS budget missing | Production sends/provider activation | Mock/sandbox only and all non-messaging work |
| Production release authority absent | Production deploy/release | Complete staging/emulator verification, signed build preparation and release instructions |
| DPO/DPIA/cross-border review incomplete | Real pupil-data pilot and production processing | Synthetic-data development/staging tests |

Every pause report names the exact blocked operation, evidence, unaffected work completed and minimum operator action needed.
