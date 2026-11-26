package ng.tiny.education.core.domain

enum class SyncOutcome { ACCEPTED, ALREADY_APPLIED, CONFLICT, REJECTED, RETRYABLE }

data class SyncCommand(
    val idempotencyKey: String,
    val commandType: String,
    val schemaVersion: Int,
    val payload: String,
)

object SyncRules {
    const val MAX_BATCH = 20

    fun validateBatch(commands: List<SyncCommand>): List<String> = buildList {
        if (commands.size > MAX_BATCH) add("A sync batch may contain at most $MAX_BATCH commands.")
        val keys = commands.map { it.idempotencyKey }
        if (keys.any(String::isBlank)) add("Every command needs an idempotency key.")
        if (keys.size != keys.distinct().size) add("Idempotency keys must be unique within a batch.")
        commands.filter { it.schemaVersion < 1 }.forEach { add("Schema version must be positive.") }
    }

    fun retryDelaySeconds(attempt: Int): Long {
        val base = 5L
        val capped = base * (1L shl attempt.coerceIn(0, 6))
        return capped.coerceAtMost(300L)
    }
}
