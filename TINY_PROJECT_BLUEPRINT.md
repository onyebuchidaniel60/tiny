# TINY — COMPLETE IMPLEMENTATION-READY PROJECT BLUEPRINT

**Blueprint version:** 1.0  
**Prepared:** 25 November 2026  
**Product:** Tiny (pronounced *TIE-nee*)  
**Product principle:** **Big impact. Small requirements. Accessible everywhere.**  
**Implementation posture:** Product and architecture decisions are made here; the coding agent is an implementation executor.

> This package is the product and engineering source of truth for the first Tiny MVP. It is not permission to begin production deployment, incur paid service costs, or send real messages. The agent must complete the one-time operator intake in `OPERATOR_INTAKE.md` before modifying a repository.

---

# 1. PRODUCT DEFINITION

## 1.1 Product identity

**Name:** Tiny  
**Pronunciation:** TIE-nee  
**One-line description:** Tiny is an offline-first Android teacher-support and parent-engagement platform for rural schools, helping teachers plan and manage classroom work while keeping parents informed through ordinary SMS.

**Product meaning:** “Tiny” describes the small requirements and low barrier to access—not a small ambition or limited capability. The product should run on the Android smartphones teachers already have, use little data and storage, remain useful offline, and reach parents who use basic phones.

**Positioning statement:** A teacher should not need reliable internet to prepare and manage a lesson, and a parent should not need a smartphone to stay involved in a child's education.

## 1.2 Problem

Rural teachers may have limited access to lesson-planning resources, professional coaching, reliable electricity, internet, and administrative support. Routine tasks such as attendance and parent communication compete with teaching time. Parents may be daily earners, live far from school, have limited literacy, or use basic mobile phones. They often receive little timely information about attendance, progress, achievements, or areas where a child needs support.

The resulting gap is two-sided: teachers need parents to be informed and involved; parents need teachers to make the child's school experience understandable and visible.

## 1.3 Current alternatives and workarounds

- Paper registers, notebooks, handwritten lesson notes and report cards.
- In-person visits and ad hoc phone calls.
- Individual teacher or school WhatsApp groups where smartphone/data access exists.
- Informal calls and SMS sent manually from personal phones.
- Generic online lesson resources that are difficult to reach or use offline.

Tiny complements existing school processes. The MVP does not claim to replace official registers, school reporting obligations, or professional teacher training.

## 1.4 Target users and roles

| Role | Description | Product access |
|---|---|---|
| Teacher | Primary user; uses a personal Android smartphone; may teach multiple classes and subjects | Full teacher application for assigned classes, lessons, attendance, progress and parent communication |
| School administrator | Operational role in a school-managed workspace; may also be a teacher | Workspace, teacher membership and class-assignment administration; no separate admin portal in MVP |
| Parent/guardian | Communication recipient; may use a basic phone and no internet | No app account; SMS-based notifications and parent-initiated communication |
| Pupil | Person whose school records are managed | No account, login or student interface |
| Platform operator | Tiny service operator | No bespoke operator dashboard in MVP; Firebase Console and documented support procedures only |

A teacher may belong to more than one workspace. An independent teacher has full core teacher functionality in a teacher-created workspace. A school administrator may also have a teacher membership.

## 1.5 Core value proposition

- **Teachers:** practical lesson structure, offline teaching resources, faster attendance and lower-friction parent communication.
- **Parents:** understandable, relevant information about attendance and learning progress without installing an app or buying data.
- **Schools:** a simple shared record and communication layer without requiring a computer lab or specialist hardware.

## 1.6 Differentiator

Tiny combines four things for low-infrastructure settings: an Android-first offline teacher tool, practical teacher scaffolding, two-way SMS parent engagement, and hybrid AI that supplements—not gates—the offline experience.

## 1.7 Primary use case

A teacher opens Tiny on an Android phone without internet, retrieves a saved Nigerian-curriculum-aligned 5E lesson plan, records attendance for a class, saves the register locally, and continues teaching. When connectivity returns, the register synchronizes, absence alerts are queued and sent to each eligible guardian, and the teacher can view and respond to parent messages. The teacher can also record a concise subject-progress observation for a pupil and approve it for the next parent digest.

## 1.8 Secondary use cases

- An independent teacher creates a workspace and begins using Tiny without waiting for a school administrator.
- A school creates a managed workspace and invites teachers.
- A teacher creates plans for several classes and subjects.
- A teacher records a pupil's achievement or area needing support.
- A parent explains an absence, asks a question, shares information, or requests a callback by SMS.
- A teacher gets a short, on-device teaching suggestion in English on a supported handset, or a cloud-generated lesson adaptation when connected.

## 1.9 Explicit non-goals

Tiny is not a school ERP, student learning-management system, online classroom, examination platform, fee-collection system, payroll system, school transport system, student social network, student-facing tutor, school surveillance product, or replacement for official assessment/reporting systems. It does not diagnose learning disabilities or mental-health conditions. It does not automatically grade pupils, rank children, or infer performance from attendance alone.

---

# 2. MVP SCOPE

## 2.1 MUST HAVE

1. Native Android teacher application, optimized for affordable personal Android phones.
2. Teacher authentication and two workspace creation routes: school-managed and independent teacher-created.
3. School administrator and teacher roles, with multi-class and multi-subject assignment.
4. Pupil records and multiple guardian relationships per pupil; one guardian may be linked to multiple pupils.
5. Four teacher-interface languages at launch: English, Hausa, Yoruba and Igbo.
6. Five parent-communication languages at launch: English, Hausa, Yoruba, Igbo and Nigerian Pidgin. Pidgin is a parent-message language in MVP; it is not a promise of full teacher UI localization.
7. Primary 1–6 curriculum catalog and offline lesson-plan templates mapped to the current NERDC Revised Basic Education Curriculum. Seed content must be verified against official NERDC source material; do not invent curriculum objectives or copy unlicensed textbook content.
8. Offline 5E lesson-plan builder and curated teaching strategy library.
9. Offline class register and attendance capture with explicit submit/finalize action.
10. Immediate parent SMS for absences only. Present and late attendance do not trigger immediate SMS.
11. Parent-initiated two-way SMS, teacher inbox and teacher replies through a product-level shared keyword.
12. Basic teacher-entered pupil progress: subject-level indicator, concise observation, optional home-support suggestion, and teacher approval before sharing.
13. Weekly parent digest using only recorded and approved information.
14. Durable local write queue, synchronization, idempotency and conflict handling.
15. Firebase AI Logic hybrid demonstration with real on-device and cloud inference. On-device generative AI is optional by device capability and language; it is never required for core use.
16. Basic audit trail, role-based access, App Check, validation, and privacy safeguards.
17. Sandbox messaging integration for demo/testing; production SMS remains disabled until account, KYC, cost ceiling and explicit authority are supplied.

## 2.2 SHOULD HAVE

- School claiming / affiliation flow for an independent teacher-created workspace, while preserving that teacher's account and data.
- Teacher review of a pupil's period progress before inclusion in a digest.
- Teacher corrections to already-submitted attendance with audit trail and parent correction message if the original absence alert was sent.
- CSV export of class roster and attendance for authorized school administrators, if it can be done without expanding data exposure.
- Downloadable curriculum packs, resource versioning and update status.

## 2.3 NICE TO HAVE

- Richer monthly child progress report with PDF export.
- Additional Nigerian languages beyond the first five communication languages.
- Voice-call notifications and callback automation.
- Teacher-to-teacher resource sharing across schools.
- School-wide aggregate reports.
- Parent USSD access.

## 2.4 FUTURE

- Carefully localized voice experiences.
- Additional regional language packs selected from pilot communities.
- State/SUBEB partnerships and managed school rollout.
- More extensive curriculum coverage and teacher professional-development pathways.
- Low-bandwidth web access for approved school administrators, if later justified.

## 2.5 OUT OF SCOPE

Student accounts or app, online examinations, live video classes, payments/fees, payroll, school ERP functions, automated student grading, automated discipline scoring, predictive dropout scoring, medical/psychological diagnosis, AI-only parent reports, real-time parent chat, voice calls in MVP, public school directory, and public exposure of pupil data.

## 2.6 MVP success definition

