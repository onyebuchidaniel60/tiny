package ng.tiny.education.core.sync

import kotlinx.coroutines.delay
import ng.tiny.education.core.database.AuditEventEntity
import ng.tiny.education.core.database.TinyDao
import java.util.UUID

data class MockSyncResult(
    val processedCommands: Int,
    val message: String,
)

/**
 * Local-only sync simulation. It deliberately does not mark records as
 * cloud-synced: no server acknowledgement exists in this preview.
 */
class MockSyncEngine {
    suspend fun run(dao: TinyDao, workspaceId: String): MockSyncResult {
        val pending = dao.getPendingOutbox()
        delay(500)
        dao.insertAudit(
            AuditEventEntity(
                id = UUID.randomUUID().toString(),
                workspaceId = workspaceId,
                action = "sync.mock_processed",
                resourceType = "outbox",
                resourceId = workspaceId,
                summary = "Mock sync processed ${pending.size} local command(s); no cloud acknowledgement.",
                createdAt = System.currentTimeMillis(),
            ),
        )
        return MockSyncResult(
            processedCommands = pending.size,
            message = "Mock sync processed ${pending.size} local command(s). Cloud sync is not configured.",
        )
    }
}
