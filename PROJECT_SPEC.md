# Tiny — Product Specification (MVP)

**Version:** 1.0  
**Status:** Implementation baseline  
**Audience:** Product owner, implementation agent, QA and pilot operators.

## 1. Product definition

Tiny is an offline-first Android teacher-support and parent-engagement platform for rural primary schools. It helps teachers prepare lessons, access practical teaching support, manage classes and attendance, record pupil progress and communicate with parents. Parents use SMS, not an app. Pupils have no accounts or interface.

Tiny is small in requirements, not in ambition: the product minimizes device, data, connectivity, literacy and infrastructure barriers. It is designed for teachers' existing Android smartphones and parents' basic mobile phones.

## 2. Confirmed decisions

- Name: Tiny (TIE-nee).
- Platform: native Android, teacher app only.
- Workspace onboarding: school-managed or individual teacher-created.
- Independent teachers have full core teacher functionality.
- Teachers can manage multiple classes and subjects.
- A pupil can have multiple guardian contact endpoints; one endpoint may be linked to multiple pupils. Within one workspace, the same normalized phone number is stored once to prevent duplicate sends; a shared household handset is treated as one contact endpoint.
- Teacher UI languages: English (`en`), Hausa (`ha`), Yoruba (`yo`), Igbo (`ig`).
- Parent communication languages: English, Hausa, Yoruba, Igbo and Nigerian Pidgin (`pcm`).
- Curriculum: NERDC Revised Basic Education Curriculum, Primary 1–6.
- Parent immediate attendance notifications: absences only.
- Parent weekly digests: attendance plus approved progress/achievement/school information.
- Parents can initiate free-text SMS communication.
- No student app, no parent app, no voice calling in MVP.

## 3. Personas and jobs to be done

### Teacher

“Help me prepare and manage my classes, keep useful teaching resources available offline, and communicate with parents without spending my day on administration.”

### Parent/guardian

“Help me understand how my child is doing and contact the teacher without needing a smartphone, internet or a trip to school.”

### School administrator

“Help me organize teachers, classes and access without needing a full school ERP.”

## 4. Functional requirements register

### Identity and workspace

**FR-001 — Teacher sign-in**  
Actor: teacher/admin. Input: Nigerian phone number and OTP. Preconditions: network available. System: Firebase Phone Auth; normalize E.164; enforce OTP rate limits. Success: authenticated Firebase UID. Failure: invalid/expired OTP, quota, no network or blocked region produces clear retry message. Acceptance: test phone can sign in in emulator; real sign-in restricted to approved +234 region; no OTP values logged.

**FR-002 — Create workspace**  
Actor: authenticated teacher. Input: workspace type, name, state, LGA, community. System: callable creates workspace and first membership atomically. `school` creator is `school_admin`; `independent` creator is owner/teacher. Acceptance: retry with same idempotency key creates one workspace only; `verificationStatus` is not falsely set to verified.

**FR-003 — Invite/revoke teacher**  
Actor: school admin. Input: normalized phone, invitation expiry. System: create one-time 7-day invitation, link it to workspace, accept only after phone auth, mark used. Revoke blocks future server commands. Acceptance: expired/revoked/used invitation cannot be accepted twice.

**FR-004 — Multiple workspaces**  
Actor: user with multiple memberships. System: show workspace switcher; every repository operation is scoped to active workspace. Acceptance: switch workspaces without leaking previously selected workspace records; user can be a teacher in several workspaces.

### Class and pupil management

**FR-005 — Multiple classes/subjects**  
Actor: teacher/admin. Input: grade P1–P6, class label, academic year, current curriculum subject IDs and teacher assignments. Acceptance: one teacher can manage more than one class and multiple subject plans; unassigned class is not visible to ordinary teacher.

**FR-006 — Pupil registration**  
Actor: assigned teacher/admin. Required: display name, class, enrollment status. Optional: local pupil code. Do not collect date of birth, address, health history or photo in MVP. Acceptance: unique pupil record per workspace; duplicate detection is advisory (not name-only hard block); archived pupil is excluded from new attendance.

**FR-007 — Guardian links**  
Actor: teacher/admin. Create guardian profile and link it to pupil; multiple guardians per pupil and multiple pupils per guardian are supported. Acceptance: no artificial single-parent constraint; link/unlink actions are audited and date-bound.

