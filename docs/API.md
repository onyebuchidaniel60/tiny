# Tiny — API Specification

**Implementation status (26 November 2026):** Callable/webhook contracts and type schemas are implemented and emulator-tested for the main workspace/class/pupil/guardian/attendance/progress/message flows. `syncCommands` applies `pupil.register`, `attendance.submit`, `progress.upsert`, `progress.approve` and `message.reply` through the same validated callable handlers, with per-command receipts and idempotent replay. The Android client still uses a mock sync engine because no Firebase project is configured. Bootstrap/pull-change endpoints and production-hardening remain incomplete. Do not treat this as production-ready API completion.

**Version:** 1.0  
**Backend:** Firebase Cloud Functions 2nd gen, TypeScript, Node.js 22, region `africa-south1`.  
**Canonical design:** Callable commands are the only client mutation interface for shared records. Firestore direct client writes to authoritative collections are denied.

## 1. Conventions

### Authentication

All callable operations require:
- A valid Firebase Auth ID token (`request.auth.uid`).
- A valid App Check token in deployed environments.
- A current active workspace membership with the specific permission.

The client must not send its own role as proof. Workspace membership and class assignment are loaded and validated server-side.

Provider webhook HTTP endpoints do not use Firebase Auth; they require provider HMAC verification, timestamp/replay checks, event deduplication and strict schema validation.

### Common request envelope

Mutation callables accept:

```json
{
  "workspaceId": "ws_...",
  "idempotencyKey": "uuid-v4",
  "schemaVersion": 1,
  "payload": {}
}
```

`workspaceId` is an untrusted scope hint and must be validated against the authenticated user. `idempotencyKey` is unique per command. Commands with the same key and same canonical payload return the prior outcome. Reusing a key with a different payload returns `IDEMPOTENCY_KEY_REUSED`.

### Common success envelope

```json
{
  "ok": true,
  "commandId": "uuid",
  "outcome": "accepted",
  "serverTime": "2026-11-25T00:00:00.000Z",
  "data": {}
}
```

Possible command outcomes: `accepted`, `alreadyApplied`, `conflict`, `rejected`, `retryable`. Callable infrastructure errors may also use standard Firebase `HttpsError` codes.

