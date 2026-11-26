package ng.tiny.education.core.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow
import ng.tiny.education.core.model.SyncState

@Dao
interface TinyDao {
    @Query("SELECT * FROM workspaces ORDER BY updatedAt DESC LIMIT 1")
    fun observeWorkspace(): Flow<WorkspaceEntity?>

    @Query("SELECT * FROM workspaces ORDER BY updatedAt DESC LIMIT 1")
    suspend fun getWorkspace(): WorkspaceEntity?

    @Query("SELECT COUNT(*) FROM workspaces")
    suspend fun workspaceCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertWorkspace(workspace: WorkspaceEntity)

    @Query("SELECT * FROM classrooms WHERE workspaceId = :workspaceId ORDER BY gradeLevel, label")
    fun observeClasses(workspaceId: String): Flow<List<ClassroomEntity>>

    @Query("SELECT * FROM classrooms WHERE id = :classId LIMIT 1")
    fun observeClass(classId: String): Flow<ClassroomEntity?>

    @Query("SELECT * FROM classrooms WHERE id = :classId LIMIT 1")
    suspend fun getClass(classId: String): ClassroomEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertClasses(classes: List<ClassroomEntity>)

    @Query("SELECT * FROM pupils WHERE classId = :classId AND enrollmentStatus = 'active' ORDER BY displayName")
    fun observePupils(classId: String): Flow<List<PupilEntity>>

    @Query("SELECT * FROM pupils WHERE classId = :classId AND enrollmentStatus = 'active' ORDER BY displayName")
    suspend fun getPupils(classId: String): List<PupilEntity>

    @Query("SELECT * FROM pupils WHERE id = :pupilId LIMIT 1")
    fun observePupil(pupilId: String): Flow<PupilEntity?>

    @Query("SELECT * FROM pupils WHERE id = :pupilId LIMIT 1")
    suspend fun getPupil(pupilId: String): PupilEntity?

    @Query("SELECT COUNT(*) FROM pupils WHERE workspaceId = :workspaceId AND enrollmentStatus = 'active'")
    fun observePupilCount(workspaceId: String): Flow<Int>

    @Query("SELECT COUNT(*) FROM pupils WHERE classId = :classId AND enrollmentStatus = 'active'")
    fun observeClassPupilCount(classId: String): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPupils(pupils: List<PupilEntity>)

    @Query("SELECT * FROM guardians WHERE workspaceId = :workspaceId ORDER BY displayName")
    fun observeGuardians(workspaceId: String): Flow<List<GuardianEntity>>

    @Query("SELECT * FROM guardians WHERE id = :guardianId LIMIT 1")
    suspend fun getGuardian(guardianId: String): GuardianEntity?

    @Query("SELECT * FROM guardians WHERE workspaceId = :workspaceId AND phoneE164 = :phoneE164 LIMIT 1")
    suspend fun getGuardianByPhone(workspaceId: String, phoneE164: String): GuardianEntity?

    @Query("SELECT * FROM guardians WHERE id = :guardianId LIMIT 1")
    fun observeGuardian(guardianId: String): Flow<GuardianEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertGuardians(guardians: List<GuardianEntity>)

    @Query("UPDATE guardians SET verificationStatus = :verification, consentStatus = :consent WHERE id = :guardianId")
    suspend fun updateGuardianConsent(
        guardianId: String,
        verification: ng.tiny.education.core.model.GuardianVerificationStatus,
        consent: ng.tiny.education.core.model.ConsentStatus,
    )

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertLinks(links: List<PupilGuardianLinkEntity>)

    @Query("SELECT * FROM pupil_guardian_links WHERE pupilId = :pupilId AND status = 'active'")
    fun observeGuardianLinks(pupilId: String): Flow<List<PupilGuardianLinkEntity>>

    @Query("SELECT * FROM pupil_guardian_links WHERE guardianId = :guardianId AND status = 'active'")
    suspend fun getGuardianLinks(guardianId: String): List<PupilGuardianLinkEntity>

    @Query("SELECT * FROM attendance_sessions WHERE classId = :classId AND schoolDate = :schoolDate LIMIT 1")
    fun observeAttendanceSession(classId: String, schoolDate: String): Flow<AttendanceSessionEntity?>

    @Query("SELECT * FROM attendance_sessions WHERE classId = :classId AND schoolDate = :schoolDate LIMIT 1")
    suspend fun getAttendanceSession(classId: String, schoolDate: String): AttendanceSessionEntity?

    @Query("SELECT * FROM attendance_sessions WHERE workspaceId = :workspaceId ORDER BY schoolDate DESC LIMIT 30")
    fun observeAttendanceHistory(workspaceId: String): Flow<List<AttendanceSessionEntity>>

    @Query("SELECT * FROM attendance_entries WHERE sessionId = :sessionId ORDER BY pupilId")
    fun observeAttendanceEntries(sessionId: String): Flow<List<AttendanceEntryEntity>>

