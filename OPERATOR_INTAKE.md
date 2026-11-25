# Tiny — Consolidated Operator Intake / Readiness Check

**Status:** Phase 0 inspection complete 25 November 2026; operator confirmations partially received; intake **BLOCKED** on remaining hard inputs.

**Last inspected:** 25 November 2026 — repository, handoff package and local environment inspected read-only. No application code, dependency installation, cloud resource, SMS or deployment action performed.

**Rule:** The agent reads the repository and handoff first, then asks all genuinely missing critical questions in one consolidated intake. Do not ask again for information already provided by the repository, environment, this package or operator response.

Record each item as `PENDING`, `CONFIRMED`, `NOT_APPLICABLE`, or `BLOCKED`. Do not put secret values in this file. Record the secret manager name/reference and validation status only.

## 1. Product and scope

| Input | Default / known decision | Status | Used by / notes |
|---|---|---|---|
| Product name/pronunciation | Tiny, pronounced TIE-nee | CONFIRMED | App name, demo narration |
| Product meaning | Small requirements, not small ambition | CONFIRMED | UX/performance decisions |
| Product principle | Big impact. Small requirements. Accessible everywhere. | CONFIRMED | Design and acceptance |
| Primary users | Rural primary-school teachers and parents/guardians in Nigeria | CONFIRMED | All features |
| Teacher platform | Personal Android smartphones | CONFIRMED | Native app |
| Parent channel | Basic mobile phones through SMS; no parent app | CONFIRMED | Messaging |
| Student view/accounts | None | CONFIRMED | Explicit scope exclusion |
| Workspace onboarding | School-managed and independent teacher-created | CONFIRMED | Identity/workspaces |
| Independent teacher capability | Full core teacher functionality | CONFIRMED | Permissions |
| Teacher assignments | Multiple classes and subjects | CONFIRMED | Class model |
| Guardians | Multiple per pupil; one guardian may link to several pupils | CONFIRMED | Relationship model |
| Attendance alerts | Immediate absence alerts only | CONFIRMED | Notification engine |
| Parent communication | Parent-initiated SMS + teacher inbox/reply | CONFIRMED | Messaging |
| Child progress | Subject indicators, factual observations and home-support suggestions; teacher approval required | CONFIRMED | Progress/digest |
| Curriculum | NERDC Revised Basic Education Curriculum, Primary 1–6 | CONFIRMED | Content pack |
| Lesson approach | 5E framework | CONFIRMED | Lesson planner |
| Teacher UI languages | English, Hausa, Yoruba, Igbo | CONFIRMED | Localization |
| Parent SMS languages | English, Hausa, Yoruba, Igbo, Nigerian Pidgin | CONFIRMED | Templates |
| Voice calls | Not in MVP | CONFIRMED | Future only |
| Payments | None in MVP | CONFIRMED | No financial integration |
| Pilot location/schools | No specific school/community supplied yet | PENDING | Needed for language validation and real-user pilot, not basic coding |
| Product success priorities | Offline-first, low storage/data/battery, low literacy friction | CONFIRMED | Architecture/UX |

## 2. Repository and engineering access

| Input | Required? | Status | Operator action / validation |
|---|---:|---|---|
| Repository URL/path and branch | Yes | CONFIRMED | Local path `C:\Users\User\Documents\Projects\tiny`; remote `https://github.com/onyebuchidaniel60/tiny.git`; branch `main`; clean at `690beef` before this intake update |
| Git write/commit access | Yes | CONFIRMED | Operator authorized commits and pushes directly to `main`. No force-push, no history rewrite, no branch deletion and no repository-visibility change |
| Repository visibility | Yes | CONFIRMED PUBLIC | Repository is public and the operator instructed that visibility must not be changed. Do not add secrets or real child/guardian data |
| Existing CI provider access | If configured | CONFIRMED | No GitHub Actions workflows, secrets, variables or releases are configured. GitHub Actions is available in the repository |
| GitHub Actions secrets access | If CI secrets needed | CONFIRMED (access only) | GitHub CLI has repository workflow access; no secret values supplied or configured. Provision through GitHub UI/CLI, never chat or Markdown |
| Existing project documentation | Yes, inspect | CONFIRMED | 26 Markdown documents; relative links resolve; code fences balanced; workflow SHA-256 matches recorded value; documentation-only repository |
| Windows/PowerShell operator constraints | If commands are run locally by operator | CONFIRMED | Windows 11 Pro 10.0.26200, PowerShell; no operator-specific command constraint stated |

