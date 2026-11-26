# Tiny — AI Implementation Handoff

**Last updated:** 26 November 2026 (Phase 1 implementation)

**Current status:** Phase 1 implementation in progress. Android shell, encrypted local data layer, Functions/rules scaffold, CI workflow and landing page exist. No production deployment, live SMS or Firebase project resources have been created.

**Current phase:** Phase 1 — repository foundation, skeletal Android app, CI and landing page.

**Next task:** Push this Phase 1 checkpoint, run GitHub Actions, fix any CI failure, verify the APK artifact, then continue Phase 2/3 with Firebase Emulator Suite and rules/domain testing.

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
- SMS: eSMS Africa Two-Way SMS target; mock adapter during current development; no live sends until authorized.
- Preview: protected Firebase App Distribution or approved secure APK artifact, not a website; landing page is a separate static marketing surface.
- No payment system, voice calling, web product frontend, parent app or student app.

## Current readiness

| Item | Status | Notes |
|---|---|---|
| Product scope and roles | CONFIRMED | `PROJECT_SPEC.md` |
| Business rules | CONFIRMED | `TINY_PROJECT_BLUEPRINT.md`, `docs/API.md`, `docs/DATA_MODEL.md` |
| Architecture | CONFIRMED | `ARCHITECTURE.md`; Firebase Agent Skills/MCP are developer tooling only |
| Implementation phase plan | CONFIRMED | `IMPLEMENTATION_PLAN.md` |
| Coding-agent rules | READY | `AGENTS.md` |
| Operator intake | COMPLETE — current scope | References and device baseline supplied; Firebase/App Distribution later gates |
| UI references | CONFIRMED | REF-001 Atelio Studio visual direction; REF-002 PASS structure/storytelling; reference-only, original Tiny assets |
| Repository/path/branch | CONFIRMED | `C:\Users\User\Documents\Projects\tiny`; public `main`; direct commits/pushes authorized |
| Git restrictions | CONFIRMED | No force-push, history rewrite, branch deletion or visibility change |
| Android build environment | CONFIRMED | GitHub Actions `ubuntu-24.04`; local portable JDK 17 + Android CLI SDK verification; no full Android Studio |
| Android shell | IMPLEMENTED — preview | Onboarding, Home, Classes, Attendance, Lessons, Messages, Progress, Settings, Sync |
| Local data layer | IMPLEMENTED — preview | Room + SQLCipher + Keystore-wrapped key + DataStore + synthetic seed data |
| Android tests | PASS — 21/21 | Domain unit tests; no instrumentation/device run yet |
| Android build | PASS | Local `assembleDevDebug`; APK 27,894,591 bytes (~26.6 MiB) |
| Android lint | PASS | After deferring partial-translation `MissingTranslation` backlog |
| Functions domain | PASS — 19/19 | TypeScript build and Vitest suites |
| Functions callables/webhooks | SCAFFOLDED | Main callables, HMAC webhooks, scheduled digest; emulator runtime tests pending |
| Firebase project/access | PENDING — later integration gate | Not required for current Android shell |
| Firebase Emulator Suite | SCAFFOLDED | Config, demo project alias, rules/indexes; startup/rules tests pending |
| Hosted Cloud Functions | NOT AUTHORIZED — emulator-only | Spark/NGN 0; no deploy/Blaze/paid hosting |
| Cloud AI | CONFIRMED — free tier | Gemini Developer API free tier on Spark; no paid AI |
| Protected preview distribution | PENDING — App Distribution preferred | Firebase project and tester/judge groups needed |
| Physical Android device | GENERAL TESTING ONLY | Samsung Galaxy Note 10+, Android 12; no second device; not Gemini Nano-supported |
| On-device AI gate | BLOCKED — separate acceptance gate | No supported physical device; emulator does not prove Nano inference |
| eSMS sandbox | NOT REQUIRED NOW | Mock SMS adapter; no live/sandbox sends authorized |
| Production SMS authority/budget | NOT AUTHORIZED | NGN 0; mock only |
| Production deploy authority | NOT AUTHORIZED | No production resources |
| Landing page | IMPLEMENTED — local preview | Responsive static page + legal/security/contact; GitHub Pages pending |
| Demo audience/output | CONFIRMED | Firebase hackathon judges/product evaluators; `artifacts/demo/` |
| Demo voice/TTS | PENDING | Recheck free tier/terms at Phase 8 |

