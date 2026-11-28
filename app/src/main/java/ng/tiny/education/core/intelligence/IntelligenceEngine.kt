package ng.tiny.education.core.intelligence

import ng.tiny.education.core.database.AssessmentEntity
import ng.tiny.education.core.database.AttendanceEvidenceRow
import ng.tiny.education.core.database.ClassroomEntity
import ng.tiny.education.core.database.FollowUpEntity
import ng.tiny.education.core.database.ProgressEntryEntity
import ng.tiny.education.core.database.PupilEntity
import ng.tiny.education.core.model.AttendanceStatus
import ng.tiny.education.core.model.ProgressIndicator

enum class PupilIntelligenceStatus {
    INSUFFICIENT,
    NEEDS_ATTENTION,
    IMPROVING,
    STRONG,
    MAKING_PROGRESS,
}

enum class EvidenceConfidence { LOW, MEDIUM, HIGH }

data class AttendanceStats(
    val marked: Int = 0,
    val present: Int = 0,
    val absent: Int = 0,
    val late: Int = 0,
    val attended: Int = 0,
    val rate: Int = 0,
    val recentAbsences: Int = 0,
    val consecutiveAbsences: Int = 0,
    val lastDate: String? = null,
)

data class AssessmentStats(
    val count: Int = 0,
    val average: Int = 0,
    val latest: Int? = null,
    val trend: Int = 0,
    val belowSupport: List<AssessmentEntity> = emptyList(),
    val strong: List<AssessmentEntity> = emptyList(),
)

data class ObservationStats(
    val count: Int = 0,
    val doingWell: Int = 0,
    val developing: Int = 0,
    val needsSupport: Int = 0,
    val notAssessed: Int = 0,
    val approved: Int = 0,
    val latest: ProgressEntryEntity? = null,
    val recent: List<ProgressEntryEntity> = emptyList(),
)

data class PupilIntelligence(
    val pupil: PupilEntity,
    val status: PupilIntelligenceStatus,
    val statusReasonKeys: List<String>,
    val confidence: EvidenceConfidence,
    val attendance: AttendanceStats,
    val assessments: AssessmentStats,
    val observations: ObservationStats,
    val evidenceIds: List<String>,
    val strengths: List<String>,
    val needsAttention: List<String>,
    val nextActions: List<String>,
)

data class ClassGap(
    val objectiveId: String,
    val objectiveLabel: String,
    val average: Int,
    val pupilsBelow: Int,
    val supportObservations: Int,
)

data class ClassIntelligence(
    val classroom: ClassroomEntity,
    val pupilCount: Int,
    val attendanceRate: Int,
    val markedAttendance: Int,
    val assessmentAverage: Int,
    val assessmentCount: Int,
    val observationCount: Int,
    val commonGaps: List<ClassGap>,
    val strengths: List<ClassGap>,
    val attentionPupils: List<PupilIntelligence>,
    val improvingPupils: List<PupilIntelligence>,
    val strongPupils: List<PupilIntelligence>,
    val evidenceFingerprint: String,
    val coverage: EvidenceConfidence,
)

