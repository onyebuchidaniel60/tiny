package ng.tiny.education.data

import ng.tiny.education.core.database.AssessmentEntity
import ng.tiny.education.core.database.AttendanceEntryEntity
import ng.tiny.education.core.database.AttendanceSessionEntity
import ng.tiny.education.core.database.AuditEventEntity
import ng.tiny.education.core.database.ClassroomEntity
import ng.tiny.education.core.database.ConversationEntity
import ng.tiny.education.core.database.FollowUpEntity
import ng.tiny.education.core.database.GuardianEntity
import ng.tiny.education.core.database.LessonPlanEntity
import ng.tiny.education.core.database.MessageEntity
import ng.tiny.education.core.database.OutboxCommandEntity
import ng.tiny.education.core.database.ProgressEntryEntity
import ng.tiny.education.core.database.PupilEntity
import ng.tiny.education.core.database.PupilGuardianLinkEntity
import ng.tiny.education.core.database.TinyDao
import ng.tiny.education.core.database.WorkspaceEntity
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
import java.util.UUID

object DemoIds {
    const val WORKSPACE = "ws_kofar_primary"
    const val CLASS_P4 = "class_p4_blue"
    const val CLASS_P5 = "class_p5_gold"
    const val AMINA = "pupil_amina"
    const val MUSA = "pupil_musa"
    const val NGOZI = "pupil_ngozi"
    const val TUNDE = "pupil_tunde"
    const val FATIMA = "pupil_fatima"
    const val EMEKA = "pupil_emeka"
    const val ZAINAB = "pupil_zainab"
    const val IBRAHIM = "pupil_ibrahim"
    const val GUARDIAN_AMINA = "guardian_amina"
    const val GUARDIAN_MUSA = "guardian_musa"
    const val GUARDIAN_FATIMA = "guardian_fatima"
    const val GUARDIAN_EMEKA = "guardian_emeka"
    const val CONVERSATION_AMINA = "conversation_amina"
    const val CONVERSATION_FATIMA = "conversation_fatima"
    const val LESSON_WATER = "lesson_water"
    const val LESSON_PLANTS = "lesson_plants"
    const val LESSON_MAP = "lesson_map"
}

/**
 * Canonical synthetic workspace. The web seed uses the same stable IDs and
 * logical records; see shared/demo/CANONICAL_DATASET.md.
 */
object DemoData {
    private const val NOW = 1_795_766_400_000L // 2026-11-27T08:00:00Z