A demonstrable complete loop must work:

1. Teacher signs in and enters a school or independent workspace.
2. Teacher manages at least two classes and their pupils/guardians.
3. Teacher accesses an offline 5E plan and a curated teaching tip.
4. Teacher marks and submits attendance while disconnected.
5. App restarts without losing queued attendance.
6. On reconnection, the register synchronizes exactly once.
7. The server creates an absence notification job only for absent pupils and eligible guardians.
8. Sandbox SMS delivery status is reflected in Tiny; provider acceptance is not mislabelled as delivery.
9. A parent-originated message reaches the authorized teacher inbox, and the teacher can reply.
10. Teacher records and approves a short progress observation; it appears in the correct weekly digest.
11. Firebase AI Logic produces one verified on-device result on a supported physical Android device and one verified cloud result; the result's source is displayed in a test/developer evidence view.
12. All essential records remain usable when neither AI route nor network is available.

---

# 3. USER ROLES AND PERMISSIONS

## 3.1 Roles

- `school_admin`: manages a school workspace, membership invitations/revocations, class assignments, school communication settings and exports.
- `teacher`: manages only assigned classes and records; may also be workspace owner for an independent workspace.
- `guardian`: not an application role and has no login. A verified guardian contact can exchange SMS with the school through the messaging service.
- `platform_operator`: Firebase project/operator access only; not part of the public product UI.

## 3.2 Permission matrix

| Action | School admin | Assigned teacher | Parent by SMS |
|---|---:|---:|---:|
| Edit school settings | Yes | No | No |
| Invite/revoke teachers | Yes | No | No |
| Create/assign classes | Yes | Yes, within workspace | No |
| Register pupils/guardians | Yes | Yes, assigned classes | No |
| Mark attendance | Yes if also assigned / override with audit | Yes | No |
| Submit attendance | Yes if assigned / override with audit | Yes | No |
| Correct submitted attendance | Admin or original submitter with reason | Original submitter with reason | No |
| Create lesson plans | Yes if also teacher | Yes | No |
| Record pupil progress | Yes if assigned / administrative override audited | Yes, assigned classes | No |
| Approve parent-facing progress update | Yes or authoring teacher | Authoring teacher | No |
| Read conversations | Authorized teachers of linked class; admin within workspace | Yes, if related class assigned | Own inbound/outbound SMS only on handset; no server data portal |
| Send teacher reply | Yes or assigned teacher | Yes | Initiate/respond by SMS |
| Access another workspace | No, unless separately a member | No, unless separately a member | No |

## 3.3 Workspace types

- `school`: created by a school representative; initial owner receives `school_admin`; `verificationStatus` starts `unverified` or `pending`, never falsely marked verified.
- `independent`: created by a teacher; creator is owner and teacher; all core teacher functions enabled.

An account may be a member of multiple workspaces. The currently selected workspace scopes every query and action. Joining a school does not silently move or merge an independent teacher's pupils or records. Any migration is explicit, authorized and audited. In MVP, joining an existing school is supported by invitation and acceptance; complex automated workspace merge is SHOULD HAVE.

---

# 4. COMPLETE USER FLOWS

Detailed flows are expanded in `PROJECT_SPEC.md`. The mandatory flows are summarized below.

## 4.1 Teacher sign-up and workspace creation

**Entry:** Welcome screen; internet is required for first registration.

1. Teacher chooses “Create account”.
2. Teacher enters name and Nigerian mobile number and completes Firebase Phone Auth OTP.
3. Teacher chooses “Create a school workspace” or “Start independently”.
4. App collects workspace name and location (state, LGA, community); school workspace also collects administrator identity/contact.
5. Backend creates workspace and membership transactionally, marks it unverified, and returns workspace ID.
6. App downloads minimal assigned data and stores it in encrypted Room.

**Failure cases:** OTP not delivered, rate-limited, no internet, duplicate workspace name, invitation expired, user already has workspace. No duplicate workspace on retry. On first authentication, offline use is not yet available.

## 4.2 Teacher joins a school

1. School admin enters teacher's verified phone or creates an invitation.
2. Server creates time-limited invitation record and outbound invitation SMS is optional; invitation may also be shared in person.
3. Teacher signs in and accepts invitation.
4. Backend creates membership after verifying invite token, workspace and status.
5. Admin assigns classes.
6. Teacher's app downloads only authorized class/pupil records.

An invitation is single-use, expires after 7 days, and can be revoked. The invitation token is not a substitute for phone authentication.

## 4.3 Create class and add pupils/guardians

1. Teacher opens workspace and selects “Add class”.
2. Selects grade Primary 1–6, class label/section, academic year and assigned teacher(s).
3. Adds pupils individually or via validated CSV import (CSV SHOULD HAVE; individual entry MUST).
4. Adds each guardian's name, relationship, normalized E.164 phone number, preferred language and communication consent state.
5. Links one or more guardians to one pupil; one guardian may be linked to multiple pupils.
6. Parent contact is pending verification until guardian confirms using an invitation code/keyword flow or teacher-approved in-person verification process.
7. Data persists locally; server synchronization may be pending.

**No automatic child-data disclosure is permitted to an unverified number.**

## 4.4 Prepare a lesson offline

1. Teacher selects class, subject and curriculum topic/objective from the downloaded pack.
2. Tiny loads the 5E template (Engage, Explore, Explain, Elaborate, Evaluate), learning objective, duration, materials and checks for understanding.
3. Teacher edits, saves and may duplicate a plan for another class.
4. The plan is stored locally and is available without internet.
5. When online, it synchronizes with the workspace.

AI assistance is optional and separate. It must not block access to the template.

## 4.5 Record and submit attendance offline

1. Teacher opens assigned class and current school date.
2. App loads the local roster.
3. Teacher marks each active pupil `present`, `absent` or `late`.
4. Unmarked pupils are visibly counted; submit is disabled until all active pupils have a status.
5. Teacher reviews the register and taps “Submit attendance”.
6. App creates a unique local session ID and queues an immutable submission event in one Room transaction.
7. UI shows “Saved on this phone — waiting to sync” if offline.
8. When network returns, WorkManager submits the command with idempotency key.
9. Backend validates membership, class assignment, unique class/date session, version and pupil membership, then commits attendance and notification jobs atomically.
10. Only `absent` entries with eligible guardian communication settings create immediate SMS jobs.
11. App updates the teacher with submitted/synced/notification statuses.

**Conflicts:** If another device already submitted attendance for that class/date, backend rejects with `ATTENDANCE_ALREADY_SUBMITTED` and returns canonical session. It must not overwrite. Authorized correction is a separate amendment command.

## 4.6 Parent receives absence notification and replies

1. Backend resolves active guardian links for absent pupil and opted-in/verified phone endpoints.
2. It creates one deduplicated notification per phone endpoint, pupil, attendance session and template/language.
3. Outbox worker estimates SMS segments, checks messaging budget and creates provider request.
4. eSMS Africa sandbox sends the message; production calls remain disabled until explicitly authorized.
5. Provider status callback updates `accepted`, `delivered`, `failed` or `unknown` accurately.
6. Parent may reply with an absence reason or free text. Each absence SMS includes a short non-secret reference (e.g. `Ref A7KD`); menu replies use `1 A7KD` or `2 A7KD`. A bare `1`/`2` is accepted only when exactly one eligible open absence alert exists for that sender; otherwise Tiny requests the reference and never guesses.
7. Signed inbound webhook reaches Cloud Function; function validates HMAC, deduplicates and maps sender/keyword/school context.
8. Message appears in the authorized teacher inbox; automated acknowledgement includes no child-specific data until guardian matching succeeds.

## 4.7 Parent initiates a message

1. Parent texts the global Tiny keyword and school code, e.g. `TINY <school-code> <message>`; once an active conversation is established, plain replies may be routed through the provider's conversation window.
2. Provider posts signed `message.inbound` event.
3. Backend validates signature, sender number, school code and guardian contact status.
4. If one verified guardian match exists, create or append a conversation. If multiple schools/pupils are ambiguous, ask the parent to specify the school/pupil code; do not guess.
5. Teacher inbox displays sender, linked class/pupil(s) where unambiguous, message and timestamp.
6. Teacher replies in the app; message job is queued and sent by provider.
7. Teacher can mark conversation `resolved`; a later parent message reopens it.

