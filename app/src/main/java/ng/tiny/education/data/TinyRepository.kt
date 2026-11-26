package ng.tiny.education.data

import androidx.room.withTransaction
import kotlinx.coroutines.flow.Flow
import ng.tiny.education.core.database.AttendanceEntryEntity
import ng.tiny.education.core.database.AttendanceSessionEntity
import ng.tiny.education.core.database.AuditEventEntity
import ng.tiny.education.core.database.ClassroomEntity
import ng.tiny.education.core.database.ConversationEntity
import ng.tiny.education.core.database.GuardianEntity
import ng.tiny.education.core.database.LessonPlanEntity
import ng.tiny.education.core.database.MessageEntity
import ng.tiny.education.core.database.OutboxCommandEntity
import ng.tiny.education.core.database.ProgressEntryEntity
import ng.tiny.education.core.database.PupilEntity
import ng.tiny.education.core.database.TinyDatabase
import ng.tiny.education.core.database.WorkspaceEntity
import ng.tiny.education.core.domain.AttendanceRules
import ng.tiny.education.core.domain.JsonStrings
import ng.tiny.education.core.domain.ProgressDraft
import ng.tiny.education.core.domain.ProgressRules
import ng.tiny.education.core.model.ApprovalStatus
import ng.tiny.education.core.model.AttendanceSessionStatus
import ng.tiny.education.core.model.AttendanceStatus
import ng.tiny.education.core.model.MessageDirection
import ng.tiny.education.core.model.MessageSenderType
import ng.tiny.education.core.model.MessageStatus
import ng.tiny.education.core.model.ProgressIndicator
import ng.tiny.education.core.model.SyncState
import ng.tiny.education.core.network.MockSmsGateway
import ng.tiny.education.core.network.SmsMessage
import ng.tiny.education.core.sync.MockSyncEngine
import ng.tiny.education.core.sync.MockSyncResult
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters
import java.util.UUID