**FR-008 — Guardian verification and consent**  
Actor: teacher and guardian. Record guardian's phone, preferred language, relationship, contact verification and consent state. `pending` contacts cannot receive child-specific content. Guardian verification in MVP uses a teacher-generated, cryptographically random one-time code shared in person after explaining the school communication notice. Parent sends `TINY <school-code> JOIN <code>` from the phone to be registered. Code is bound to workspace, guardian and intended-phone hash; it expires after 7 days, is single-use and allows at most 5 failed attempts. Store only a strong code hash. A successful JOIN proves possession of the sender handset and records affirmative opt-in for the message categories described in the notice; the controller/DPO must approve lawful basis and notice wording before pilot. It does not independently prove legal guardianship; the school/teacher verifies the relationship through its normal school process. If parent cannot send the confirmation SMS, the contact remains pending and receives no child-specific messages. STOP suppresses outbound non-essential messages; consent changes are recorded.

### Localization and curriculum

**FR-009 — Teacher UI localization**  
Provide English, Hausa, Yoruba and Igbo resource strings from launch. Language selection is per teacher. Fallback for missing UI string is English, but the language selection screen must be explicit.

**FR-010 — Parent SMS localization**  
Use per-guardian locale: `en`, `ha`, `yo`, `ig`, `pcm`. Use only human-reviewed approved templates for critical alerts. Cloud translation may help draft but cannot auto-send unreviewed critical content. If template missing, apply explicit school-configured fallback; never silently send English.

**FR-011 — NERDC curriculum**  
Catalog Primary 1–6 and version all packs. Subject and objective IDs come from official current NERDC curriculum files. The agent must inspect the official grade-specific source and record URL, title, version/date, retrieval date, content usage rights and SHA-256. Do not guess subject names or objectives. Do not copy protected textbook chapters. Seed a limited verified subset for the MVP and clearly label pack coverage.

**FR-012 — 5E lesson planner and teaching library**  
Offline fields: grade, subject, topic, objective, duration, materials, prior knowledge and Engage/Explore/Explain/Elaborate/Evaluate sections. Teacher can save, edit, duplicate, archive. Curated strategy cards are bundled for offline use. AI is optional and never required to load a plan.

### Attendance and sync

**FR-013 — Offline attendance draft**  
Teacher opens a class, sees active pupils and marks present/absent/late. Data saved to Room. Acceptance: process remains available with airplane mode on and after app restart.

**FR-014 — Submit attendance**  
All active pupils require status before submit. Teacher reviews and submits. Submission creates immutable local event and idempotency key. Acceptance: no SMS job before server accepts; incomplete register cannot submit.

**FR-015 — Local outbox**  
Domain mutation and outbox item saved atomically in Room. Each command carries `idempotencyKey`, `commandType`, `schemaVersion`, `payload`, `clientCreatedAt`, `expectedVersion` when needed, and sync state. Acceptance: app termination does not lose pending commands.

**FR-016 — WorkManager sync**  
Network-constrained background worker; manual Sync Now; user preference can restrict automatic background sync to unmetered Wi-Fi. Acceptance: retryable failures use exponential backoff; permanent rejections go to Needs Attention.

**FR-017 — Server authoritative validation**  
Server checks membership, role, class assignment, workspace, ownership, state, request schema, duplicate key and version. Acceptance: tampered client-supplied IDs cannot cross workspace boundaries.

### Parent communication

**FR-018 — Absence-only alert**  
After attendance session commit, create notification jobs only for `absent` entries. Present and late do not trigger immediate message. Acceptance: integration test verifies zero messages for present/late.

**FR-019 — Multiple guardian notifications**  
Notify every verified, linked, opted-in guardian. Deduplicate if a shared phone endpoint receives equivalent notification for same pupil/session. If one guardian number is linked to multiple pupils, each message must remain scoped and not disclose unrelated pupils.

**FR-020 — Parent-initiated inbound SMS**  
Accept message on global Tiny shared keyword. First contact uses `TINY <school-code> <message>`. Absence-alert menu replies include the unique short reference in the reply (e.g. `1 A7KD`); bare replies are routed only if exactly one eligible open alert exists. HMAC verification, provider event dedupe, normalized sender match and tenant routing are mandatory. Unknown/ambiguous senders receive no child details.

**FR-021 — Teacher inbox/reply**  
Teacher sees conversations only for authorized workspace/classes. Reply is queued; status values distinguish queued, accepted, delivered, failed and unknown. Acceptance: no personal teacher phone number exposed.

**FR-022 — Basic pupil progress**  
Record a period, subject, objective (optional where content mapping is not available), indicator (`doing_well`, `developing`, `needs_support`, `not_assessed`), optional factual note up to 300 characters and optional practical home activity up to 240 characters. Acceptance: no grades/ranks/diagnosis; one entry per pupil+subject+period is upserted with revision/audit.

