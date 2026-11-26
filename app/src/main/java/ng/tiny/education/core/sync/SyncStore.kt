package ng.tiny.education.core.sync

import java.util.UUID
import ng.tiny.education.core.database.AuditEventEntity
import ng.tiny.education.core.database.OutboxCommandEntity
import ng.tiny.education.core.database.TinyDao
import ng.tiny.education.core.model.SyncState

interface SyncStore {
    suspend fun dueCommands(workspaceId: String, nowMillis: Long, limit: Int): List<OutboxCommandEntity>
    suspend fun updateCommand(command: OutboxCommandEntity)
    suspend fun markAttendance(classId: String, schoolDate: String, state: SyncState)
    suspend fun markProgress(entryId: String, state: SyncState)
    suspend fun markPupil(pupilId: String, state: SyncState)
    suspend fun markClass(classId: String, state: SyncState)
    suspend fun markGuardian(guardianId: String, state: SyncState)
    suspend fun audit(workspaceId: String, action: String, summary: String)
}

class RoomSyncStore(private val dao: TinyDao) : SyncStore {
    override suspend fun dueCommands(workspaceId: String, nowMillis: Long, limit: Int) =
        dao.getDueOutbox(workspaceId, nowMillis, limit)

    override suspend fun updateCommand(command: OutboxCommandEntity) = dao.updateOutbox(command)

    override suspend fun markAttendance(classId: String, schoolDate: String, state: SyncState) =
        dao.updateAttendanceSessionSyncState(classId, schoolDate, state)

    override suspend fun markProgress(entryId: String, state: SyncState) =
        dao.updateProgressSyncState(entryId, state)

    override suspend fun markPupil(pupilId: String, state: SyncState) =
        dao.updatePupilSyncState(pupilId, state)

    override suspend fun markClass(classId: String, state: SyncState) =
        dao.updateClassSyncState(classId, state)

    override suspend fun markGuardian(guardianId: String, state: SyncState) =
        dao.updateGuardianSyncState(guardianId, state)

    override suspend fun audit(workspaceId: String, action: String, summary: String) {
        dao.insertAudit(
            AuditEventEntity(
                id = UUID.randomUUID().toString(),
                workspaceId = workspaceId,
                action = action,
                resourceType = "outbox",
                resourceId = workspaceId,
                summary = summary,
                createdAt = System.currentTimeMillis(),
            ),
        )
    }
}
