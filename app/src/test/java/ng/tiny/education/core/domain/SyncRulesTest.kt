package ng.tiny.education.core.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SyncRulesTest {
    @Test fun rejectsOversizedBatch() {
        val commands = (1..21).map { SyncCommand("key-$it", "attendance.submit", 1, "{}") }
        assertTrue(SyncRules.validateBatch(commands).isNotEmpty())
    }

    @Test fun rejectsDuplicateKeys() {
        val commands = listOf(
            SyncCommand("same", "attendance.submit", 1, "{}"),
            SyncCommand("same", "progress.upsert", 1, "{}"),
        )
        assertTrue(SyncRules.validateBatch(commands).isNotEmpty())
    }

    @Test fun acceptsValidBatch() {
        val commands = (1..3).map { SyncCommand("key-$it", "attendance.submit", 1, "{}") }
        assertTrue(SyncRules.validateBatch(commands).isEmpty())
    }

    @Test fun retryDelayIsCapped() {
        assertEquals(5L, SyncRules.retryDelaySeconds(0))
        assertTrue(SyncRules.retryDelaySeconds(20) <= 300L)
    }
}