**FR-023 — Progress approval**  
Only authoring teacher or school admin can approve. Editing after approval creates new revision and resets approval. Acceptance: unapproved/withdrawn entry never appears in guardian digest.

**FR-024 — Weekly digest**  
Run Friday 15:00 Africa/Lagos. Group by guardian + workspace + period; combine siblings in same workspace; include only approved, available data. Target max two SMS segments. No automatic AI summary of child records. Acceptance: deterministic test fixture produces expected localized message and is not duplicated on retry.

### Hybrid AI

**FR-025 — Hybrid inference**  
Use Firebase AI Logic with on-device and cloud model. On-device supported tasks are short, single-turn English tasks on supported devices. Cloud tasks cover longer structured lesson adaptation and local-language assistance. Acceptance: test evidence captures actual source from SDK response for one physical on-device call and one cloud call.

**FR-026 — Capability and source**  
Display when on-device capability is unavailable, downloading, ready, or request failed; model download must be opt-in and Wi-Fi-preferred. Show the actual inference source in the result details/developer evidence. Acceptance: unsupported phone uses curated resource and does not claim local inference.

**FR-027 — AI privacy**  
No names, phone numbers, pupil identifiers or identifiable records in AI requests. AI output is a draft and validated before display; teacher approval required before parent sharing. Acceptance: tests verify PII redaction and no automatic database write.

### Security and operations

**FR-028 — Access controls**  Firestore rules deny unauthenticated, nonmember and cross-workspace access; direct client writes denied to authoritative collections. Callable commands require Auth + App Check. Acceptance: emulator tests include IDOR attempts.

**FR-029 — Delivery reports**  Provider callbacks update message status only after signature verification and dedupe. Missing callback remains unknown; not delivered.

**FR-030 — Voice**  Out of scope for MVP. No voice-call code or provider spend.

## 5. Acceptance criteria by end-to-end journey

### Workspace

- School-admin and independent routes both create correctly scoped workspace.
- Same authenticated user can switch between workspaces.
- Admin can invite/revoke; revoked membership fails server writes.

### Offline lessons/attendance

- Downloaded curriculum/teaching resources open in airplane mode.
- Attendance can be completed, submitted locally, app terminated/reopened and later synced exactly once.
- Class/date duplicate submission returns conflict without overwriting.

### Parent messaging

- Only absent entries create immediate absence jobs.
- Only verified/consented guardians are messaged.
- Inbound webhook signature required; replay does not create duplicate conversation message.
- Ambiguous phone/school context asks for code and sends no child data.

### Progress

- Teacher can save draft offline, sync and approve it.
- Unapproved record excluded from digest.
- Edited approved record requires reapproval.

### AI

- One English on-device task runs on supported physical handset and SDK says on-device.
- One cloud task is verified and SDK says in-cloud.
- Unsupported handset shows safe fallback.
- Non-English task is never silently sent through unsupported on-device path.

## 6. Non-functional requirements and measurable targets

These are initial engineering targets to validate on physical low-cost devices, not claims about already-tested performance:

- App install package target: <=35 MB for release APK/AAB base payload, excluding system-managed Gemini Nano model; investigate any larger library impact.
- Core UI cold start target: <=5 seconds on agreed lowest-spec pilot handset.
- Basic register scroll/mark interaction: no network wait; target UI response <=200 ms under normal local operation.
- Offline app usage: essential screens usable after initial sign-in and initial sync.
- Background sync: no mobile-data use if user has chosen Wi-Fi-only; manual Sync Now requests confirmation on metered data.
- No mandatory images, video or audio downloads.
- Core app functions on Android API 26+ regardless of on-device model support.
- Local database uses SQLCipher; keys protected by Android Keystore.
- Core offline functions do not require Google Play services once the teacher has authenticated and provisioned local data. However, the MVP's connected production operations use Firebase App Check with Play Integrity and therefore require a compatible Google Play environment; non-GMS/non-attestable phones are not fully supported for cloud sync in this fixed MVP. Phase 0 must inventory target phones and report the actual coverage before pilot. Do not bypass App Check to broaden compatibility.

## 7. Explicit design/quality rules

- The teacher should be able to mark a class register with minimal taps.
- A progress observation is not mandatory for every pupil every week; do not create a new administrative burden.
- Progress indicator is instructional feedback, not a formal grade.
- Parent notifications must be short, specific, useful and localized.
- Parent communication is asynchronous, not real-time chat.
- No child-identifying details on push lock screens.
- Local data is never shown as cloud-synced until server acknowledgement.
- No AI feature blocks a non-AI workflow.