## 4.8 Record and share pupil progress

1. Teacher selects a pupil or group of pupils, period and subject/curriculum objective.
2. Selects one indicator: `doing_well`, `developing`, `needs_support`, or `not_assessed`.
3. Adds optional factual note and optional practical home activity.
4. Tiny stores the draft locally.
5. Teacher reviews and approves parent-facing content before it is shared.
6. Approved entries become eligible for next weekly digest or an individually initiated update.
7. `not_assessed` is not presented as a negative result and is not sent as a progress judgment.

No scores, diagnoses, child rankings or inferred performance are generated by AI.

## 4.9 Weekly digest

1. A weekly scheduled backend job runs Friday at 15:00 `Africa/Lagos`.
2. It queries active guardian relationships and approved records for the reporting period.
3. It groups updates per guardian per workspace and includes multiple linked pupils when applicable.
4. Only approved attendance/progress/school announcements are included.
5. It excludes unapproved notes, missing data and sensitive details.
6. It renders a short localized template, calculates encoding/segments, checks limits and usage budget, then queues SMS.
7. If data is incomplete, digest explicitly says the report is incomplete or omits the field; it never reports absence of data as evidence of poor performance.

## 4.10 Hybrid AI assistance

1. Teacher selects an AI action (e.g. simplify a topic explanation or suggest a classroom strategy).
2. App checks selected language, input length, device capability and current connectivity.
3. On supported device and English prompt, run the configured Firebase AI Logic on-device path and capture inference source.
4. For complex or non-English tasks, use cloud-only path while connected; if unavailable, return cached resource or clear offline message.
5. Model output is parsed/validated against typed schema and content limits.
6. Teacher reviews and edits before saving or sharing anything.
7. AI cannot create attendance, progress, grade or communication records without explicit teacher action.

---

# 5. FUNCTIONAL REQUIREMENTS

The canonical detailed feature register is in `PROJECT_SPEC.md`. The MVP must implement these identifiers and acceptance tests:

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | Firebase phone authentication for teachers; first login online | MUST |
| FR-002 | School and independent workspace creation | MUST |
| FR-003 | School admin invites/revokes teachers | MUST |
| FR-004 | Multiple workspaces per user and workspace switcher | MUST |
| FR-005 | Manage multiple classes and subjects | MUST |
| FR-006 | Register pupils and maintain enrollment status | MUST |
| FR-007 | Link multiple guardians to a pupil; guardian may link to multiple pupils | MUST |
| FR-008 | Guardian language, phone verification and communication consent | MUST |
| FR-009 | Teacher UI localization: en, ha, yo, ig | MUST |
| FR-010 | Parent SMS localization: en, ha, yo, ig, pcm | MUST |
| FR-011 | NERDC Primary 1–6 curriculum catalog and versioned local packs | MUST |
| FR-012 | Offline 5E lesson plans and curated teaching library | MUST |
| FR-013 | Offline class register and attendance draft | MUST |
| FR-014 | Explicit attendance submission; no incomplete register finalization | MUST |
| FR-015 | Local Room database and durable outbox | MUST |
| FR-016 | WorkManager network-constrained synchronization | MUST |
| FR-017 | Server-side validation, idempotency and conflict responses | MUST |
| FR-018 | Absence-only instant notifications | MUST |
| FR-019 | Multi-guardian notification with deduplication by phone endpoint | MUST |
| FR-020 | Parent-initiated two-way SMS and teacher inbox | MUST |
| FR-021 | Teacher replies via queued SMS | MUST |
| FR-022 | Basic subject-level progress indicators and factual notes | MUST |
| FR-023 | Teacher approval before parent sharing | MUST |
| FR-024 | Weekly guardian digest, consolidated per workspace | MUST |
| FR-025 | Firebase AI Logic hybrid on-device + cloud paths | MUST |
| FR-026 | AI capability/source display and fallback | MUST |
| FR-027 | No pupil PII in AI requests | MUST |
| FR-028 | Firestore rules, App Check, audit trail and privacy controls | MUST |
| FR-029 | Delivery status handling for SMS | MUST |
| FR-030 | Voice calls | OUT OF SCOPE for MVP |

Every requirement has a testable acceptance criterion in `PROJECT_SPEC.md` and tests in `docs/TESTING.md`.

---

# 6. BUSINESS LOGIC AND STATE MACHINES

## 6.1 Workspace lifecycle

`draft -> active_unverified -> verified` (school verification later).  
`active_unverified -> suspended` only by authorized operator/admin policy.  
Independent workspace remains `active_unverified`; it is never represented as a verified school without verification evidence.

## 6.2 Membership lifecycle

`invited -> active -> revoked`; invitation may also become `expired` or `cancelled`.  
A revoked member cannot sync new commands. Existing offline data is wiped/restricted when the device next reconnects and learns of revocation. No system can remotely wipe a phone while it is offline; this limitation must be documented.

## 6.3 Attendance lifecycle

`local_draft -> local_submitted_pending_sync -> server_submitted -> notification_jobs_created -> completed_with_delivery_status`.

Corrections are separate immutable amendments: `correction_pending -> correction_accepted -> correction_notification_queued` or `correction_rejected`. The original submission remains auditable.

Rules:
- One canonical attendance session per workspace + class + school-local date.
- Session ID is deterministic from class ID and ISO school date or guarded by a unique server key.
- No future date. Backdated entries up to 7 calendar days require `lateSubmissionReason`; older dates require admin correction.
- Every active pupil must have one final status before submission.
- `present` and `late` count as attended; only `absent` creates immediate absence alerts.
- A submitted session is immutable; change through a correction command with `expectedVersion` and reason.
- First valid submission wins. A concurrent competing submission returns `ATTENDANCE_ALREADY_SUBMITTED`; it is never silently merged or overwritten.

## 6.4 Guardian communication lifecycle

Guardian verification: `pending -> verified -> revoked`.  
Consent: `not_recorded -> opted_in -> opted_out`; `STOP` moves to `opted_out`, `START` may re-enable only after confirming identity/relationship and school policy.  
Notification: `queued -> sending -> accepted_by_provider -> delivered | failed | unknown | suppressed`. Provider acceptance is not proof of delivery.

## 6.5 Conversation lifecycle

`open -> waiting_teacher -> waiting_parent -> resolved`; any new inbound message reopens a resolved conversation. Conversations are asynchronous, not live chat. Service-level response promise is not guaranteed in MVP.

## 6.6 Progress lifecycle

`draft_local -> synced_draft -> approved_for_guardian -> included_in_digest` or `withdrawn`. Approval is explicit and audit logged. Editing after approval creates a new revision and resets share approval. `not_assessed` is not a deficit status and is excluded from negative summaries.

## 6.7 Lesson plan lifecycle

`template -> draft -> saved_local -> synced`; plans may be archived. AI suggestions are drafts only. A lesson plan is not an official curriculum document unless the source and version are recorded.

## 6.8 Sync command state

Local outbox: `pending -> in_flight -> acknowledged`; retryable failure returns to `pending` with backoff; permanent validation or permission failure becomes `needs_attention`; conflict becomes `conflict`. An acknowledged command is not resent. Every command has unique `idempotencyKey`.

## 6.9 Digest logic

- Fixed initial schedule: Friday 15:00 `Africa/Lagos` (configurable in a later release).
- Digest groups by guardian + workspace + week; multiple pupils in the same school are combined.
- Same phone in different workspaces gets separate, explicitly scoped messages; never blend school records across tenant boundaries.
- Do not send if no approved digest content exists, except an optional minimal school announcement specifically approved by the school.
- Segment ceiling: target maximum 2 SMS segments per guardian per weekly digest. If content exceeds the ceiling, omit lower-priority optional sections and include a school callback instruction. Do not silently cut names or facts.

## 6.10 Parent SMS routing

Use one product-level keyword `TINY` and a shared short code, not a paid keyword for every school. Parent first message format: `TINY <school-code> <message>`. If a single verified association is known and the provider conversation window is active, plain replies can be routed. If sender maps to multiple schools or pupils and context is ambiguous, request school/pupil code; never guess. School code is a routing hint, not an authentication secret.

