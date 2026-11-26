package ng.tiny.education.core.sync

import ng.tiny.education.core.database.OutboxCommandEntity
import ng.tiny.education.core.model.SyncState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SyncProcessorTest {
    private class FakeStore(initial: List<OutboxCommandEntity>) : SyncStore {
        val commands = initial.toMutableList()
        val attendance = mutableMapOf<String, SyncState>()
        val progress = mutableMapOf<String, SyncState>()
        val pupils = mutableMapOf<String, SyncState>()
        val classes = mutableMapOf<String, SyncState>()
        val guardians = mutableMapOf<String, SyncState>()
        val audits = mutableListOf<String>()

        override suspend fun dueCommands(workspaceId: String, nowMillis: Long, limit: Int) =
            commands.filter {
                it.workspaceId == workspaceId &&
                    it.syncState == SyncState.PENDING_SYNC &&
                    (it.nextAttemptAt == null || it.nextAttemptAt <= nowMillis)
            }.take(limit)

        override suspend fun updateCommand(command: OutboxCommandEntity) {
            val index = commands.indexOfFirst { it.id == command.id }
            if (index >= 0) commands[index] = command
        }

        override suspend fun markAttendance(classId: String, schoolDate: String, state: SyncState) {
            attendance["$classId|$schoolDate"] = state
        }

        override suspend fun markProgress(entryId: String, state: SyncState) {
            progress[entryId] = state
        }

        override suspend fun markPupil(pupilId: String, state: SyncState) {
            pupils[pupilId] = state
        }

        override suspend fun markClass(classId: String, state: SyncState) {
            classes[classId] = state
        }

        override suspend fun markGuardian(guardianId: String, state: SyncState) {
            guardians[guardianId] = state
        }

        override suspend fun audit(workspaceId: String, action: String, summary: String) {
            audits += action
        }
    }

    private fun command(
        id: String,
        type: String,
        payload: String,
        state: SyncState = SyncState.PENDING_SYNC,
    ) = OutboxCommandEntity(
        id = id,
        workspaceId = "ws1",
        commandType = type,
        schemaVersion = 1,
        payloadJson = payload,
        idempotencyKey = "key-$id",
        createdAt = 1,
        attempts = 0,
        nextAttemptAt = null,
        syncState = state,
        lastError = null,
    )

    private fun transport(
        handler: suspend (String, List<RemoteSyncCommand>) -> RemoteSyncBatch,
    ): SyncTransport = object : SyncTransport {
        override suspend fun push(workspaceId: String, commands: List<RemoteSyncCommand>) =
            handler(workspaceId, commands)
    }

    @Test fun acceptedAttendanceMarksOutboxAndLocalRowSynced() = runTest {
        val store = FakeStore(listOf(command("1", "attendance.submit", """{"classId":"c1","schoolDate":"2026-11-26"}""")))
        val processor = SyncProcessor(store, transport { _, _ ->
            RemoteSyncBatch(listOf(RemoteSyncResult("key-1", RemoteSyncOutcome.ACCEPTED)))
        })
        val result = processor.process("ws1")
        assertEquals(1, result.accepted)
        assertEquals(SyncState.SYNCED, store.commands.single().syncState)
        assertEquals(SyncState.SYNCED, store.attendance["c1|2026-11-26"])
    }

    @Test fun conflictAndRejectionBecomeReviewStates() = runTest {
        val store = FakeStore(
            listOf(
                command("1", "progress.upsert", """{"clientEntryId":"p1"}"""),
                command("2", "pupil.register", """{"pupilId":"pupil1"}"""),
            ),
        )
        val processor = SyncProcessor(store, transport { _, _ ->
            RemoteSyncBatch(
                listOf(
                    RemoteSyncResult("key-1", RemoteSyncOutcome.CONFLICT, message = "Version changed."),
                    RemoteSyncResult("key-2", RemoteSyncOutcome.REJECTED, message = "Not allowed."),
                ),
            )
        })
        val result = processor.process("ws1")
        assertEquals(1, result.conflicts)
        assertEquals(1, result.rejected)
        assertEquals(SyncState.CONFLICT, store.progress["p1"])
        assertEquals(SyncState.NEEDS_ATTENTION, store.pupils["pupil1"])
    }

    @Test fun retryableKeepsPendingWithBackoff() = runTest {
        val store = FakeStore(listOf(command("1", "attendance.submit", """{"classId":"c1","schoolDate":"2026-11-26"}""")))
        val processor = SyncProcessor(store, transport { _, _ ->
            RemoteSyncBatch(listOf(RemoteSyncResult("key-1", RemoteSyncOutcome.RETRYABLE, message = "Try later.")))
        })
        val result = processor.process("ws1")
        assertEquals(1, result.retryable)
        val updated = store.commands.single()
        assertEquals(SyncState.PENDING_SYNC, updated.syncState)
        assertEquals(1, updated.attempts)
        assertNotNull(updated.nextAttemptAt)
        assertTrue(updated.nextAttemptAt!! > System.currentTimeMillis())
    }

    @Test fun transportFailureRetriesEverythingAndAudits() = runTest {
        val store = FakeStore(listOf(command("1", "attendance.submit", """{"classId":"c1","schoolDate":"2026-11-26"}""")))
        val processor = SyncProcessor(store, transport { _, _ -> error("offline") })
        val result = processor.process("ws1")
        assertEquals(1, result.retryable)
        assertEquals(1, store.commands.single().attempts)
        assertTrue(store.audits.contains("sync.retryable"))
    }

    @Test fun alreadyAppliedIsTerminalWithoutDuplicateWork() = runTest {
        val store = FakeStore(listOf(command("1", "progress.upsert", """{"clientEntryId":"p1"}""")))
        val processor = SyncProcessor(store, transport { _, _ ->
            RemoteSyncBatch(listOf(RemoteSyncResult("key-1", RemoteSyncOutcome.ALREADY_APPLIED)))
        })
        processor.process("ws1")
        assertEquals(SyncState.SYNCED, store.progress["p1"])
        assertEquals(SyncState.SYNCED, store.commands.single().syncState)
    }

    private fun runTest(block: suspend () -> Unit) =
        kotlinx.coroutines.test.runTest { block() }
}