## 3. UI reference assets — critical before final UI work

| Input | Required? | Status | Operator action / validation |
|---|---|---:|---|
| UI reference images or interface links | Yes | BLOCKED — operator confirmed links will be supplied, but exact links are not yet received | Supply exact URL(s) and access/permission notes. Inspect them and record source, retrieval date and intended screens in `REFERENCE_ASSETS.md` |
| Asset ownership/source | Yes | PENDING | Confirm each reference is operator-owned, licensed, or reference-only inspiration. Do not copy third-party marks, logos or protected layouts |
| Intended screens | Helpful | PENDING | Default: teacher home/dashboard, attendance, lesson planner, pupil/progress, inbox, settings |
| Responsive expectations | Yes | CONFIRMED | Android phone portrait first; small-screen layout; accessible larger font scaling |
| Existing logo/icon/brand assets | Optional | PENDING | If absent, agent creates original text-first identity; no third-party logos |
| Color/visual constraints | Optional | PENDING | If no explicit brand direction, derive an original design from supplied references and document decisions |

Do not claim any missing reference exists. The UI implementation is direct from the references; no separate mockup/approval phase.

## 4. Firebase / Google Cloud

| Input | Required? | Status | Authorization boundary |
|---|---:|---|---|
| Firebase project ID | Yes for backend implementation and App Distribution | PENDING | Operator will create a dedicated Tiny project and supply the project ID. Project ID is not a secret; do not share credentials in chat |
| Firebase project membership/role | Yes | PENDING | Operator must grant least-privilege access or authenticate Firebase CLI locally. Agent verifies access |
| Firebase billing account / plan | Yes for hosted Functions | CONFIRMED — Spark, NGN 0 | No Blaze upgrade, billing account, paid model or paid service without explicit operator approval |
| Cloud Functions Gen2 deployment | Yes for fixed backend | BLOCKED by Spark/NGN 0 | Official Firebase documentation requires Blaze to deploy functions. Callables/webhooks can be tested in Emulator Suite; scheduled digest logic must be invoked locally/unit-tested. No hosted backend deployment until billing authority changes |
| Firestore database | Yes | PENDING | Create Firestore Standard in `africa-south1` after project access; Spark free-tier limits apply |
| Firebase Authentication Phone provider | Yes | PENDING | Enable Phone Auth; configure +234 policy, OTP quota and authorized test numbers |
| App Check / Play Integrity | Production required | PENDING | Debug provider only for local development; production Play Integrity configured later |
| Firebase AI Logic Gemini Developer API | Yes for cloud AI demo | CONFIRMED — free tier | No paid AI. Gemini Developer API free tier is compatible with Spark; use App Check debug provider locally |
| On-device AI test phone | Yes for proof of on-device path | BLOCKED | Supplied device is Samsung Galaxy Note 10+. As of 25 November 2026 this model is **not** on the official ML Kit Gemini Nano supported-device list. Android version still needed for general app testing. A supported physical device is required for genuine on-device inference evidence |
| Representative low-cost pilot phones | Required before pilot | PENDING | Supply common models/Android versions and confirm Google Play services + Play Integrity availability for connected cloud use |
| Android SDK/build machine | Yes | BLOCKED | No JDK, Android Studio, Android SDK, `adb` or Gradle detected; only 5.5 GB free on `C:`. Authorize a minimal CLI toolchain install after freeing space, or provide an approved CI/other build machine |
| Firebase App Distribution | Preferred for preview | PENDING | No Firebase project, tester group or distribution access supplied. Alternative protected APK destination also not supplied |
| Firebase Emulator Suite | Strongly required for tests | BLOCKED | Firebase CLI/emulators not installed; install with the approved toolchain. No production data |