## 6.11 AI business rules

- AI can draft suggestions, simplify explanations or rephrase generic teacher text; it cannot directly create authoritative records.
- No AI-generated attendance, assessment score, behavior diagnosis, child ranking, or unsupervised progress assessment.
- No pupil name, phone number, pupil ID, guardian contact, full attendance record or identifiable progress report is sent to a model.
- On-device generation is English-only for Tiny's supported use cases because current Google guidance validates English and Korean on-device; non-English use is cloud-only when online or static-template fallback offline.
- On-device is a bonus capability and only available on supported hardware. The app's main functionality cannot depend on it.
- Model output must validate against a schema, safe-length limits, allowed topics and language expectation; teacher reviews before any sharing.

---

# 7. DATA MODEL

Firestore is the cloud system of record; encrypted Room is the device's local source of truth for the active workspace and unsynced changes. The detailed field schemas, indexes, constraints, retention notes and visibility rules are in `docs/DATA_MODEL.md`.

Core entities:

1. `UserProfile`: teacher/admin identity, Firebase UID, verified phone, preferred application language and account status.
2. `Workspace`: school-managed or independent workspace, name, globally unique non-secret 8-character school routing code, Nigerian state/LGA/community, owner and verification state.
3. `Membership` and `Invitation`: workspace role, class scopes, invitation lifecycle and revocation.
4. `Classroom` and `ClassEnrollment`: Primary 1–6 class, section, academic year, assigned teachers and date-bounded pupil enrollment history.
5. `Pupil`: minimal pupil record; no student account or interface.
6. `Guardian`: one workspace-scoped SMS contact endpoint with normalized phone, preferred parent-message language, verification and consent state. One endpoint may link to several pupils; a shared household handset is one endpoint.
7. `PupilGuardianLink`: pupil-to-contact relationship label, notification eligibility and effective dates; multiple endpoints per pupil and multiple pupils per endpoint.
8. `GuardianVerificationChallenge`: one-time code hash, endpoint/workspace binding, expiry, attempt limit and completion state. Phone possession verification is not proof of legal guardianship.
9. `CurriculumPack`, `LessonPlan` and `TeachingResource`: NERDC source/version/provenance, objective references, 5E plan sections and reviewed offline teaching resources.
10. `AttendanceSession`, `AttendanceEntry` and `AttendanceAmendment`: full class/day register, immutable submission and append-only correction history.
11. `ProgressEntry` and `ProgressRevision`: current subject-level indicator and teacher-authored observation, immutable revision snapshots, explicit approval and last-shared revision.
12. `Conversation` and `Message`: parent/teacher SMS conversation, direction, status, language and optional child context.
13. `NotificationJob` and `WeeklyDigest`: idempotent absence, correction, teacher-reply and weekly digest delivery with provider state.
14. `CommandReceipt`: idempotency outcome for offline commands.
15. `AuditEvent`: actor, workspace, action, resource, reason and safe before/after summaries.
16. `ProviderWebhookReceipt`: signature validation, deduplication and processing state.
17. `AIUsageEvent`: task, language, requested mode, actual inference source and non-PII telemetry.

Sensitive data includes pupil names, guardian phone numbers, contact relationships, attendance, progress observations and message bodies. None is public. Access is restricted by workspace membership and class assignment. The app sends no pupil-identifying record to AI.

# 8. SYSTEM ARCHITECTURE

## 8.1 Architecture decision

Use a native Android client with local-first domain storage and a Firebase-managed cloud backend. Avoid custom microservices, separate web frontends, or an external SQL database for the MVP.

## 8.2 Components

```text
Android teacher app (Kotlin + Jetpack Compose)
  ├─ UI / navigation / localization
  ├─ ViewModels + use cases
  ├─ Repository layer
  ├─ Room encrypted local database (source of truth)
  ├─ Local outbox + sync state
  ├─ WorkManager sync workers
  ├─ Firebase Auth + App Check
  ├─ Firestore network reads (disk persistence disabled)
  └─ Firebase AI Logic (hybrid on-device/cloud)
             │
             ▼
Firebase / Google Cloud (africa-south1 for regional data/backend)
  ├─ Firebase Authentication
  ├─ Cloud Firestore Standard (regional)
  ├─ Cloud Functions 2nd gen (Node.js 22 / TypeScript)
  │    ├─ Callable domain commands
  │    ├─ Sync command processor
  │    ├─ SMS inbound/outbound webhooks
  │    ├─ Notification outbox worker
  │    └─ Weekly digest scheduler
  ├─ Cloud Scheduler (one weekly digest schedule)
  ├─ Firebase Cloud Messaging (optional teacher push)
  ├─ Firebase App Check (Play Integrity)
  └─ Secret Manager / Firebase Functions secrets
             │
             ├─ Firebase AI Logic → Gemini Developer API (global cloud inference)
             └─ eSMS Africa Two-Way SMS (sandbox for hackathon)
```

## 8.3 Local-first rule

UI reads from Room only. On successful network sync, cloud snapshots are reconciled into Room. Firestore disk persistence is disabled in the Android SDK so sensitive pupil/guardian records are not duplicated in the unencrypted Firestore cache. When offline, Room serves all cached classes, pupils, attendance history, lessons, resources and queued progress entries.

The app never treats an unsynced local mutation as server-accepted. Every record visibly carries `localOnly`, `pendingSync`, `synced`, `conflict` or `needsAttention` state as appropriate.

## 8.4 Backend authority

All mutations that affect shared cloud records go through authenticated Cloud Functions callable commands. The client cannot directly write authoritative Firestore collections. Server functions validate Auth, App Check, workspace membership, class assignment, state transitions, data schema, idempotency and business rules before using Admin SDK transactions/batches.

Firestore reads are allowed only when `request.auth` is present and the user is an active member of the target workspace; class-level access is enforced through rules and server checks. Parents do not read Firestore.

## 8.5 Location

Set Firestore Standard database and Cloud Functions 2nd gen in `africa-south1` (Johannesburg) to keep those resources co-located in the nearest supported African region. There is no Nigerian Firestore region in the current location list. This is cross-border processing and must be assessed under the Nigeria Data Protection Act; do not represent this as Nigerian data residency. Firebase AI Logic using Gemini Developer API is global and its location cannot be selected; hence cloud AI receives only de-identified, minimal context. A DPIA/legal review is required before a real-school pilot.

---

# 9. TECHNOLOGY STACK

| Layer | Chosen technology | Responsibility / reason |
|---|---|---|
| Mobile app | Native Android, Kotlin | Android-first experience and direct Firebase/ML Kit support |
| UI | Jetpack Compose + Material 3 | Native, responsive, accessible touch UI |
| Architecture | MVVM + repositories + use cases; feature packages in one app module | Testable separation without an over-modularized MVP |
| Async | Kotlin Coroutines + Flow | Main-safe async state and streaming local data |
| Navigation | Navigation Compose | Role-aware screen navigation |
| Local DB | Room + SQLCipher for Android | Encrypted durable offline source of truth |
| Preferences | DataStore | Locale, selected workspace, sync preferences; no sensitive pupil records |
| Background jobs | WorkManager | Network-constrained sync and retry |
| Auth | Firebase Authentication Phone Auth | Phone-first teacher identity; parent has no app auth |
| Cloud database | Cloud Firestore Standard | Managed, document-oriented multi-tenant storage |
| Backend | Cloud Functions for Firebase 2nd gen, TypeScript, Node.js 22 | Authoritative business logic, webhooks and scheduled jobs |
| Cloud AI | Firebase AI Logic with Gemini Developer API | Hackathon-friendly cloud route; global processing, no PII prompts |
| On-device AI | Firebase AI Logic On-Device SDK / ML Kit Prompt API | Supported-device short English inference; experimental/beta |
| Push | Firebase Cloud Messaging | Optional teacher message alert; not required for core delivery |
| Integrity | Firebase App Check with Play Integrity | Reduce unauthorized client access |
| Secrets | Google Secret Manager / Functions secrets | eSMS key, webhook secret, provider credentials |
| SMS | eSMS Africa Two-Way SMS | Nigerian shared short code, signed inbound webhook and sandbox |
| Scheduler | Cloud Scheduler through scheduled Functions | Friday weekly digest |
| Tests | JUnit, MockK, Turbine, AndroidX Test/Espresso or Compose UI Test, Firebase Emulator Suite | Unit, integration and E2E coverage |
| CI | GitHub Actions | Android build, lint, tests and Firebase Functions checks |
| Distribution | Firebase App Distribution for protected early Android preview | Native preview instead of a web deployment |
| Demo capture | Android UIAutomator/Maestro or equivalent + `adb screenrecord`; Playwright for any browser console | Real native product behavior |