## Operator confirmations received

- Git: direct commits/pushes to public `main`; no force-push, history rewrite, branch deletion or visibility change.
- UI references: Framer Atelio Studio (visual direction) and PASS landing page (structure/storytelling) supplied 26 November 2026. Both reference-only; no copying source/assets/branding; original Tiny identity required.
- Device: Samsung Galaxy Note 10+, Android 12; only physical device; general testing only, not Gemini Nano-supported; no second device planned.
- Build: GitHub Actions Ubuntu preferred; no full Android Studio installation on Windows.
- Firebase: dedicated non-production project to be created/supplied; project access is a later integration gate. Gemini Developer API free tier; Spark; no billing/Blaze/paid service without explicit approval; Emulator Suite and synthetic data.
- Distribution: Firebase App Distribution preferred; tester/judge access pending.
- Functions: emulator-only under Spark/NGN 0.
- Credentials: complete register; `.env.example` placeholders only; no credentials through chat.
- Budgets: cloud NGN 0; paid AI NGN 0; SMS/voice NGN 0; paid third-party NGN 0.
- SMS: mock adapter authorized; no live sends.
- Data: synthetic only; production blocked until privacy/legal/security gates pass.
- Demo: Firebase hackathon judges/product evaluators; 90–150 seconds (max 180); `artifacts/demo/`.
- Autonomy: continue after genuine blockers resolved; stop for security, destructive actions, unexpected costs, unavailable essential dependencies or out-of-scope actions.

## Phase 1 implementation evidence

### Android

- Gradle/Kotlin/Compose project with pinned versions: AGP 8.13.2, Gradle 8.13, Kotlin 2.3.0, Compose BOM 2026.06.01, compileSdk/targetSdk 36, minSdk 26, JDK 17.
- Package structure: `core/model`, `core/database`, `core/security`, `core/preferences`, `core/domain`, `core/network`, `core/sync`, `data`, `ui/theme`, `ui/components`, `ui/screens`.
- Navigation: onboarding → language → welcome → Home/Classes/Lessons/Messages + detail routes; Settings and Sync.
- Local data: Room entities/DAOs for workspace, class, pupil, guardian, links, attendance, lessons, progress, conversations/messages, outbox, sync cursor, audit.
- SQLCipher: `net.zetetic:sqlcipher-android:4.20.0`; passphrase generated randomly and wrapped by an Android Keystore AES-GCM key; fails closed if unwrap fails.
- Demo data: synthetic workspace/classes/pupils/guardians, one submitted attendance session, two lesson plans, progress entries, conversations and a pending outbox command.
- Attendance: save draft, validate complete roster, submit locally, create outbox command, absence-only audit; no real SMS.
- Progress: validation, draft save, revision reset on approved edit, approval state, digest eligibility.
- Messages: mock parent inbox, teacher reply queued through mock adapter, status labelled as mock.
- Sync: mock engine processes pending commands without claiming cloud sync; sync center explains the limitation.
- Unit tests: 21/21 pass across phone normalization, attendance, SMS segmentation, progress, digest and sync rules.
- Local build: `testDevDebugUnitTest assembleDevDebug` successful; APK 27,894,591 bytes.
- Lint: `lintDevDebug` successful after disabling `MissingTranslation` for the partial draft translation set.

### Functions / Firebase

- `functions/` TypeScript project (Node 22, Firebase Functions 6.5.0, Admin 13.4.0, Zod).
- Domain modules: phone, access, attendance, guardian, progress, SMS segmentation, digest, sync, AI privacy/schema.
- 19 Vitest tests pass; `npm run build` passes.
- Callables scaffolded: workspace create, invitation, accept, classroom, pupil, guardian, link, verification, attendance submit, progress create/approve, teacher reply, sync batch.
- Webhooks: HMAC-SHA256 raw-body verification, timing-safe comparison, event dedupe, routing by school code, guardian phone-hash lookup, mock-safe responses.
- Scheduled digest: Friday 15:00 Africa/Lagos; approved/non-not-assessed entries only; mock notification jobs.
- `firestore.rules`: default deny; member read baseline; direct writes denied; admin-only guardian/conversation reads. Class-level read restrictions need emulator tests and tightening before pilot.
- `firebase.json`, `.firebaserc` (`demo-tiny`), `firestore.indexes.json` present.
- `syncCommands` validates batches/receipts but the full command processor is not complete; direct callables cover main flows. Do not claim full offline sync processing.