**Fixed region decision:** Firestore Standard and Functions Gen2 in `africa-south1` (Johannesburg). This is not Nigerian data residency. Cross-border processing must be assessed in DPIA/legal review. Gemini Developer API AI processing is global; only de-identified/minimized generic context may be sent.

**Spark plan consequence:** Firestore, Auth free quotas, App Distribution and Gemini Developer API free-tier AI can be used within free limits. Cloud Functions Gen2 cannot be deployed. This is a documented limitation, not a silent architecture change. The fixed backend remains emulator-only until the operator explicitly authorizes Blaze and a bounded budget.

## 5. SMS provider and communications

| Input | Required? | Status | Authorization boundary |
|---|---:|---|---|
| SMS adapter mode | For development/demo | CONFIRMED — MOCK | Use a deterministic mock adapter until further written authorization. No real eSMS calls, sends or spend |
| eSMS Africa account | For sandbox integration | PENDING — not required now | Verify account ownership and service status only when sandbox work is authorized |
| eSMS Africa sandbox key | For sandbox tests | PENDING | Store only in Secret Manager/local secret store; never commit. Not requested while mock mode is active |
| Shared keyword service (`TINY`) | For real inbound SMS | PENDING | One product-level keyword/service, not one paid keyword per school |
| Inbound webhook URL/config | For real inbound messages | PENDING | Configure only after a protected staging URL is authorized and signature secret stored |
| Delivery webhook | For status callbacks | PENDING | Validate signature and event uniqueness |
| KYC/business registration | For production provider activation, if required by provider | PENDING | Confirm current provider requirements; no representation that account is already approved |
| SMS budget ceiling | Mandatory before production sends | CONFIRMED — NGN 0 | No production SMS spend. Mock adapter only |
| Approved production recipients | Mandatory before live sends | NOT AUTHORIZED | No live messages during development/demo |
| Guardian consent/verification process | Product/legal readiness required before pilot | PENDING | Confirm school collection script, lawful basis, notice, consent/opt-out handling with DPO/legal adviser |
| Default digest schedule | Friday 15:00 Africa/Lagos | CONFIRMED | Configurable later, not per-school in MVP |
| Sender/service wording | `Tiny` shared keyword; final sender display depends on provider | PENDING | Verify supported sender/short code and Nigerian network behavior before any production activation |

Provider acceptance must never be labelled delivery. Mock/sandbox only unless the operator provides explicit cost and send authorization.

## 6. Other external services and permissions

| Input | Required? | Status | Safe default |
|---|---:|---|---|
| NERDC curriculum materials and source/license notes | Yes | PENDING | Agent retrieves public official materials, records provenance/rights/hash; only small verified subset seeded |
| Translation review by native speakers | Required before real parent messaging in each locale | PENDING — later gate | Use reviewed fixed templates; unreviewed language is disabled, never machine-translated and auto-sent |
| Voice provider | No | NOT_APPLICABLE | Voice is out of MVP |
| Maps/geolocation provider | No | NOT_APPLICABLE | Collect typed State/LGA/community only; no GPS in MVP |
| Payment provider | No | NOT_APPLICABLE | No payment feature |
| Google AI TTS for demo | Required only if available and free at demo time | PENDING | Check current quota/terms; no paid use without authorization; use genuinely free permitted fallback if unavailable |
| Other UI skills | Optional | PENDING | Required attempt: `npx skills add benjitaylor/skills --skill stageshow` at Phase 6; optional skills must be relevant/trustworthy |
| Firebase Agent Skills | Required developer tooling | CONFIRMED REQUIRED — installation pending Phase 1 | Install selected official Firebase skills project-locally for OpenCode; inspect content/scripts; copy files; preserve lockfile if generated; no app runtime dependency |
| Firebase MCP server | Recommended companion; not a hard Phase 0 blocker | PENDING AUTHORIZATION | Configure disabled until non-production Firebase project/access and operation scope are confirmed; use least-privilege CLI identity; state-changing tools require explicit operator approval |
| OpenCode version / skills discovery | Required to validate tooling | PENDING IMPLEMENTATION | OpenCode is the established coding agent; record `opencode --version`; verify selected skills discover in a fresh session; inspect current MCP config syntax before modifying it |