### Version policy

Pin dependency versions in `gradle/libs.versions.toml`, Gradle wrapper and `functions/package-lock.json`. Never use dynamic `+` versions. At preparation time, Firebase's current hybrid guide lists Firebase Android BoM 35.2.0 and `firebase-ai-ondevice` 16.0.0-beta08 alongside `firebase-ai`; use the versions proven compatible in the repository at implementation time and record the exact versions in `docs/CONFIGURATION.md`. The on-device library is not included in the Firebase BoM and is beta/experimental. Current Compose stable BOM documentation lists 2026.09.00. Confirm all exact stable versions during Phase 0/1 and pin them; do not silently upgrade mid-build.

### Minimum Android SDK decision

Set `minSdk = 26` (Android 8.0) because the current Firebase AI Logic on-device SDK/ML Kit Prompt API path requires API 26. This is an explicit MVP trade-off. The app must still run all core features on API 26+ devices that do not support Gemini Nano; on-device AI is runtime-optional. Production-connected operations use Play Integrity App Check, so the connected client also needs a supported Google Play environment. A non-GMS or non-attestable phone may use already provisioned offline features but cannot be promised cloud sync under this MVP architecture. Phase 0 must inventory actual target-school devices. If this limitation materially excludes target teachers, stop before a live pilot and seek an explicit architecture decision; never disable App Check to claim broader support.

### Why alternatives are rejected for MVP

- Flutter/React Native: native Kotlin is chosen because hybrid inference and the on-device ML Kit path are Android-specific and this product is Android-first.
- Web/PWA: cannot satisfy the same native Android hybrid inference and local-device integration requirement as directly.
- SQL/remote-only data: remote-only breaks the offline classroom use case; a second backend database adds unnecessary operations.
- Firestore-only offline writes: last-write-wins is insufficient for finalized attendance; Room + explicit sync commands is safer.
- Separate admin web app: not required for the MVP; admin functions live in the Android app.
- Voice provider: deferred because SMS is the core inclusive channel and voice increases cost, language QA and integration scope.

---

# 10. API SPECIFICATION

Canonical request/response contracts are in `docs/API.md`. All callable functions require Firebase Auth and App Check unless explicitly a signed provider webhook. Every request has Zod validation; every business mutation uses idempotency or a version precondition.

Main callable functions:

- `createWorkspace`
- `createInvitation`
- `acceptInvitation`
- `revokeMembership`
- `createClassroom`
- `assignTeacherToClass`
- `registerPupil`
- `upsertGuardian`
- `linkGuardianToPupil`
- `verifyGuardianContact`
- `submitAttendanceSession`
- `correctAttendanceEntry`
- `createLessonPlan`
- `createProgressEntry`
- `approveProgressEntry`
- `sendTeacherMessage`
- `resolveConversation`
- `syncCommands` (bounded batch of pre-defined command types only)

HTTP webhooks:

- `POST /webhooks/esms/inbound`
- `POST /webhooks/esms/delivery`

Scheduled function:

- `runWeeklyDigests` — Fridays, 15:00, `Africa/Lagos`.

No endpoint permits arbitrary Firestore writes or arbitrary provider requests.

---

# 11. DATABASE OPERATIONS AND CONSISTENCY

- Local Room transactions write the domain change and its outbox command atomically.
- Outbox commands have globally unique UUID idempotency keys.
- Sync sends at most 20 commands per callable request; server returns per-command result (`accepted`, `alreadyApplied`, `conflict`, `rejected`, `retryable`).
- Server records a `CommandReceipt` and applies the domain change in one transaction wherever practical.
- Attendance submission uses a server transaction/commit with a deterministic unique class/date key. It creates attendance entries and absence notification jobs atomically; retries return the original result.
- Submitted attendance is immutable. Corrections are new amendment records.
- Progress entries are append/revision oriented. Updating an approved item resets approval and creates an audit event.
- Message sends use an outbox job and provider message ID; provider retries must not create duplicate user messages.
- Inbound webhook events are HMAC verified, replay-protected and deduplicated before processing.
- Cloud snapshot changes are merged into Room by server version. Local unacknowledged edits are never overwritten by a cloud snapshot.
- For editable metadata, optimistic `expectedVersion` is required. Conflict leads to user resolution, never silent last-write-wins.

---

# 12. AUTHENTICATION AND AUTHORIZATION

- Teacher and school administrator identities use Firebase Phone Authentication with Nigeria (+234) enabled in the SMS region policy.
- First registration, OTP and initial workspace creation require connectivity.
- After first successful authentication and initial sync, the teacher can unlock the local app using device credential/biometric or local app PIN; local unlock does not replace Firebase authorization.
- Keep Firebase session tokens in SDK-managed storage; do not copy tokens to Room or logs.
- Firebase App Check production provider: Play Integrity. Local development uses App Check debug provider only in emulator/test project. Connected production clients must pass supported Play Integrity attestation; no-GMS/non-attestable devices are outside the MVP's connected support baseline.
- Firestore security rules allow only reads for active workspace members and relevant class assignments. Direct client writes to authoritative collections are denied.
- Cloud Functions validate role and class membership on every command; UI hiding is not authorization.
- Parent is not authenticated to the app or Firestore. Incoming parent messages are matched by verified E.164 phone, product keyword and school code. Ambiguous matches receive no child-specific information.
- Workspace membership revocation blocks future server commands and removes local cached data when device reconnects; offline remote wipe is impossible and must be disclosed.

---

# 13. SECURITY ARCHITECTURE

Security design and risk matrix are in `docs/SECURITY.md`. Baseline requirements:

- Multi-tenant isolation at Firestore rules and backend function level.
- IDOR prevention by deriving workspace, role and class permissions from server-side membership records; never trust client-supplied `workspaceId` alone.
- App Check, Firebase Auth, rate limits, OTP throttling, schema validation and abuse monitoring.
- Callable functions validate request shape, identity, class assignment, record ownership, state transition and idempotency.
- eSMS webhooks verify HMAC-SHA256 over the raw request body using timing-safe comparison; deduplicate provider event IDs and reject stale/replayed events.
- Store secrets in Secret Manager; no API keys or service account files in APK, repository, logs or demo video.
- Use Room encrypted with SQLCipher; key stored using Android Keystore. Sensitive data stays in app-private storage; no shared external storage exports by default.
- Minimize lock-screen notification details. Push payload only says a message is waiting; no pupil name, parent message or attendance status.
- No pupil identifiers/PII in AI prompts or analytics. No raw prompts stored by default.
- No child photos, biometric data, GPS tracking or medical data in MVP.
- Teacher reviews all parent-facing AI-assisted text; no autonomous AI publication.
- Conduct a DPIA and legal review before processing real pupil records at pilot scale. Nigeria Data Protection Act applies to child data and high-risk processing; the exact controller/processor responsibilities must be agreed with participating schools.

---

# 14. UI/UX ARCHITECTURE

The app is for teachers only. Parents use SMS; pupils have no interface.

## 14.1 Navigation structure

Bottom navigation with four primary destinations:

1. **Home** — today's classes, pending sync state, quick lesson/attendance actions, message alerts.
2. **Classes** — class selector, pupils, attendance, progress and subject context.
3. **Lessons** — curriculum packs, saved plans, teaching library and AI assistance.
4. **Messages** — parent inbox, conversations, weekly digest preview and message state.

A profile/settings area contains language, current workspace, membership, sync/data preferences, help, privacy notice and sign out.

## 14.2 Screen inventory