class TinyRepository(
    private val database: TinyDatabase,
    private val smsGateway: MockSmsGateway,
    private val syncEngine: MockSyncEngine,
) {
    private val dao = database.dao()

    fun observeWorkspace(): Flow<WorkspaceEntity?> = dao.observeWorkspace()
    fun observeClasses(workspaceId: String): Flow<List<ClassroomEntity>> = dao.observeClasses(workspaceId)
    fun observeClass(classId: String): Flow<ClassroomEntity?> = dao.observeClass(classId)
    fun observePupils(classId: String): Flow<List<PupilEntity>> = dao.observePupils(classId)
    fun observePupil(pupilId: String): Flow<PupilEntity?> = dao.observePupil(pupilId)
    fun observePupilCount(workspaceId: String): Flow<Int> = dao.observePupilCount(workspaceId)
    fun observeClassPupilCount(classId: String): Flow<Int> = dao.observeClassPupilCount(classId)
    fun observeGuardianLinks(pupilId: String): Flow<List<ng.tiny.education.core.database.PupilGuardianLinkEntity>> = dao.observeGuardianLinks(pupilId)
    fun observeAttendanceSession(classId: String, schoolDate: String): Flow<AttendanceSessionEntity?> = dao.observeAttendanceSession(classId, schoolDate)
    fun observeAttendanceEntries(sessionId: String): Flow<List<AttendanceEntryEntity>> = dao.observeAttendanceEntries(sessionId)
    fun observeLessonPlans(workspaceId: String): Flow<List<LessonPlanEntity>> = dao.observeLessonPlans(workspaceId)
    fun observeLessonPlan(lessonId: String): Flow<LessonPlanEntity?> = dao.observeLessonPlan(lessonId)
    fun observeProgress(pupilId: String): Flow<List<ProgressEntryEntity>> = dao.observeProgress(pupilId)
    fun observeApprovedProgress(workspaceId: String): Flow<List<ProgressEntryEntity>> = dao.observeApprovedProgress(workspaceId)
    fun observeConversations(workspaceId: String): Flow<List<ConversationEntity>> = dao.observeConversations(workspaceId)
    fun observeConversation(conversationId: String): Flow<ConversationEntity?> = dao.observeConversation(conversationId)
    fun observeGuardian(guardianId: String): Flow<GuardianEntity?> = dao.observeGuardian(guardianId)
    fun observeMessages(conversationId: String): Flow<List<MessageEntity>> = dao.observeMessages(conversationId)
    fun observeOutbox(workspaceId: String): Flow<List<OutboxCommandEntity>> = dao.observeOutbox(workspaceId)
    fun observePendingOutboxCount(workspaceId: String): Flow<Int> = dao.observePendingOutboxCount(workspaceId)
    fun observeAudit(workspaceId: String): Flow<List<AuditEventEntity>> = dao.observeAudit(workspaceId)

    suspend fun seedDemoData() = DemoData.seedIfEmpty(dao)

    suspend fun addPupil(
        workspaceId: String,
        classId: String,
        displayName: String,
        localPupilCode: String?,
    ): Result<String> = runCatching {
        val name = displayName.trim()
        require(name.isNotEmpty()) { "Pupil name is required." }
        val pupilId = "pupil_${UUID.randomUUID()}"
        database.withTransaction {
            dao.upsertPupils(
                listOf(
                    PupilEntity(
                        id = pupilId,
                        workspaceId = workspaceId,
                        classId = classId,
                        displayName = name,
                        localCode = localPupilCode?.trim()?.takeIf { it.isNotEmpty() },
                        syncState = SyncState.PENDING_SYNC,
                        version = 1,
                    ),
                ),
            )
            enqueueOutbox(
                workspaceId,
                "pupil.register",
                buildString {
                    append("{\"pupilId\":${JsonStrings.quote(pupilId)}")
                    append(",\"classId\":${JsonStrings.quote(classId)}")
                    append(",\"displayName\":${JsonStrings.quote(name)}")
                    localPupilCode?.trim()?.takeIf { it.isNotEmpty() }?.let {
                        append(",\"localPupilCode\":${JsonStrings.quote(it)}")
                    }
                    append('}')
                },
            )
            audit(workspaceId, "pupil.registered", "pupil", pupilId, "Pupil registered locally.")
        }
        pupilId
    }

    suspend fun saveAttendanceDraft(
        workspaceId: String,
        classId: String,
        schoolDate: String,
        statuses: Map<String, AttendanceStatus>,
    ): Result<Unit> = runCatching {
        val existing = dao.getAttendanceSession(classId, schoolDate)
        check(existing?.status != AttendanceSessionStatus.SUBMITTED) { "Attendance is already submitted." }
        val sessionId = existing?.id ?: AttendanceRules.sessionId(classId, schoolDate)
        database.withTransaction {
            dao.upsertAttendanceSession(
                AttendanceSessionEntity(
                    id = sessionId,
                    workspaceId = workspaceId,
                    classId = classId,
                    schoolDate = schoolDate,
                    status = AttendanceSessionStatus.DRAFT,
                    submittedAt = existing?.submittedAt,
                    syncedAt = null,
                    syncState = SyncState.LOCAL_ONLY,
                    version = (existing?.version ?: 0) + 1,
                ),
            )
            dao.upsertAttendanceEntries(
                statuses.map { (pupilId, status) ->
                    AttendanceEntryEntity(
                        id = "${sessionId}_$pupilId",
                        sessionId = sessionId,
                        pupilId = pupilId,
                        status = status,
                    )
                },
            )
            audit(workspaceId, "attendance.draft_saved", "attendance_session", sessionId, "Draft saved locally.")
        }
    }

    suspend fun submitAttendance(
        workspaceId: String,
        classId: String,
        schoolDate: String,
        statuses: Map<String, AttendanceStatus>,
    ): Result<Unit> = runCatching {
        val pupils = dao.getPupils(classId)
        val missing = AttendanceRules.validateComplete(pupils.map { it.id }, statuses)
        check(missing.isEmpty()) { "Every active pupil needs a status before submission." }
        val existing = dao.getAttendanceSession(classId, schoolDate)
        check(existing?.status != AttendanceSessionStatus.SUBMITTED) { "Attendance is already submitted." }

        val sessionId = existing?.id ?: AttendanceRules.sessionId(classId, schoolDate)
        val now = System.currentTimeMillis()
        database.withTransaction {
            dao.upsertAttendanceSession(
                AttendanceSessionEntity(
                    id = sessionId,
                    workspaceId = workspaceId,
                    classId = classId,
                    schoolDate = schoolDate,
                    status = AttendanceSessionStatus.SUBMITTED,
                    submittedAt = now,
                    syncedAt = null,
                    syncState = SyncState.PENDING_SYNC,
                    version = (existing?.version ?: 0) + 1,
                ),
            )
            dao.upsertAttendanceEntries(
                statuses.map { (pupilId, status) ->
                    AttendanceEntryEntity(
                        id = "${sessionId}_$pupilId",
                        sessionId = sessionId,
                        pupilId = pupilId,
                        status = status,
                    )
                },
            )
            val absent = AttendanceRules.absencePupilIds(statuses)
            enqueueOutbox(
                workspaceId = workspaceId,
                commandType = "attendance.submit",
                payload = buildString {
                    append("{\"classId\":${JsonStrings.quote(classId)}")
                    append(",\"schoolDate\":${JsonStrings.quote(schoolDate)}")
                    append(",\"entries\":[")
                    append(
                        statuses.entries.joinToString(",") { (pupilId, status) ->
                            "{\"pupilId\":${JsonStrings.quote(pupilId)},\"status\":${JsonStrings.quote(status.name.lowercase())}}"
                        },
                    )
                    append("]}")
                },
            )
            audit(
                workspaceId,
                "attendance.submitted",
                "attendance_session",
                sessionId,
                "Submitted locally. Absence candidates: ${absent.size}.",
            )
        }
    }

    suspend fun saveProgress(
        workspaceId: String,
        pupilId: String,
        classId: String,
        subjectId: String,
        indicator: ProgressIndicator,
        teacherNote: String?,
        homeActivity: String?,
        existingEntryId: String? = null,
    ): Result<String> = runCatching {
        val validation = ProgressRules.validate(ProgressDraft(indicator, teacherNote, homeActivity))
        check(validation.valid) { validation.errors.joinToString(" ") }
        val existing = existingEntryId?.let { dao.getProgressEntry(it) }
        val periodStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        val periodEnd = periodStart.plusDays(6)
        val revision = if (existing?.approvalStatus == ApprovalStatus.APPROVED) existing.revision + 1 else (existing?.revision ?: 1)
        val entryId = existing?.id ?: "progress_${UUID.randomUUID()}"
        val now = System.currentTimeMillis()
        database.withTransaction {
            dao.upsertProgress(
                ProgressEntryEntity(
                    id = entryId,
                    workspaceId = workspaceId,
                    pupilId = pupilId,
                    classId = classId,
                    periodStart = periodStart.toString(),
                    periodEnd = periodEnd.toString(),
                    subjectId = subjectId,
                    objectiveId = existing?.objectiveId,
                    indicator = indicator,
                    teacherNote = teacherNote?.takeIf { it.isNotBlank() },
                    homeActivity = homeActivity?.takeIf { it.isNotBlank() },
                    approvalStatus = ApprovalStatus.DRAFT,
                    revision = revision,
                    syncState = SyncState.PENDING_SYNC,
                    updatedAt = now,
                ),
            )
            enqueueOutbox(
                workspaceId,
                "progress.upsert",
                buildString {
                    append("{\"pupilId\":${JsonStrings.quote(pupilId)}")
                    append(",\"classId\":${JsonStrings.quote(classId)}")
                    append(",\"periodStart\":${JsonStrings.quote(periodStart.toString())}")
                    append(",\"periodEnd\":${JsonStrings.quote(periodEnd.toString())}")
                    append(",\"subjectId\":${JsonStrings.quote(subjectId)}")
                    append(",\"indicator\":${JsonStrings.quote(indicator.name.lowercase())}")
                    teacherNote?.takeIf { it.isNotBlank() }?.let {
                        append(",\"teacherNote\":${JsonStrings.quote(it)}")
                    }
                    homeActivity?.takeIf { it.isNotBlank() }?.let {
                        append(",\"homeActivity\":${JsonStrings.quote(it)}")
                    }
                    append('}')
                },
            )
            audit(workspaceId, "progress.draft_saved", "progress_entry", entryId, "Draft saved; approval reset if edited.")
        }
        entryId
    }

    suspend fun approveProgress(workspaceId: String, entryId: String): Result<Unit> = runCatching {
        val existing = dao.getProgressEntry(entryId) ?: error("Progress entry not found.")
        check((existing.teacherNote?.length ?: 0) <= ProgressRules.MAX_NOTE) {
            "Teacher note is too long."
        }
        database.withTransaction {
            dao.upsertProgress(
                existing.copy(
                    approvalStatus = ApprovalStatus.APPROVED,
                    syncState = SyncState.PENDING_SYNC,
                    updatedAt = System.currentTimeMillis(),
                ),
            )
            enqueueOutbox(workspaceId, "progress.approve", "{\"progressEntryId\":\"$entryId\"}")
            audit(workspaceId, "progress.approved", "progress_entry", entryId, "Approved for parent digest.")
        }
    }

    suspend fun sendReply(conversationId: String, body: String): Result<Unit> = runCatching {
        require(body.isNotBlank()) { "Reply cannot be empty." }
        val conversation = dao.getConversation(conversationId) ?: error("Conversation not found.")
        val guardian = dao.getGuardian(conversation.guardianId) ?: error("Guardian not found.")
        val now = System.currentTimeMillis()
        val messageId = "msg_${UUID.randomUUID()}"
        database.withTransaction {
            dao.upsertMessage(
                MessageEntity(
                    id = messageId,
                    conversationId = conversationId,
                    direction = MessageDirection.OUTBOUND,
                    senderType = MessageSenderType.TEACHER,
                    body = body.trim(),
                    locale = guardian.preferredLocale,
                    status = MessageStatus.QUEUED,
                    createdAt = now,
                ),
            )
            dao.updateConversation(conversationId, "WAITING_PARENT", now)
            enqueueOutbox(
                conversation.workspaceId,
                "message.reply",
                buildString {
                    append("{\"conversationId\":${JsonStrings.quote(conversationId)}")
                    append(",\"body\":${JsonStrings.quote(body.trim())}")
                    append(",\"locale\":${JsonStrings.quote(guardian.preferredLocale)}")
                    append(",\"clientMessageId\":${JsonStrings.quote(messageId)}")
                    append('}')
                },
            )
        }
        val result = smsGateway.send(
            SmsMessage(
                toE164 = guardian.phoneE164,
                body = body.trim(),
                locale = guardian.preferredLocale,
                idempotencyKey = messageId,
            ),
        )
        val status = when (result.status.name) {
            "ACCEPTED" -> MessageStatus.ACCEPTED
            "QUEUED" -> MessageStatus.QUEUED
            "FAILED" -> MessageStatus.FAILED
            else -> MessageStatus.UNKNOWN
        }
        dao.upsertMessage(
            MessageEntity(
                id = messageId,
                conversationId = conversationId,
                direction = MessageDirection.OUTBOUND,
                senderType = MessageSenderType.TEACHER,
                body = body.trim(),
                locale = guardian.preferredLocale,
                status = status,
                createdAt = now,
            ),
        )
        audit(conversation.workspaceId, "message.mock_queued", "message", messageId, "Mock adapter only; no real SMS.")
    }

    suspend fun markConversationRead(conversationId: String) = dao.markConversationRead(conversationId)

    suspend fun syncNow(workspaceId: String): MockSyncResult = syncEngine.run(dao, workspaceId)

    private suspend fun enqueueOutbox(workspaceId: String, commandType: String, payload: String) {
        dao.upsertOutbox(
            OutboxCommandEntity(
                id = UUID.randomUUID().toString(),
                workspaceId = workspaceId,
                commandType = commandType,
                schemaVersion = 1,
                payloadJson = payload,
                idempotencyKey = UUID.randomUUID().toString(),
                createdAt = System.currentTimeMillis(),
                attempts = 0,
                nextAttemptAt = null,
                syncState = SyncState.PENDING_SYNC,
                lastError = null,
            ),
        )
    }

    private suspend fun audit(
        workspaceId: String,
        action: String,
        resourceType: String,
        resourceId: String,
        summary: String,
    ) {
        dao.insertAudit(
            AuditEventEntity(
                id = UUID.randomUUID().toString(),
                workspaceId = workspaceId,
                action = action,
                resourceType = resourceType,
                resourceId = resourceId,
                summary = summary,
                createdAt = System.currentTimeMillis(),
            ),
        )
    }
}
