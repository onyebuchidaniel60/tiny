package ng.tiny.education.data

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
import ng.tiny.education.core.database.PupilGuardianLinkEntity
import ng.tiny.education.core.database.TinyDao
import ng.tiny.education.core.database.WorkspaceEntity
import ng.tiny.education.core.domain.AttendanceRules
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
import java.time.LocalDate
import java.util.UUID

object DemoIds {
    const val WORKSPACE = "ws_kofar_demo"
    const val CLASS_P4 = "class_p4_blue"
    const val CLASS_P5 = "class_p5_gold"
    const val AMINA = "pupil_amina"
    const val MUSA = "pupil_musa"
    const val GRACE = "pupil_grace"
    const val IBRAHIM = "pupil_ibrahim"
    const val HALIMA = "pupil_halima"
    const val SAMUEL = "pupil_samuel"
    const val GUARDIAN_AMINA = "guardian_amina_family"
    const val GUARDIAN_MUSA = "guardian_musa_father"
    const val GUARDIAN_SHARED = "guardian_shared_family"
    const val CONVERSATION_AMINA = "conversation_amina"
    const val CONVERSATION_MUSA = "conversation_musa"
    const val LESSON_WATER = "lesson_water_p4"
    const val LESSON_PLACE = "lesson_place_p5"
}

