package ng.tiny.education.core.sync

import ng.tiny.education.core.database.OutboxCommandEntity
import ng.tiny.education.core.model.SyncState

data class SyncRunResult(
    val processed: Int,
    val accepted: Int,
    val conflicts: Int,
    val rejected: Int,
    val retryable: Int,
    val message: String,
)

/**
 * Applies the server's per-command outcomes to the durable outbox and the
 * affected local rows. A command is never deleted; its state records what the
 * server acknowledged so the UI can stay honest.
 */
class SyncProcessor(
    private val store: SyncStore,
    private val transport: SyncTransport,
) {
    suspend fun process(workspaceId: String): SyncRunResult {
        var processed = 0
        var accepted = 0
        var conflicts = 0
        var rejected = 0
        var retryable = 0

        repeat(MAX_BATCHES_PER_RUN) {
            val due = store.dueCommands(workspaceId, System.currentTimeMillis(), BATCH_SIZE)
            if (due.isEmpty()) return@repeat
            val commands = due.map { command ->
                RemoteSyncCommand(
                    idempotencyKey = command.idempotencyKey,
                    commandType = command.commandType,
                    schemaVersion = command.schemaVersion,
                    payload = SyncPayloadJson.toMap(command.payloadJson),
                )
            }
            val batch = try {
                transport.push(workspaceId, commands)
            } catch (error: Exception) {
                due.forEach { command ->
                    retryLater(command, error.message ?: "Sync transport unavailable.")
                }
                retryable += due.size
                processed += due.size
                store.audit(workspaceId, "sync.retryable", "Transport failure for ${due.size} command(s).")
                return SyncRunResult(processed, accepted, conflicts, rejected, retryable, "Sync is temporarily unavailable; queued work will retry.")
            }
            val byKey = batch.results.associateBy { it.idempotencyKey }
            due.forEach { command ->
                processed += 1
                val result = byKey[command.idempotencyKey]
                when (result?.outcome) {
                    RemoteSyncOutcome.ACCEPTED, RemoteSyncOutcome.ALREADY_APPLIED -> {
                        markSynced(command)
                        accepted += 1
                    }
                    RemoteSyncOutcome.CONFLICT -> {
                        markProblem(command, result, SyncState.CONFLICT)
                        conflicts += 1
                    }
                    RemoteSyncOutcome.REJECTED -> {
                        markProblem(command, result, SyncState.NEEDS_ATTENTION)
                        rejected += 1
                    }
                    else -> {
                        retryLater(command, result?.message ?: "The server did not acknowledge this command.")
                        retryable += 1
                    }
                }
            }
        }

        val message = when {
            processed == 0 -> "No queued commands are due."
            retryable > 0 -> "$accepted synced, $retryable will retry."
            conflicts + rejected > 0 -> "$accepted synced; ${conflicts + rejected} need review."
            else -> "$accepted command(s) synced with the backend."
        }
        store.audit(workspaceId, "sync.processed", message)
        return SyncRunResult(processed, accepted, conflicts, rejected, retryable, message)
    }

    private suspend fun markSynced(command: OutboxCommandEntity) {
        val payload = SyncPayloadJson.toMap(command.payloadJson)
        when (command.commandType) {
            "attendance.submit" -> {
                val classId = payload.stringValue("classId")
                val schoolDate = payload.stringValue("schoolDate")
                if (classId != null && schoolDate != null) {
                    store.markAttendance(classId, schoolDate, SyncState.SYNCED)
                }
            }
            "progress.upsert" -> payload.stringValue("clientEntryId")?.let {
                store.markProgress(it, SyncState.SYNCED)
            }
            "progress.approve" -> payload.stringValue("progressEntryId")?.let {
                store.markProgress(it, SyncState.SYNCED)
            }
            "pupil.register" -> payload.stringValue("pupilId")?.let {
                store.markPupil(it, SyncState.SYNCED)
            }
            "class.create" -> payload.stringValue("classId")?.let {
                store.markClass(it, SyncState.SYNCED)
            }
            "guardian.upsert" -> payload.stringValue("guardianId")?.let {
                store.markGuardian(it, SyncState.SYNCED)
            }
        }
        store.updateCommand(
            command.copy(
                syncState = SyncState.SYNCED,
                attempts = command.attempts + 1,
                nextAttemptAt = null,
                lastError = null,
            ),
        )
    }

    private suspend fun markProblem(
        command: OutboxCommandEntity,
        result: RemoteSyncResult,
        state: SyncState,
    ) {
        val payload = SyncPayloadJson.toMap(command.payloadJson)
        when (command.commandType) {
            "attendance.submit" -> {
                val classId = payload.stringValue("classId")
                val schoolDate = payload.stringValue("schoolDate")
                if (classId != null && schoolDate != null) {
                    store.markAttendance(classId, schoolDate, state)
                }
            }
            "progress.upsert" -> payload.stringValue("clientEntryId")?.let {
                store.markProgress(it, state)
            }
            "progress.approve" -> payload.stringValue("progressEntryId")?.let {
                store.markProgress(it, state)
            }
            "pupil.register" -> payload.stringValue("pupilId")?.let {
                store.markPupil(it, state)
            }
            "class.create" -> payload.stringValue("classId")?.let {
                store.markClass(it, state)
            }
            "guardian.upsert" -> payload.stringValue("guardianId")?.let {
                store.markGuardian(it, state)
            }
        }
        store.updateCommand(
            command.copy(
                syncState = state,
                attempts = command.attempts + 1,
                nextAttemptAt = null,
                lastError = result.message ?: result.errorCode ?: "The server rejected this command.",
            ),
        )
    }

    private suspend fun retryLater(command: OutboxCommandEntity, error: String?) {
        val attempts = command.attempts + 1
        store.updateCommand(
            command.copy(
                syncState = SyncState.PENDING_SYNC,
                attempts = attempts,
                nextAttemptAt = SyncOutcomePolicy.nextAttemptAt(attempts, System.currentTimeMillis()),
                lastError = error,
            ),
        )
    }

    private companion object {
        const val BATCH_SIZE = 20
        const val MAX_BATCHES_PER_RUN = 5
    }
}
