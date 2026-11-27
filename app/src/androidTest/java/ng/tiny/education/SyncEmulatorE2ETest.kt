package ng.tiny.education

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.functions.FirebaseFunctions
import java.util.UUID
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.tasks.await
import ng.tiny.education.core.database.OutboxCommandEntity
import ng.tiny.education.core.model.SyncState
import ng.tiny.education.core.sync.FirebaseSyncTransport
import ng.tiny.education.core.sync.RemoteSyncBatch
import ng.tiny.education.core.sync.RemoteSyncCommand
import ng.tiny.education.core.sync.SyncProcessor
import ng.tiny.education.core.sync.SyncStore
import ng.tiny.education.core.sync.SyncTransport
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Android client-to-Functions-emulator E2E. This test uses the real
 * Firebase Functions Android SDK and SyncProcessor transport against a local
 * emulator project; it does not touch the real Firebase project.
 *
 * It covers accepted acknowledgement, idempotent replay, transport retry and
 * a server conflict. Run via the manual firebase-sync-smoke workflow.
 */
@RunWith(AndroidJUnit4::class)
class SyncEmulatorE2ETest {
    private val projectId = "demo-tiny-e2e"
    private val appName = "tiny-sync-emulator"

    private class TestStore(initial: List<OutboxCommandEntity> = emptyList()) : SyncStore {
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

        fun enqueue(
            workspaceId: String,
            type: String,
            idempotencyKey: String,
            payloadJson: String,
        ): OutboxCommandEntity {
            val command = OutboxCommandEntity(
                id = UUID.randomUUID().toString(),
                workspaceId = workspaceId,
                commandType = type,
                schemaVersion = 1,
                payloadJson = payloadJson,
                idempotencyKey = idempotencyKey,
                createdAt = System.currentTimeMillis(),
                attempts = 0,
                nextAttemptAt = null,
                syncState = SyncState.PENDING_SYNC,
                lastError = null,
            )
            commands += command
            return command
        }

        fun makeDue(command: OutboxCommandEntity) {
            val index = commands.indexOfFirst { it.id == command.id }
            if (index >= 0) commands[index] = commands[index].copy(nextAttemptAt = null)
        }
    }

    private class FlakyTransport(private val delegate: SyncTransport) : SyncTransport {
        var failNext = false
        override suspend fun push(workspaceId: String, commands: List<RemoteSyncCommand>): RemoteSyncBatch {
            if (failNext) {
                failNext = false
                error("Simulated network loss")
            }
            return delegate.push(workspaceId, commands)
        }
    }

    @Test
    fun clientTransportCoversAcceptRetryIdempotencyAndConflict() {
        assumeTrue(
            "Run only in the manual firebase-sync-smoke job with local emulators",
            InstrumentationRegistry.getArguments().getString("tinySyncEmulator") == "true",
        )
        runBlocking {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val options = FirebaseOptions.Builder()
            .setApplicationId("1:1234567890:android:tiny-emulator")
            .setApiKey("AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY")
            .setProjectId(projectId)
            .build()
        val app = FirebaseApp.getApps(context).firstOrNull { it.name == appName }
            ?: FirebaseApp.initializeApp(context, options, appName)
        val auth = FirebaseAuth.getInstance(app).apply { useEmulator("10.0.2.2", 9099) }
        if (auth.currentUser == null) {
            auth.signInAnonymously().await()
        }
        val firestore = FirebaseFirestore.getInstance(app).apply { useEmulator("10.0.2.2", 8080) }
        val functions = FirebaseFunctions.getInstance(app, "africa-south1").apply {
            useEmulator("10.0.2.2", 5001)
        }
        val transport = FirebaseSyncTransport(functions)
        val flaky = FlakyTransport(transport)
        val store = TestStore()
        val processor = SyncProcessor(store, flaky)

        val workspaceId = createWorkspace(functions)
        val classId = "class_emulator01"
        val classKey = "e2e-class-create-0001"
        store.enqueue(
            workspaceId,
            "class.create",
            classKey,
            """{"classId":"$classId","gradeLevel":"P4","sectionLabel":"Blue","academicYear":"2026/2027","subjectIds":["basic_science"]}""",
        )
        val accepted = processor.process(workspaceId)
        assertEquals(1, accepted.accepted)
        assertEquals(SyncState.SYNCED, store.classes[classId])
        assertEquals(SyncState.SYNCED, store.commands.single { it.idempotencyKey == classKey }.syncState)

        // Same server idempotency key, new outbox row: must replay as alreadyApplied.
        val replayKey = "e2e-class-create-0001"
        val replay = store.enqueue(
            workspaceId,
            "class.create",
            replayKey,
            """{"classId":"$classId","gradeLevel":"P4","sectionLabel":"Blue","academicYear":"2026/2027","subjectIds":["basic_science"]}""",
        )
        val replayed = processor.process(workspaceId)
        assertEquals(1, replayed.accepted)
        assertEquals(SyncState.SYNCED, store.commands.single { it.id == replay.id }.syncState)

        // Transport loss -> retryable; force the backoff due, then succeed.
        val pupilId = "pupil_emulator01"
        val pupilCommand = store.enqueue(
            workspaceId,
            "pupil.register",
            "e2e-pupil-register-0001",
            """{"classId":"$classId","pupilId":"$pupilId","displayName":"Emulator Pupil"}""",
        )
        flaky.failNext = true
        val retry = processor.process(workspaceId)
        assertEquals(1, retry.retryable)
        assertEquals(SyncState.PENDING_SYNC, store.commands.single { it.id == pupilCommand.id }.syncState)
        assertTrue(store.commands.single { it.id == pupilCommand.id }.attempts >= 1)
        store.makeDue(pupilCommand)
        val acceptedAfterRetry = processor.process(workspaceId)
        assertEquals(1, acceptedAfterRetry.accepted)
        assertEquals(SyncState.SYNCED, store.pupils[pupilId])

        // Same class identity with a different client id must be a conflict.
        val conflictingClass = "class_emulator02"
        store.enqueue(
            workspaceId,
            "class.create",
            "e2e-class-conflict-0001",
            """{"classId":"$conflictingClass","gradeLevel":"P4","sectionLabel":"Blue","academicYear":"2026/2027","subjectIds":[]}""",
        )
        val conflict = processor.process(workspaceId)
        assertEquals(1, conflict.conflicts)
        assertEquals(SyncState.CONFLICT, store.classes[conflictingClass])

        // The backend must have exactly one class in the emulator Firestore.
        val remoteClasses = firestore.collection("workspaces").document(workspaceId)
            .collection("classes").get().await()
        assertEquals(1, remoteClasses.size())
        }
    }

    private suspend fun createWorkspace(functions: FirebaseFunctions): String {
        val result = functions.getHttpsCallable("createWorkspace").call(
            mapOf(
                "idempotencyKey" to "e2e-workspace-${UUID.randomUUID()}",
                "schemaVersion" to 1,
                "payload" to mapOf(
                    "type" to "school",
                    "name" to "Emulator Sync Primary",
                    "stateCode" to "KN",
                    "lga" to "Emulator",
                    "community" to "Emulator",
                    "timezone" to "Africa/Lagos",
                ),
            ),
        ).await()
        val data = result.data as? Map<*, *> ?: error("Malformed workspace response")
        return data["workspaceId"] as? String ?: error("Workspace id missing")
    }
}
