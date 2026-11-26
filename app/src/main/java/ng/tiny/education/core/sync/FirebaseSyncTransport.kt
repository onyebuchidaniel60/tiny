package ng.tiny.education.core.sync

import com.google.firebase.functions.FirebaseFunctions
import java.util.UUID
import kotlinx.coroutines.tasks.await

/**
 * Pushes the durable outbox to the `syncCommands` callable. Firebase Auth and
 * App Check tokens are attached automatically by the Firebase SDK.
 */
class FirebaseSyncTransport(
    private val functions: FirebaseFunctions,
) : SyncTransport {
    override suspend fun push(workspaceId: String, commands: List<RemoteSyncCommand>): RemoteSyncBatch {
        require(commands.isNotEmpty()) { "A sync batch cannot be empty." }
        val batchKey = "client-batch-${UUID.randomUUID()}"
        val data = mapOf(
            "workspaceId" to workspaceId,
            "idempotencyKey" to batchKey,
            "schemaVersion" to 1,
            "payload" to mapOf(
                "commands" to commands.map { command ->
                    mapOf(
                        "idempotencyKey" to command.idempotencyKey,
                        "commandType" to command.commandType,
                        "schemaVersion" to command.schemaVersion,
                        "payload" to command.payload,
                    )
                },
            ),
        )
        val result = functions.getHttpsCallable("syncCommands").call(data).await()
        val response = result.data as? Map<*, *> ?: error("Malformed sync response.")
        val rawResults = response["results"] as? List<*> ?: error("Sync response has no results.")
        val results = rawResults.mapNotNull { item ->
            val map = item as? Map<*, *> ?: return@mapNotNull null
            val key = map["idempotencyKey"] as? String ?: return@mapNotNull null
            RemoteSyncResult(
                idempotencyKey = key,
                outcome = SyncPayloadJson.outcome(map["outcome"] as? String),
                errorCode = map["errorCode"] as? String,
                message = map["message"] as? String,
            )
        }
        return RemoteSyncBatch(results)
    }
}