object IntelligenceEngine {
    fun pupil(
        pupil: PupilEntity,
        attendance: List<AttendanceEvidenceRow>,
        assessments: List<AssessmentEntity>,
        progress: List<ProgressEntryEntity>,
    ): PupilIntelligence {
        val pupilAttendance = attendance.filter { it.pupilId == pupil.id }.sortedBy { it.schoolDate }
        val present = pupilAttendance.count { it.status == AttendanceStatus.PRESENT }
        val absent = pupilAttendance.count { it.status == AttendanceStatus.ABSENT }
        val late = pupilAttendance.count { it.status == AttendanceStatus.LATE }
        val marked = present + absent + late
        val attended = present + late
        var consecutive = 0
        for (row in pupilAttendance.asReversed()) {
            if (row.status != AttendanceStatus.ABSENT) break
            consecutive += 1
        }
        val attendanceStats = AttendanceStats(
            marked = marked,
            present = present,
            absent = absent,
            late = late,
            attended = attended,
            rate = if (marked > 0) (attended * 100.0 / marked).toInt() else 0,
            recentAbsences = pupilAttendance.takeLast(7).count { it.status == AttendanceStatus.ABSENT },
            consecutiveAbsences = consecutive,
            lastDate = pupilAttendance.lastOrNull()?.schoolDate,
        )
        val pupilAssessments = assessments.filter { it.pupilId == pupil.id }.sortedBy { it.schoolDate }
        val scores = pupilAssessments.map { if (it.maxScore > 0) it.score / it.maxScore * 100.0 else 0.0 }
        val midpoint = scores.size / 2
        val earlier = scores.take(midpoint).averageOrZero()
        val later = scores.drop(midpoint).averageOrZero()
        val assessmentStats = AssessmentStats(
            count = pupilAssessments.size,
            average = scores.averageOrZero().toInt(),
            latest = scores.lastOrNull()?.toInt(),
            trend = if (scores.size >= 2) (later - earlier).toInt() else 0,
            belowSupport = pupilAssessments.filter { it.maxScore > 0 && it.score / it.maxScore < 0.5 },
            strong = pupilAssessments.filter { it.maxScore > 0 && it.score / it.maxScore >= 0.75 },
        )
        val pupilProgress = progress.filter { it.pupilId == pupil.id }.sortedByDescending { it.periodEnd }
        val observationStats = ObservationStats(
            count = pupilProgress.size,
            doingWell = pupilProgress.count { it.indicator == ProgressIndicator.DOING_WELL },
            developing = pupilProgress.count { it.indicator == ProgressIndicator.DEVELOPING },
            needsSupport = pupilProgress.count { it.indicator == ProgressIndicator.NEEDS_SUPPORT },
            notAssessed = pupilProgress.count { it.indicator == ProgressIndicator.NOT_ASSESSED },
            approved = pupilProgress.count { it.approvalStatus == ng.tiny.education.core.model.ApprovalStatus.APPROVED },
            latest = pupilProgress.firstOrNull(),
            recent = pupilProgress.take(3),
        )
        val reasons = mutableListOf<String>()
        val status = when {
            marked < 3 && pupilAssessments.size < 2 && pupilProgress.isEmpty() -> {
                reasons += "status_reason_insufficient"
                PupilIntelligenceStatus.INSUFFICIENT
            }
            attendanceStats.rate < 75 || (assessmentStats.count > 0 && assessmentStats.average < 45) || observationStats.needsSupport >= 2 -> {
                if (attendanceStats.rate < 75) reasons += "status_reason_attendance"
                if (assessmentStats.count > 0 && assessmentStats.average < 45) reasons += "status_reason_assessment"
                if (observationStats.needsSupport >= 2) reasons += "status_reason_observations"
                PupilIntelligenceStatus.NEEDS_ATTENTION
            }
            assessmentStats.trend >= 8 || (observationStats.needsSupport > 0 && observationStats.latest?.indicator == ProgressIndicator.DOING_WELL) -> {
                if (assessmentStats.trend >= 8) reasons += "status_reason_assessment_trend"
                if (observationStats.latest?.indicator == ProgressIndicator.DOING_WELL) reasons += "status_reason_recent_observation"
                PupilIntelligenceStatus.IMPROVING
            }
            attendanceStats.rate >= 90 && assessmentStats.average >= 75 && observationStats.needsSupport == 0 -> {
                reasons += "status_reason_strong_evidence"
                PupilIntelligenceStatus.STRONG
            }
            else -> {
                reasons += "status_reason_steady"
                PupilIntelligenceStatus.MAKING_PROGRESS
            }
        }
        val evidenceCount = marked + pupilAssessments.size + pupilProgress.size
        val confidence = when {
            evidenceCount >= 10 && pupilAssessments.size >= 2 && pupilProgress.size >= 2 -> EvidenceConfidence.HIGH
            evidenceCount >= 4 -> EvidenceConfidence.MEDIUM
            else -> EvidenceConfidence.LOW
        }
        val strengths = buildList {
            if (attendanceStats.rate >= 90) add("strength_attendance")
            if (assessmentStats.average >= 75) add("strength_assessment")
            if (observationStats.doingWell > 0) add("strength_observation")
            if (assessmentStats.trend > 0) add("strength_improving")
        }
        val needsAttention = buildList {
            if (attendanceStats.rate < 80) add("attention_attendance")
            if (assessmentStats.belowSupport.isNotEmpty()) add("attention_assessment")
            if (observationStats.needsSupport > 0) add("attention_observation")
            if (pupilAssessments.isEmpty()) add("attention_missing_assessments")
            if (pupilProgress.isEmpty()) add("attention_missing_observations")
        }
        val nextActions = buildList {
            if (attendanceStats.consecutiveAbsences >= 2 || attendanceStats.recentAbsences >= 2) add("action_contact_family")
            if (assessmentStats.belowSupport.isNotEmpty()) add("action_plan_support")
            if (pupilAssessments.isEmpty()) add("action_record_assessment")
            if (pupilProgress.isEmpty()) add("action_record_observation")
            if (isEmpty()) add("action_continue_monitoring")
        }
        val evidenceIds = attendance.filter { it.pupilId == pupil.id }.map { "attendance:${it.schoolDate}" } +
            pupilAssessments.map { it.id } + pupilProgress.map { it.id }
        return PupilIntelligence(
            pupil = pupil,
            status = status,
            statusReasonKeys = reasons,
            confidence = confidence,
            attendance = attendanceStats,
            assessments = assessmentStats,
            observations = observationStats,
            evidenceIds = evidenceIds,
            strengths = strengths,
            needsAttention = needsAttention,
            nextActions = nextActions,
        )
    }