### CI / distribution

- `.github/workflows/android-ci.yml`: Ubuntu 24.04, JDK 17, Android SDK, Gradle, Node 22, Functions tests, Android lint/unit tests/debug APK, artifact upload; optional manual App Distribution job gated by variables.
- No GitHub Actions run yet at the time of this checkpoint.
- `.github/workflows/landing-pages.yml`: GitHub Pages static deployment; Pages enablement pending.
- App Distribution tester/judge access still pending.

### Skills

- Firebase Agent Skills installed under `.agents/skills/`; `skills-lock.json` preserved.
- Source commit: `99954a30898bb5ddc8152ee10e124dc3b4106bf7`.
- Installed: `firebase-basics`, `firebase-auth-basics`, `firebase-firestore`, `firebase-security-rules-auditor`, `firestore-rules-creation`.
- Live catalog mapping: `firebase-firestore-standard` → `firebase-firestore`; `firestore-security-rules-auditor` → `firebase-security-rules-auditor`; `firebase-local-env-setup` absent (covered by `firebase-basics` + official emulator docs).
- Discovery: Firebase skills are visible in the active OpenCode tool catalog. `opencode` CLI is not on PATH, so a separate fresh-session CLI check was not possible; recorded as a limitation.
- StageShow: install attempted; files appeared but the harness removed the `stageshow` skill ID after a server restart. Incomplete directory removed; **not used** and completion is not claimed.
- Firebase MCP: disabled until non-production project/access and operation scope are authorized.

### Landing page

- `landing/index.html`, `styles.css`, `app.js`, `privacy.html`, `security.html`, `contact.html`.
- Original warm paper/riso-inspired identity, serif display type, ink outlines, tomato/cobalt/butter palette, hand-drawn CSS motifs and product mockups.
- Multi-section story: hero, problem, approach, teacher features, parent features, how it works, offline/low-bandwidth/multilingual, walkthrough, impact, build status, FAQ, final CTA, substantial footer.
- Clearly distinguishes implemented/preview from planned/externally gated; no fabricated testimonials, logos, adoption numbers or impact statistics.
- Local screenshots: `artifacts/screenshots/landing-desktop-full.png`, `landing-mobile-top.png`, `landing-mobile-revealed.png`.
- Local link/nav checks pass; no images without alt; mobile nav toggle verified.

## Blockers and minimum operator action

| Blocker | Why it matters | Minimum operator action |
|---|---|---|
| Firebase project/App Distribution access | Required before real Firebase integration tests and judge-facing preview | Supply project ID, least-privilege access method, `internal-testers`/`judges` groups and judge-email handling |
| Supported on-device AI device | Note 10+ (Android 12) is general testing only; separate acceptance gate | Provide a currently supported physical device, or accept on-device demo blocked |
| StageShow skill | Required attempt unavailable after harness restart | No operator action unless a replacement UI skill is approved; current landing page uses direct design-system discipline |
| GitHub Actions first run | CI is authored but not yet executed | Push checkpoint and inspect the workflow result; fix failures |
| Firebase Emulator runtime tests | Rules/functions/emulator integration not yet run | Install Firebase CLI in CI/local and run emulator tests |
| Native translation review | Hausa/Yoruba/Igbo app strings are draft/partial | Arrange native review before pilot; English fallback is active |
| Pilot/legal gates | DPIA, controller/processor, privacy notice, retention, NERDC rights | Identify approvers and timing before a real-school pilot |

## Preview / deployment evidence

- Local debug APK: `app/build/outputs/apk/dev/debug/app-dev-debug.apk` (27,894,591 bytes).
- GitHub Actions: workflow file present; **not yet run**.
- App Distribution: not uploaded; no tester group/project.
- Landing page: local static preview; GitHub Pages workflow present but Pages enablement/publication not verified.
- Hosted backend: not deployed; Spark/NGN 0.
- Production: not authorized.

