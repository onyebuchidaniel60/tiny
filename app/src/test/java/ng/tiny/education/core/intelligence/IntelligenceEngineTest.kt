package ng.tiny.education.core.intelligence

import ng.tiny.education.core.database.AssessmentEntity
import ng.tiny.education.core.database.AttendanceEvidenceRow
import ng.tiny.education.core.database.ClassroomEntity
import ng.tiny.education.core.database.ProgressEntryEntity
import ng.tiny.education.core.database.PupilEntity
import ng.tiny.education.core.model.ApprovalStatus
import ng.tiny.education.core.model.AttendanceStatus
import ng.tiny.education.core.model.ProgressIndicator
import ng.tiny.education.core.model.SyncState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Mirrors the canonical synthetic workspace consumed by the web companion.
 * The expected rates and statuses are also asserted in
 * web/src/intelligence.test.ts, so a schema or rule drift is caught on either
 * platform.
 */
class IntelligenceEngineTest {
    private val workspaceId = "ws_kofar_primary"
    private val classP4 = "class_p4_blue"
    private val classP5 = "class_p5_gold"

    private val p4Pupils = listOf(
        pupil("pupil_amina", "Amina Bello", "KOF001", classP4),
        pupil("pupil_musa", "Musa Ibrahim", "KOF002", classP4),
        pupil("pupil_ngozi", "Ngozi Okafor", "KOF003", classP4),
        pupil("pupil_tunde", "Tunde Adeyemi", "KOF004", classP4),
    )

    private val attendance = listOf(
        attendance("pupil_amina", "2026-11-17", AttendanceStatus.PRESENT),
        attendance("pupil_amina", "2026-11-18", AttendanceStatus.PRESENT),
        attendance("pupil_amina", "2026-11-19", AttendanceStatus.PRESENT),
        attendance("pupil_amina", "2026-11-20", AttendanceStatus.PRESENT),
        attendance("pupil_amina", "2026-11-24", AttendanceStatus.PRESENT),
        attendance("pupil_amina", "2026-11-25", AttendanceStatus.LATE),
        attendance("pupil_amina", "2026-11-26", AttendanceStatus.PRESENT),
        attendance("pupil_musa", "2026-11-17", AttendanceStatus.ABSENT),
        attendance("pupil_musa", "2026-11-18", AttendanceStatus.ABSENT),
        attendance("pupil_musa", "2026-11-19", AttendanceStatus.PRESENT),
        attendance("pupil_musa", "2026-11-20", AttendanceStatus.ABSENT),
        attendance("pupil_musa", "2026-11-24", AttendanceStatus.PRESENT),
        attendance("pupil_musa", "2026-11-25", AttendanceStatus.ABSENT),
        attendance("pupil_musa", "2026-11-26", AttendanceStatus.PRESENT),
        attendance("pupil_ngozi", "2026-11-17", AttendanceStatus.PRESENT),
        attendance("pupil_ngozi", "2026-11-18", AttendanceStatus.PRESENT),
        attendance("pupil_ngozi", "2026-11-19", AttendanceStatus.PRESENT),
        attendance("pupil_ngozi", "2026-11-20", AttendanceStatus.LATE),
        attendance("pupil_ngozi", "2026-11-24", AttendanceStatus.PRESENT),
        attendance("pupil_ngozi", "2026-11-25", AttendanceStatus.PRESENT),
        attendance("pupil_ngozi", "2026-11-26", AttendanceStatus.PRESENT),
        attendance("pupil_tunde", "2026-11-17", AttendanceStatus.LATE),
        attendance("pupil_tunde", "2026-11-18", AttendanceStatus.PRESENT),
        attendance("pupil_tunde", "2026-11-19", AttendanceStatus.ABSENT),
        attendance("pupil_tunde", "2026-11-20", AttendanceStatus.LATE),
        attendance("pupil_tunde", "2026-11-24", AttendanceStatus.PRESENT),
        attendance("pupil_tunde", "2026-11-25", AttendanceStatus.ABSENT),
        attendance("pupil_tunde", "2026-11-26", AttendanceStatus.PRESENT),
    )

    private val assessments = listOf(
        assessment("assessment_pupil_amina_1", "pupil_amina", "water_sources", "Water sources and uses", 82, "2026-11-06"),
        assessment("assessment_pupil_amina_2", "pupil_amina", "water_sources", "Water sources and uses", 88, "2026-11-13"),
        assessment("assessment_pupil_amina_3", "pupil_amina", "water_sources", "Water sources and uses", 90, "2026-11-20"),
        assessment("assessment_pupil_musa_1", "pupil_musa", "water_sources", "Water sources and uses", 42, "2026-11-06"),
        assessment("assessment_pupil_musa_2", "pupil_musa", "water_sources", "Water sources and uses", 51, "2026-11-13"),
        assessment("assessment_pupil_musa_3", "pupil_musa", "water_sources", "Water sources and uses", 60, "2026-11-20"),
        assessment("assessment_pupil_ngozi_1", "pupil_ngozi", "plant_parts", "Plant parts and functions", 62, "2026-11-06"),
        assessment("assessment_pupil_ngozi_2", "pupil_ngozi", "plant_parts", "Plant parts and functions", 70, "2026-11-13"),
        assessment("assessment_pupil_ngozi_3", "pupil_ngozi", "plant_parts", "Plant parts and functions", 78, "2026-11-20"),
        assessment("assessment_pupil_tunde_1", "pupil_tunde", "plant_parts", "Plant parts and functions", 35, "2026-11-06"),
        assessment("assessment_pupil_tunde_2", "pupil_tunde", "plant_parts", "Plant parts and functions", 31, "2026-11-13"),
        assessment("assessment_pupil_tunde_3", "pupil_tunde", "plant_parts", "Plant parts and functions", 38, "2026-11-20"),
    )

