# Tiny — AI Implementation Handoff

**Last updated:** 27 November 2026 (browser companion, submission, sync E2E and judge access)

**Current status:** Firebase CLI is authenticated as the project owner. `tiny-b9f29` is audited (Spark, billing disabled); the dev-debug Android app, SHA-1/SHA-256, `google-services.json`, Firestore database in `africa-south1`, rules/indexes and free-tier APIs are configured. Firebase Auth was initialized from the Console, Phone Auth is enabled with two synthetic test numbers, and the SMS region allowlist is `NG`. App Check debug-token exchange and the AI Logic cloud proxy were verified with synthetic traffic. The Firebase-enabled CI emulator signs in with a test number, reaches Home, and loads a synthetic Firestore workspace (1 class / 1 pupil). The private AI smoke test passed with on-device fallback and SDK-reported source `Cloud Gemini`. A public Apache-2.0 judge APK (`v0.1.0-preview.1`) is published. A browser companion is hosted at <https://tiny-b9f29.web.app> with a synthetic Firebase email/password account, read-only Firestore bootstrap, local-only outbox, PWA offline shell and Firebase AI Logic. Its live AI request also returned SDK-reported `Cloud Gemini`. App Check enforcement, Play Integrity and on-device Nano remain unverified.

**Current blocker:** no technical blocker for the tested Android, browser or Firebase paths. Submission gates: public YouTube upload, Devpost entry/eligibility confirmation, App Distribution tester emails and a supported Nano device. App Check enforcement/Play Integrity remain deliberate release-hardening items. The web and Android judge App Check debug tokens must remain valid through judging and then be revoked.

**Next task:** finish the official submission (YouTube demo upload, Devpost entry, eligibility confirmation), keep the browser preview and judge APK live through 16 December 2026, then run the on-device Nano acceptance procedure if a supported device is available. After judging, revoke the web and APK debug tokens and take down the synthetic previews. App Check enforcement/Play Integrity and hosted Functions are documented follow-ups. See `docs/HACKATHON_SUBMISSION.md`, `docs/WEB_APP.md` and `docs/FIREBASE_EVIDENCE.md`.

## Product polish, localization and tours checkpoint - 27 November 2026

