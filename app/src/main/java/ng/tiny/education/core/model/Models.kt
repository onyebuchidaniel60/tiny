package ng.tiny.education.core.model

enum class WorkspaceType { SCHOOL, INDEPENDENT }

enum class VerificationStatus { ACTIVE_UNVERIFIED, PENDING, VERIFIED, SUSPENDED }

enum class SyncState { LOCAL_ONLY, PENDING_SYNC, SYNCED, CONFLICT, NEEDS_ATTENTION }

enum class AttendanceStatus { PRESENT, ABSENT, LATE }

enum class AttendanceSessionStatus { DRAFT, SUBMITTED, AMENDED }

enum class ProgressIndicator { DOING_WELL, DEVELOPING, NEEDS_SUPPORT, NOT_ASSESSED }

enum class ApprovalStatus { DRAFT, APPROVED, WITHDRAWN }

enum class GuardianVerificationStatus { PENDING, VERIFIED, REVOKED }

enum class ConsentStatus { NOT_RECORDED, OPTED_IN, OPTED_OUT }

enum class ConversationStatus { OPEN, WAITING_TEACHER, WAITING_PARENT, RESOLVED }

enum class MessageDirection { INBOUND, OUTBOUND }

enum class MessageSenderType { GUARDIAN, TEACHER, SYSTEM }

enum class MessageStatus { RECEIVED, QUEUED, ACCEPTED, DELIVERED, FAILED, UNKNOWN, SUPPRESSED }

enum class LessonStatus { DRAFT, SAVED, ARCHIVED }

data class DashboardSummary(
    val workspaceName: String = "",
    val schoolCode: String = "",
    val classCount: Int = 0,
    val pupilCount: Int = 0,
    val pendingSyncCount: Int = 0,
    val unreadMessageCount: Int = 0,
    val attendanceStarted: Boolean = false,
)

data class AttendanceSummary(
    val present: Int = 0,
    val absent: Int = 0,
    val late: Int = 0,
) {
    val marked: Int get() = present + absent + late
}