## Documentation status

- [x] Product spec, architecture, implementation plan, agent instructions
- [x] Operator intake and reference register updated
- [x] Credential/configuration register and `.env.example`
- [x] GitHub Actions/App Distribution guide
- [x] Landing page and legal/security/contact pages
- [x] Phase 1 evidence in this handoff and build log
- [ ] Final design notes against app screenshots
- [ ] Native translation review
- [ ] Full README build/preview results after CI run

## Demo status

- Video: Not produced; requires stable app capture. No physical device connected during this checkpoint.
- Target length: 90–150 seconds; absolute maximum 180 seconds.
- Demo data: synthetic only.
- Demo journeys: offline lesson, local attendance, mock absence job, parent mock message/teacher reply, approved progress/digest, cloud/fallback AI; on-device Nano evidence blocked.
- Output: `artifacts/demo/`.
- TTS: check free Google AI option/quota/terms at Phase 8; no charges.

## Authorization boundaries

- Do not reveal or commit secrets, real pupil/guardian data or private URLs. No credentials through chat.
- Do not incur unapproved charges. Cloud, AI, SMS, voice and third-party budgets are NGN 0.
- Do not send live SMS. Mock adapter only.
- Do not process real pupil/guardian data in development or demos.
- Do not deploy production, migrate/destructively alter production data or enable irreversible actions.
- Do not deploy Cloud Functions, activate Blaze or create paid Firebase resources. Functions are emulator-only.
- Do not install full Android Studio on the Windows machine; use GitHub Actions.
- Do not force-push, rewrite history, delete branches or change repository visibility.
- Do not bypass App Check, encryption or authorization to make a demo work.

## Documentation inconsistencies observed

1. **Environment-variable names:** `TINY_PROJECT_BLUEPRINT.md` §23 uses `SMS_MONTHLY_BUDGET_USD` / `AI_DAILY_CLOUD_LIMIT_PER_TEACHER`; `docs/CONFIGURATION.md` and `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md` use `SMS_MONTHLY_BUDGET_MINOR` / `AI_DAILY_CLOUD_LIMIT_PER_USER`. The register treats the latter as canonical.
2. **SMS mode:** target architecture uses `SMS_MODE=sandbox|production`; current development uses `mock`. Mock is a development adapter, not an architecture change.
3. **Demo output path:** Phase 8 narrative mentions `demo/`; artifact table and `DEMO_VIDEO_PLAN.md` use `artifacts/demo/`. Use `artifacts/demo/`.
4. **AI versions:** blueprint SDK/Compose versions are provisional; pinned versions actually used are recorded in this handoff and `docs/BUILD_LOG.md`.
5. **Firebase skill IDs:** the live official catalog has renamed/removed some selected IDs; mapping is recorded above. No silent substitution.
6. **StageShow:** required attempt failed due harness removal; not claimed complete.
7. **Historical ZIP claim:** the ZIP is not in this repository; current Markdown checks pass independently.

## Known limitations / risks

1. On-device Gemini Nano is blocked: Note 10+ is not supported; emulator does not prove physical inference.
2. Hosted Functions are unavailable under Spark/NGN 0; backend is emulator-only.
3. Firebase project/App Distribution access is not yet available; no judge-facing build or Firebase integration test.
4. `syncCommands` command processing is scaffolded, not complete.
5. Firestore rules are a baseline; class-level guardian/conversation read restrictions need emulator tests before pilot.
6. App translations are partial draft resources; native review is pending.
7. No physical device was connected during the checkpoint; general device validation is pending.
8. StageShow skill was not usable after restart; no claim.
9. Local Windows machine uses portable JDK/SDK; CI is the canonical build.
10. Public repository: never commit secrets or real data.

## Resume instruction

Inspect Git status, this file, `OPERATOR_INTAKE.md`, `docs/BUILD_LOG.md`, `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`, `docs/CI_ANDROID_BUILD.md`, and the latest commits. Resume by pushing the Phase 1 checkpoint, running GitHub Actions, fixing CI, then continue Phase 2/3. Do not deploy Functions, activate Blaze, send live SMS, use real pupil data or claim on-device AI without a supported device and evidence.
