# Tiny — Consolidated Operator Intake / Readiness Check

**Status:** Pending; complete once before implementation.  
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
| Repository URL/path and branch | Yes | PENDING | Supply repo or working directory; agent inspects Git status and existing code first |
| Git write/commit access | Yes | PENDING | Confirm permitted branch and remote |
| Existing CI provider access | If configured | PENDING | Agent discovers from repo; no need to re-ask if already available |
| GitHub Actions secrets access | If CI secrets needed | PENDING | Configure via secure UI; never paste secret values into chat or Markdown |
| Existing project documentation | Yes, inspect | CONFIRMED | This package is the initial source of truth; reconcile any repo docs |
| Windows/PowerShell operator constraints | If commands are run locally by operator | PENDING | Default to portable commands and explain Windows alternatives where needed |

## 3. UI reference assets — critical before final UI work

| Input | Required? | Status | Operator action / validation |
|---|---:|---|---|
| At least one UI reference image | Yes | BLOCKED — not supplied in this conversation | Supply image file(s) during intake or explicitly authorize the agent to generate a reference image |
| Asset ownership/source | Yes | PENDING | Confirm operator-owned, licensed, or reference-only inspiration |
| Intended screens | Helpful | PENDING | Default: teacher home/dashboard, attendance, lesson planner, pupil/progress, inbox, settings |
| Responsive expectations | Yes | CONFIRMED | Android phone portrait first; small-screen layout; accessible larger font scaling |
| Existing logo/icon/brand assets | Optional | PENDING | If absent, agent creates original text-first identity; no third-party logos |
| Color/visual constraints | Optional | PENDING | If no explicit brand direction, derive an original design from supplied references and document decisions |

Do not claim any missing image was supplied. The agent must inspect exact filenames, paths and visual content and complete `REFERENCE_ASSETS.md`. The UI implementation is direct from the references; no separate mockup/approval phase.

## 4. Firebase / Google Cloud

| Input | Required? | Status | Authorization boundary |
|---|---:|---|---|
| Firebase project ID | Yes for backend implementation | PENDING | Prefer separate development/staging project; provide ID, not private credentials in chat |
| Firebase project membership/role | Yes | PENDING | Operator grants least privilege via IAM; agent verifies access |
| Firebase billing account / plan | Yes to deploy Functions Gen2 | PENDING | Confirm Blaze enabled and maximum spend approved; no billable deployment before approval |
| Firestore database | Yes | PENDING | Create Standard database in `africa-south1` only after operator approval |
| Firebase Authentication Phone provider | Yes | PENDING | Enable Phone Auth; configure +234 allowlist/region policy, OTP quota and authorized test numbers |
| App Check / Play Integrity | Production required | PENDING | Debug provider only in local test project; production attestation configured later |
| Firebase AI Logic Gemini Developer API | Yes for cloud AI demo | PENDING | Enable API and quota; global processing limitation acknowledged |
| On-device AI test phone | Yes for proof of on-device path | BLOCKED until device supplied | Must be a physically supported Android device with compatible model. Emulator-only proof is insufficient |
| Representative low-cost pilot phones | Required before pilot | PENDING | Supply common models/Android versions and confirm Google Play services + Play Integrity availability for connected cloud use; record the share that meets the MVP baseline |
| Android SDK/build machine | Yes | PENDING | Android Studio/SDK, JDK compatible with pinned AGP, Gradle wrapper; agent validates versions |
| Firebase App Distribution | Preferred for preview | PENDING | Provide tester group/authorized distribution access, or explicitly choose protected APK artifact fallback |
| Firebase Emulator Suite | Strongly required for tests | PENDING | Local emulators; no production data |

**Fixed region decision:** Firestore Standard and Functions Gen2 in `africa-south1` (Johannesburg). This is not Nigerian data residency. Cross-border processing must be assessed in DPIA/legal review. Gemini Developer API AI processing is global; only de-identified/minimized generic context may be sent.

## 5. SMS provider and communications

| Input | Required? | Status | Authorization boundary |
|---|---:|---|---|
| eSMS Africa account | For sandbox integration | PENDING | Verify account ownership and service status |
| eSMS Africa sandbox key | For sandbox tests | PENDING | Store only in Secret Manager/local secret store; never commit |
| Shared keyword service (`TINY`) | For real inbound SMS | PENDING | One product-level keyword/service, not one paid keyword per school |
| Inbound webhook URL/config | For real inbound messages | PENDING | Configure only after protected staging URL is deployed and signature secret stored |
| Delivery webhook | For status callbacks | PENDING | Validate signature and event uniqueness |
| KYC/business registration | For production provider activation, if required by provider | PENDING | Confirm current provider requirements; no representation that account is already approved |
| SMS budget ceiling | Mandatory before production sends | BLOCKED — no amount supplied | Set monthly USD/NGN cap, daily segment cap and per-workspace limits; zero until approval |
| Approved production recipients | Mandatory before live sends | BLOCKED — none supplied | No live messages during development/demo |
| Guardian consent/verification process | Product/legal readiness required before pilot | PENDING | Confirm school collection script, lawful basis, notice, consent/opt-out handling with DPO/legal adviser |
| Default digest schedule | Friday 15:00 Africa/Lagos | CONFIRMED | Configurable later, not per-school in MVP |
| Sender/service wording | `Tiny` shared keyword; final sender display depends on provider | PENDING | Verify supported sender/short code and Nigerian network behavior |

