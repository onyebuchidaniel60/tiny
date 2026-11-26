package ng.tiny.education.core.sync

import ng.tiny.education.core.model.SyncState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SyncOutcomePolicyTest {
    @Test fun mapsServerOutcomesToDurableStates() {
        assertEquals(SyncState.SYNCED, SyncOutcomePolicy.outboxState(RemoteSyncOutcome.ACCEPTED))
        assertEquals(SyncState.SYNCED, SyncOutcomePolicy.outboxState(RemoteSyncOutcome.ALREADY_APPLIED))
        assertEquals(SyncState.CONFLICT, SyncOutcomePolicy.outboxState(RemoteSyncOutcome.CONFLICT))
        assertEquals(SyncState.NEEDS_ATTENTION, SyncOutcomePolicy.outboxState(RemoteSyncOutcome.REJECTED))
        assertEquals(SyncState.PENDING_SYNC, SyncOutcomePolicy.outboxState(RemoteSyncOutcome.RETRYABLE))
    }

    @Test fun onlyRetryableIsNonTerminal() {
        assertTrue(SyncOutcomePolicy.isTerminal(RemoteSyncOutcome.ACCEPTED))
        assertTrue(SyncOutcomePolicy.isTerminal(RemoteSyncOutcome.CONFLICT))
        assertFalse(SyncOutcomePolicy.isTerminal(RemoteSyncOutcome.RETRYABLE))
    }

    @Test fun retryDelayGrowsAndIsCapped() {
        val now = 1_000_000L
        val first = SyncOutcomePolicy.nextAttemptAt(1, now)
        val later = SyncOutcomePolicy.nextAttemptAt(5, now)
        assertTrue(first > now)
        assertTrue(later > first)
        assertTrue(SyncOutcomePolicy.nextAttemptAt(30, now) <= now + 300_000L)
    }

    @Test fun parsesNestedOutboxPayload() {
        val payload = SyncPayloadJson.toMap(
            """{"classId":"class_1","schoolDate":"2026-11-26","entries":[{"pupilId":"pupil_1","status":"absent"}]}""",
        )
        assertEquals("class_1", payload["classId"])
        val entries = payload["entries"] as List<*>
        assertEquals(1, entries.size)
        val first = entries.first() as Map<*, *>
        assertEquals("pupil_1", first["pupilId"])
        assertEquals("absent", first["status"])
    }

    @Test fun mapsUnknownOutcomeToRetryable() {
        assertEquals(RemoteSyncOutcome.RETRYABLE, SyncPayloadJson.outcome("something-new"))
        assertEquals(RemoteSyncOutcome.ALREADY_APPLIED, SyncPayloadJson.outcome("alreadyApplied"))
    }
}