object DemoData {
    suspend fun seedIfEmpty(dao: TinyDao) {
        // Remove the old evaluation-only label from devices that already have
        // the local sample workspace. The data itself is unchanged.
        dao.renameWorkspace("Kofar Demo Primary", "Kofar Primary")
        if (dao.workspaceCount() > 0) return
        val now = System.currentTimeMillis()
        val today = LocalDate.now()
        val yesterday = today.minusDays(1).toString()

        dao.upsertWorkspace(
            WorkspaceEntity(
                id = DemoIds.WORKSPACE,
                name = "Kofar Primary",
                type = WorkspaceType.SCHOOL,
                schoolCode = "KOFAR001",
                verificationStatus = VerificationStatus.ACTIVE_UNVERIFIED,
                syncState = SyncState.LOCAL_ONLY,
                version = 1,
                updatedAt = now,
            ),
        )

        dao.upsertClasses(
            listOf(
                ClassroomEntity(
                    id = DemoIds.CLASS_P4,
                    workspaceId = DemoIds.WORKSPACE,
                    gradeLevel = "P4",
                    label = "Blue",
                    academicYear = "2026/2027",
                    subjectSummary = "Basic Science · Mathematics · English",
                    teacherName = "Ms. Bello",
                    syncState = SyncState.LOCAL_ONLY,
                    version = 1,
                ),
                ClassroomEntity(
                    id = DemoIds.CLASS_P5,
                    workspaceId = DemoIds.WORKSPACE,
                    gradeLevel = "P5",
                    label = "Gold",
                    academicYear = "2026/2027",
                    subjectSummary = "Basic Science · Social Studies · English",
                    teacherName = "Ms. Bello",
                    syncState = SyncState.LOCAL_ONLY,
                    version = 1,
                ),
            ),
        )

        val pupils = listOf(
            PupilEntity(DemoIds.AMINA, DemoIds.WORKSPACE, DemoIds.CLASS_P4, "Amina Bello", "P4-014", syncState = SyncState.LOCAL_ONLY, version = 1),
            PupilEntity(DemoIds.MUSA, DemoIds.WORKSPACE, DemoIds.CLASS_P4, "Musa Ibrahim", "P4-015", syncState = SyncState.LOCAL_ONLY, version = 1),
            PupilEntity(DemoIds.GRACE, DemoIds.WORKSPACE, DemoIds.CLASS_P4, "Grace Adamu", "P4-016", syncState = SyncState.LOCAL_ONLY, version = 1),
            PupilEntity(DemoIds.IBRAHIM, DemoIds.WORKSPACE, DemoIds.CLASS_P4, "Ibrahim Sani", "P4-017", syncState = SyncState.LOCAL_ONLY, version = 1),
            PupilEntity(DemoIds.HALIMA, DemoIds.WORKSPACE, DemoIds.CLASS_P5, "Halima Yusuf", "P5-004", syncState = SyncState.LOCAL_ONLY, version = 1),
            PupilEntity(DemoIds.SAMUEL, DemoIds.WORKSPACE, DemoIds.CLASS_P5, "Samuel Okafor", "P5-005", syncState = SyncState.LOCAL_ONLY, version = 1),
        )
        dao.upsertPupils(pupils)

        val guardians = listOf(
            GuardianEntity(DemoIds.GUARDIAN_AMINA, DemoIds.WORKSPACE, "Amina's family", "+2348000000001", "en", GuardianVerificationStatus.VERIFIED, ConsentStatus.OPTED_IN, SyncState.LOCAL_ONLY),
            GuardianEntity(DemoIds.GUARDIAN_MUSA, DemoIds.WORKSPACE, "Musa's father", "+2348000000002", "ha", GuardianVerificationStatus.VERIFIED, ConsentStatus.OPTED_IN, SyncState.LOCAL_ONLY),
            GuardianEntity(DemoIds.GUARDIAN_SHARED, DemoIds.WORKSPACE, "Shared family contact", "+2348000000003", "yo", GuardianVerificationStatus.PENDING, ConsentStatus.NOT_RECORDED, SyncState.LOCAL_ONLY),
        )
        dao.upsertGuardians(guardians)
        dao.upsertLinks(
            listOf(
                PupilGuardianLinkEntity("link_amina", DemoIds.WORKSPACE, DemoIds.AMINA, DemoIds.GUARDIAN_AMINA, "Parent", true),
                PupilGuardianLinkEntity("link_musa", DemoIds.WORKSPACE, DemoIds.MUSA, DemoIds.GUARDIAN_MUSA, "Father", true),
                PupilGuardianLinkEntity("link_grace", DemoIds.WORKSPACE, DemoIds.GRACE, DemoIds.GUARDIAN_SHARED, "Family contact", false),
            ),
        )

        val sessionId = AttendanceRules.sessionId(DemoIds.CLASS_P4, yesterday)
        dao.upsertAttendanceSession(
            AttendanceSessionEntity(
                id = sessionId,
                workspaceId = DemoIds.WORKSPACE,
                classId = DemoIds.CLASS_P4,
                schoolDate = yesterday,
                status = AttendanceSessionStatus.SUBMITTED,
                submittedAt = now - 86_400_000,
                syncedAt = null,
                syncState = SyncState.PENDING_SYNC,
                version = 1,
            ),
        )
        dao.upsertAttendanceEntries(
            listOf(
                AttendanceEntryEntity("${sessionId}_${DemoIds.AMINA}", sessionId, DemoIds.AMINA, AttendanceStatus.PRESENT),
                AttendanceEntryEntity("${sessionId}_${DemoIds.MUSA}", sessionId, DemoIds.MUSA, AttendanceStatus.ABSENT),
                AttendanceEntryEntity("${sessionId}_${DemoIds.GRACE}", sessionId, DemoIds.GRACE, AttendanceStatus.PRESENT),
                AttendanceEntryEntity("${sessionId}_${DemoIds.IBRAHIM}", sessionId, DemoIds.IBRAHIM, AttendanceStatus.LATE),
            ),
        )

        dao.upsertLessonPlans(
            listOf(
                LessonPlanEntity(
                    id = DemoIds.LESSON_WATER,
                    workspaceId = DemoIds.WORKSPACE,
                    classId = DemoIds.CLASS_P4,
                    gradeLevel = "P4",
                    subjectId = "basic_science",
                    topic = "Water and its uses",
                    objective = "Pupils identify sources of water and explain three uses in daily life.",
                    durationMinutes = 40,
                    materials = "A cup of water, pictures of a well, rain and a tap, chalkboard",
                    priorKnowledge = "Pupils have seen rain, wells and taps in their community.",
                    engage = "Show a cup of water. Ask: where did this water come from? Collect three answers.",
                    explore = "Small groups sort picture cards into sources and uses of water.",
                    explain = "Guide pupils to name sources and connect water to drinking, cooking, washing and farming.",
                    elaborate = "Ask pupils to draw one source and one use they saw near their home.",
                    evaluate = "Exit ticket: name two sources and two uses of water.",
                    status = LessonStatus.SAVED,
                    syncState = SyncState.LOCAL_ONLY,
                    updatedAt = now,
                ),
                LessonPlanEntity(
                    id = DemoIds.LESSON_PLACE,
                    workspaceId = DemoIds.WORKSPACE,
                    classId = DemoIds.CLASS_P5,
                    gradeLevel = "P5",
                    subjectId = "social_studies",
                    topic = "Our place in Nigeria",
                    objective = "Pupils locate their state and describe one community responsibility.",
                    durationMinutes = 40,
                    materials = "Map outline, coloured pencils, local examples",
                    priorKnowledge = "Pupils know the name of their community and state.",
                    engage = "Ask pupils to point to their state on a simple map outline.",
                    explore = "Pairs mark their state and name one service in the community.",
                    explain = "Discuss how people share responsibility for water, cleanliness and safety.",
                    elaborate = "Pupils write one action they can take at school or home.",
                    evaluate = "A short oral check: state name plus one responsibility.",
                    status = LessonStatus.SAVED,
                    syncState = SyncState.LOCAL_ONLY,
                    updatedAt = now - 60_000,
                ),
            ),
        )

        dao.upsertProgress(
            ProgressEntryEntity(
                id = "progress_amina_science",
                workspaceId = DemoIds.WORKSPACE,
                pupilId = DemoIds.AMINA,
                classId = DemoIds.CLASS_P4,
                periodStart = today.minusDays(7).toString(),
                periodEnd = today.minusDays(1).toString(),
                subjectId = "basic_science",
                objectiveId = "water_sources",
                indicator = ProgressIndicator.DOING_WELL,
                teacherNote = "Amina explained three uses of water clearly and helped her group sort the picture cards.",
                homeActivity = "Ask Amina to name two sources of water at home and one way to keep water clean.",
                approvalStatus = ApprovalStatus.APPROVED,
                revision = 1,
                syncState = SyncState.PENDING_SYNC,
                updatedAt = now - 120_000,
            ),
        )
        dao.upsertProgress(
            ProgressEntryEntity(
                id = "progress_musa_science",
                workspaceId = DemoIds.WORKSPACE,
                pupilId = DemoIds.MUSA,
                classId = DemoIds.CLASS_P4,
                periodStart = today.minusDays(7).toString(),
                periodEnd = today.minusDays(1).toString(),
                subjectId = "basic_science",
                objectiveId = "water_sources",
                indicator = ProgressIndicator.DEVELOPING,
                teacherNote = "Musa is beginning to name water sources with prompting.",
                homeActivity = "Practise naming one source of water during a short walk together.",
                approvalStatus = ApprovalStatus.DRAFT,
                revision = 1,
                syncState = SyncState.LOCAL_ONLY,
                updatedAt = now - 180_000,
            ),
        )

        dao.upsertConversations(
            listOf(
                ConversationEntity(DemoIds.CONVERSATION_AMINA, DemoIds.WORKSPACE, DemoIds.GUARDIAN_AMINA, DemoIds.AMINA, ConversationStatus.WAITING_TEACHER, now - 3_600_000, 1),
                ConversationEntity(DemoIds.CONVERSATION_MUSA, DemoIds.WORKSPACE, DemoIds.GUARDIAN_MUSA, DemoIds.MUSA, ConversationStatus.WAITING_PARENT, now - 86_400_000, 0),
            ),
        )
        dao.upsertMessages(
            listOf(
                MessageEntity("msg_amina_1", DemoIds.CONVERSATION_AMINA, MessageDirection.INBOUND, MessageSenderType.GUARDIAN, "Good morning. Amina is unwell today and will miss school.", "en", MessageStatus.RECEIVED, now - 3_600_000),
                MessageEntity("msg_amina_2", DemoIds.CONVERSATION_AMINA, MessageDirection.OUTBOUND, MessageSenderType.TEACHER, "Thank you for letting us know. We will keep today's work for her.", "en", MessageStatus.ACCEPTED, now - 3_500_000),
                MessageEntity("msg_musa_1", DemoIds.CONVERSATION_MUSA, MessageDirection.OUTBOUND, MessageSenderType.TEACHER, "Musa joined the reading group well today.", "ha", MessageStatus.ACCEPTED, now - 86_400_000),
            ),
        )

        dao.upsertOutbox(
            OutboxCommandEntity(
                id = UUID.randomUUID().toString(),
                workspaceId = DemoIds.WORKSPACE,
                commandType = "attendance.submit",
                schemaVersion = 1,
                payloadJson = """{"classId":"${DemoIds.CLASS_P4}","schoolDate":"$yesterday"}""",
                idempotencyKey = UUID.randomUUID().toString(),
                createdAt = now - 86_000_000,
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
                summary = "Sample workspace seeded locally.",
                createdAt = now,
            ),
        )
    }
}