### Common application error envelope

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request could not be processed.",
    "retryable": false,
    "fieldErrors": {
      "payload.phoneE164": "Enter a valid phone number."
    },
    "correlationId": "opaque-id"
  }
}
```

Messages must be safe and non-enumerating. Do not reveal whether an untrusted phone number is linked to a pupil or which workspace it belongs to.

### Limits

- Request body max: 256 KiB for normal callables; smaller feature-level caps apply.
- `syncCommands`: maximum 20 commands per request.
- Message text: max 1,000 Unicode code points inbound; outbound template limits enforced by segment policy.
- Progress observation note: 300 chars; home support activity: 240 chars.
- Class roster command: max 100 pupil mutations per batch; larger imports use bounded pages.
- All list endpoints use bounded pagination (default 25, max 100).

## 2. Callable endpoint catalogue

The following names are callable function names (not REST paths). Every mutation takes the common envelope unless noted. Typed request schemas use Zod in Functions; response fields are stable and versioned.

| Callable | Actor | Purpose | Idempotent / special |
|---|---|---|---|
| `createWorkspace` | Auth teacher | Create school or independent workspace and owner membership atomically | Required idempotency key |
| `createInvitation` | School admin | Create 7-day one-use teacher invitation | Required |
| `acceptInvitation` | Auth teacher | Accept one-time invitation | Required; token consumed atomically |
| `revokeMembership` | School admin | Revoke a member | Required; audit event |
| `joinWorkspace` | Auth teacher | Join through a valid invite; explicit acceptance | Required |
| `createClassroom` | Admin/teacher with permission | Create a Primary 1–6 class | Required |
| `updateClassroom` | Admin/assigned teacher | Change class metadata with `expectedVersion` | Optimistic concurrency |
| `assignTeacherToClass` | School admin | Assign/remove teacher from class | Required; audit |
| `registerPupil` | Admin/assigned teacher | Register pupil with minimal fields | Required |
| `updatePupil` | Admin/assigned teacher | Update pupil display name/enrollment state | `expectedVersion` |
| `archivePupil` | Admin/assigned teacher | Archive/transfer pupil; retain historical records | Required; audit |
| `upsertGuardian` | Admin/assigned teacher | Create/update guardian profile | Required |
| `linkGuardianToPupil` | Admin/assigned teacher | Create date-bounded pupil/guardian relationship | Required |
| `unlinkGuardianFromPupil` | Admin/assigned teacher | End relationship; do not delete history | Required; audit |
| `requestGuardianVerification` | Admin/assigned teacher | Start one-time verification flow | Rate limited |
| `updateGuardianPreferences` | Admin/assigned teacher or verified inbound command | Update locale/consent/channel | Audit; consent transitions constrained |
| `submitAttendanceSession` | Assigned teacher/admin | Finalize one whole class/date register | Atomic unique session, idempotent |
| `correctAttendanceEntry` | Original submitter/admin | Append correction with reason | `expectedVersion`, audit |
| `createLessonPlan` | Assigned teacher/admin | Save lesson plan | Idempotent |
| `updateLessonPlan` | Author/assigned teacher | Edit a lesson plan | `expectedVersion` |
| `createProgressEntry` | Assigned teacher/admin | Create draft progress record | Idempotent |
| `updateProgressEntry` | Author/assigned teacher/admin | Revise draft/approved entry | `expectedVersion`; resets approval |
| `approveProgressEntry` | Authoring teacher/admin | Approve current revision for parent sharing | Required; audit |
| `withdrawProgressEntry` | Author/admin | Withdraw from future sharing | Required; audit |
| `sendTeacherMessage` | Authorized teacher/admin | Queue outbound reply to a known conversation | Idempotent; provider job only |
| `resolveConversation` | Authorized teacher/admin | Resolve/reopen conversation | Required |
| `createSchoolAnnouncement` | School admin | Create approved digest announcement | Idempotent; MVP may omit UI if no time |
| `syncCommands` | Auth teacher/admin | Submit bounded offline outbox commands | Per-command idempotency; max 20 |
| `getBootstrapData` | Auth teacher/admin | Download minimum workspace/class data for local use | Read; bounded |
| `getSyncChanges` | Auth teacher/admin | Pull records changed since server cursor | Read; class-scoped |
| `getMessageInbox` | Authorized teacher/admin | Retrieve paginated conversations/messages | Read; workspace/class scoped |
| `getAttendanceHistory` | Assigned teacher/admin | Retrieve class/pupil attendance history | Read; bounded |
| `getProgressHistory` | Assigned teacher/admin | Retrieve pupil progress history | Read; bounded |
| `getAiUsageStatus` | Auth teacher | Return non-PII usage/capability info | Read; rate-limited |

## 3. Selected request and response contracts

### 3.1 `createWorkspace`

Request `payload`:

```json
{
  "type": "independent",
  "name": "Kofar Demo Primary",
  "stateCode": "NG-KD",
  "lga": "Example LGA",
  "community": "Example Community",
  "timezone": "Africa/Lagos"
}
```

`type` is `school` or `independent`. A school workspace creator becomes `school_admin`; an independent creator becomes workspace owner and `teacher`. Workspace starts `active_unverified`. Server generates a globally unique 8-character uppercase `schoolCode` using an ambiguity-reduced alphabet, returns it with the workspace summary and membership, and never accepts a client-selected school code. The code is a routing identifier, not a secret; enforce inbound rate limits and guardian proof.

### 3.2 `createInvitation`

Request `payload`:

```json
{
  "teacherPhoneE164": "+2348012345678",
  "classIds": [],
  "expiresInDays": 7
}
```

Backend permits `expiresInDays` only as 7 in MVP. Store token hash, not plaintext. Return one-time invite code/URI for operator/teacher to share. Do not expose invitation records to non-admins.

### 3.3 `registerPupil`

Request `payload`:

```json
{
  "classId": "class_...",
  "clientPupilId": "uuid",
  "displayName": "Sample Pupil",
  "localPupilCode": "P4-014"
}
```

No DOB, home address, photo, health or biometric fields in MVP. `localPupilCode` is optional and not a global identifier. Server checks class belongs to workspace and actor is assigned/admin.

### 3.4 `upsertGuardian` and `linkGuardianToPupil`

`upsertGuardian` accepts `displayName`, `phoneE164` and `preferredLocale`. Normalize the phone to E.164 on the server. A guardian is a workspace-scoped SMS contact endpoint, not a guaranteed unique adult identity. The server computes a workspace-scoped HMAC lookup key and transactionally enforces one endpoint per `(workspaceId, normalized phoneE164)`. If the endpoint already exists, return that record and apply only explicitly supplied editable fields with `expectedVersion`; do not create a second record. A household-shared phone is represented once with a neutral label such as `Family contact`.

Changing an endpoint's phone number is not an in-place update. Create a new pending endpoint, verify possession and consent for the new number, then let an authorized teacher/admin move or recreate pupil links. Revoke the old endpoint as appropriate and retain its historical messages/audit trail. Never send child-specific information to the new number before verification and valid consent state.

`linkGuardianToPupil` requires `pupilId`, `guardianId`, `relationshipLabel`, `notificationEligible` and optional effective dates. The relationship label belongs to the pupil-contact relationship because one contact endpoint may represent a shared household handset or be linked to multiple pupils. Server verifies that pupil and guardian share the workspace, the actor has class permission, and no active duplicate link exists.

### 3.5 Guardian verification code

`requestGuardianVerification` creates a cryptographically random one-time code bound to `(workspaceId, guardianId, intendedPhoneHash)` and a recorded consent-notice version. The code is displayed once to the teacher for in-person sharing; it is not sent to the unverified number. Store a strong code hash only; expire after 7 days; max 5 failed attempts; single use. Parent sends `TINY <school-code> JOIN <code>` from the intended handset. The inbound webhook validates sender, school code, code hash, expiry, attempt limit and notice version. A successful JOIN proves possession of the sending number and records the parent's affirmative channel opt-in for the described message categories; legal basis and notice text still require DPO/legal approval. The code is not a long-term password. The `processGuardianJoinMessage` handler is internal to the signed inbound webhook, not a public callable. Phone possession is verified by the inbound SMS; the teacher/school separately confirms the person-to-pupil relationship under its normal school process. The code must not be treated as proof of legal guardianship.

### 3.6 `submitAttendanceSession`

Request `payload`:

```json
{
  "sessionId": "client-uuid",
  "classId": "class_...",
  "schoolDate": "2026-11-25",
  "rosterVersion": 4,
  "entries": [
    {"pupilId": "pupil_1", "status": "present"},
    {"pupilId": "pupil_2", "status": "absent"},
    {"pupilId": "pupil_3", "status": "late"}
  ]
}
```

Preconditions: all active pupils in the current server roster for that date are represented exactly once; statuses are from `present|absent|late`; class assignment and date rules pass. Server validates roster version and returns `ATTENDANCE_ALREADY_SUBMITTED` with canonical session if one already exists. Commit attendance entries and notification jobs in a transaction. Client-provided guardian IDs are not accepted.

Inbound absence replies use a short non-secret `responseReference` included in the SMS (for example `Ref A7KD`). Parent replies `1 A7KD` or `2 A7KD`. If a reply arrives without a reference, route it only when exactly one eligible open absence notification exists for that verified sender in the active workspace; if more than one exists, ask for the reference. Never infer the target from the most recent message alone when there is ambiguity.

### 3.7 `correctAttendanceEntry`

Request `payload`:

```json
{
  "attendanceEntryId": "att_...",
  "newStatus": "present",
  "reason": "Teacher selected the wrong pupil row.",
  "expectedVersion": 1
}
```

Reason required (10–300 characters). Append amendment, increment version and create correction notification job only when an already-delivered absence alert needs correction. Never overwrite audit history.

### 3.8 `createProgressEntry`

Request `payload`:

```json
{
  "pupilId": "pupil_...",
  "classId": "class_...",
  "periodStart": "2026-11-16",
  "periodEnd": "2026-11-20",
  "subjectId": "nerdc_subject_id",
  "objectiveId": "nerdc_objective_id",
  "indicator": "developing",
  "teacherNote": "Can solve simple multiplication problems with guidance.",
  "homeActivity": "Practise two short multiplication examples together."
}
```

`indicator` is `doing_well|developing|needs_support|not_assessed`. Server rejects scores/ranks. `teacherNote` max 300; `homeActivity` max 240. New record is `draft`, never parent-visible until `approveProgressEntry`.

### 3.9 `sendTeacherMessage`

Request `payload`:

```json
{
  "conversationId": "conv_...",
  "body": "Thank you for letting us know. We can discuss this after school.",
  "locale": "ha",
  "clientMessageId": "uuid"
}
```

Server verifies conversation is in workspace and actor is authorized for linked class. Locale must match guardian's preference or explicit teacher override with confirmation. The message is queued through the provider adapter, not sent synchronously from Android. Server stores message and outbox job atomically.

### 3.10 `syncCommands`

Request `payload`:

```json
{
  "commands": [
    {
      "idempotencyKey": "uuid",
      "commandType": "attendance.submit",
      "schemaVersion": 1,
      "clientCreatedAt": "2026-11-25T09:00:00+01:00",
      "expectedVersion": null,
      "payload": {}
    }
  ]
}
```

Max 20. Server processes independently and returns per-command results. One rejected item must not silently cause the client to assume every command failed or succeeded. Any command type not explicitly allowlisted is rejected.

Implemented command types: `pupil.register`, `attendance.submit`, `progress.upsert`, `progress.approve`, `message.reply`. Each command must carry the complete domain payload (for example attendance `entries`, or the progress observation fields), not just a local row id. Accepted commands receive a workspace receipt; a replayed accepted key returns `alreadyApplied`. Permanent validation/permission failures return `rejected` or `conflict`; provider/transient failures return `retryable` without a terminal receipt.

## 4. Webhook contracts

### 4.1 `POST /webhooks/esms/inbound`

- Accept raw request body; verify exact documented provider signature before JSON parsing or action.
- Use HMAC-SHA256 and timing-safe comparison against `X-Webhook-Signature` in the provider's required format.
- Enforce timestamp freshness/replay protection if provider supplies timestamp; otherwise durable event ID/hash dedupe plus configured provider retry window.
- Validate provider service/keyword, sender and payload size.
- Normalize sender to E.164; do not infer child identity from phone alone if multiple links exist.
- Resolve first message syntax `TINY <school-code> <message>`. The `JOIN <code>` route invokes internal `processGuardianJoinMessage` only after signature verification; for normal text, if ambiguous, reply with generic routing instructions and no child details.
- Persist `ProviderWebhookReceipt` before or atomically with processing; repeated provider event returns success without duplicate message creation.
- Respond with provider-required success status only after event is durably accepted.

### 4.2 `POST /webhooks/esms/delivery`

- Verify signature and event schema.
- Deduplicate provider event.
- Map provider status to `accepted|delivered|failed|unknown`; do not infer delivery from API success.
- Store provider raw status code in a restricted diagnostic field; do not log API secrets or message contents unnecessarily.

## 5. Scheduled/background functions

| Function | Trigger | Behavior |
|---|---|---|
| `runWeeklyDigests` | Friday 15:00 `Africa/Lagos` | Calculate reporting period, group by guardian/workspace, build localized approved digest jobs, dedupe |
| `drainSmsOutbox` | Scheduled/queue-triggered | Check opt-out, verification, budget, segment policy and provider availability; send bounded batch |
| `expireInvitations` | Scheduled daily | Mark expired invitations and clean only eligible token material |
| `purgeExpiredOperationalData` | Scheduled after retention policy approved | Delete only records whose retention has been approved and logged; disabled until policy is signed off |

## 6. Error codes

| Code | Meaning | Retry? |
|---|---|---:|
| `AUTH_REQUIRED` | Missing/expired Firebase Auth | After re-auth |
| `APP_CHECK_REQUIRED` | Invalid/missing App Check | No, until client attestation fixed |
| `PERMISSION_DENIED` | User lacks workspace/class permission | No |
| `RESOURCE_NOT_FOUND` | Resource not accessible or absent | No |
| `VALIDATION_FAILED` | Schema/business validation failed | No until data changed |
| `IDEMPOTENCY_KEY_REUSED` | Same key used with different payload | No; new command key after diagnosis |
| `ATTENDANCE_ALREADY_SUBMITTED` | Canonical session already exists | Conflict resolution |
| `VERSION_CONFLICT` | `expectedVersion` is stale | No automatic retry; refresh/resolve |
| `GUARDIAN_UNVERIFIED` | Contact cannot receive child-specific communications | No until verified |
| `GUARDIAN_OPTED_OUT` | Non-essential outbound suppressed | No |
| `AMBIGUOUS_PARENT_ROUTE` | Multiple workspace/pupil matches | Parent must provide code |
| `PROVIDER_UNAVAILABLE` | SMS provider temporarily unavailable | Yes with backoff |
| `BUDGET_LIMIT_REACHED` | Messaging budget guard blocked send | No until authorized budget change |
| `RATE_LIMITED` | Abuse/rate policy threshold reached | Retry after `retryAfter` if appropriate |
| `AI_UNAVAILABLE` | No eligible inference route | Use approved static fallback |
| `AI_OUTPUT_REJECTED` | Schema/content validation failed | At most one bounded retry, then fallback |

## 7. Security, rate and cost controls

- OTP/provider/webhook/API rate limiting at the applicable service edge and function layer.
- `createWorkspace`: e.g. max 3 per UID per 24h pending operator policy.
- `createInvitation`: max 10 per admin per hour; resend cooldown.
- Inbound SMS: per sender, per keyword and per service limits; never disclose contact registration state.
- Teacher message send: per user/workspace daily limit and provider budget gate.
- AI: per-user daily request and output-token budget; backend-enforced cloud usage limit, not only client-side throttle.
- All cost limits default closed until an operator sets a value.
- PII and message bodies are excluded from ordinary application logs. Diagnostic event IDs and correlation IDs are used instead.