- Welcome / language selection
- Sign-in / sign-up / OTP verification
- Workspace type selection
- School workspace form
- Independent workspace form
- Invitation acceptance
- Workspace switcher
- Home dashboard
- Class list / class details
- Add/edit class
- Pupil roster / add/edit pupil
- Guardian details / add/link guardian / verify contact / consent
- Attendance register / review / submit / submission result / correction
- Curriculum picker / topic/objective detail
- 5E lesson plan editor / saved lesson plans
- Teaching strategy library / tip detail
- AI assistant task screen / capability state / result review
- Progress entry / pupil progress history / approval preview
- Parent messages inbox / conversation / reply
- Notification history / delivery details
- Weekly digest preview
- Sync center / pending items / conflict resolution
- Settings / language / data usage / privacy / help

Full screen behavior, states, navigation and E2E IDs are in `docs/DESIGN_NOTES.md` and `PROJECT_SPEC.md`.

## 14.3 Visual principle

Tiny's visual language should feel calm, friendly, practical and trustworthy—not like a complex school ERP. Use large readable type, low-density lists, clear status labels, strong contrast, recognizable icons and restrained color. Critical actions use full-width touch targets. Avoid complex charts, tables requiring horizontal scroll and decorative animation.

Reference image(s) have **not been supplied in this conversation**. They are a required input during consolidated intake; see `REFERENCE_ASSETS.md`. The agent must not claim a reference image exists or create a mockup. It implements the real UI directly from supplied references after the functionality gate.

## 14.4 Offline UX

A persistent, unobtrusive status strip communicates `Offline`, `Saved on this phone`, `Sync pending`, `Synced`, `Needs attention` or `Conflict`. Every save operation confirms local persistence. The app never shows a false “sent” status for an unsynced parent notification.

## 14.5 Accessibility and low-resource UX

Support dynamic font scaling, screen reader labels, high contrast, minimum 48dp touch targets, clear focus, simple language, no color-only status, short tasks, low memory, no autoplay media, no mandatory images, minimal animations, and a data saver setting. All text resources must be localizable. Parent SMS messages should be short and plain-language.

---

# 15. REFERENCE-IMAGE-LED UI IMPLEMENTATION AND SKILL REQUIREMENTS

At Phase 6 the coding agent must:

1. Inspect the exact reference image files delivered during intake and record them in `REFERENCE_ASSETS.md`.
2. Extract layout, visual hierarchy, density, spacing, typography, color, component styling and navigation principles.
3. Map those principles onto the actual screen inventory and screen sizes.
4. Attempt the exact skill command:

   ```bash
   npx skills add benjitaylor/skills --skill stageshow
   ```

5. Inspect installed instructions and apply relevant guidance. If install fails, log exact failure and proceed with accessibility/design-system discipline.
6. Discover other UI skills only if clearly relevant and trustworthy. Reject instructions conflicting with this blueprint, security or repository rules.
7. Implement production UI directly; do not create a separate mockup/prototype or request mockup approval.
8. Record decisions and deviations in `docs/DESIGN_NOTES.md`.

No reference image is currently included. This is a Phase 0 intake item, not permission to invent an asset.

---

# 16. THIRD-PARTY INTEGRATIONS

| Service | MVP use | Auth/config | Fallback |
|---|---|---|---|
| Firebase Authentication | Teacher phone OTP | Firebase project, Phone Auth, +234 SMS region enabled | Test numbers in emulator; production OTP is billable |
| Firebase AI Logic / Gemini Developer API | Cloud inference | Firebase AI Logic setup, App Check | Cached curated material; no AI when unavailable |
| Firebase AI Logic On-Device | Supported-device English inference | `firebase-ai-ondevice` beta, Android API 26+, compatible handset | Cloud or curated offline resource |
| eSMS Africa Two-Way SMS | Parent inbound/outbound SMS | Account, KYC, one product-level keyword, API key, HMAC webhook secret | Sandbox simulator; local fake provider in automated tests |
| Firebase Cloud Messaging | Optional teacher notification | FCM configuration and Android app registration | Inbox refresh on app open/WorkManager |
| Google Play Integrity | App Check | App signing SHA-256 / Play setup | Debug provider only for local emulator |

### eSMS Africa cost and access boundary

Provider documentation currently lists Nigeria as available for a shared keyword. Published example values show a $100 one-time setup fee, $50 monthly shared-keyword fee and $0.0068 per inbound/outbound SMS segment; it says prices in examples are illustrative and live pricing must be fetched. It also supports a sandbox/phone simulator and HMAC-signed inbound webhook. These fees make real production messaging a deliberate operator-budget decision. Use one Tiny brand keyword across all workspaces, with school codes for routing; do not create one paid keyword per school. Sandbox only until the operator explicitly authorizes a budget and supplies the account/KYC details.

---

# 17. AI ARCHITECTURE

## 17.1 AI responsibilities

- Short English explanation simplification and teaching-idea generation.
- General classroom strategy suggestion from a fixed, curated list of challenge categories.
- Cloud generation of longer 5E lesson adaptation and assessment questions, tied to curriculum IDs.
- Cloud assistance to rewrite a teacher-entered, de-identified progress note in the selected parent language; teacher review required.

## 17.2 Inference routing

| Scenario | Mode | Conditions |
|---|---|---|
| Short English teacher suggestion, local-first | `PREFER_ON_DEVICE` | On-device supported; cloud fallback only when online |
| Private short English task that must remain on device | `ONLY_ON_DEVICE` | Compatible device, English, foreground; otherwise show unavailable and curated resource |
| Longer lesson adaptation or multilingual generation | `ONLY_IN_CLOUD` | Online, rate limit and App Check pass |
| Short English task preferring cloud but tolerant of local fallback | `PREFER_IN_CLOUD` | Use only if the request is eligible for on-device fallback |

## 17.3 Constraints

Current Firebase documentation says Android on-device inference is experimental and requires Firebase AI Logic SDK v17.10.0+ / BoM v34.10.0+ in the older version baseline; current docs now show newer SDKs. The on-device library is separate from BoM and beta. It uses ML Kit Prompt API and requires Android API 26+. Current on-device support is single-turn text generation, selected supported devices only, validated English and Korean, foreground-only; request/input/output limits and supported devices can change. The build must check exact current docs and pin tested versions. No model download over mobile data without explicit teacher action; AICore model may require a large download and may not be available. The app must not imply that every Android device supports generative AI.

## 17.4 Prompt/data contract

- Inputs are general subject, grade, topic, objective IDs, selected challenge category and a de-identified text fragment.
- Do not pass pupil names, phone numbers, student IDs, guardian names, exact attendance records, private messages, or raw pupil report content.
- Output schema for lesson assist: `title`, `objectiveRefs[]`, `engage`, `explore`, `explain`, `elaborate`, `evaluate[]`, `materials[]`, `cautions[]`, `locale`, `sourceDisclaimer`.
- Output schema for teacher tip: `strategyTitle`, `steps[]`, `whyItMayHelp`, `whenToUse`, `limitations[]`.
- Output schema for rewritten feedback: `parentFriendlyMessage`, `homeActivity`, `locale`; reject unsupported factual additions.
- Validate JSON/typed data, max output size, supported language, subject/objective IDs, and unsafe content before showing it.
- Model output remains a draft. Teacher must approve any communication.
- No tools, web search, autonomous agents or database write tools in MVP.
- Cloud AI is accessed through Firebase AI Logic and App Check, not a secret key embedded in the APK. The Gemini Developer API is global; use only minimized de-identified context.

---

# 18. PAYMENTS / FINANCIAL LOGIC

No in-app payments, parent fees, teacher subscriptions or school payment collection in MVP. SMS gateway costs are paid by the Tiny operating entity/sponsor under an explicit budget, not automatically charged to teachers or parents. No wallet, auto-recharge or top-up is implemented. Production SMS is disabled until cost/authority acceptance. Cloud billing is subject to a project budget and alert thresholds; budget alerts are not a guaranteed hard spending cap.

---

# 19. ADMIN / OPERATIONS

No separate platform admin dashboard in MVP. School administrators use the Android app for workspace settings, membership and class assignment. Tiny operator operations are performed through restricted Firebase/Google Cloud consoles and documented runbooks. Support actions must be auditable. No operator should browse pupil records except where necessary for a documented support/security/legal incident and authorized by policy.

