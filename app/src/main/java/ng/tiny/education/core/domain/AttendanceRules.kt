package ng.tiny.education.core.domain

import ng.tiny.education.core.model.AttendanceStatus
import ng.tiny.education.core.model.AttendanceSummary

object AttendanceRules {
    fun sessionId(classId: String, schoolDate: String): String = "attendance_${classId}_$schoolDate"

    fun summary(entries: Collection<AttendanceStatus>): AttendanceSummary = AttendanceSummary(
        present = entries.count { it == AttendanceStatus.PRESENT },
        absent = entries.count { it == AttendanceStatus.ABSENT },
        late = entries.count { it == AttendanceStatus.LATE },
    )

    fun validateComplete(activePupilIds: Collection<String>, statuses: Map<String, AttendanceStatus>): List<String> =
        activePupilIds.filterNot { statuses.containsKey(it) }

    fun absencePupilIds(statuses: Map<String, AttendanceStatus>): Set<String> =
        statuses.filterValues { it == AttendanceStatus.ABSENT }.keys

    fun createsImmediateNotification(status: AttendanceStatus): Boolean = status == AttendanceStatus.ABSENT

    fun isDateIso(value: String): Boolean = runCatching { java.time.LocalDate.parse(value) }.isSuccess
}