    @Query("SELECT * FROM attendance_entries WHERE sessionId = :sessionId ORDER BY pupilId")
    suspend fun getAttendanceEntries(sessionId: String): List<AttendanceEntryEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAttendanceSession(session: AttendanceSessionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAttendanceEntries(entries: List<AttendanceEntryEntity>)

    @Query("SELECT * FROM lesson_plans WHERE workspaceId = :workspaceId ORDER BY updatedAt DESC")
    fun observeLessonPlans(workspaceId: String): Flow<List<LessonPlanEntity>>

    @Query("SELECT * FROM lesson_plans WHERE id = :lessonId LIMIT 1")
    fun observeLessonPlan(lessonId: String): Flow<LessonPlanEntity?>

    @Query("SELECT * FROM lesson_plans WHERE id = :lessonId LIMIT 1")
    suspend fun getLessonPlan(lessonId: String): LessonPlanEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertLessonPlans(lessons: List<LessonPlanEntity>)

    @Query("SELECT * FROM progress_entries WHERE pupilId = :pupilId ORDER BY periodStart DESC, subjectId")
    fun observeProgress(pupilId: String): Flow<List<ProgressEntryEntity>>

    @Query("SELECT * FROM progress_entries WHERE id = :entryId LIMIT 1")
    suspend fun getProgressEntry(entryId: String): ProgressEntryEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertProgress(entry: ProgressEntryEntity)

    @Query("SELECT * FROM progress_entries WHERE workspaceId = :workspaceId AND approvalStatus = 'APPROVED' ORDER BY updatedAt DESC")
    fun observeApprovedProgress(workspaceId: String): Flow<List<ProgressEntryEntity>>

    @Query("SELECT * FROM conversations WHERE workspaceId = :workspaceId ORDER BY lastMessageAt DESC")
    fun observeConversations(workspaceId: String): Flow<List<ConversationEntity>>

    @Query("SELECT * FROM conversations WHERE id = :conversationId LIMIT 1")
    fun observeConversation(conversationId: String): Flow<ConversationEntity?>

    @Query("SELECT * FROM conversations WHERE id = :conversationId LIMIT 1")
    suspend fun getConversation(conversationId: String): ConversationEntity?

    @Query("UPDATE conversations SET unreadCount = 0 WHERE id = :conversationId")
    suspend fun markConversationRead(conversationId: String)

    @Query("UPDATE conversations SET status = :status, lastMessageAt = :lastMessageAt WHERE id = :conversationId")
    suspend fun updateConversation(conversationId: String, status: String, lastMessageAt: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertConversations(conversations: List<ConversationEntity>)

    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY createdAt")
    fun observeMessages(conversationId: String): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY createdAt")
    suspend fun getMessages(conversationId: String): List<MessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMessages(messages: List<MessageEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMessage(message: MessageEntity)

    @Query("SELECT * FROM outbox_commands WHERE workspaceId = :workspaceId ORDER BY createdAt DESC")
    fun observeOutbox(workspaceId: String): Flow<List<OutboxCommandEntity>>

    @Query("SELECT * FROM outbox_commands WHERE syncState = 'PENDING_SYNC' ORDER BY createdAt ASC LIMIT :limit")
    suspend fun getPendingOutbox(limit: Int = 20): List<OutboxCommandEntity>

    @Query(
        "SELECT * FROM outbox_commands WHERE workspaceId = :workspaceId AND syncState = 'PENDING_SYNC' " +
            "AND (nextAttemptAt IS NULL OR nextAttemptAt <= :now) ORDER BY createdAt ASC LIMIT :limit",
    )
    suspend fun getDueOutbox(workspaceId: String, now: Long, limit: Int = 20): List<OutboxCommandEntity>

    @Query("SELECT * FROM outbox_commands WHERE id = :id LIMIT 1")
    suspend fun getOutboxCommand(id: String): OutboxCommandEntity?

    @Query("SELECT COUNT(*) FROM outbox_commands WHERE workspaceId = :workspaceId AND syncState IN ('PENDING_SYNC', 'NEEDS_ATTENTION', 'CONFLICT')")
    fun observePendingOutboxCount(workspaceId: String): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertOutbox(command: OutboxCommandEntity)

    @Update
    suspend fun updateOutbox(command: OutboxCommandEntity)

    @Query("UPDATE attendance_sessions SET syncState = :syncState, version = version + 1 WHERE classId = :classId AND schoolDate = :schoolDate")
    suspend fun updateAttendanceSessionSyncState(classId: String, schoolDate: String, syncState: SyncState)

    @Query("UPDATE progress_entries SET syncState = :syncState WHERE id = :entryId")
    suspend fun updateProgressSyncState(entryId: String, syncState: SyncState)

    @Query("UPDATE pupils SET syncState = :syncState WHERE id = :pupilId")
    suspend fun updatePupilSyncState(pupilId: String, syncState: SyncState)

    @Query("UPDATE messages SET status = :status WHERE id = :messageId")
    suspend fun updateMessageStatus(messageId: String, status: ng.tiny.education.core.model.MessageStatus)

    @Query("SELECT * FROM sync_cursors WHERE workspaceId = :workspaceId LIMIT 1")
    suspend fun getSyncCursor(workspaceId: String): SyncCursorEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertSyncCursor(cursor: SyncCursorEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAudit(event: AuditEventEntity)

    @Query("SELECT * FROM audit_events WHERE workspaceId = :workspaceId ORDER BY createdAt DESC LIMIT 50")
    fun observeAudit(workspaceId: String): Flow<List<AuditEventEntity>>
}