    fun classroom(
        classroom: ClassroomEntity,
        pupils: List<PupilEntity>,
        attendance: List<AttendanceEvidenceRow>,
        assessments: List<AssessmentEntity>,
        progress: List<ProgressEntryEntity>,
    ): ClassIntelligence {
        val profiles = pupils.map { pupil(it, attendance, assessments, progress) }
        val classAttendance = attendance.filter { row -> pupils.any { it.id == row.pupilId } }
        val attended = classAttendance.count { it.status == AttendanceStatus.PRESENT || it.status == AttendanceStatus.LATE }
        val classAssessments = assessments.filter { it.classId == classroom.id }
        val average = classAssessments.map { if (it.maxScore > 0) it.score / it.maxScore * 100 else 0.0 }.averageOrZero()
        val gaps = mutableMapOf<String, MutableGap>()
        for (assessment in classAssessments) {
            val gap = gaps.getOrPut(assessment.objectiveId) { MutableGap(assessment.objectiveLabel) }
            if (assessment.maxScore > 0) gap.scores += assessment.score / assessment.maxScore * 100
        }
        for (entry in progress) {
            val objective = entry.objectiveId ?: continue
            val gap = gaps.getOrPut(objective) { MutableGap(objective.replace('_', ' ')) }
            if (entry.indicator == ProgressIndicator.NEEDS_SUPPORT) gap.support += 1
        }
        val classGaps = gaps.map { (id, gap) ->
            ClassGap(
                objectiveId = id,
                objectiveLabel = gap.label,
                average = gap.scores.averageOrZero().toInt(),
                pupilsBelow = gap.scores.count { it < 50 },
                supportObservations = gap.support,
            )
        }
        val commonGaps = classGaps.filter { (it.average in 1..54) || it.supportObservations >= 2 || it.pupilsBelow >= 2 }.sortedBy { it.average }.take(5)
        val strengths = classGaps.filter { it.average >= 70 && it.supportObservations == 0 }.sortedByDescending { it.average }.take(4)
        val evidenceCount = classAttendance.size + classAssessments.size + profiles.sumOf { it.observations.count }
        return ClassIntelligence(
            classroom = classroom,
            pupilCount = pupils.size,
            attendanceRate = if (classAttendance.isNotEmpty()) (attended * 100.0 / classAttendance.size).toInt() else 0,
            markedAttendance = classAttendance.size,
            assessmentAverage = average.toInt(),
            assessmentCount = classAssessments.size,
            observationCount = profiles.sumOf { it.observations.count },
            commonGaps = commonGaps,
            strengths = strengths,
            attentionPupils = profiles.filter { it.status == PupilIntelligenceStatus.NEEDS_ATTENTION },
            improvingPupils = profiles.filter { it.status == PupilIntelligenceStatus.IMPROVING },
            strongPupils = profiles.filter { it.status == PupilIntelligenceStatus.STRONG },
            evidenceFingerprint = buildString {
                append(classroom.id).append('|').append(evidenceCount)
                classAssessments.forEach { append('|').append(it.id) }
                profiles.forEach { append('|').append(it.evidenceIds.joinToString(",")) }
            },
            coverage = when {
                evidenceCount >= 25 -> EvidenceConfidence.HIGH
                evidenceCount >= 10 -> EvidenceConfidence.MEDIUM
                else -> EvidenceConfidence.LOW
            },
        )
    }