    suspend fun seedIfEmpty(dao: TinyDao) {
        dao.renameWorkspace("Kofar Demo Primary", "Kofar Primary")
        if (dao.workspaceCount() > 0) return
        dao.upsertWorkspace(
            WorkspaceEntity(
                id = DemoIds.WORKSPACE,
                name = "Kofar Primary",
                type = WorkspaceType.SCHOOL,
                schoolCode = "KOFAR001",
                verificationStatus = VerificationStatus.ACTIVE_UNVERIFIED,
                syncState = SyncState.LOCAL_ONLY,
                version = 1,
                updatedAt = NOW,
            ),
        )
        dao.upsertClasses(
            listOf(
                ClassroomEntity(DemoIds.CLASS_P4, DemoIds.WORKSPACE, "P4", "Blue", "2026/2027", "Basic Science · Mathematics · English", "Ms. Bello", SyncState.LOCAL_ONLY, 1),
                ClassroomEntity(DemoIds.CLASS_P5, DemoIds.WORKSPACE, "P5", "Gold", "2026/2027", "Basic Science · Social Studies", "Ms. Bello", SyncState.LOCAL_ONLY, 1),
            ),
        )
        val pupils = listOf(
            PupilEntity(DemoIds.AMINA, DemoIds.WORKSPACE, DemoIds.CLASS_P4, "Amina Bello", "KOF001", syncState = SyncState.LOCAL_ONLY, version = 1),
            PupilEntity(DemoIds.MUSA, DemoIds.WORKSPACE, DemoIds.CLASS_P4, "Musa Ibrahim", "KOF002", syncState = SyncState.LOCAL_ONLY, version = 1),
            PupilEntity(DemoIds.NGOZI, DemoIds.WORKSPACE, DemoIds.CLASS_P4, "Ngozi Okafor", "KOF003", syncState = SyncState.LOCAL_ONLY, version = 1),
            PupilEntity(DemoIds.TUNDE, DemoIds.WORKSPACE, DemoIds.CLASS_P4, "Tunde Adeyemi", "KOF004", syncState = SyncState.LOCAL_ONLY, version = 1),
            PupilEntity(DemoIds.FATIMA, DemoIds.WORKSPACE, DemoIds.CLASS_P5, "Fatima Sani", "KOF005", syncState = SyncState.LOCAL_ONLY, version = 1),
            PupilEntity(DemoIds.EMEKA, DemoIds.WORKSPACE, DemoIds.CLASS_P5, "Emeka Nwosu", "KOF006", syncState = SyncState.LOCAL_ONLY, version = 1),
            PupilEntity(DemoIds.ZAINAB, DemoIds.WORKSPACE, DemoIds.CLASS_P5, "Zainab Bello", "KOF007", syncState = SyncState.LOCAL_ONLY, version = 1),
            PupilEntity(DemoIds.IBRAHIM, DemoIds.WORKSPACE, DemoIds.CLASS_P5, "Ibrahim Musa", "KOF008", syncState = SyncState.LOCAL_ONLY, version = 1),
        )
        dao.upsertPupils(pupils)
        dao.upsertGuardians(
            listOf(
                GuardianEntity(DemoIds.GUARDIAN_AMINA, DemoIds.WORKSPACE, "Mrs. Bello", "+2348000000011", "en", GuardianVerificationStatus.VERIFIED, ConsentStatus.OPTED_IN, SyncState.LOCAL_ONLY),
                GuardianEntity(DemoIds.GUARDIAN_MUSA, DemoIds.WORKSPACE, "Mr. Ibrahim", "+2348000000012", "ha", GuardianVerificationStatus.VERIFIED, ConsentStatus.OPTED_IN, SyncState.LOCAL_ONLY),
                GuardianEntity(DemoIds.GUARDIAN_FATIMA, DemoIds.WORKSPACE, "Mrs. Sani", "+2348000000013", "en", GuardianVerificationStatus.VERIFIED, ConsentStatus.OPTED_IN, SyncState.LOCAL_ONLY),
                GuardianEntity(DemoIds.GUARDIAN_EMEKA, DemoIds.WORKSPACE, "Mr. Nwosu", "+2348000000014", "ig", GuardianVerificationStatus.PENDING, ConsentStatus.NOT_RECORDED, SyncState.LOCAL_ONLY),
            ),
        )
        dao.upsertLinks(
            listOf(
                PupilGuardianLinkEntity("link_amina", DemoIds.WORKSPACE, DemoIds.AMINA, DemoIds.GUARDIAN_AMINA, "Mother", true),
                PupilGuardianLinkEntity("link_musa", DemoIds.WORKSPACE, DemoIds.MUSA, DemoIds.GUARDIAN_MUSA, "Father", true),
                PupilGuardianLinkEntity("link_ngozi", DemoIds.WORKSPACE, DemoIds.NGOZI, DemoIds.GUARDIAN_MUSA, "Father", true),
                PupilGuardianLinkEntity("link_tunde", DemoIds.WORKSPACE, DemoIds.TUNDE, DemoIds.GUARDIAN_MUSA, "Family contact", true),
                PupilGuardianLinkEntity("link_fatima", DemoIds.WORKSPACE, DemoIds.FATIMA, DemoIds.GUARDIAN_FATIMA, "Mother", true),
                PupilGuardianLinkEntity("link_emeka", DemoIds.WORKSPACE, DemoIds.EMEKA, DemoIds.GUARDIAN_EMEKA, "Father", true),
                PupilGuardianLinkEntity("link_ibrahim", DemoIds.WORKSPACE, DemoIds.IBRAHIM, DemoIds.GUARDIAN_EMEKA, "Father", true),
            ),
        )

        val p4Attendance = mapOf(
            "2026-11-17" to listOf(AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.PRESENT, AttendanceStatus.LATE),
            "2026-11-18" to listOf(AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT),
            "2026-11-19" to listOf(AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT),
            "2026-11-20" to listOf(AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE, AttendanceStatus.LATE),
            "2026-11-24" to listOf(AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT),
            "2026-11-25" to listOf(AttendanceStatus.LATE, AttendanceStatus.ABSENT, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT),
            "2026-11-26" to listOf(AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT),
        )
        val p4Pupils = listOf(DemoIds.AMINA, DemoIds.MUSA, DemoIds.NGOZI, DemoIds.TUNDE)
        val p5Pupils = listOf(DemoIds.FATIMA, DemoIds.EMEKA, DemoIds.ZAINAB, DemoIds.IBRAHIM)
        for ((date, statuses) in p4Attendance) {
            val sessionId = "${DemoIds.CLASS_P4}_$date"
            dao.upsertAttendanceSession(
                AttendanceSessionEntity(sessionId, DemoIds.WORKSPACE, DemoIds.CLASS_P4, date, AttendanceSessionStatus.SUBMITTED, NOW, null, SyncState.PENDING_SYNC, 1),
            )
            dao.upsertAttendanceEntries(p4Pupils.mapIndexed { index, pupilId -> AttendanceEntryEntity("${sessionId}_$pupilId", sessionId, pupilId, statuses[index]) })
        }
        val p5Dates = listOf("2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-24", "2026-11-25", "2026-11-26")
        p5Dates.forEachIndexed { index, date ->
            val sessionId = "${DemoIds.CLASS_P5}_$date"
            val statuses = listOf(
                AttendanceStatus.PRESENT,
                if (index % 3 == 1) AttendanceStatus.ABSENT else AttendanceStatus.PRESENT,
                AttendanceStatus.PRESENT,
                if (index % 4 == 3) AttendanceStatus.LATE else AttendanceStatus.PRESENT,
            )
            dao.upsertAttendanceSession(
                AttendanceSessionEntity(sessionId, DemoIds.WORKSPACE, DemoIds.CLASS_P5, date, AttendanceSessionStatus.SUBMITTED, NOW, null, SyncState.PENDING_SYNC, 1),
            )
            dao.upsertAttendanceEntries(p5Pupils.mapIndexed { pupilIndex, pupilId -> AttendanceEntryEntity("${sessionId}_$pupilId", sessionId, pupilId, statuses[pupilIndex]) })
        }

        val assessments = mutableListOf<AssessmentEntity>()
        fun assessment(pupilId: String, classId: String, subjectId: String, objectiveId: String, objectiveLabel: String, scores: List<Int>, dates: List<String>) {
            scores.forEachIndexed { index, score ->
                assessments += AssessmentEntity(
                    id = "assessment_${pupilId}_${index + 1}",
                    workspaceId = DemoIds.WORKSPACE,
                    classId = classId,
                    pupilId = pupilId,
                    subjectId = subjectId,
                    objectiveId = objectiveId,
                    objectiveLabel = objectiveLabel,
                    score = score.toDouble(),
                    maxScore = 100.0,
                    schoolDate = dates[index],
                    teacherNote = if (index == scores.lastIndex) "End-of-week check" else "Class exercise",
                    createdAt = NOW,
                    updatedAt = NOW,
                )
            }
        }
        val dates = listOf("2026-11-06", "2026-11-13", "2026-11-20")
        assessment(DemoIds.AMINA, DemoIds.CLASS_P4, "basic_science", "water_sources", "Water sources and uses", listOf(82, 88, 90), dates)
        assessment(DemoIds.MUSA, DemoIds.CLASS_P4, "basic_science", "water_sources", "Water sources and uses", listOf(42, 51, 60), dates)
        assessment(DemoIds.NGOZI, DemoIds.CLASS_P4, "basic_science", "plant_parts", "Plant parts and functions", listOf(62, 70, 78), dates)
        assessment(DemoIds.TUNDE, DemoIds.CLASS_P4, "basic_science", "plant_parts", "Plant parts and functions", listOf(35, 31, 38), dates)
        assessment(DemoIds.FATIMA, DemoIds.CLASS_P5, "social_studies", "map_reading", "Map reading and directions", listOf(80, 84, 86), dates)
        assessment(DemoIds.EMEKA, DemoIds.CLASS_P5, "social_studies", "map_reading", "Map reading and directions", listOf(38, 44, 47), dates)
        assessment(DemoIds.ZAINAB, DemoIds.CLASS_P5, "social_studies", "community", "Community responsibilities", listOf(72, 76, 79), dates)
        assessment(DemoIds.IBRAHIM, DemoIds.CLASS_P5, "social_studies", "community", "Community responsibilities", listOf(55, 52, 58), dates)
        dao.upsertAssessments(assessments)

        val progress = listOf(
            progress("progress_amina_1", DemoIds.AMINA, DemoIds.CLASS_P4, "basic_science", "water_sources", ProgressIndicator.DOING_WELL, "Amina explained three water sources and helped her group sort picture cards.", "Ask Amina to teach a younger sibling one water-saving habit.", ApprovalStatus.APPROVED, "2026-11-16", "2026-11-20"),
            progress("progress_amina_2", DemoIds.AMINA, DemoIds.CLASS_P4, "basic_science", "plant_parts", ProgressIndicator.DOING_WELL, "Amina labelled roots, stem and leaf correctly and explained the leaf function.", "Ask Amina to find one plant at home and name two parts.", ApprovalStatus.APPROVED, "2026-11-23", "2026-11-27"),
            progress("progress_musa_1", DemoIds.MUSA, DemoIds.CLASS_P4, "basic_science", "water_sources", ProgressIndicator.DEVELOPING, "Musa names sources with prompting and is gaining confidence in group work.", "Practise naming one water source at home each evening.", ApprovalStatus.DRAFT, "2026-11-16", "2026-11-20"),
            progress("progress_musa_2", DemoIds.MUSA, DemoIds.CLASS_P4, "basic_science", "plant_parts", ProgressIndicator.DEVELOPING, "Musa matched two plant parts correctly after a second demonstration.", "Draw one plant and label the leaf and root.", ApprovalStatus.DRAFT, "2026-11-23", "2026-11-27"),
            progress("progress_ngozi_1", DemoIds.NGOZI, DemoIds.CLASS_P4, "basic_science", "plant_parts", ProgressIndicator.DEVELOPING, "Ngozi participates well orally but needs support writing full explanations.", "Ask Ngozi to explain one plant part to a family member.", ApprovalStatus.DRAFT, "2026-11-23", "2026-11-27"),
            progress("progress_tunde_1", DemoIds.TUNDE, DemoIds.CLASS_P4, "basic_science", "plant_parts", ProgressIndicator.NEEDS_SUPPORT, "Tunde is still confusing roots and stems; he responded well to a picture prompt.", "Practise naming two plant parts using a leaf or plant at home.", ApprovalStatus.DRAFT, "2026-11-23", "2026-11-27"),
            progress("progress_fatima_1", DemoIds.FATIMA, DemoIds.CLASS_P5, "social_studies", "map_reading", ProgressIndicator.DOING_WELL, "Fatima used the map key accurately and gave clear directions.", "Draw a simple map of the route home.", ApprovalStatus.APPROVED, "2026-11-16", "2026-11-20"),
            progress("progress_emeka_1", DemoIds.EMEKA, DemoIds.CLASS_P5, "social_studies", "map_reading", ProgressIndicator.NEEDS_SUPPORT, "Emeka can identify the key but needs help ordering directions.", "Practise left and right, then north and south, on a short walk.", ApprovalStatus.DRAFT, "2026-11-23", "2026-11-27"),
            progress("progress_zainab_1", DemoIds.ZAINAB, DemoIds.CLASS_P5, "social_studies", "community", ProgressIndicator.DOING_WELL, "Zainab described two community responsibilities with clear examples.", "Ask Zainab to name one responsibility at home and one at school.", ApprovalStatus.APPROVED, "2026-11-16", "2026-11-20"),
            progress("progress_ibrahim_1", DemoIds.IBRAHIM, DemoIds.CLASS_P5, "social_studies", "community", ProgressIndicator.DEVELOPING, "Ibrahim contributed one example and listened carefully to others.", "Ask Ibrahim to name one service in the community.", ApprovalStatus.DRAFT, "2026-11-23", "2026-11-27"),
        )
        progress.forEach { dao.upsertProgress(it) }

        dao.upsertFollowUp(
            FollowUpEntity(
                "followup_musa_attendance", DemoIds.WORKSPACE, DemoIds.CLASS_P4, DemoIds.MUSA,
                "Check Musa attendance pattern",
                "Musa has missed three of the last seven school days. Confirm the reason with the family and record the outcome.",
                "2026-11-30", "open", "attendance", null, NOW, null,
            ),
        )
        dao.upsertFollowUp(
            FollowUpEntity(
                "followup_tunde_support", DemoIds.WORKSPACE, DemoIds.CLASS_P4, DemoIds.TUNDE,
                "Plan a plant-parts support activity",
                "Tunde is still confusing roots and stems. Prepare a concrete sorting activity and check again next week.",
                "2026-12-01", "open", "assessment", "assessment_${DemoIds.TUNDE}_3", NOW, null,
            ),
        )
        dao.upsertFollowUp(
            FollowUpEntity(
                "followup_emeka_map", DemoIds.WORKSPACE, DemoIds.CLASS_P5, DemoIds.EMEKA,
                "Follow up map directions",
                "Emeka can read the key but needs support with direction order. Use a short route activity.",
                "2026-12-01", "open", "observation", "progress_emeka_1", NOW, null,
            ),
        )
        dao.upsertFollowUp(
            FollowUpEntity(
                "followup_fatima_digest", DemoIds.WORKSPACE, DemoIds.CLASS_P5, DemoIds.FATIMA,
                "Review Fatima digest wording",
                "The approved map-reading observation is ready for the next family digest.",
                "2026-11-28", "open", "manual", null, NOW, null,
            ),
        )

        dao.upsertLessonPlans(
            listOf(
                LessonPlanEntity(
                    DemoIds.LESSON_WATER, DemoIds.WORKSPACE, DemoIds.CLASS_P4, "P4", "basic_science", "Sources and uses of water",
                    "Pupils identify sources of water and explain three uses in daily life.", 40,
                    "Cup of water, picture cards, chalkboard",
                    "Pupils have seen rain, wells and taps in their community.",
                    "Show a cup of water. Ask: where did this water come from? Collect three answers.",
                    "Small groups sort picture cards into sources and uses of water.",
                    "Guide pupils to name sources and connect water to drinking, cooking, washing and farming.",
                    "Ask pupils to draw one source and one use they saw near their home.",
                    "Exit ticket: name two sources and two uses of water.",
                    LessonStatus.SAVED, SyncState.LOCAL_ONLY, NOW,
                ),
                LessonPlanEntity(
                    DemoIds.LESSON_PLANTS, DemoIds.WORKSPACE, DemoIds.CLASS_P4, "P4", "basic_science", "Plant parts and functions",
                    "Pupils name the main parts of a plant and describe one function of each.", 40,
                    "Leaf, plant diagram, chalkboard",
                    "Pupils have seen leaves, roots and flowers near their homes.",
                    "Pass around a leaf and ask what job it does for the plant.",
                    "Groups label a simple plant diagram.",
                    "Discuss roots, stem, leaf and flower with local examples.",
                    "Pupils match plant parts to the jobs they do.",
                    "One-minute misconception check.",
                    LessonStatus.SAVED, SyncState.LOCAL_ONLY, NOW,
                ),
                LessonPlanEntity(
                    DemoIds.LESSON_MAP, DemoIds.WORKSPACE, DemoIds.CLASS_P5, "P5", "social_studies", "Reading a simple map",
                    "Pupils use a key and compass directions to describe a route.", 40,
                    "Simple map, ruler, chalkboard",
                    "Pupils know the route from school to the market.",
                    "Ask pupils to describe the route from school to the market.",
                    "Pairs trace a route on a simple map.",
                    "Introduce key, north, south, east and west.",
                    "Groups give directions from the school gate to the classroom.",
                    "Draw and label one route.",
                    LessonStatus.SAVED, SyncState.LOCAL_ONLY, NOW,
                ),
            ),
        )
        dao.upsertConversations(
            listOf(
                ConversationEntity(DemoIds.CONVERSATION_AMINA, DemoIds.WORKSPACE, DemoIds.GUARDIAN_AMINA, DemoIds.AMINA, ConversationStatus.WAITING_TEACHER, NOW - 3_600_000, 1),
                ConversationEntity(DemoIds.CONVERSATION_FATIMA, DemoIds.WORKSPACE, DemoIds.GUARDIAN_FATIMA, DemoIds.FATIMA, ConversationStatus.WAITING_PARENT, NOW - 86_400_000, 0),
            ),
        )
        dao.upsertMessages(
            listOf(
                MessageEntity("msg_amina_1", DemoIds.CONVERSATION_AMINA, MessageDirection.INBOUND, MessageSenderType.GUARDIAN, "Good morning. Amina will be a little late today.", "en", MessageStatus.RECEIVED, NOW - 3_600_000),
                MessageEntity("msg_amina_2", DemoIds.CONVERSATION_AMINA, MessageDirection.OUTBOUND, MessageSenderType.TEACHER, "Thank you for letting me know. I will mark Amina late.", "en", MessageStatus.ACCEPTED, NOW - 3_500_000),
                MessageEntity("msg_fatima_1", DemoIds.CONVERSATION_FATIMA, MessageDirection.OUTBOUND, MessageSenderType.TEACHER, "Fatima did well with map reading today.", "en", MessageStatus.ACCEPTED, NOW - 86_400_000),
            ),
        )
        dao.upsertOutbox(
            OutboxCommandEntity(
                id = UUID.randomUUID().toString(),
                workspaceId = DemoIds.WORKSPACE,
                commandType = "attendance.submit",
                schemaVersion = 1,
                payloadJson = """{"classId":"${DemoIds.CLASS_P4}","schoolDate":"2026-11-26"}""",
                idempotencyKey = "demo-attendance-2026-11-26",
                createdAt = NOW - 86_000_000,
                attempts = 0,
                nextAttemptAt = null,
                syncState = SyncState.PENDING_SYNC,
                lastError = null,
            ),
        )
        dao.insertAudit(
            AuditEventEntity(
                id = UUID.randomUUID().toString(),
                workspaceId = DemoIds.WORKSPACE,
                action = "demo.seeded",
                resourceType = "workspace",
                resourceId = DemoIds.WORKSPACE,
                summary = "Canonical sample workspace seeded locally.",
                createdAt = NOW,
            ),
        )
    }

    private fun progress(
        id: String,
        pupilId: String,
        classId: String,
        subjectId: String,
        objectiveId: String,
        indicator: ProgressIndicator,
        note: String,
        homeActivity: String,
        approval: ApprovalStatus,
        start: String,
        end: String,
    ) = ProgressEntryEntity(
        id = id,
        workspaceId = DemoIds.WORKSPACE,
        pupilId = pupilId,
        classId = classId,
        periodStart = start,
        periodEnd = end,
        subjectId = subjectId,
        objectiveId = objectiveId,
        indicator = indicator,
        teacherNote = note,
        homeActivity = homeActivity,
        approvalStatus = approval,
        revision = 1,
        syncState = SyncState.LOCAL_ONLY,
        updatedAt = NOW,
    )
}
