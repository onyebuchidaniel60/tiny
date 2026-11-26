package ng.tiny.education.core.sync

import ng.tiny.education.core.model.SyncState

/** Pure mapping used by the durable outbox processor and its unit tests. */
object SyncOutcomePolicy {
    fun outboxState(outcome: RemoteSyncOutcome): SyncState = when (outcome) {
        RemoteSyncOutcome.ACCEPTED,
        RemoteSyncOutcome.ALREADY_APPLIED,
        -> SyncState.SYNCED
        RemoteSyncOutcome.CONFLICT -> SyncState.CONFLICT
        RemoteSyncOutcome.REJECTED -> SyncState.NEEDS_ATTENTION
        RemoteSyncOutcome.RETRYABLE -> SyncState.PENDING_SYNC
    }

    fun localState(outcome: RemoteSyncOutcome): SyncState = when (outcome) {
        RemoteSyncOutcome.ACCEPTED,
        RemoteSyncOutcome.ALREADY_APPLIED,
        -> SyncState.SYNCED
        RemoteSyncOutcome.CONFLICT -> SyncState.CONFLICT
        RemoteSyncOutcome.REJECTED -> SyncState.NEEDS_ATTENTION
        RemoteSyncOutcome.RETRYABLE -> SyncState.PENDING_SYNC
    }

    fun isTerminal(outcome: RemoteSyncOutcome): Boolean = outcome != RemoteSyncOutcome.RETRYABLE

    fun nextAttemptAt(attempts: Int, nowMillis: Long): Long =
        nowMillis + ng.tiny.education.core.domain.SyncRules.retryDelaySeconds(attempts) * 1_000
}