- **Scope:** final product-quality pass across native Android and the hosted web teacher companion. Architecture and zero-spend boundaries preserved.
- **StageShow:** installed successfully with `npx skills add benjitaylor/skills --skill stageshow`; complete skill at `.agents/skills/stageshow/`. Read `SKILL.md`, `references/craft.md` and `references/review.md`; applied restraint, focal-object, icon-family, spacing and viewport-review rules to the real interfaces. No faux-UI deliverable shipped.
- **Design references:** Atelio Studio (warm serif-led, crafted, human) and PASS (product-story structure) re-inspected; findings and deviations in `REFERENCE_ASSETS.md`, `docs/DESIGN_NOTES.md`, `docs/DESIGN_SYSTEM.md`.
- **Localization root cause:** Android had only ~14 translated keys per locale plus many hardcoded Compose literals and English ViewModel snackbars; web had no i18n layer at all. Fixed at architecture level with one shared catalogue (`shared/i18n/*.json`, 754 keys), generator validation, generated Android resources and web dictionary.
- **Languages:** English source/reviewed; Hausa, Yoruba and Igbo complete drafts (all 754 keys, placeholders and plurals) with **native review pending**. The UI says so; they are not claimed as verified.
- **Runtime:** Android applies `AppCompatDelegate` locales immediately, mirrors the language for cold start and exposes `android:localeConfig`; web `I18nProvider` updates and persists instantly. Snackbars use resource IDs (`UiMessage`). Dates are numeric fallback for ha/yo/ig on web because Chromium ICU month names are inconsistent.
- **Tours/Help:** teacher tour (10 steps), guardian SMS guide (4 steps), skippable, persisted, replayable from Help/Settings; bilingual Help centre with search, 13 guides, limitations and contact.
- **Brand:** Lucide `sprout` (ISC, `lucide-static` 0.544.0), used on Android/web with typographic wordmark and adaptive icon; source/licence in `docs/BRAND_AND_ASSETS.md`. Not claimed as an original Tiny logo.
- **Web UI:** all pages migrated to `t()`; task-focused dashboard; new tokens/typography/surfaces; responsive desktop/tablet/mobile; dark scheme; accessible tours; language selector; polished evaluation sign-in. 60 i18n screenshots in `artifacts/web/i18n/`.
- **Android UI:** all Compose screens localized and restyled; Help screen; tour host; top-bar Help; localized snackbars/AI source/status; language persistence; Lucide mark; evaluation labels removed from core surfaces.
- **Verification:** web CI run [45999218456](https://github.com/onyebuchidaniel60/tiny/actions/runs/45999218456) passed typecheck, 23 Vitest tests, build and 36 Playwright journeys (3 viewports, 4 languages; 3 live tests skipped), with 0 serious/critical axe violations. Android CI run [45999218913](https://github.com/onyebuchidaniel60/tiny/actions/runs/45999218913) passed build/lint/APK, 37/37 JVM tests, rules, backend E2E and Compose instrumentation. Manual emulator evidence run [46000347482](https://github.com/onyebuchidaniel60/tiny/actions/runs/46000347482).
- **Preserved authentication:** Firebase Phone Auth synthetic test numbers remain `+2348000000001`/`123456` and `+2348000000002`/`654321`; web evaluation account remains `judge@tiny-demo.example` / `TinyDemo2026!`. No auth configuration was changed.
- **Not claimed:** live SMS, hosted Functions, cross-device sync, App Check enforcement, Play Integrity, physical-device testing, native translation review or on-device Nano.

## Browser companion delivery checkpoint - 27 November 2026

- **Scope:** operator-requested browser companion for evaluation. Teacher-only; no parent login, pupil account or student app. Native Android remains the primary product. The web preview does not replace SQLCipher/Room or phone-first Android auth.
- **URL:** <https://tiny-b9f29.web.app>.
- **Synthetic account:** `judge@tiny-demo.example` / `TinyDemo2026!`; workspace `ws_webdemo0001`; web UID `wT35e4yAe1PTRZ0BT6UheSsmEdg2`.
- **Stack:** Vite 7.3.8, React 19.3.1, TypeScript 5.9.3, Firebase Web SDK 13.4.0, `idb` 8.0.4, `vite-plugin-pwa` 2.0.0, Vitest 3.2.7, Playwright 1.65.1.
- **Implemented:** Home, Classes, class detail/roster, attendance with drafts and completion validation, lessons and 5E editor, progress drafts/approval, messages, synthetic guardian SMS simulator, guardians/links/consent display, settings, sync centre, AI helper, responsive desktop/mobile navigation, large-text and reduced-motion controls.
- **Persistence:** IndexedDB `tiny-web` (`state`, `drafts`) plus synchronous localStorage backup. Attendance/message drafts survive refresh. Outbox records pending/retryable/synced/failed/conflict with idempotency keys. Browser writes stay local; the hosted build reports server sync unavailable.
- **Firebase:** Existing project only. Registered Web app `1:1072757481941:web:10a300a3c9756e1520dd5c`; Email/Password enabled for the synthetic account; synthetic workspace seeded; Firestore rules unchanged; read-only bootstrap; no Functions deployment.
- **Offline demo startup:** lazy Firebase Auth creation means the offline demo no longer waits for Auth or its hidden iframe. The app shell is cached by Workbox after the first visit and has an SPA navigation fallback.
- **AI:** `web/src/ai/service.ts` uses `InferenceMode.PREFER_ON_DEVICE`, cloud model `gemini-3.5-flash-lite`, de-identified English P4 prompt, source read only from `response.response.inferenceSource`. Hosted evidence: **Cloud Gemini**, detail `The SDK reported cloud inference.`; screenshot `artifacts/web/tiny-web-ai-cloud.png`. Chrome exposed a built-in AI object, but the SDK did not report on-device inference. No Nano claim.
- **Tests:** typecheck passed; **14/14 Vitest** unit/component; **10 passed / 2 skipped Playwright** across desktop and mobile; **1/1 live Firebase/AI** manual run; **0 serious/critical axe** violations. Desktop/mobile screenshots regenerated in `artifacts/web/`.
- **Deployment:** Firebase Hosting `tiny-b9f29`, `web/dist`, SPA rewrite, no-cache `index.html`/`sw.js`, immutable hashed assets. Vercel CLI was unauthenticated; no Vercel claim.
- **Security/limits:** synthetic data only; browser storage unencrypted; dedicated revocable web App Check debug token embedded in the hosted client (GitHub secret `FIREBASE_WEB_APP_CHECK_DEBUG_TOKEN`, never committed); App Check enforcement off; no real SMS; no hosted callable sync; no cross-device sync; no on-device AI proof.
- **Evidence/docs:** `docs/WEB_APP.md`, `docs/JUDGE_ACCESS.md`, `docs/TESTING.md`, `.github/workflows/web-ci.yml`, `web/e2e/`, `artifacts/web/`.
- **Commit:** app `2ae6a81`; immediate-persistence and CI-stable test fixes `581d89d`, `86c9717`.
- **CI:** web run [45975389944](https://github.com/onyebuchidaniel60/tiny/actions/runs/45975389944) passed; Android regression run [45975389893](https://github.com/onyebuchidaniel60/tiny/actions/runs/45975389893) passed. The first web run (`45973072502`) failed on two Playwright timing/navigation assertions; the fixes are recorded in `docs/BUILD_LOG.md`, and the rerun is green.

## Live Firebase setup checkpoint (26 November 2026)

- **CLI/access:** `firebase-tools` 15.14.0 authenticated as the project owner; project `tiny-b9f29` (number `1072757481941`) is Spark with billing disabled.
- **Android app:** `Tiny dev debug`, package `ng.tiny.education.dev.debug`, app ID `1:1072757481941:android:2005f8b35944923b20dd5c`; debug SHA-1/SHA-256 registered.
- **Client config:** `app/google-services.json` present locally and ignored; GitHub secret `GOOGLE_SERVICES_JSON_BASE64` set. Never commit or print the file.
- **Firestore:** `(default)` created in `africa-south1`, Firestore Native/Standard, delete protection enabled. Rules release `cloud.firestore` updated 2026-11-26 17:26:35 UTC; seven indexes READY. The unnecessary `messages` collection-group index was removed and the deployment succeeded.
- **APIs enabled:** Firestore, Firebase App Check, Firebase App Distribution, Firebase AI Logic (`firebasevertexai`), Firebase ML (`firebaseml`), Generative Language, Play Integrity, Secure Token and related Firebase services.
- **App Check:** the first debug token was registered through the v1beta REST API and exchanged successfully (TTL 3600s), then revoked. A separate token for the private AI smoke is stored only in the GitHub secret `FIREBASE_APP_CHECK_DEBUG_TOKEN`; the CI artifact containing the old raw logcat was deleted. Enforcement remains off. The local debug-token resource file is ignored by Git.
- **AI Logic:** P4SA identities created; `roles/firebaseml.serviceAgent` granted. A `gemini-3.5-flash-lite` proxy call with App Check returned a candidate (usage: 22 prompt / 50 candidate / 72 total tokens). The private `AiLogicLiveTest` also passed: on-device provider unavailable, cloud fallback, SDK-reported source `Cloud Gemini`. The direct Gemini endpoint remains blocked through the client key. No on-device claim.
- **Rules behaviour:** live unauthenticated Firestore `GET` on `workspaces` returns HTTP 403 `Missing or insufficient permissions`, with or without App Check, as designed. A synthetic member user can read the workspace/class/pupil (200); a second non-member test user is denied (403).
- **Auth:** Console setup completed 2026-11-26; config subtype `FIREBASE_AUTH`; Phone enabled with `+2348000000001`/`123456` and `+2348000000002`/`654321`; SMS region allowlist `NG`; no real SMS. REST test sign-in and the app-level test-phone sign-in both succeeded.
- **App-level bootstrap:** CI run `45891064395` signed in and loaded `Tiny Synthetic E2E` (1 class / 1 pupil) from Firestore. Evidence: `artifacts/emulator/tiny-04-authenticated.png`.
- **App-level AI:** manual run `45950443728`; `AiLogicLiveTest` 1/1 passed. Ephemeral APK and token were not uploaded; reports contain no token. On-device Nano was not available and not claimed.
- **CI:** run `45891064395` succeeded (build, 35/35 Android unit, 19/19 Functions domain, 9/9 rules, 10/10 backend E2E, Compose instrumentation). The smoke script handles launcher ANRs, attempts test-phone auth, captures the authenticated Home, and redacts App Check tokens. Final regression run `45950400565` is also green; live AI/sync tests are skipped in the normal instrumentation job when their config is absent.
- **Android sync E2E:** manual run `45950447844`; `SyncEmulatorE2ETest` passed against Auth/Firestore/Functions emulators, covering accepted acknowledgement, idempotent replay, transport retry and conflict. No real project was contacted.
- **Not claimed:** App Check enforcement, Play Integrity, Phone Auth SMS, hosted Functions, App Distribution, on-device Gemini Nano.

## Firebase integration stage (26 November 2026)

- **Project:** `tiny-b9f29`; `.firebaserc`, `.env.example`, configuration and credential registers updated. Project ID is not a secret.
- **Implemented:** App Check bootstrap (debug + Play Integrity), phone-auth gate/screen, Firebase Functions callable transport, WorkManager durable sync with receipts/conflicts/backoff, Firestore bootstrap reads, workspace/class creation, guardian linking/verification, AI Logic hybrid client, backend `verifyGuardianCode` and class/guardian sync handlers.
- **Emulator evidence:** backend E2E 10/10 (now includes guardian code verification and class/guardian sync); rules 9/9; Android unit tests 35/35; Android-to-emulator sync E2E 1/1.
- **Auth/Firestore verified:** Firebase Auth was initialized from the Console; Phone Auth uses synthetic test numbers only. The CI emulator signed in and loaded a synthetic Firestore workspace.
- **Spark limits:** real phone verification SMS requires Blaze and is not authorized; use Firebase test phone numbers only. Cloud Functions remain emulator-only.
- **Not claimed:** Phone Auth SMS, App Check enforcement, Play Integrity, hosted Functions, App Distribution or on-device Gemini Nano. App Check token exchange, the AI Logic proxy and the app-level cloud fallback were verified; Auth/Firestore were verified end-to-end with synthetic data.

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
- Preview: protected Firebase App Distribution or approved secure APK artifact, plus an operator-requested browser companion at <https://tiny-b9f29.web.app>; landing page is a separate static marketing surface.
- No payment system, voice calling, parent app or student app. The native teacher app is primary; the browser companion is a teacher-only evaluation surface and introduces no parent or pupil account.

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
| Android tests | PASS - 35/35 unit | Domain, JSON, sync outcome, source label and durable processor tests |
| Compose instrumentation | PASS | API 35 Pixel 5 journey in run 45891064395 |
| Android build | PASS - CI | `tiny-dev-debug-apk` from run 45891064395; Firebase config injected |
| Android lint | PASS | No `MissingTranslation` suppression; all four locales define the complete key set |
| Functions domain | PASS — 19/19 | TypeScript build and Vitest suites |
| Firestore rules | PASS - 9/9 | Emulator tests incl. class-scoped records and own workspace index |
| Functions callables/webhooks | IMPLEMENTED — E2E 10/10 | Workspace/class/pupil/guardian/attendance/progress/message callables, signed webhook, digest, sync dispatcher |
| Firebase project/access | CONFIRMED - CLI authenticated | `tiny-b9f29`; app and SHA registered; billing disabled; see `docs/FIREBASE_EVIDENCE.md` |
| Firestore live database | DEPLOYED | `(default)` in `africa-south1`; rules release live; 7 indexes READY; unauthenticated and non-member reads denied |
| Firebase Auth | VERIFIED - Console initialized | Config subtype `FIREBASE_AUTH`; Phone enabled; synthetic test numbers; SMS region `NG`; app-level sign-in succeeded |
| App-level Firestore | VERIFIED - bootstrap | Synthetic workspace/class/pupil loaded into the app; member read 200, non-member 403 |
| Android sync E2E | PASS - emulator | `SyncEmulatorE2ETest` 1/1: accepted, idempotent replay, retry and conflict against Auth/Firestore/Functions emulators |
| App Check | PARTIAL - debug + private CI token | Exchange succeeded; first token revoked; private CI token in GitHub secrets; enforcement off; Play Integrity pending |
| Firebase Emulator Suite | PASS — rules + backend E2E | Config/rules/indexes working; 9/9 rules tests and 10/10 callable/webhook/scheduler/sync E2E |
| Hosted Cloud Functions | NOT AUTHORIZED — emulator-only | Spark/NGN 0; no deploy/Blaze/paid hosting |
| Cloud AI | VERIFIED — free tier | App-level `AiLogicLiveTest` passed: on-device unavailable, cloud fallback, SDK source `Cloud Gemini`; on-device still pending |
| Protected preview distribution | PUBLIC JUDGE APK + App Distribution groups | `v0.1.0-preview.1` published; `internal-testers`/`judges` groups created; tester emails still needed for App Distribution |
| Physical Android device | GENERAL TESTING ONLY | Samsung Galaxy Note 10+, Android 12; no second device; not Gemini Nano-supported |
| On-device AI gate | BLOCKED — separate acceptance gate | No supported physical device; emulator does not prove Nano inference |
| eSMS sandbox | NOT REQUIRED NOW | Mock SMS adapter; no live/sandbox sends authorized |
| Production SMS authority/budget | NOT AUTHORIZED | NGN 0; mock only |
| Production deploy authority | NOT AUTHORIZED | No production resources |
| Browser companion | IMPLEMENTED - HOSTED | <https://tiny-b9f29.web.app>; synthetic account; teacher-only; local-only writes |
| Browser persistence | VERIFIED | IndexedDB state/drafts, localStorage backup, outbox states, refresh/offline recovery |
| Browser tests | PASS - 14 unit, 10 E2E, live 1 | Typecheck/build; desktop+mobile Playwright; axe 0 serious/critical |
| Browser AI | VERIFIED - CLOUD ONLY | SDK-reported `Cloud Gemini`; curated fallback; no on-device claim |
| Browser App Check | PARTIAL - DEBUG TOKEN | Dedicated registered web token; enforcement off; revoke after judging |
| Browser sync | LOCAL ONLY | Hosted Functions unavailable under Spark; no cross-device sync claim |
| Landing page | IMPLEMENTED - local preview | Responsive static page + legal/security/contact; GitHub Pages manual workflow not enabled/published |
| Demo audience/output | CONFIRMED | Firebase hackathon judges/product evaluators; `artifacts/demo/` |
| Demo voice/TTS | CONFIRMED - local SAPI | Microsoft Zira offline TTS; no Google AI TTS credentials or charges |

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
- Navigation: onboarding → language → welcome → Home/Classes/Lessons/Messages + detail routes; Settings, Sync, local pupil registration and an honest offline AI fallback screen.
- Local data: Room entities/DAOs for workspace, class, pupil, guardian, links, attendance, lessons, progress, conversations/messages, outbox, sync cursor, audit.
- SQLCipher: `net.zetetic:sqlcipher-android:4.20.0`; passphrase generated randomly and wrapped by an Android Keystore AES-GCM key; fails closed if unwrap fails.
- Demo data: synthetic workspace/classes/pupils/guardians, one submitted attendance session, two lesson plans, progress entries, conversations and a pending outbox command.
- Attendance: save draft, validate complete roster, submit locally, create outbox command, absence-only audit; no real SMS.
- Progress: validation, draft save, revision reset on approved edit, approval state, digest eligibility.
- Messages: mock parent inbox, teacher reply queued through mock adapter, status labelled as mock.
- Sync: mock engine processes pending commands without claiming cloud sync; sync center explains the limitation.
- Unit tests: 35/35 pass across phone normalization, attendance, SMS segmentation, progress, digest, sync rules, JSON escaping and AI source labels.\n- Startup waits for the encrypted local seed before composing, preventing a first-launch race where Home showed zero classes/pending.
- Local build: `testDevDebugUnitTest assembleDevDebug` successful; final CI APK 31,094,724 bytes; SHA-256 `E124B01C005C93FF272A6B0617FF5A319C81442F165BCD09984ABEDC69327F72`.
- Lint: `lintDevDebug` passes with all four locales complete; the old `MissingTranslation` suppression has been removed.
- GitHub Actions: build/test job success; APK artifact `tiny-dev-debug-apk`.
- Emulator smoke: manual Ubuntu job installed/launched the APK on API 35, captured language/welcome/home/classes/class detail/attendance/lessons/messages/conversation/settings screens, and uploaded evidence. Logcat contained no Tiny fatal exception; Pixel Launcher ANR on the slow emulator was transient and dismissed.
- Firestore rules: 9/9 emulator tests pass (unauthenticated/nonmember denial, member reads, direct write denial, class-scoped pupils/guardians/links/conversations/messages).

### Functions / Firebase

- `functions/` TypeScript project (Node 22, Firebase Functions 6.5.0, Admin 13.4.0, Zod).
- Domain modules: phone, access, attendance, guardian, progress, SMS segmentation, digest, sync, AI privacy/schema.
- 19 Vitest domain tests pass; 8 Firestore rules tests pass in the Firebase emulator; 10 callable/webhook/scheduler/sync E2E tests pass; `npm run build` passes.
- Callables implemented and E2E-tested: workspace create, invitation, accept, classroom, pupil, guardian, link, verification, attendance submit, progress create/approve, teacher reply, sync batch.
- Webhooks: HMAC-SHA256 raw-body verification, timing-safe comparison, event dedupe, routing by school code, guardian phone-hash lookup, mock-safe responses.
- Scheduled digest: Friday 15:00 Africa/Lagos; approved/non-not-assessed entries only; mock notification jobs.
- `firestore.rules`: default deny; member read baseline; direct writes denied; admin-only guardian/conversation reads. Class-level read restrictions need emulator tests and tightening before pilot.
- `firebase.json`, `.firebaserc` (`demo-tiny`), `firestore.indexes.json` present.
- `syncCommands` dispatches `pupil.register`, `class.create`, `guardian.upsert`, `guardian.link`, `guardian.verify`, `attendance.submit`, `progress.upsert`, `progress.approve` and `message.reply` through the same validated callable handlers, records accepted/rejected receipts, and replays accepted commands as `alreadyApplied`. The Android client has a Firebase Functions transport and WorkManager processor. The project and client config are now present; live callable verification remains unavailable because Functions are emulator-only on Spark.

### CI / distribution

- `.github/workflows/android-ci.yml`: Ubuntu 24.04, JDK 17, Android SDK, Gradle, Node 22, Functions tests, Android lint/unit tests/debug APK, artifact upload; separate Firestore rules emulator job (JDK 21); optional manual App Distribution and manual emulator smoke jobs.
- GitHub Actions run `45853884690` succeeded: build/test, backend emulator E2E, Firestore rules and Compose instrumentation. The last manual smoke run was `45809071551`; the demo images came from that run.
- App Distribution tester/judge access still pending.
- GitHub Pages workflow is manual and not enabled/published; no public URL claimed.

### Skills

- Firebase Agent Skills installed under `.agents/skills/`; `skills-lock.json` preserved.
- Source commit: `99954a30898bb5ddc8152ee10e124dc3b4106bf7`.
- Installed: `firebase-basics`, `firebase-auth-basics`, `firebase-firestore`, `firebase-security-rules-auditor`, `firestore-rules-creation`.
- Live catalog mapping: `firebase-firestore-standard` → `firebase-firestore`; `firestore-security-rules-auditor` → `firebase-security-rules-auditor`; `firebase-local-env-setup` absent (covered by `firebase-basics` + official emulator docs).
- Discovery: Firebase skills are visible in the active OpenCode tool catalog. `opencode` CLI is not on PATH, so a separate fresh-session CLI check was not possible; recorded as a limitation.
- StageShow: installed successfully on 27 November 2026 with `npx skills add benjitaylor/skills --skill stageshow`; complete skill under `.agents/skills/stageshow/`. Read `SKILL.md`, `references/craft.md` and `references/review.md` and applied its craft rules to the real product. The earlier interrupted attempt is superseded and is no longer a limitation.
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
| App Check enforcement / Play Integrity | Debug exchange and app-level cloud AI work, but enforcement is off and release attestation is unconfigured | Register the CI/release SHA-256 and enable enforcement deliberately after the remaining app checks |
| Supported on-device AI device | Note 10+ (Android 12) is general testing only; separate acceptance gate | Provide a currently supported physical device, or accept on-device demo blocked |
| App Distribution tester emails | Public APK is available, but App Distribution invitations need approved emails | Supply judge/tester emails privately; groups `internal-testers` and `judges` exist |
| Native translation review | Hausa/Yoruba/Igbo have complete draft coverage (754 keys); native review is pending | Arrange native review before pilot; English fallback is active |
| Pilot/legal gates | DPIA, controller/processor, privacy notice, retention, NERDC rights | Identify approvers and timing before a real-school pilot |

## Preview / deployment evidence

- CI APK artifact: `tiny-dev-debug-apk` from run `45891064395` (31,097,300 bytes; SHA-256 `14105D643987805C534621E0F29ABBC8A18DB7F10E52EFD2C8AD5142957625D9`).
- GitHub Actions build/test and rules jobs: **success**.
- Emulator smoke: **test-phone sign-in succeeded**; `artifacts/emulator/tiny-04-authenticated.png` shows Home with the synthetic Firestore workspace (1 class / 1 pupil). `artifacts/emulator/tiny-03-auth-gate.png` remains as the gate evidence. The prior pre-Firebase screenshots remain at `artifacts/emulator/tiny-01-language.png` through `tiny-10-settings.png` and in the demo.
- Compose instrumentation: **success** in CI on API 35 Pixel 5 (no Firebase client config injected; local-mode journey).
- Android sync E2E: manual run `45950447844`; `SyncEmulatorE2ETest` 1/1 passed against local Auth/Firestore/Functions emulators.
- App-level AI smoke: manual run `45950443728`; `AiLogicLiveTest` 1/1 passed with cloud fallback and `Cloud Gemini` source. Ephemeral APK not uploaded; no token in reports.
- Judge APK AI UI: manual run `45950452014`; real cloud result displayed `Source: Cloud Gemini`; screenshot `artifacts/emulator/tiny-ai-cloud.png`.
- Public judge preview: `v0.1.0-preview.1`; `tiny-judge-preview.apk` (31,097,336 bytes; SHA-256 `5c7dc73d6384691ac5714af0240ad826897d28d41f6cdbb84896b4d85c7ea64b`). App Distribution groups `internal-testers` and `judges` created; tester emails pending.
- Landing page: local static preview; GitHub Pages workflow manual and not enabled/published.
- Hosted backend: not deployed; Spark/NGN 0.
- Production: not authorized.

## Documentation status

- [x] Product spec, architecture, implementation plan, agent instructions
- [x] Operator intake and reference register updated
- [x] Credential/configuration register and `.env.example`
- [x] GitHub Actions/App Distribution guide
- [x] Landing page and legal/security/contact pages
- [x] Phase 1 evidence in this handoff and build log
- [x] Firebase live-setup audit and sanitized evidence: `docs/FIREBASE_EVIDENCE.md`
- [x] Hybrid AI verification and on-device gap: `docs/AI_HYBRID_VERIFICATION.md`
- [x] Judge access and public APK/App Distribution: `docs/JUDGE_ACCESS.md`
- [x] Official hackathon submission review: `docs/HACKATHON_SUBMISSION.md`
- [x] Apache-2.0 `LICENSE`; GitHub detects it
- [x] Final design notes against app screenshots
- [ ] Native translation review
- [x] Full README build/preview results after CI run

## Demo status

- Video: `artifacts/demo/tiny-demo.mp4` — 146.6s, 1920x1080 H.264/AAC, 5,551,546 bytes, SHA-256 `6B2BB28A849BB58CCD666AD5A9858E52857EE56CEF5DA04D91555816C7215DD6`.
- Capture: reviewed screenshot slideshow with narration, not motion screen recording. Uses the pre-Firebase product screens plus the authenticated `tiny-04-authenticated.png` Firebase scene; test-phone Auth and cloud AI fallback are shown/enounced honestly.
- **Disclosure:** product-flow screens remain from the earlier emulator run. The Firebase Auth/Firestore screenshot and the AI `Source: Cloud Gemini` screenshot are from the Firebase-enabled/judge APK runs. The demo does not show App Check enforcement or on-device Nano.
- Target length: 90-150 seconds; absolute maximum 180 seconds. Final render is 146.6s, within target.
- Demo data: synthetic only.
- Demo journeys: sign-in/Firestore verification, offline lesson, local attendance, cloud AI fallback with honest source, parent mock message/teacher reply, approved progress/digest; on-device Nano evidence blocked.
- Output: `artifacts/demo/` (MP4, captions, narration script, production notes).
- TTS: local Windows SAPI (Microsoft Zira), free/offline; no Google AI TTS credentials or charges.

## Authorization boundaries

- Do not reveal or commit secrets, real pupil/guardian data or private URLs. No credentials through chat. Exception: the dedicated `FIREBASE_JUDGE_DEBUG_TOKEN` is intentionally embedded in the public judge test APK for the hackathon, is non-production, and must be revoked after judging. The private CI token must never be public.
- The public judge APK is a synthetic-data preview, not a production deployment. Keep App Check enforcement/Play Integrity off until release fingerprints are configured.
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
6. **StageShow (historical):** the first install attempt was interrupted by a harness restart; the later install succeeded and its instructions were applied. No limitation remains.
7. **Historical ZIP claim:** the ZIP is not in this repository; current Markdown checks pass independently.

## Known limitations / risks

1. On-device Gemini Nano is blocked: Note 10+ is not supported; emulator does not prove physical inference.
2. Hosted Functions are unavailable under Spark/NGN 0; backend is emulator-only.
3. App Distribution and judge access are not yet available; no judge-facing build has been uploaded.
4. The Android Firebase sync transport, WorkManager processor, Auth gate, Firestore bootstrap and AI Logic service are implemented. Client config, App Check debug exchange and the AI Logic proxy are verified; Auth, authenticated Firestore, app-level AI and live callable sync remain unverified because Auth needs Console initialization and Functions are emulator-only.
5. Firestore rules are class-scoped and pass 9/9 emulator tests; a full review is still required before any pilot.
6. In-app workspace/class creation and guardian linking/verification screens are implemented against local Room; the online path uses callables. Live online verification is blocked on Auth/Functions deployment constraints.
7. Android cloud mode requires a Firebase app config; without it the app stays in local/mock preview mode and does not claim cloud sync.
8. Native translation review and physical low-end device testing remain pending.
6. App and web translations have complete draft coverage; native review of Hausa, Yoruba and Igbo is pending.
7. No physical device was connected during the checkpoint; general device validation is pending.
8. StageShow skill was not usable after restart; no claim.
9. Local Windows machine uses portable JDK/SDK; CI is the canonical build.
10. Public repository: never commit secrets or real data.

## Resume instruction

Inspect Git status, this file, `OPERATOR_INTAKE.md`, `docs/BUILD_LOG.md`, `docs/CREDENTIALS_AND_CONFIGURATION_REGISTER.md`, `docs/CI_ANDROID_BUILD.md`, and the latest commits. Resume by pushing the Phase 1 checkpoint, running GitHub Actions, fixing CI, then continue Phase 2/3. Do not deploy Functions, activate Blaze, send live SMS, use real pupil data or claim on-device AI without a supported device and evidence.

