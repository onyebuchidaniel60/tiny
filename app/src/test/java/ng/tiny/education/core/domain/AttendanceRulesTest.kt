package ng.tiny.education.core.domain

import ng.tiny.education.core.model.AttendanceStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AttendanceRulesTest {
    @Test fun incompleteRegisterListsMissingPupils() {
        val missing = AttendanceRules.validateComplete(
            listOf("p1", "p2", "p3"),
            mapOf("p1" to AttendanceStatus.PRESENT, "p2" to AttendanceStatus.ABSENT),
        )
        assertEquals(listOf("p3"), missing)
    }

    @Test fun onlyAbsenceCreatesImmediateNotification() {
        assertTrue(AttendanceRules.createsImmediateNotification(AttendanceStatus.ABSENT))
        assertFalse(AttendanceRules.createsImmediateNotification(AttendanceStatus.PRESENT))
        assertFalse(AttendanceRules.createsImmediateNotification(AttendanceStatus.LATE))
    }

    @Test fun summaryCountsStatuses() {
        val summary = AttendanceRules.summary(
            listOf(AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE),
        )
        assertEquals(2, summary.present)
        assertEquals(1, summary.absent)
        assertEquals(1, summary.late)
        assertEquals(4, summary.marked)
    }

    @Test fun sessionIdIsDeterministic() {
        assertEquals(
            AttendanceRules.sessionId("class_1", "2026-11-26"),
            AttendanceRules.sessionId("class_1", "2026-11-26"),
        )
    }
}