## 7. Data protection, budget and release authority

| Input | Required? | Status | Boundary/default |
|---|---:|---|---|
| Controller/processor determination | Yes before live school pilot | PENDING — later gate | Do not assume Tiny is the sole controller; school/Tiny roles need legal assessment |
| Data Protection Impact Assessment | Yes before high-risk processing/pilot | PENDING — later gate | Complete before real pupil data is processed in production |
| Privacy notice/guardian notice | Yes before pilot | PENDING — later gate | Draft only; counsel/DPO approves final text |
| Data retention/deletion schedule | Yes before pilot | PENDING — later gate | Default minimal collection; schedule requires operator/legal confirmation |
| Cloud budget | Yes before enabling paid resources | CONFIRMED — NGN 0 | No billable cloud resources; use emulator/free-tier only |
| Maximum monthly cloud spend | Yes | CONFIRMED — NGN 0 | No billing account or Blaze upgrade without explicit approval |
| SMS spend ceiling | Yes before live messages | CONFIRMED — NGN 0 | No production sends; mock adapter only |
| Paid AI / paid third-party integrations | Yes before enabling | CONFIRMED — NGN 0 | No paid model, API or service. Free tiers only; no auto-upgrade or top-up |
| Preview deployment authority | Yes | PENDING | Protected staging/App Distribution only, when access is supplied. No production resources |
| Production deployment authority | Yes | NOT AUTHORIZED | Requires separate explicit approval after security/DPIA gates |
| Destructive DB migrations | Yes | NOT AUTHORIZED | Backups and explicit authorization required |
| Real parent messaging | Yes | NOT AUTHORIZED | Mock adapter only |
| Real child/pupil data in demo | No | PROHIBITED | Use deterministic synthetic data only |
| Public repository | Optional | CONFIRMED PUBLIC — do not change | Operator instructed not to change visibility. Never commit secrets, real pupil/guardian data or private URLs |
| Domains/website | No MVP web app | NOT_APPLICABLE | Native app only; no website/landing page unless separately approved |

## 8. Demo and delivery

| Input | Required? | Status | Default |
|---|---:|---|---|
| Demo audience | Helpful | CONFIRMED | Firebase hackathon judges and product evaluators |
| Demo key journeys | Yes | CONFIRMED | Offline lesson, offline attendance + sync, absence SMS mock, parent inbound message + teacher reply, progress approval/digest, on-device + cloud AI proof where hardware permits |
| Product pronunciation | Yes | CONFIRMED | TIE-nee |
| Target duration | Yes | CONFIRMED | 90–150 seconds; absolute maximum 180 seconds |
| Demo data | Yes | CONFIRMED | Synthetic Nigerian names and fake phone numbers; no real child/guardian data |
| Redaction | Yes | CONFIRMED | Hide tokens, keys, real numbers, private URLs, account details, real personal data |
| Video output location | Yes | CONFIRMED | `artifacts/demo/` |
| Narration voice | Yes | PENDING | Free Google AI TTS if available/currently permitted; otherwise free permitted fallback |
| Captions | Recommended | CONFIRMED | Include captions where feasible |

## 9. Remaining consolidated questions

Only items still missing after the 25 November 2026 inspection and operator confirmations are listed. Answer all that apply in one reply. Do not paste secret values into chat or Markdown.

