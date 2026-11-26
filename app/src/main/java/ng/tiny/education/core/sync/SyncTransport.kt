package ng.tiny.education.core.sync

import org.json.JSONArray
import org.json.JSONObject

enum class RemoteSyncOutcome {
    ACCEPTED,
    ALREADY_APPLIED,
    CONFLICT,
    REJECTED,
    RETRYABLE,
}

data class RemoteSyncCommand(
    val idempotencyKey: String,
    val commandType: String,
    val schemaVersion: Int,
    val payload: Map<String, Any?>,
)

data class RemoteSyncResult(
    val idempotencyKey: String,
    val outcome: RemoteSyncOutcome,
    val errorCode: String? = null,
    val message: String? = null,
)

data class RemoteSyncBatch(
    val results: List<RemoteSyncResult>,
)

interface SyncTransport {
    suspend fun push(workspaceId: String, commands: List<RemoteSyncCommand>): RemoteSyncBatch
}

object SyncPayloadJson {
    fun toMap(json: String): Map<String, Any?> {
        if (json.isBlank()) return emptyMap()
        return jsonObjectToMap(JSONObject(json))
    }

    private fun jsonObjectToMap(obj: JSONObject): Map<String, Any?> {
        val result = linkedMapOf<String, Any?>()
        obj.keys().forEach { key ->
            result[key] = when (val value = obj.get(key)) {
                is JSONObject -> jsonObjectToMap(value)
                is JSONArray -> (0 until value.length()).map { index ->
                    when (val item = value.get(index)) {
                        is JSONObject -> jsonObjectToMap(item)
                        is JSONArray -> (0 until item.length()).map { item.get(it) }
                        JSONObject.NULL -> null
                        else -> item
                    }
                }
                JSONObject.NULL -> null
                else -> value
            }
        }
        return result
    }

    fun outcome(value: String?): RemoteSyncOutcome = when (value) {
        "accepted" -> RemoteSyncOutcome.ACCEPTED
        "alreadyApplied" -> RemoteSyncOutcome.ALREADY_APPLIED
        "conflict" -> RemoteSyncOutcome.CONFLICT
        "rejected" -> RemoteSyncOutcome.REJECTED
        else -> RemoteSyncOutcome.RETRYABLE
    }
}

fun Map<String, Any?>.stringValue(key: String): String? = this[key] as? String
