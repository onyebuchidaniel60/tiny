# Tiny — Data Model and Database Contract

**Cloud system of record:** Firestore.  
**Offline/local source of truth:** encrypted Room database for the active user/device cache and all unsynced changes.  
**Authority:** Cloud Functions validate and commit all shared mutations.

## 1. Modeling rules

- Tenant boundary is `workspaceId`; every workspace-owned record carries it even when nested under a workspace collection.
- Document IDs are opaque random IDs/UUIDs, not sequential or guessable.
- Phone numbers are normalized to E.164 and treated as personal data.
- `createdAt` and `updatedAt` use server timestamps. Client timestamps are retained only as untrusted event metadata.
- Mutable shared records use an integer `version` for optimistic concurrency.
- Domain mutation and corresponding outbox/audit event are written atomically wherever practical.
- No hard delete for attendance, progress approvals, messages or audit events. Use archive/withdraw/revoke and retention policy.
- Pupil records contain the minimum identity information needed to operate the class; no DOB, home address, photo, health history or biometrics in MVP.
- A parent is represented by a guardian contact profile, not an app user account.

## 2. Entity dictionary

### 2.1 `UserProfile`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `uid` | string | Yes | Firebase Auth UID; primary key |
| `displayName` | string | Yes | Teacher/admin display name |
| `phoneE164` | string | Yes | Verified Firebase Auth number; unique by Auth UID, not a public lookup |
| `appLocale` | enum | Yes | `en|ha|yo|ig`; default `en` |
| `accountStatus` | enum | Yes | `active|disabled` |
| `createdAt` | Timestamp | Yes | Server timestamp |
| `updatedAt` | Timestamp | Yes | Server timestamp |

Sensitive: phone number and user identity. Visible only to the user and authorized workspace functions/members where needed. No public profile directory.

### 2.2 `Workspace`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `workspaceId` | string | Yes | Primary key |
| `type` | enum | Yes | `school|independent` |
| `name` | string | Yes | Display name |
| `schoolCode` | string | Yes | Unique, human-readable 8-character routing code for inbound SMS; generated server-side, non-secret, never reused |
| `ownerUid` | string | Yes | Creator/current owner |
| `stateCode` | string | Yes | Nigerian state code |
| `lga` | string | Yes | Local Government Area |
| `community` | string | Yes | Community/town text |
| `timezone` | string | Yes | `Africa/Lagos` for MVP |
| `verificationStatus` | enum | Yes | `active_unverified|pending|verified|suspended`; no false verification |
| `status` | enum | Yes | `active|suspended|closed` |
| `createdAt`, `updatedAt` | Timestamp | Yes | Server timestamps |
| `version` | number | Yes | Starts 1 |

Workspace is visible to active members. `schoolCode` is shared with parents for inbound SMS routing and is not an authentication secret; rate limiting and guardian verification are still required. Generate 8 uppercase characters from an ambiguity-reduced alphabet, enforce global uniqueness transactionally and never reuse. Exact location may be personal/sensitive depending on context; no GPS coordinate collected.

### 2.3 `Membership`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `membershipId` | string | Yes | Primary key; may be deterministic from workspace+UID |
| `workspaceId` | string | Yes | FK to Workspace |
| `uid` | string | Yes | FK to UserProfile/Firebase Auth |
| `role` | enum | Yes | `school_admin|teacher` |
| `status` | enum | Yes | `invited|active|revoked|expired` |
| `assignedClassIds` | string[] | Yes | Teacher class scopes; admin may have workspace scope |
| `invitationId` | string | No | Source invitation |
| `joinedAt`, `revokedAt` | Timestamp | No | Audit timestamps |
| `createdAt`, `updatedAt` | Timestamp | Yes | Server timestamps |
| `version` | number | Yes | Optimistic concurrency |

Unique: one active membership per `(workspaceId, uid)`. `assignedClassIds` is the server-maintained permission projection for teacher class scope; updates must be transactionally consistent with class assignment metadata. Role is server-controlled. Membership is security-critical.

### 2.4 `Invitation`

Fields: `invitationId`, `workspaceId`, `phoneE164`, `tokenHash`, `classIds`, `status` (`pending|accepted|revoked|expired`), `expiresAt`, `createdByUid`, `acceptedByUid`, `createdAt`, `updatedAt`. Token hash only; single use; expiry 7 days. Raw token shown once to inviter; never logged.

