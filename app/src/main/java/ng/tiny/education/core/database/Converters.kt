package ng.tiny.education.core.database

import androidx.room.TypeConverter
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

class Converters {
    @TypeConverter fun workspaceTypeToString(value: WorkspaceType): String = value.name
    @TypeConverter fun stringToWorkspaceType(value: String): WorkspaceType = WorkspaceType.valueOf(value)

    @TypeConverter fun verificationStatusToString(value: VerificationStatus): String = value.name
    @TypeConverter fun stringToVerificationStatus(value: String): VerificationStatus = VerificationStatus.valueOf(value)

    @TypeConverter fun syncStateToString(value: SyncState): String = value.name
    @TypeConverter fun stringToSyncState(value: String): SyncState = SyncState.valueOf(value)

    @TypeConverter fun attendanceStatusToString(value: AttendanceStatus): String = value.name
    @TypeConverter fun stringToAttendanceStatus(value: String): AttendanceStatus = AttendanceStatus.valueOf(value)

    @TypeConverter fun attendanceSessionStatusToString(value: AttendanceSessionStatus): String = value.name
    @TypeConverter fun stringToAttendanceSessionStatus(value: String): AttendanceSessionStatus = AttendanceSessionStatus.valueOf(value)

    @TypeConverter fun progressIndicatorToString(value: ProgressIndicator): String = value.name
    @TypeConverter fun stringToProgressIndicator(value: String): ProgressIndicator = ProgressIndicator.valueOf(value)

    @TypeConverter fun approvalStatusToString(value: ApprovalStatus): String = value.name
    @TypeConverter fun stringToApprovalStatus(value: String): ApprovalStatus = ApprovalStatus.valueOf(value)

    @TypeConverter fun guardianVerificationToString(value: GuardianVerificationStatus): String = value.name
    @TypeConverter fun stringToGuardianVerification(value: String): GuardianVerificationStatus = GuardianVerificationStatus.valueOf(value)

    @TypeConverter fun consentStatusToString(value: ConsentStatus): String = value.name
    @TypeConverter fun stringToConsentStatus(value: String): ConsentStatus = ConsentStatus.valueOf(value)

    @TypeConverter fun conversationStatusToString(value: ConversationStatus): String = value.name
    @TypeConverter fun stringToConversationStatus(value: String): ConversationStatus = ConversationStatus.valueOf(value)

    @TypeConverter fun messageDirectionToString(value: MessageDirection): String = value.name
    @TypeConverter fun stringToMessageDirection(value: String): MessageDirection = MessageDirection.valueOf(value)

    @TypeConverter fun messageSenderTypeToString(value: MessageSenderType): String = value.name
    @TypeConverter fun stringToMessageSenderType(value: String): MessageSenderType = MessageSenderType.valueOf(value)

    @TypeConverter fun messageStatusToString(value: MessageStatus): String = value.name
    @TypeConverter fun stringToMessageStatus(value: String): MessageStatus = MessageStatus.valueOf(value)

    @TypeConverter fun lessonStatusToString(value: LessonStatus): String = value.name
    @TypeConverter fun stringToLessonStatus(value: String): LessonStatus = LessonStatus.valueOf(value)
}
