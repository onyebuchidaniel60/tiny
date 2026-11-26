package ng.tiny.education.core.database

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import ng.tiny.education.core.model.ApprovalStatus
import ng.tiny.education.core.model.AttendanceSessionStatus
import ng.tiny.education.core.model.AttendanceStatus
import ng.tiny.education.core.model.ConsentStatus
import ng.tiny.education.core.model.ConversationStatus
import ng.tiny.education.core.model.GuardianVerificationStatus
import ng.tiny.education.core.model.LessonStatus
import ng.tiny.education.core.model.MessageDirection
import ng.tiny.education.core.model.MessageSenderType
import ng.tiny.education.core.model.MessageStatus
import ng.tiny.education.core.model.ProgressIndicator
import ng.tiny.education.core.model.SyncState
import ng.tiny.education.core.model.VerificationStatus
import ng.tiny.education.core.model.WorkspaceType

@Entity(tableName = "workspaces")
data class WorkspaceEntity(
    @PrimaryKey val id: String,
    val name: String,
    val type: WorkspaceType,
    val schoolCode: String,
    val verificationStatus: VerificationStatus,
    val syncState: SyncState,
    val version: Int,
    val updatedAt: Long,
)

@Entity(tableName = "classrooms", indices = [Index("workspaceId")])
data class ClassroomEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val gradeLevel: String,
    val label: String,
    val academicYear: String,
    val subjectSummary: String,
    val teacherName: String,
    val syncState: SyncState,
    val version: Int,
)

@Entity(tableName = "pupils", indices = [Index("workspaceId"), Index("classId")])
data class PupilEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val classId: String,
    val displayName: String,
    val localCode: String?,
    val enrollmentStatus: String = "active",
    val syncState: SyncState,
    val version: Int,
)

@Entity(tableName = "guardians", indices = [Index("workspaceId"), Index(value = ["workspaceId", "phoneE164"], unique = true)])
data class GuardianEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val displayName: String,
    val phoneE164: String,
    val preferredLocale: String,
    val verificationStatus: GuardianVerificationStatus,
    val consentStatus: ConsentStatus,
    val syncState: SyncState,
)

@Entity(tableName = "pupil_guardian_links", indices = [Index("pupilId"), Index("guardianId")])
data class PupilGuardianLinkEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val pupilId: String,
    val guardianId: String,
    val relationshipLabel: String,
    val notificationEligible: Boolean,
    val status: String = "active",
)

@Entity(tableName = "attendance_sessions", indices = [Index(value = ["classId", "schoolDate"], unique = true)])
data class AttendanceSessionEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val classId: String,
    val schoolDate: String,
    val status: AttendanceSessionStatus,
    val submittedAt: Long?,
    val syncedAt: Long?,
    val syncState: SyncState,
    val version: Int,
)

@Entity(tableName = "attendance_entries", indices = [Index("sessionId"), Index("pupilId")])
data class AttendanceEntryEntity(
    @PrimaryKey val id: String,
    val sessionId: String,
    val pupilId: String,
    val status: AttendanceStatus,
    val note: String? = null,
)

@Entity(tableName = "lesson_plans", indices = [Index("workspaceId"), Index("classId")])
data class LessonPlanEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val classId: String,
    val gradeLevel: String,
    val subjectId: String,
    val topic: String,
    val objective: String,
    val durationMinutes: Int,
    val materials: String,
    val priorKnowledge: String,
    val engage: String,
    val explore: String,
    val explain: String,
    val elaborate: String,
    val evaluate: String,
    val status: LessonStatus,
    val syncState: SyncState,
    val updatedAt: Long,
)

@Entity(tableName = "progress_entries", indices = [Index("pupilId"), Index("workspaceId")])
data class ProgressEntryEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val pupilId: String,
    val classId: String,
    val periodStart: String,
    val periodEnd: String,
    val subjectId: String,
    val objectiveId: String?,
    val indicator: ProgressIndicator,
    val teacherNote: String?,
    val homeActivity: String?,
    val approvalStatus: ApprovalStatus,
    val revision: Int,
    val syncState: SyncState,
    val updatedAt: Long,
)

@Entity(tableName = "conversations", indices = [Index("workspaceId"), Index("guardianId")])
data class ConversationEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val guardianId: String,
    val pupilId: String?,
    val status: ConversationStatus,
    val lastMessageAt: Long,
    val unreadCount: Int,
)

@Entity(tableName = "messages", indices = [Index("conversationId")])
data class MessageEntity(
    @PrimaryKey val id: String,
    val conversationId: String,
    val direction: MessageDirection,
    val senderType: MessageSenderType,
    val body: String,
    val locale: String,
    val status: MessageStatus,
    val createdAt: Long,
)

@Entity(tableName = "outbox_commands", indices = [Index("workspaceId"), Index("idempotencyKey", unique = true)])
data class OutboxCommandEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val commandType: String,
    val schemaVersion: Int,
    val payloadJson: String,
    val idempotencyKey: String,
    val createdAt: Long,
    val attempts: Int,
    val nextAttemptAt: Long?,
    val syncState: SyncState,
    val lastError: String?,
)

@Entity(tableName = "sync_cursors")
data class SyncCursorEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val cursor: String,
    val lastSyncedAt: Long,
)

@Entity(tableName = "audit_events", indices = [Index("workspaceId")])
data class AuditEventEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val action: String,
    val resourceType: String,
    val resourceId: String,
    val summary: String,
    val createdAt: Long,
)