1. **UI references (hard blocker).** Supply the exact URL(s) for the existing interfaces to use as design references, plus ownership/usage notes and intended screens. The workflow requires references before code phases begin.
2. **Build environment (hard blocker).** Choose how Phase 1 builds/tests will run: (a) authorize installation of a minimal local JDK/Android command-line SDK/Gradle toolchain and free enough disk space (currently 5.5 GB free on `C:`), (b) authorize GitHub Actions/another approved build machine, or (c) operator installs the toolchain. Node 22 is required for Functions; `fnm` is available and Node 24.20.0 is currently active.
3. **Firebase project and access.** Supply the dedicated non-production Firebase project ID and the access method (local `firebase login`, IAM grant, or approved CLI identity). Do not send keys or tokens in chat.
4. **Protected distribution.** Provide Firebase App Distribution tester group/access or an approved protected APK artifact destination. If unavailable, only a local APK can be produced and the early-preview limitation will be recorded.
5. **Android device.** Supply the Note 10+ Android version for general compatibility testing, and confirm whether a **supported** on-device Gemini Nano device is available. The Note 10+ cannot satisfy the on-device AI proof gate under the current official device list.
6. **Spark/Functions limitation.** Confirm that hosted Cloud Functions are out of scope while the project remains on Spark/NGN 0, and that backend integration/E2E will run against Firebase Emulator Suite only. Alternatively, explicitly authorize a Blaze upgrade with a hard budget; do not infer this from project access.
7. **Optional pilot context.** If known, name the pilot state/LGA/community/schools and target languages. This is not required for synthetic development.

If the agent can discover an answer in the repository/environment or operator material, it must mark it confirmed and not ask again. Optional design preferences use defaults and do not block implementation.

## 10. Phase 0 inspection record (25 November 2026)

### 10.1 Handoff verification

- 26 Markdown documents are present and tracked in Git, including `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`.
- Relative Markdown links resolve; fenced code blocks are balanced.
- `docs/PROPER_VIBE_CODING_WORKFLOW.md` SHA-256 is `11607c448d9803ef27ab69d7e20d53730c2f535fc8b2b97559c9f464b66cacdb`, matching the value recorded in `AI_HANDOFF.md`.
- No application source, Gradle/Android project, Functions code, database migration, Firebase configuration, CI workflow, deployment script or test suite is present.
- No UI reference image, logo or brand asset is present in the repository.
- The operator has confirmed that interface links will be supplied; exact links are still pending.
- The historical ZIP-integrity claim in `AI_HANDOFF.md` could not be re-verified because the ZIP is not in the repository. The Markdown package checks above passed.

### 10.2 Repository inspection

- Local path: `C:\Users\User\Documents\Projects\tiny`.
- Remote: `https://github.com/onyebuchidaniel60/tiny.git`; default/current branch `main`; only local/remote branch `main`.
- HEAD before this intake update: `690beef609d4620610611df737252615b7652f23` — `added firebase skills`.
- Working tree clean before the Phase 0 documentation update.
- GitHub repository is public; authenticated GitHub CLI has repository admin permission. Operator authorized direct commits/pushes to `main` with no force-push, history rewrite, branch deletion or visibility change.
- `main` is not branch-protected. No GitHub Actions workflows, secrets, variables, releases or deployment configuration exist.
- No `app/`, `functions/`, `firebase/`, `tests/`, `.github/` or `artifacts/` implementation tree exists yet.
- No environment/configuration file, `google-services.json`, `.firebaserc`, service-account file, `.env` or secret material was found. No secret values were read or displayed.

### 10.3 Local environment inspection

| Check | Result |
|---|---|
| OS | Windows 11 Pro 10.0.26200 |
| Git | 2.55.0.windows.5 |
| Node.js | v24.20.0 (architecture requires Node 22 for Functions) |
| npm | 11.19.0; npm registry reachable |
| Version managers | `fnm` present; `nvm`/Volta absent |
| Package managers | `winget` 1.29.380, Chocolatey 2.7.4 |
| GitHub CLI | Present and authenticated; repository admin access |
| JDK/Java | **Absent** |
| Android Studio / Android SDK / `adb` | **Absent** |
| Gradle | **Absent** (no wrapper yet) |
| Firebase CLI / Google Cloud CLI | **Absent** |
| Flutter | Absent (not required) |
| Connected Android device | **None detected** via USB/PnP; ADB unavailable |
| Disk space | `C:` has approximately 5.5 GB free (only filesystem drive) |
| Firebase/eSMS/Google env vars | None present (names checked; no values displayed) |

