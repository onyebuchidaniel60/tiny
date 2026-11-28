# Tiny — Cross-Platform Data and Synchronization

**Status:** implemented and tested as far as the approved Firebase Spark / NGN 0 constraints allow. Cloud Functions remain emulator-only. No deployed cross-device synchronization is claimed.

This document is the contract between the Android teacher app and the web companion. The canonical data itself is described in `shared/demo/CANONICAL_DATASET.md`.

## 1. Source of truth

| Layer | Android | Web | Authority |
|---|---|---|---|
| Working copy | Encrypted Room database | IndexedDB + localStorage backup | Local-first; survives offline |
| Pending changes | Durable `outbox_commands` table | Durable `outbox` array | Idempotent command queue |
| Intended shared store | Firestore | Firestore | Server-side validation only |
| Shared writes | Firebase Functions SDK → `syncCommands` | Functions SDK → `syncCommands` in emulator mode | Cloud Functions; direct client writes denied |
| Seed / demo | `DemoData.kt` | `seed.ts` | Synthetic only |

Both working copies are legitimate local persistence. A record shown after “Reset local demo” or “Seed sample workspace” is **local**, not cloud-synced. The Sync centre is the only place that may claim a remote result, and only after the callable returns an accepted/already-applied receipt.

## 2. Shared schema and identifier mapping

All IDs are opaque strings with stable prefixes. They are identical on both platforms.

| Entity | Firestore collection | Android table | Stable ID | Shared fields |
|---|---|---|---|---|
| Workspace | `workspaces/{workspaceId}` | `workspaces` | `ws_…` | name, type, schoolCode, verificationStatus, version |
| Class | `workspaces/{id}/classes/{classId}` | `classes` | `class_…` | gradeLevel, sectionLabel/label, academicYear, teacherName, version |
| Pupil | `workspaces/{id}/pupils/{pupilId}` | `pupils` | `pupil_…` | classId, displayName, localPupilCode/localCode, enrollmentStatus, version |
| Guardian | `workspaces/{id}/guardians/{guardianId}` | `guardians` | `guardian_…` | displayName, phoneE164, preferredLocale, verification, consent |
| Link | `workspaces/{id}/pupilGuardianLinks/{linkId}` | `pupil_guardian_links` | `link_…` | pupilId, guardianId, relationshipLabel, classId, notificationEligible |
| Attendance session | `…/attendanceSessions/{classId_date}` | `attendance_sessions` | `classId_YYYY-MM-DD` | classId, schoolDate, status, version |
| Attendance entry | `…/attendanceEntries/{sessionId_pupilId}` | `attendance_entries` | `sessionId_pupilId` | pupilId, status |
| Progress/observation | `…/progressEntries/{progressEntryId}` | `progress_entries` | deterministic from pupil/period/subject | pupilId, classId, objectiveId, indicator, teacherNote, homeActivity, approvalStatus, revision |
| Assessment | `…/assessments/{assessmentId}` | `assessments` | `assessment_…` | pupilId, classId, subjectId, objectiveId/label, score, maxScore, schoolDate, version |
| Follow-up | `…/followUps/{followUpId}` | `follow_ups` | `followup_…` | pupilId?, classId, title, detail, dueDate, status, source/sourceId, version |
| Lesson | `…/lessonPlans/{lessonId}` | `lesson_plans` | `lesson_…` | classId, title/topic, gradeLevel, subjectId, 5E fields, status, version |
| Conversation | `…/conversations/{conversationId}` | `conversations` | `conversation_…` | guardianId, pupilId, classId, status |
| Message | `…/conversations/{id}/messages/{messageId}` | `messages` | `msg_…` | direction, body, status, provider |
| AI analysis | not shared | `ai_analyses` | `analysis_…` | evidenceFingerprint, evidenceIds, source, durationMs, fallback |

Only field-name differences are documented mappings: Android `label` ↔ Firestore `sectionLabel`, Android `localCode` ↔ `localPupilCode`, Android `topic` ↔ Firestore `title`. No business meaning differs.