### 2.5 `Classroom`

Fields: `classId`, `workspaceId`, `gradeLevel` (`P1`…`P6`), `sectionLabel`, `academicYear`, `subjectIds[]`, `assignedTeacherUids[]`, `status` (`active|archived`), `createdAt`, `updatedAt`, `version`. Unique business key: `(workspaceId, gradeLevel, sectionLabel, academicYear)` unless school has an approved exception. Teachers can see only assigned classes.

### 2.6 `Pupil`

Fields: `pupilId`, `workspaceId`, `displayName`, optional `localPupilCode`, `enrollmentStatus` (`active|transferred|archived`), `createdAt`, `updatedAt`, `version`. Class enrollment is date-bounded in `ClassEnrollment` rather than overwriting historical class association.

Do not store legal name beyond what school needs; display name may be sufficient. Avoid Date of Birth, address, photo, medical or biometric fields in MVP.

### 2.7 `ClassEnrollment`

Fields: `enrollmentId`, `workspaceId`, `pupilId`, `classId`, `startDate`, optional `endDate`, `status` (`active|ended`), `createdAt`, `endedAt`, `createdByUid`. A pupil has one active class enrollment at a time in MVP; transfers preserve prior enrollments.

### 2.8 `Guardian`

Fields: `guardianId`, `workspaceId`, `displayName` (parent/guardian contact label), `phoneE164`, `phoneEndpointHash`, `phoneLookupKeyVersion`, `preferredLocale` (`en|ha|yo|ig|pcm`), `verificationStatus` (`pending|verified|revoked`), `consentStatus` (`not_recorded|opted_in|opted_out`), `consentCategories[]` (`absence_alerts|weekly_digest|teacher_replies|school_announcements`), `consentMethod`, `consentNoticeVersion`, `consentAt`, `consentRecordedByUid`, `createdAt`, `updatedAt`, `version`. `consentStatus` is the recorded messaging preference/permission state; it does not by itself determine the controller's lawful basis under NDPA.

In MVP a `Guardian` represents one SMS contact endpoint within one workspace. Enforce unique `(workspaceId, normalized phoneE164)` so duplicate guardian rows do not create duplicate sends. One endpoint may be linked to multiple pupils. Relationship-to-pupil is stored on `PupilGuardianLink`, not here. If a household shares one handset among adults, represent it as one shared family contact endpoint (for example label `Family contact`); SMS cannot reliably distinguish which adult is holding that phone. The same phone in a different workspace has a separate workspace-scoped record and must use the school code for routing. Phone number/hash are sensitive; no public lookup.

### 2.9 `GuardianVerificationChallenge`

Fields: `challengeId`, `workspaceId`, `guardianId`, `intendedPhoneHash`, `codeHash`, `expiresAt`, `failedAttemptCount`, `maxAttempts` (5), `status` (`pending|verified|expired|locked|revoked`), `noticeVersion`, `createdByUid`, `createdAt`, `verifiedAt`. The raw one-time code is returned to the teacher once for in-person sharing and is never persisted. Expiry is 7 days, single use, at most 5 failed attempts. Do not log the code or phone.

### 2.10 `PupilGuardianLink`

Fields: `linkId`, `workspaceId`, `pupilId`, `guardianId`, `relationshipLabel`, `notificationEligible`, `startDate`, optional `endDate`, `status` (`active|ended`), `createdAt`, `endedAt`, `createdByUid`. Multiple active guardians per pupil and multiple pupils per guardian are supported. Unique active pair `(workspaceId,pupilId,guardianId)`. Different guardian phone endpoints can link to the same pupil. One endpoint may link to multiple pupils.

### 2.11 `CurriculumPack`

Fields: `packId`, `sourceOrg` (`NERDC`), `sourceTitle`, `sourceUrl`, `retrievedAt`, `sourceVersionOrDate`, `usageRightsNote`, `licenseReviewStatus`, `gradeLevel`, `subjectId`, `objectiveIds[]`, `locale`, `contentHashSha256`, `packVersion`, `status` (`draft|verified|published|retired`). Each seeded curriculum record includes provenance and review evidence.

### 2.12 `LessonPlan`