Published provider examples have included setup/monthly keyword charges and per-segment SMS costs; current pricing must be fetched during intake and revalidated immediately before approval. Provider acceptance must never be labelled delivery. Sandbox only unless the operator provides explicit cost and send authorization.

## 6. Other external services and permissions

| Input | Required? | Status | Safe default |
|---|---:|---|---|
| NERDC curriculum materials and source/license notes | Yes | PENDING | Agent retrieves public official materials, records provenance/rights/hash; only small verified subset seeded |
| Translation review by native speakers | Required before real parent messaging in each locale | PENDING | Use reviewed fixed templates; unreviewed language is disabled, never machine-translated and auto-sent |
| Voice provider | No | NOT_APPLICABLE | Voice is out of MVP |
| Maps/geolocation provider | No | NOT_APPLICABLE | Collect typed State/LGA/community only; no GPS in MVP |
| Payment provider | No | NOT_APPLICABLE | No payment feature |
| Google AI TTS for demo | Required only if available and free at demo time | PENDING | Check current quota/terms; no paid use without authorization; use genuinely free permitted fallback if unavailable |
| Other UI skills | Optional | PENDING | Required attempt: `npx skills add benjitaylor/skills --skill stageshow`; optional skills must be relevant/trustworthy |

## 7. Data protection, budget and release authority

| Input | Required? | Status | Boundary/default |
|---|---:|---|---|
| Controller/processor determination | Yes before live school pilot | PENDING | Do not assume Tiny is the sole controller; school/Tiny roles need legal assessment |
| Data Protection Impact Assessment | Yes before high-risk processing/pilot | PENDING | Complete before real pupil data is processed in production |
| Privacy notice/guardian notice | Yes before pilot | PENDING | Draft only; counsel/DPO approves final text |
| Data retention/deletion schedule | Yes before pilot | PENDING | Default minimal collection; schedule requires operator/legal confirmation |
| Cloud budget | Yes before enabling paid resources | PENDING | No budget assumption; use emulator/sandbox first |
| Maximum monthly cloud spend | Yes | BLOCKED | Explicit value required before enabling billable services in a live project |
| SMS spend ceiling | Yes before live messages | BLOCKED | Explicit value required; zero means no production sends |
| Preview deployment authority | Yes | PENDING | Default: protected staging/App Distribution only, when access is supplied |
| Production deployment authority | Yes | NOT AUTHORIZED by default | Requires separate explicit approval after security/DPIA gates |
| Destructive DB migrations | Yes | NOT AUTHORIZED by default | Backups and explicit authorization required |
| Real parent messaging | Yes | NOT AUTHORIZED by default | Sandbox only |
| Real child/pupil data in demo | No | PROHIBITED | Use deterministic synthetic data only |
| Public repository | Optional | PENDING | Do not expose private repo; link only if confirmed public/approved |
| Domains/website | No MVP web app | NOT_APPLICABLE | Native app only; no website/landing page unless separately approved |

## 8. Demo and delivery

| Input | Required? | Status | Default |
|---|---:|---|---|
| Demo audience | Helpful | PENDING | Hackathon judges / product evaluators |
| Demo key journeys | Yes | CONFIRMED | Offline lesson, offline attendance + sync, absence SMS sandbox, parent inbound message + teacher reply, progress approval/digest, on-device + cloud AI proof |
| Product pronunciation | Yes | CONFIRMED | TIE-nee |
| Target duration | Yes | CONFIRMED | 90–150 seconds; absolute maximum 180 seconds |
| Demo data | Yes | CONFIRMED | Synthetic Nigerian names and fake phone numbers; no real child/guardian data |
| Redaction | Yes | CONFIRMED | Hide tokens, keys, real numbers, private URLs, account details, real personal data |
| Video output location | Yes | PENDING | Default `artifacts/demo/` in repo, unless operator chooses another path |
| Narration voice | Yes | PENDING | Free Google AI TTS if available/currently permitted; otherwise free permitted fallback |
| Captions | Recommended | CONFIRMED | Include captions where feasible |

## 9. Single consolidated questions to ask operator

Only ask items still marked as critical after repository/environment inspection. Do not send separate questions for every pending optional field.

1. Which repository/branch should receive the implementation, and what is the permitted Git write/commit access?
2. Please supply the required UI reference image(s), or explicitly authorize the agent to generate the reference image(s). Confirm asset ownership/source.
3. Which Firebase project should be used for development/staging, and can the agent access it with least-privilege permissions? Is Blaze billing enabled, and what monthly cloud spend ceiling is authorized?
4. Which Android test handset is available for genuine on-device Firebase hybrid inference verification? Provide exact model and Android version; agent validates support.
5. Can the agent access eSMS Africa sandbox credentials and webhook configuration? If live messaging is intended later, what is the approved monthly/daily SMS budget and who authorizes real sends? (Default remains sandbox only.)
6. What protected preview distribution route is available (Firebase App Distribution tester group or approved secure APK artifact destination)?
7. Where should the final demo video and supporting script be saved? (Default `artifacts/demo/`.)
8. Are there any prohibited actions or additional data-handling restrictions not already in this package?

If the agent can discover the answer in repository/environment or operator material, it must mark it confirmed and not ask again. Optional design preferences use defaults and do not block implementation.