---

# 20. ERROR AND EDGE-CASE MATRIX

| Case | Expected handling |
|---|---|
| No internet during first login | Explain that first sign-in needs connectivity; do not create a partial account |
| Internet lost during attendance | Save local transaction and outbox; show sync pending |
| App killed after mark but before submit | Restore draft from Room; no parent alert until submit is accepted server-side |
| Duplicate sync request | Return original command receipt; no duplicate writes or SMS |
| Two devices submit same class/date | First server-accepted submission wins; second receives conflict and canonical record |
| Teacher revoked while offline | Allow locally cached viewing according to privacy controls; reject sync on reconnect; wipe local workspace data after confirmation |
| Parent phone unverified | No child-specific notification or disclosure; teacher sees pending verification |
| Parent phone maps to multiple schools | Require school code; never guess destination |
| Provider webhook replay | HMAC/timestamp/event dedupe; no duplicate message or mutation |
| Provider outage/low balance | Keep message job queued, show blocked/failed status; no endless immediate retry |
| SMS accepted but delivery callback missing | Show accepted/unknown, not delivered |
| Unicode message exceeds segment cap | Shorten through approved template/omit low-priority sections; never silently truncate facts |
| Digest data incomplete | Explicitly omit or label incomplete; never invent missing data |
| AI unsupported device | Explain unavailable; show curated resource; no app failure |
| AI local model not downloaded | Ask before download and only on Wi-Fi or explicit consent; otherwise use fallback |
| AI offline and device unsupported | No AI result; offline library remains available |
| Non-English on-device prompt | Route cloud when connected; otherwise use verified static localization/template |
| AI produces invalid JSON/fabricated claim | Reject output, retry once if appropriate, fall back to curated content; do not save/send |
| Teacher edits approved progress note | Create revision and require new approval |
| Pupil transfers class | Preserve history and date-bound class membership; future class records use new membership |
| Parent opts out | Mark consent opted out; suppress outbound non-essential messages; retain inbound handling only as policy permits |
| Multiple guardians share a phone | Dedupe by phone endpoint and content context; do not reveal a different pupil without explicit linked context |

---

# 21. TEST STRATEGY

## Unit tests

- E.164 phone normalization and Nigerian numbers.
- Workspace and membership permission evaluator.
- Class assignment access.
- Attendance validation and state transitions.
- Absence-only notification generation.
- Guardian multi-link and shared-phone routing.
- Consent/STOP/START rules.
- Digest aggregation and segment ceiling.
- Progress approval/version rules.
- Idempotency key behavior.
- AI output schema and validation.
- Locale/template fallback.

## Integration tests

- Room transaction saves domain data and outbox atomically.
- WorkManager retries and sync batching.
- Callable function validates Auth/App Check and role.
- Firestore transaction enforces one attendance session per class/date.
- Firestore security rules deny cross-workspace reads/writes.
- SMS provider adapter serializes, sends, verifies webhooks, deduplicates events and handles errors.
- Scheduled weekly digest produces deterministic records.
- AI Logic mode reports on-device/cloud result and handles unavailable path.

## End-to-end tests

1. Teacher signs up and creates independent workspace.
2. School admin creates workspace and invites teacher.
3. Teacher has multiple classes.
4. Teacher adds pupil and multiple guardians.
5. Teacher opens a lesson while offline.
6. Attendance submitted offline, app restarted, and synchronized once.
7. Only absent pupils' eligible guardians receive sandbox SMS jobs.
8. Parent inbound SMS appears in the correct teacher inbox.
9. Teacher replies and provider status updates.
10. Teacher records and approves progress; weekly digest includes only approved data.
11. Supported handset produces genuine on-device result; online cloud call produces genuine cloud result.
12. Unauthorized user cannot read or mutate another workspace.

## Security tests

IDOR, workspace/class access bypass, malformed command, role escalation, replayed webhook, invalid HMAC, duplicate inbound/outbound event, phone enumeration, OTP abuse, prompt injection in teacher note, PII prompt leakage, oversized SMS, Unicode segmentation, secret leakage, offline revoked account, concurrent attendance and storage extraction.

## Release gates

- All unit/integration tests pass.
- All critical E2E tests pass on preview/sandbox.
- No unresolved critical/high security issue.
- Hybrid evidence shows source `on-device` and `in-cloud` from actual Firebase SDK response.
- No test message reached a real parent without approved production authority.
- Data and cost budgets documented.
- App does not falsely claim offline AI on unsupported devices.

---

# 22. REPOSITORY STRUCTURE

```text
Tiny/
├── PROJECT_SPEC.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── AGENTS.md
├── AI_HANDOFF.md
├── OPERATOR_INTAKE.md
├── REFERENCE_ASSETS.md
├── DEMO_VIDEO_PLAN.md
├── README.md
├── docs/
│   ├── PROPER_VIBE_CODING_WORKFLOW.md
│   ├── SETUP.md
│   ├── CONFIGURATION.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   ├── TROUBLESHOOTING.md
│   ├── DESIGN_NOTES.md
│   ├── BUILD_LOG.md
│   ├── OPERATOR_GUIDE.md
│   ├── API.md
│   ├── DATA_MODEL.md
│   ├── SECURITY.md
│   ├── CURRICULUM_AND_LOCALIZATION.md
│   └── MESSAGING.md
├── app/
│   └── src/main/{java,res,assets}/
├── functions/
│   └── src/{callables,webhooks,jobs,domain,providers,shared}/
├── firebase/
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── firebase.json
├── tests/
│   ├── emulator/
│   ├── fixtures/
│   └── e2e/
├── gradle/
│   └── libs.versions.toml
├── .github/workflows/
└── tools/
```

The actual implementation may add conventional Android Gradle files (`settings.gradle.kts`, root `build.gradle.kts`, wrapper, `app/build.gradle.kts`, `gradle.properties`, ProGuard rules) and Firebase Functions package files. Do not add a web app or unrelated service without an approved architecture change.

---

# 23. ENVIRONMENT CONFIGURATION

Exact names are in `docs/CONFIGURATION.md`. Core variables/secrets:

| Variable/secret | Purpose | Location |
|---|---|---|
| `GCLOUD_PROJECT_ID` | Firebase/Google Cloud project | Functions only |
| `FIREBASE_REGION` | `africa-south1` | Functions config |
| `FIRESTORE_DATABASE_ID` | Default database ID | Functions config |
| `ESMS_API_KEY` | eSMS provider API access | Secret Manager only |
| `ESMS_WEBHOOK_SECRET` | HMAC-SHA256 verification secret | Secret Manager only |
| `ESMS_SERVICE_ID` | Product-level Two-Way SMS keyword service | Functions config |
| `ESMS_SENDER_KEYWORD` | `TINY` | Functions config |
| `SMS_MODE` | `sandbox` or `production`; default `sandbox` | Functions config |
| `SMS_MONTHLY_BUDGET_USD` | Approved provider spend ceiling | Functions config; zero until approved |
| `SMS_DAILY_SEGMENT_LIMIT` | Operational send limit | Functions config |
| `AI_PROVIDER` | Firebase AI Logic Gemini Developer API for MVP | Android/Firebase config |
| `AI_DAILY_CLOUD_LIMIT_PER_TEACHER` | Initial cloud request guard | Backend/Remote Config |
| `APP_CHECK_DEBUG_TOKEN` | Local testing only | Local ignored file/CI secret; never production |

Firebase's Android `google-services.json` is app configuration, not a server service-account credential; do not mistake it for a secret or commit a service-account private key. Any server credentials must remain in Secret Manager or CI secrets.

---

# 24. AUTONOMOUS IMPLEMENTATION PLAN

Phases follow the attached `PROPER_VIBE_CODING_WORKFLOW.md`; detailed checkpoints, commits and evidence are in `IMPLEMENTATION_PLAN.md`.