    private val progress = listOf(
        progress("progress_amina_1", "pupil_amina", "water_sources", ProgressIndicator.DOING_WELL, "Amina explained three water sources.", "2026-11-20"),
        progress("progress_amina_2", "pupil_amina", "plant_parts", ProgressIndicator.DOING_WELL, "Amina labelled roots, stem and leaf correctly.", "2026-11-27"),
        progress("progress_musa_1", "pupil_musa", "water_sources", ProgressIndicator.DEVELOPING, "Musa names sources with prompting.", "2026-11-20"),
        progress("progress_musa_2", "pupil_musa", "plant_parts", ProgressIndicator.DEVELOPING, "Musa matched two plant parts.", "2026-11-27"),
        progress("progress_ngozi_1", "pupil_ngozi", "plant_parts", ProgressIndicator.DEVELOPING, "Ngozi needs support writing full explanations.", "2026-11-27"),
        progress("progress_tunde_1", "pupil_tunde", "plant_parts", ProgressIndicator.NEEDS_SUPPORT, "Tunde is still confusing roots and stems.", "2026-11-27"),
    )

    @Test fun aminaMatchesSharedWebIntelligence() {
        val profile = IntelligenceEngine.pupil(p4Pupils[0], attendance, assessments, progress)
        assertEquals(7, profile.attendance.marked)
        assertEquals(0, profile.attendance.absent)
        assertEquals(100, profile.attendance.rate)
        assertEquals(87, profile.assessments.average)
        assertEquals(12, profile.evidenceIds.size)
        assertEquals(PupilIntelligenceStatus.STRONG, profile.status)
        assertEquals(EvidenceConfidence.HIGH, profile.confidence)
    }

    @Test fun musaIsFlaggedForAttendanceAndAssessmentSupport() {
        val profile = IntelligenceEngine.pupil(p4Pupils[1], attendance, assessments, progress)
        assertEquals(7, profile.attendance.marked)
        assertEquals(4, profile.attendance.absent)
        assertEquals(43, profile.attendance.rate)
        assertEquals(51, profile.assessments.average)
        assertEquals(PupilIntelligenceStatus.NEEDS_ATTENTION, profile.status)
        assertTrue(profile.statusReasonKeys.contains("status_reason_attendance"))
        assertTrue(profile.nextActions.contains("action_contact_family"))
    }

    @Test fun classIntelligenceIdentifiesTheSharedPlantPartsGap() {
        val classroom = ClassroomEntity(
            classP4,
            workspaceId,
            "P4",
            "Blue",
            "2026/2027",
            "Basic Science",
            "Ms. Bello",
            SyncState.LOCAL_ONLY,
            1,
        )
        val intelligence = IntelligenceEngine.classroom(classroom, p4Pupils, attendance, assessments, progress)
        assertEquals(4, intelligence.pupilCount)
        assertEquals(28, intelligence.markedAttendance)
        assertEquals(79, intelligence.attendanceRate)
        assertEquals(61, intelligence.assessmentAverage)
        assertTrue(intelligence.commonGaps.any { it.objectiveId == "plant_parts" })
        assertEquals(listOf("pupil_musa", "pupil_tunde"), intelligence.attentionPupils.map { it.pupil.id })
        assertEquals(listOf("pupil_ngozi"), intelligence.improvingPupils.map { it.pupil.id })
    }

    @Test fun evidenceFingerprintChangesWhenAnAssessmentIsAdded() {
        val before = IntelligenceEngine.pupil(p4Pupils[3], attendance, assessments, progress)
        val extra = assessment("assessment_pupil_tunde_4", "pupil_tunde", "plant_parts", "Plant parts and functions", 45, "2026-11-27")
        val after = IntelligenceEngine.pupil(p4Pupils[3], attendance, assessments + extra, progress)
        assertEquals(35, before.assessments.average)
        assertEquals(37, after.assessments.average)
        assertNotEquals(before.evidenceIds, after.evidenceIds)
    }

    private fun pupil(id: String, name: String, code: String, classId: String) = PupilEntity(
        id = id,
        workspaceId = workspaceId,
        classId = classId,
        displayName = name,
        localCode = code,
        syncState = SyncState.LOCAL_ONLY,
        version = 1,
    )

    private fun attendance(pupilId: String, date: String, status: AttendanceStatus) = AttendanceEvidenceRow(
        pupilId = pupilId,
        status = status,
        schoolDate = date,
        classId = classP4,
    )

    private fun assessment(id: String, pupilId: String, objectiveId: String, objectiveLabel: String, score: Int, date: String) = AssessmentEntity(
        id = id,
        workspaceId = workspaceId,
        classId = classP4,
        pupilId = pupilId,
        subjectId = "basic_science",
        objectiveId = objectiveId,
        objectiveLabel = objectiveLabel,
        score = score.toDouble(),
        maxScore = 100.0,
        schoolDate = date,
        teacherNote = "Class exercise",
        createdAt = 0L,
        updatedAt = 0L,
    )

    private fun progress(id: String, pupilId: String, objectiveId: String, indicator: ProgressIndicator, note: String, end: String) = ProgressEntryEntity(
        id = id,
        workspaceId = workspaceId,
        pupilId = pupilId,
        classId = classP4,
        periodStart = "2026-11-16",
        periodEnd = end,
        subjectId = "basic_science",
        objectiveId = objectiveId,
        indicator = indicator,
        teacherNote = note,
        homeActivity = null,
        approvalStatus = ApprovalStatus.DRAFT,
        revision = 1,
        syncState = SyncState.LOCAL_ONLY,
        updatedAt = 0L,
    )
}