    fun pupilPrompt(profile: PupilIntelligence, task: String): String = buildString {
        appendLine("Task: $task.")
        appendLine("You are assisting a primary-school teacher in Nigeria. Return plain text only, at most 160 English words.")
        appendLine("Use only the evidence below. Do not invent events, grades, diagnoses, family details or another pupil. Do not name the pupil. Distinguish facts from suggested actions.")
        appendLine("Attendance: ${profile.attendance.marked} marked; present ${profile.attendance.present}, late ${profile.attendance.late}, absent ${profile.attendance.absent}, rate ${profile.attendance.rate}%, consecutive absences ${profile.attendance.consecutiveAbsences}.")
        appendLine("Assessment: ${profile.assessments.count} records; average ${profile.assessments.average}%; latest ${profile.assessments.latest ?: "none"}; change ${profile.assessments.trend}.")
        appendLine("Deterministic status: ${profile.status}. Do not override the attendance percentage or status calculation.")
        appendLine("Recent teacher observations (names redacted):")
        profile.observations.recent.forEach {
            appendLine("- ${it.periodEnd}, ${it.subjectId}: ${it.indicator}. ${redact(it.teacherNote ?: "")}")
        }
    }

    fun classPrompt(intelligence: ClassIntelligence, task: String): String = buildString {
        appendLine("Task: $task.")
        appendLine("You are assisting a primary-school teacher in Nigeria. Return plain text only, at most 160 English words.")
        appendLine("Use only the aggregate evidence below. Do not invent individual pupil facts, grades, diagnoses or another class.")
        appendLine("Class: ${intelligence.classroom.gradeLevel} ${intelligence.classroom.label}; ${intelligence.pupilCount} pupils.")
        appendLine("Attendance: ${intelligence.markedAttendance} marked entries; rate ${intelligence.attendanceRate}%.")
        appendLine("Assessment: ${intelligence.assessmentCount} records; average ${intelligence.assessmentAverage}%.")
        appendLine("Observations: ${intelligence.observationCount}.")
        appendLine("Common gaps: " + intelligence.commonGaps.joinToString("; ") { "${it.objectiveLabel} (${it.average}%, ${it.pupilsBelow} below 50%)" })
        appendLine("Strengths: " + intelligence.strengths.joinToString("; ") { it.objectiveLabel })
        appendLine("Pupils needing attention (count only): ${intelligence.attentionPupils.size}.")
    }

    fun deterministicPupilReview(profile: PupilIntelligence): String {
        val attendance = if (profile.attendance.marked > 0) {
            "Attendance is ${profile.attendance.rate}% across ${profile.attendance.marked} marked sessions (${profile.attendance.absent} absent, ${profile.attendance.late} late)."
        } else "There is not enough attendance evidence yet."
        val assessment = if (profile.assessments.count > 0) {
            "The average assessment result is ${profile.assessments.average}%; the latest is ${profile.assessments.latest}% and the trend is ${profile.assessments.trend} points."
        } else "No assessment evidence has been recorded."
        val observation = profile.observations.latest?.let {
            "The latest observation is \"${it.teacherNote.orEmpty()}\" with an indicator of ${it.indicator.name.lowercase().replace('_', ' ')}."
        } ?: "No teacher observation has been recorded."
        return "$attendance $assessment $observation\n\nSuggested next step: ${profile.nextActions.firstOrNull()?.replace('_', ' ')}. This is a deterministic summary of recorded evidence, not a model response."
    }