1. **Phase 0 — One consolidated operator intake:** inspect repository and all instructions read-only; gather missing reference images, Firebase project access, eSMS sandbox/production choice, billing boundary, physical supported Android device, deployment/testing access, demo requirements and authority. Do not modify application code until critical input and reference images are ready.
2. **Phase 1 — Repository foundation + skeletal Android UI:** establish Gradle project, app shell, routes/navigation, localization scaffolding and labelled placeholders. Build and distribute a protected debug APK through Firebase App Distribution or an equivalent protected artifact. Record exact distribution URL/build number/Git commit. This is the native equivalent of the early preview; no public web UI is added.
3. **Phase 2 — Backend/data/auth foundation:** Firebase project, Firestore database and rules, Auth, App Check, Functions 2nd gen, local Room/SQLCipher, emulator setup and health tests.
4. **Phase 3 — Core domain and APIs:** workspace, membership, class, pupil, guardian, lesson, attendance, progress, messaging, digest and sync commands; deterministic validation and idempotency.
5. **Phase 4 — Functional frontend integration:** connect screens to repositories and real backend behavior; implement local queue and status/error states.
6. **Phase 5 — Functionality gate:** all essential journeys and failure paths pass unit/integration/E2E tests using sandbox data/services; fix and rerun automatically.
7. **Phase 6 — Reference-image-led final UI:** install/inspect StageShow skill; apply references directly to real screens; no mockup phase or approval stop.
8. **Phase 7 — Frontend and documentation completeness:** responsive phone/tablet behavior, accessibility, loading/empty/error/permission states, real links, metadata/icons, README and docs.
9. **Phase 8 — Demo video:** capture native application through Android UI automation or equivalent, use free Google AI TTS if verified available, synchronize narration, captions where feasible, render/review <=180 seconds.
10. **Phase 9 — Final regression/security/release:** final tests, security pass, cost/usage check and release only within exact operator authority. Otherwise deliver verified staging/distribution build and release instructions.

At every checkpoint: implement → test → inspect → fix → commit → update `AI_HANDOFF.md` and `docs/BUILD_LOG.md` → continue automatically. No routine human approval between phases.

---

# 25. PROJECT_SPEC.md

See [`PROJECT_SPEC.md`](PROJECT_SPEC.md) for the full detailed requirements register, screen/flow contracts, acceptance criteria, progress model, localization rules, roles and edge cases. That file is the canonical product requirements source of truth.

# 26. ARCHITECTURE.md

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for component boundaries, deployment topology, offline synchronization sequence, AI routing, Firestore security boundary, data residency and technology decisions. That file is the canonical architecture source of truth.

# 27. IMPLEMENTATION_PLAN.md

See [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) for phase-by-phase tasks, dependencies, deliverables, automated checks, commit expectations, exit criteria and continuation rules.

# 28. AGENTS.md

See [`AGENTS.md`](AGENTS.md) for persistent instructions to the coding agent. These rules apply throughout implementation and override convenience-driven deviations.

# 29. AI_HANDOFF.md

See [`AI_HANDOFF.md`](AI_HANDOFF.md) for the initial pre-implementation state. It explicitly records that no app code has been written, no preview deployed, reference images pending and operator intake not completed.

# 30. FINAL PRE-IMPLEMENTATION AUDIT

| Audit item | Status |
|---|---|
| Product name, target audience and philosophy defined | PASS |
| MVP and non-goals defined | PASS |
| Teacher, school admin, parent and pupil boundaries defined | PASS |
| School/independent onboarding defined | PASS |
| Multiple classes/subjects and multiple guardians defined | PASS |
| Initial languages defined | PASS |
| Parent progress and parent-initiated SMS included | PASS |
| Attendance state machine, corrections and duplicate prevention defined | PASS |
| Local data model and server data model defined | PASS |
| Android/Firebase architecture and stack fixed | PASS |
| API endpoint contracts identified | PASS |
| Authentication/authorization model defined | PASS |
| Security controls and child data safeguards defined | PASS |
| AI routes and current platform limitations recorded | PASS |
| SMS provider and real pricing boundary identified | PASS |
| No in-app payment architecture required | PASS |
| UX route/screen structure defined | PASS |
| Reference images supplied | **PENDING — required at operator intake** |
| StageShow install/use rule included | PASS |
| Operator credentials/account access supplied | **PENDING — Phase 0 intake** |
| Firebase billing authority/cost ceiling supplied | **PENDING — Phase 0 intake** |
| eSMS account/KYC/keyword access supplied | **PENDING — sandbox first; production opt-in** |
| Supported physical Android test device confirmed | **PENDING — Phase 0 intake** |
| Early native preview/distribution strategy defined | PASS |
| Functionality gate before visual refinement defined | PASS |
| Demo video plan <=180 seconds defined | PASS |
| README/docs/repository structure defined | PASS |
| Production release authority | **NOT GRANTED by this blueprint** |

## Coding-agent start point

The exact first task is:

> Read `AGENTS.md`, `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md`, `DEMO_VIDEO_PLAN.md`, `README.md` and `docs/PROPER_VIBE_CODING_WORKFLOW.md`. Inspect the existing repository, Git state, manifests, tests, Firebase configuration and deployment configuration without modifying code. Conduct one consolidated Operator Intake/Readiness Check, record every answer and validation result in `OPERATOR_INTAKE.md`, verify that the required reference image files exist, verify Firebase/eSMS access and sandbox status, establish budget and production authority boundaries, and confirm an actual supported physical Android device for on-device AI testing. Do not begin implementation while a critical input or required reference image is missing. Once intake is complete, execute Phase 1 onward autonomously, in the prescribed order, with tests, commits, handoff updates and build-log evidence at every internal checkpoint.

**No application code is included in this package.** The package is a blueprint and implementation handoff only.

---

# RESEARCH AND SOURCE REFERENCES

The following current primary sources informed the technical and policy decisions. Re-check at implementation time because APIs, device lists and prices change.

1. [Proper Vibe Coding Workflow](docs/PROPER_VIBE_CODING_WORKFLOW.md) — operator-supplied methodology.
2. [Firebase AI Logic — Android hybrid inference](https://firebase.google.com/docs/ai-logic/hybrid/android/get-started) — SDK, inference modes, device restrictions and limitations.
3. [Firebase AI Logic — hybrid configuration](https://firebase.google.com/docs/ai-logic/hybrid/android/configuration-options) — mode selection and source reporting.
4. [ML Kit Prompt API](https://developers.google.com/ml-kit/genai/prompt/android/get-started) — Android API requirements and device/model capability.
5. [Firebase Firestore offline persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline) — offline behavior and last-write-wins conflict semantics.
6. [Android data layer architecture](https://developer.android.com/topic/architecture/data-layer) — local data source as offline-first source of truth.
7. [WorkManager constraints](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work) — network/battery/storage constraints.
8. [Firebase Functions callable functions](https://firebase.google.com/docs/functions/callable) — Auth/App Check token handling.
9. [Firebase Functions locations](https://firebase.google.com/docs/functions/locations) — supported `africa-south1` region for 2nd gen functions.
10. [Firestore locations](https://firebase.google.com/docs/firestore/locations) — supported regional locations including `africa-south1`.
11. [Firebase pricing](https://firebase.google.com/pricing) — billing plan, no-cost quotas and phone-auth SMS billing.
12. [eSMS Africa Two-Way SMS](https://docs.esmsafrica.io/docs/sms/two-way) and [pricing/keyword API](https://esmsafrica.io/docs/api-reference/two-way/keywords/) — Nigeria shared keyword, webhook and pricing.
13. [NERDC Revised Basic Education Curriculum](https://nerdc.gov.ng/content_manager/new_curriculum_home.html) — Primary 1–6 source catalog.
14. [Federal Ministry of Education curriculum announcement, 3 September 2025](https://education.gov.ng/wp-content/uploads/2025/09/FG-OVERHAULS-CURRICULUM.pdf) — revised curriculum summary.
15. [Federal Ministry of Information, 13 November 2025](https://fmino.gov.ng/fg-reaffirms-english-as-medium-of-instruction-launches-inclusive-language-policy-to-promote-national-unity/) — English as the current medium of instruction announced by the National Council on Education.
16. [Nigeria Data Protection Act 2023](https://ndpc.gov.ng/wp-content/uploads/2024/03/Nigeria_Data_Protection_Act_2023.pdf) — child data, consent and high-risk processing provisions.

---