Fields: `lessonPlanId`, `workspaceId`, `classId`, `gradeLevel`, `subjectId`, `topic`, `objectiveIds[]`, `durationMinutes`, `materials[]`, `priorKnowledge`, `engage`, `explore`, `explain`, `elaborate`, `evaluate[]`, `locale`, `createdByUid`, `status` (`draft|saved|archived`), `sourcePackVersion`, `createdAt`, `updatedAt`, `version`. Teacher content may be private to author or shared with assigned co-teachers; MVP default is workspace class visibility to assigned teachers.

### 2.13 `TeachingResource`

Fields: `resourceId`, `category`, `title`, `body`, `locale`, `sourceName`, `sourceUrlOrCitation`, `usageRights`, `reviewedBy`, `reviewedAt`, `packVersion`, `status` (`published|retired`). Curated resource content is read-only to teacher clients; downloaded into Room.

### 2.14 `AttendanceSession`

Fields: `sessionId`, `workspaceId`, `classId`, `schoolDate` (`YYYY-MM-DD`), `submittedByUid`, `submittedAt`, `rosterVersion`, `status` (`submitted|amended`), `version`, `clientSessionId`. Unique `(workspaceId,classId,schoolDate)`. Once submitted, immutable; corrections represented separately.

### 2.15 `AttendanceEntry`

Fields: `attendanceEntryId`, `workspaceId`, `sessionId`, `classId`, `pupilId`, `status` (`present|absent|late`), `originalStatus`, `currentVersion`, `createdAt`, `updatedAt`. Unique `(sessionId,pupilId)`. Correction history stored in `AttendanceAmendment`.

### 2.16 `AttendanceAmendment`

Fields: `amendmentId`, `workspaceId`, `attendanceEntryId`, `oldStatus`, `newStatus`, `reason`, `requestedByUid`, `approvedByUid` if required, `status` (`pending|accepted|rejected`), `expectedVersion`, `createdAt`, `resolvedAt`. Append-only.

### 2.17 `ProgressEntry`

Fields: `progressEntryId`, `workspaceId`, `pupilId`, `classId`, `periodStart`, `periodEnd`, `subjectId`, optional `objectiveId`, `indicator` (`doing_well|developing|needs_support|not_assessed`), optional `teacherNote` (300 chars), optional `homeActivity` (240 chars), `createdByUid`, `currentRevisionNumber` (starts at 1), `approvalStatus` (`draft|approved|withdrawn`), optional `approvedRevisionNumber`, optional `approvedByUid`, optional `approvedAt`, optional `lastSharedRevisionNumber`, `createdAt`, `updatedAt`, `version`. No numeric grade/rank/diagnosis fields in MVP.

Unique logical key for the current period record: `(workspaceId,pupilId,subjectId,periodStart,periodEnd)`. `ProgressEntry` is the current snapshot; immutable revision snapshots are stored in `ProgressRevision`. An edit creates the next revision and resets `approvalStatus` to `draft`, clearing `approvedRevisionNumber`, `approvedByUid` and `approvedAt`. A digest may use only the exact current revision where `approvalStatus=approved` and `approvedRevisionNumber=currentRevisionNumber`. `lastSharedRevisionNumber` records the last revision delivered to a parent.

### 2.18 `ProgressRevision`

Fields: `revisionId`, `workspaceId`, `progressEntryId`, `revisionNumber`, `pupilId`, `classId`, `periodStart`, `periodEnd`, `subjectId`, optional `objectiveId`, `indicator`, optional `teacherNote`, optional `homeActivity`, `changedByUid`, optional `changeReason`, `createdAt`. Immutable after creation. Unique `(workspaceId,progressEntryId,revisionNumber)`. The snapshot contains only the fields needed to reconstruct exactly what the teacher authored and approved; no AI-generated assessment is stored as a teacher observation.

### 2.19 `Conversation`

Fields: `conversationId`, `workspaceId`, `guardianId`, optional `pupilId`, `classId`, `channel` (`sms`), `status` (`open|waiting_teacher|waiting_parent|resolved`), `lastMessageAt`, `lastMessageDirection`, `createdAt`, `updatedAt`, `version`. A guardian with multiple children can have one school conversation plus child-linked messages; when a message is about a specific child, linkage must be explicit/confirmed.

### 2.20 `Message`