Sensitive phone numbers never appear in AI prompts. AI analyses are device diagnostics and are not treated as school records.

## 3. Supported commands

The `syncCommands` callable accepts at most 20 commands per batch. Each command is validated independently and receives its own receipt.

| Command | Validation | Applied by |
|---|---|---|
| `class.create` | manager role, unique grade/section/year | `createClassroom` |
| `pupil.register` | class access, class/pupil consistency | `registerPupil` |
| `guardian.upsert` | workspace membership, normalized E.164, one endpoint per phone | `upsertGuardian` |
| `guardian.link` | class access, pupil and guardian in workspace | `linkGuardianToPupil` |
| `attendance.submit` | complete active roster, one submitted register per date | `submitAttendanceSession` |
| `progress.upsert` | class access, objective/indicator validation, revision check | `createProgressEntry` |
| `progress.approve` | class access, approved-only digest eligibility | `approveProgressEntry` |
| `message.reply` | class access, guardian consent, mock provider | `sendTeacherMessage` |
| `assessment.record` | class access, pupil enrolled in class, score ≤ max, version check | `recordAssessment` |
| `lesson.upsert` | class access, version check | `upsertLesson` |
| `followup.upsert` | class access, pupil enrolled if supplied, version check | `upsertFollowUp` |
| `followup.status` | class access resolved from the stored follow-up | `updateFollowUpStatus` |

`workspace.create`, invitations and guardian verification use direct callables and are not part of the offline batch.

Every handler checks Firebase Auth, workspace membership and class assignment. App Check is enforced outside the emulator. Callables never trust a client role or class list.

## 4. Idempotency, conflicts and duplicate prevention

- Every command has a client idempotency key. The backend stores a per-workspace receipt. Replaying the same key returns `alreadyApplied`; the change is not applied twice.
- The same idempotency key with a different payload is rejected (`IDEMPOTENCY_KEY_REUSED`).
- Attendance is unique per `(classId, schoolDate)`. A second submission is a conflict, not an overwrite.
- Progress uses a server revision number. An edit based on a stale revision returns `VERSION_CONFLICT`.
- Assessments, lessons and follow-ups accept `expectedVersion`. A stale version returns `VERSION_CONFLICT` and the stored record is unchanged.
- A class identity clash (same grade/section/year with a different client ID) is a conflict.
- The Android `SyncProcessor` maps accepted/already-applied to `SYNCED`, conflicts to `CONFLICT`, rejected to `FAILED` and transport failures to `RETRYABLE` with backoff.
- The web Sync centre applies the same mapping and preserves the outbox row. Nothing is deleted on failure.
- Remote refresh merges by ID: unrelated remote records always survive; a local record still waiting in the outbox is kept and never silently replaced. Once its command is accepted, the next refresh adopts the server copy.

## 5. What actually works, and where

### Local persistence — verified

- Android Room + SQLCipher survives restart; seed is idempotent.
- Web IndexedDB + localStorage survives reload; the offline Playwright journey reloads with the service worker active.
- Both stores keep unsynced edits and show an honest pending state.

### Firebase cloud reads — verified against the non-production project

- The deployed web preview signs in with its synthetic account and reads member-scoped Firestore collections (classes, pupils, guardians, links, lessons, progress, assessments, follow-ups, conversations, messages).
- Android reads its user workspace index, workspace, classes and pupils into Room after authentication.
- Direct client writes to authoritative collections remain denied by Firestore rules.

### Emulator synchronization — verified at the contract layer

- The Functions emulator suite exercises `syncCommands` with mixed batches, accepted receipts, idempotent replay, unsupported commands, attendance conflicts and stale-version conflicts.
- The manual `firebase-sync-smoke` workflow runs the real Android Firebase Functions SDK and `SyncProcessor` against Auth/Firestore/Functions emulators, covering accept, replay, transport retry and conflict.
- The web store produces the same command payload shapes (`class.create`, `pupil.register`, `guardian.*`, `attendance.submit`, `progress.*`, `message.reply`, `assessment.record`, `lesson.upsert`, `followup.*`). Its batch sender is disabled unless the build is explicitly pointed at the emulators.