### 10.4 Device support finding

- Supplied device: **Samsung Galaxy Note 10+**; Android version still pending.
- The current official ML Kit GenAI direct-model-access device list (retrieved 25 November 2026 from `https://developers.google.com/ml-kit/genai`) does **not** include the Galaxy Note 10+.
- This device may still be usable for general app installation and offline/local testing if its Android version meets `minSdk 26`, but it cannot provide genuine Gemini Nano/on-device inference evidence.
- The on-device AI acceptance/demo gate therefore remains blocked until a currently supported physical device is available. Do not claim on-device inference ran on the Note 10+.

### 10.5 Firebase budget/plan finding

- Operator confirmed: dedicated non-production project, Spark plan, no billing account, no Blaze upgrade, cloud spend NGN 0, Gemini Developer API free tier, Emulator Suite and synthetic data.
- Official Firebase documentation (retrieved 25 November 2026) states that deploying Cloud Functions requires the Blaze pricing plan.
- Therefore the fixed Cloud Functions backend can be implemented and tested locally in the Emulator Suite, but cannot be deployed or validated as a hosted staging backend while the project remains on Spark/NGN 0.
- This is recorded as a material limitation. Do not silently replace Cloud Functions, enable Blaze or create paid resources.

### 10.6 Outstanding blockers and minimum operator action

| Blocker | Why it matters | Minimum operator action |
|---|---|---|
| UI reference links | Required by the workflow before code phases; Phase 6 cannot begin without them | Supply exact URL(s), ownership/usage notes and intended screens |
| Android build toolchain / disk | Phase 1 cannot build, lint or install an APK without JDK, Android SDK, Gradle and sufficient space | Authorize minimal CLI toolchain installation and free disk space, or provide an approved CI/other build machine |
| Firebase project ID and access | Required for Phase 2, App Check/AI Logic free tier, App Distribution and Firebase tooling | Supply project ID and least-privilege access method; do not send secrets |
| Protected preview distribution | Required for the Phase 1 early installable preview | Provide App Distribution tester group/access or approved protected artifact destination |
| Supported on-device AI device | Note 10+ is not on the current Gemini Nano support list; emulator is insufficient | Provide a supported physical device for on-device proof, or explicitly accept a blocked on-device demo and cloud/fallback-only evidence |
| Hosted Functions on Spark | Cloud Functions deployment requires Blaze; NGN 0 prohibits it | Confirm emulator-only backend scope, or explicitly authorize Blaze with a bounded budget |
| Optional pilot/legal gates | Required before real-school pilot, not synthetic development | Identify DPIA/legal/translation/NERDC approvers and timing |

### 10.7 Documentation inconsistencies recorded (not silently resolved)

1. **Environment-variable names.** `TINY_PROJECT_BLUEPRINT.md` §23 uses `SMS_MONTHLY_BUDGET_USD` and `AI_DAILY_CLOUD_LIMIT_PER_TEACHER`; `docs/CONFIGURATION.md` uses `SMS_MONTHLY_BUDGET_MINOR` and `AI_DAILY_CLOUD_LIMIT_PER_USER`. Resolution belongs in Phase 2; no code exists yet.
2. **Demo output path.** `IMPLEMENTATION_PLAN.md` Phase 8 narrative mentions `demo/`; the artifact table and `DEMO_VIDEO_PLAN.md` use `artifacts/demo/`. The operator confirmed `artifacts/demo/`; treat that as canonical.
3. **Time-sensitive AI versions.** The blueprint records provisional Firebase/Compose AI SDK versions and notes they must be verified. They are not treated as pinned; Phase 1 must check current official documentation and record exact tested versions.
4. **Historical ZIP claim.** `AI_HANDOFF.md` records a ZIP integrity check from package preparation; the ZIP is not part of this repository. The current Markdown package checks passed independently.