    fun deterministicParentDraft(profile: PupilIntelligence, subjectLabel: String): String = buildString {
        if (profile.attendance.marked > 0) appendLine("Your child attended ${profile.attendance.attended} of ${profile.attendance.marked} recorded school days this period.\n")
        if (profile.assessments.count > 0) {
            appendLine("In $subjectLabel, the recent assessment average is ${profile.assessments.average}%.")
            if (profile.assessments.trend >= 8) appendLine("Recent results show improvement.")
            else if (profile.assessments.average < 50) appendLine("We will give additional practice in the next lessons.")
            appendLine()
        }
        profile.observations.latest?.teacherNote?.let { appendLine("Teacher observation: $it\n") }
        profile.observations.latest?.homeActivity?.let { appendLine("At home, you can help with: $it\n") }
        if (isEmpty()) appendLine("There is not enough recorded evidence for a detailed update yet. We will contact you after the next classroom check.\n")
        appendLine("Please reply if you would like to discuss this update with the teacher.")
    }

    fun deterministicClassReview(intelligence: ClassIntelligence): String {
        val gaps = if (intelligence.commonGaps.isNotEmpty()) {
            "The clearest shared gaps are ${intelligence.commonGaps.joinToString { "${it.objectiveLabel} (average ${it.average}%)" }}."
        } else "No shared learning gap is yet supported by enough evidence."
        return "Attendance is ${intelligence.attendanceRate}% across ${intelligence.markedAttendance} marked entries. The assessment average is ${intelligence.assessmentAverage}% from ${intelligence.assessmentCount} records. $gaps ${intelligence.attentionPupils.size} pupil(s) have evidence needing attention and ${intelligence.improvingPupils.size} show improvement. This is a deterministic class summary, not a model response."
    }

    fun deterministicLessonPlan(intelligence: ClassIntelligence): List<Pair<String, String>> {
        val gap = intelligence.commonGaps.firstOrNull()?.objectiveLabel ?: "the current learning objective"
        return listOf(
            "Objective" to "Re-teach $gap with concrete examples and check understanding.",
            "Prior knowledge" to "Use the pupils' recorded examples and the previous lesson's exit ticket.",
            "Engage" to "Start with a local object, picture or short story connected to the gap.",
            "Explore" to "Pairs sort or match examples before the formal explanation.",
            "Explain" to "Model the key vocabulary and connect it to what pupils noticed.",
            "Elaborate" to "Apply the idea in a new everyday context.",
            "Evaluate" to "A short oral or written check with three questions.",
            "Support" to "Give pupils with the lowest recorded scores a concrete prompt and one extra guided example.",
            "Follow-up" to "Re-check the objective in the next lesson and record a short observation.",
        )
    }

    fun followUpSuggestions(pupils: List<PupilEntity>, profiles: List<PupilIntelligence>): List<FollowUpSuggestion> {
        val result = mutableListOf<FollowUpSuggestion>()
        for (profile in profiles) {
            if (profile.attendance.rate < 80) result += FollowUpSuggestion(profile.pupil.id, profile.pupil.classId, "suggest_attendance_title", "suggest_attendance_detail", "attendance")
            if (profile.assessments.count > 0 && profile.assessments.average < 50) result += FollowUpSuggestion(profile.pupil.id, profile.pupil.classId, "suggest_assessment_title", "suggest_assessment_detail", "assessment")
            if (profile.observations.needsSupport >= 2) result += FollowUpSuggestion(profile.pupil.id, profile.pupil.classId, "suggest_observation_title", "suggest_observation_detail", "observation")
        }
        return result
    }

    private fun redact(value: String): String = value
        .replace(Regex("\\+?\\d[\\d\\s-]{7,}\\d"), "[phone hidden]")
        .replace(Regex("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"), "[email hidden]")
        .take(600)
}

data class FollowUpSuggestion(
    val pupilId: String,
    val classId: String,
    val titleKey: String,
    val detailKey: String,
    val source: String,
)

private class MutableGap(val label: String) {
    val scores = mutableListOf<Double>()
    var support = 0
}

private fun List<Double>.averageOrZero(): Double = if (isEmpty()) 0.0 else sum() / size