### Deployed cross-device synchronization — not available

Cloud Functions 2nd gen cannot be deployed on the Spark plan without enabling Blaze. The project stays on Spark at NGN 0. Therefore:

- The deployed web app does not push its outbox; it labels the command as unavailable.
- The deployed Android app can read Firestore bootstrap data but cannot apply writes through `syncCommands`.
- No live SMS, no paid infrastructure and no production data are involved.
- This is a billing-plan limitation, not a hidden local-only feature presented as sync.

One additional migration limitation is recorded honestly: the already-seeded non-production preview workspace is `ws_webdemo0001`, created before the canonical workspace was consolidated. It has two classes, eight pupils and four guardians, but its IDs predate `ws_kofar_primary`. Migrating that remote workspace would require an authorized admin write; the current Firestore rules deny client writes and the Spark plan has no deployed callable to perform it. Therefore:

- The canonical dataset is authoritative for the Android app and the web **offline demo**.
- Firebase sign-in on the deployed web preview still reads the legacy synthetic workspace read-only.
- Canonical-ID cross-platform synchronization is exercised against the emulator, where seeding and command application are legitimate.
- The deployed preview never claims that the legacy workspace is the canonical one.

## 6. Acceptance-test matrix

| Requirement | Evidence | Result |
|---|---|---|
| Same canonical workspace and identifiers | `tools/check-canonical-dataset.mjs` in both CI workflows | Verified |
| Same classes and 8 pupils | canonical guard + web seed tests + Android seed constants | Verified |
| Consistent student intelligence | `web/src/intelligence.test.ts`; `IntelligenceEngineTest.kt` | Verified (same rates/statuses) |
| Consistent class intelligence | same suites; P4 79% / 61% / plant-parts gap | Verified |
| Record created on web is accepted by shared backend | Functions emulator checks web-shaped commands for class/pupil/attendance/progress/message/assessment/lesson/follow-up | Contract verified |
| Record created on Android is accepted by shared backend | Manual Android sync E2E (real SDK) covers class/pupil; Functions suite covers the remaining commands | Partial: Android SDK proven for class/pupil, command contract proven for the rest |
| Web sees Android record after sync | Firestore emulator + web `readRemote` mapping; no single browser test spanning both apps | Not run end-to-end |
| Android sees web record after sync | Android Firestore bootstrap verified; web writes only accepted in emulator mode | Not run end-to-end |
| Offline edits durable | Playwright offline reload; `SyncProcessorTest` retry; web outbox | Verified |
| Duplicate submission prevented | receipt replay and duplicate-attendance tests | Verified |
| Conflict does not discard records | stale assessment/version test; progress revision; Android conflict mapping | Verified |
| Session restoration | web auth restore + IndexedDB; Android Room/Keystore | Verified |
| Data refresh after another device changes a record | web `refreshRemote` merge; Android Firestore bootstrap | Merge logic verified; live two-device run blocked by Spark |

The missing end-to-end rows are the exact Spark limitation. They are not reported as passing.

## 7. Reproducing the emulator checks

```bash
# Start the emulators and run the callable/webhook/scheduler/sync suite
npx firebase-tools@15.14.0 emulators:exec --only firestore --project demo-tiny-e2e \
  "npm --prefix functions run test:emulator"

# Optional: real Android SDK against Auth/Firestore/Functions emulators
gh workflow run firebase-sync-smoke.yml
```

CI runs the Functions suite in the `rules-tests` job of `android-ci`. The manual workflow is the only place the Android SDK talks to the Functions emulator.

## 8. Deliberate non-goals

- Browser authoritative writes without Functions.
- Service-account keys in either client.
- Firestore disk persistence on Android (Room remains authoritative).
- “Sync” based on shared browser localStorage, copied databases or a fake success banner.
- Syncing AI output as if it were a school record.