Fields: `messageId`, `workspaceId`, `conversationId`, `direction` (`inbound|outbound`), `senderType` (`guardian|teacher|system`), optional `senderUid`, optional `guardianId`, optional `pupilId`, `body`, `locale`, `provider`, optional `providerMessageId`, `status` (`received|queued|accepted|delivered|failed|unknown|suppressed`), `createdAt`, `updatedAt`. Access restricted to authorized conversation participants/teachers. Message text can contain sensitive pupil information; never include in general logs or AI prompts.

### 2.21 `NotificationJob`

Fields: `notificationJobId`, `workspaceId`, `type` (`absence|correction|weekly_digest|teacher_reply|announcement`), `guardianId`, optional `phoneEndpointHash`, `pupilIds[]`, `locale`, `templateId`, optional short `responseReference`, `contentPayload`, `idempotencyKey`, `segmentEstimate`, `status` (`queued|sending|accepted|delivered|failed|unknown|suppressed`), `providerMessageId`, `attemptCount`, `nextAttemptAt`, `createdAt`, `updatedAt`. Sensitive content is access restricted; phone number fetched from guardian profile at send time, not copied into broad logs.

### 2.22 `WeeklyDigest`

Fields: `digestId`, `workspaceId`, `guardianId`, `periodStart`, `periodEnd`, `sourceRecordIds[]`, `locale`, `renderedTemplateId`, `segmentCount`, `approvalState`, `status`, `idempotencyKey`, `providerMessageId`, `createdAt`, `sentAt`. Unique `(workspaceId,guardianId,periodStart,periodEnd)`.

### 2.23 `CommandReceipt`

Fields: `idempotencyKey`, `uid`, `workspaceId`, `commandType`, `payloadHash`, `outcome`, `resultRef`, `errorCode`, `createdAt`, `expiresAt`. Unique idempotency key. Retention period must be approved; preserve attendance-related receipts at least as long as retry and audit requirements.

### 2.24 `AuditEvent`

Fields: `auditEventId`, `workspaceId`, `actorType`, `actorUid`, `action`, `resourceType`, `resourceId`, `reason`, `beforeSummary`, `afterSummary`, `correlationId`, `createdAt`. No access tokens, secret values or full message body in audit summary. Append-only.

### 2.25 `ProviderWebhookReceipt`

Fields: `receiptId`, `provider`, `providerEventId`, `payloadHash`, `signatureValid`, `eventType`, `processedStatus`, `receivedAt`, `processedAt`, `errorCode`. Unique `(provider,providerEventId)`; if provider gives no stable ID, use a carefully constructed payload hash plus time bucket and document the limitations.

### 2.26 `AIUsageEvent`

Fields: `aiEventId`, `uid`, `workspaceId`, `taskType`, `requestedMode`, `actualInferenceSource`, `modelFamily`, `locale`, `inputLengthBucket`, `outputLengthBucket`, `status`, `createdAt`. No prompt or output content and no pupil identifiers. Use for cost/capability telemetry.

## 3. Relationships

```text
UserProfile 1 ── * Membership * ── 1 Workspace
Workspace 1 ── * Classroom
Workspace 1 ── * Pupil
Pupil 1 ── * ClassEnrollment * ── 1 Classroom
Pupil * ── * Guardian (through PupilGuardianLink)
Guardian 1 ── * GuardianVerificationChallenge
ProgressEntry 1 ── * ProgressRevision
Classroom 1 ── * LessonPlan
Classroom 1 ── * AttendanceSession 1 ── * AttendanceEntry * ── 1 Pupil
AttendanceEntry 1 ── * AttendanceAmendment
Pupil 1 ── * ProgressEntry
Guardian 1 ── * Conversation 1 ── * Message
Guardian 1 ── * NotificationJob / WeeklyDigest
Workspace 1 ── * AuditEvent / CommandReceipt / ProviderWebhookReceipt
UserProfile 1 ── * AIUsageEvent
```

## 4. Firestore collection layout

Use tenant-nested paths to make scoping explicit:

```text
users/{uid}
workspaces/{workspaceId}
  members/{uid}
  invitations/{invitationId}
  classes/{classId}
  pupils/{pupilId}
  enrollments/{enrollmentId}
  guardians/{guardianId}
  guardianPhoneKeys/{phoneEndpointHash}
  pupilGuardianLinks/{linkId}
  guardianVerificationChallenges/{challengeId}
  curriculumPacks/{packId}
  lessonPlans/{lessonPlanId}
  teachingResources/{resourceId}
  attendanceSessions/{sessionId}
  attendanceEntries/{entryId}
  attendanceAmendments/{amendmentId}
  progressEntries/{progressEntryId}
  progressEntries/{progressEntryId}/revisions/{revisionId}
  conversations/{conversationId}
    messages/{messageId}
  notificationJobs/{jobId}
  weeklyDigests/{digestId}
  commandReceipts/{idempotencyKey}
  auditEvents/{auditEventId}
providerWebhookReceipts/{receiptId}
aiUsageEvents/{aiEventId}
```

The provider webhook routing path must resolve the workspace from the supplied school code, then compute the workspace-scoped phone endpoint key and query only that workspace. Use `phoneEndpointHash = HMAC-SHA256(serverSecret, workspaceId + "|" + normalizedE164)`; keep the HMAC secret in Secret Manager and never in Android. This avoids a global phone-number directory and prevents cross-workspace correlation. The normalized E.164 phone number is stored in a server-restricted field for delivery and authorized teacher display; never put it in general logs. If a provider event does not include a school code, return a generic non-enumerating routing response rather than searching all workspaces.

## 5. Important indexes and uniqueness

Firestore does not provide arbitrary relational unique constraints. Enforce business uniqueness with deterministic document IDs or transactionally guarded unique-key documents:

- Membership: `workspaceId_uid`.
- School code: globally unique, generated server-side, non-secret and never reused.
- Class: workspace + grade + section + academicYear.
- Active enrollment: workspace + pupil (one active class in MVP).
- Guardian endpoint: workspace + normalized E.164 phone; derive a server-only `guardianPhoneKeys/{phoneEndpointHash}` unique-key document using the workspace-scoped HMAC. Store the key version for rotation. Changing a phone creates a new endpoint and re-verification; do not mutate a verified endpoint's number in place.
- Active guardian link: workspace + pupil + guardian.
- Progress current-period record: workspace + pupil + subject + period (unique logical key).
- Progress revision: workspace + progress entry + revision number (append-only unique key).
- Attendance session: workspace + class + date.
- Attendance entry: session + pupil.
- Digest: workspace + guardian + reporting period.
- Provider event: provider + event ID.
- Command receipt: idempotency key (also store uid/workspace and payload hash).

Add composite indexes only for actual bounded queries: class + status, pupil + date range, conversation + lastMessageAt, guardian + period, status + nextAttemptAt for jobs, workspace + createdAt for audit. Record deployed index definitions in `firestore.indexes.json` and this file.

## 6. Visibility classification

| Data | Visibility |
|---|---|
| Workspace name, community and class labels | Active workspace members |
| User profile | Owner and limited workspace membership display |
| Pupil name/enrollment | Assigned teachers and authorized school admins only |
| Guardian name/phone/locale/consent | Assigned teachers and authorized school admins; service-side routing only |
| Attendance | Assigned teachers and admins; parent receives only own linked pupil's approved summary via SMS |
| Progress note | Author and authorized teachers/admin; parents only after approval and only through their channel |
| Lesson plans/resources | Assigned teachers; workspace policy controls sharing |
| Conversation/message body | Authorized teachers for associated class/workspace; service runtime; not public |
| Audit event | Restricted school admin/operator as policy allows |
| Provider credentials/webhook secrets | Secret Manager only; never Firestore/client |
| AI usage metadata | Restricted operator aggregate; no prompt or pupil data |

## 7. Local Room model

Room mirrors only required tenant records and adds device/sync metadata:

- `localId`/remote ID mapping where needed.
- `syncState`: `localOnly|pendingSync|synced|conflict|needsAttention`.
- `serverVersion` and `lastSyncedAt`.
- `deletedLocallyAt` tombstone for authorized local removals.
- `isSensitive` classification for secure local handling.
- Outbox command and payload hash.

All local writes occur in Room transactions. Store SQLCipher key using Android Keystore-backed key material. Do not store secrets or plain API keys in DataStore or Room.

## 8. Retention and deletion

Final retention periods are not yet selected because the school/Tiny controller relationship and applicable education record obligations need legal review. The implementation must support archival, correction, revocation and scheduled purge mechanisms, but must not run destructive retention jobs until the operator approves the written schedule. Account deletion must not silently destroy school records owned by a workspace; define a controlled transfer/retention process before pilot.
