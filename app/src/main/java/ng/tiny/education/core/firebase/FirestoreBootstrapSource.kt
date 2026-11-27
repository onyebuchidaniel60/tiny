package ng.tiny.education.core.firebase

import android.content.Context
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import ng.tiny.education.core.database.ClassroomEntity
import ng.tiny.education.core.database.PupilEntity
import ng.tiny.education.core.database.WorkspaceEntity
import ng.tiny.education.core.model.SyncState
import ng.tiny.education.core.model.VerificationStatus
import ng.tiny.education.core.model.WorkspaceType

data class RemoteBootstrap(
    val workspace: WorkspaceEntity,
    val classes: List<ClassroomEntity>,
    val pupils: List<PupilEntity>,
)

/**
 * Read-only Firestore bootstrap. Authoritative writes remain on callables; the
 * client only pulls minimum workspace/class/pupil data through rules that are
 * class-scoped server-side.
 */
class FirestoreBootstrapSource(context: Context) {
    private val db: FirebaseFirestore? =
        if (FirebaseRuntime.isConfigured(context)) FirebaseFirestore.getInstance() else null

    val configured: Boolean get() = db != null

    suspend fun workspaceIds(uid: String): List<String> {
        val firestore = db ?: return emptyList()
        return firestore.collection("users").document(uid).collection("workspaces")
            .get().await().documents.mapNotNull { it.getString("workspaceId") ?: it.id }
    }

    suspend fun loadWorkspace(workspaceId: String): RemoteBootstrap? {
        val firestore = db ?: return null
        val workspaceRef = firestore.collection("workspaces").document(workspaceId)
        val workspaceSnap = workspaceRef.get().await()
        if (!workspaceSnap.exists()) return null
        val remoteName = workspaceSnap.getString("name") ?: "Workspace"
        val workspace = WorkspaceEntity(
            id = workspaceSnap.id,
            // Known non-production workspaces were seeded with development
            // labels. Present the same sample school without that wording.
            name = when (remoteName) {
                "Tiny Synthetic E2E", "Tiny Web Demo Primary", "Kofar Demo Primary" -> "Kofar Primary"
                else -> remoteName
            },
            type = if (workspaceSnap.getString("type") == "independent") WorkspaceType.INDEPENDENT else WorkspaceType.SCHOOL,
            schoolCode = workspaceSnap.getString("schoolCode") ?: "--------",
            verificationStatus = when (workspaceSnap.getString("verificationStatus")) {
                "verified" -> VerificationStatus.VERIFIED
                "pending" -> VerificationStatus.PENDING
                "suspended" -> VerificationStatus.SUSPENDED
                else -> VerificationStatus.ACTIVE_UNVERIFIED
            },
            syncState = SyncState.SYNCED,
            version = workspaceSnap.getLong("version")?.toInt() ?: 1,
            updatedAt = System.currentTimeMillis(),
        )
        val classDocs = workspaceRef.collection("classes").get().await().documents
        val classes = mutableListOf<ClassroomEntity>()
        val pupils = mutableListOf<PupilEntity>()
        for (classDoc in classDocs) {
            val classId = classDoc.id
            val subjectIds = classDoc.get("subjectIds") as? List<*> ?: emptyList<Any>()
            classes += ClassroomEntity(
                id = classId,
                workspaceId = workspaceId,
                gradeLevel = classDoc.getString("gradeLevel") ?: "P?",
                label = classDoc.getString("sectionLabel") ?: "",
                academicYear = classDoc.getString("academicYear") ?: "",
                subjectSummary = subjectIds.joinToString(" · ") { it.toString().replace('_', ' ') },
                teacherName = classDoc.getString("teacherName") ?: "Teacher",
                syncState = SyncState.SYNCED,
                version = classDoc.getLong("version")?.toInt() ?: 1,
            )
            runCatching {
                val pupilDocs = workspaceRef.collection("pupils")
                    .whereEqualTo("classId", classId)
                    .whereEqualTo("enrollmentStatus", "active")
                    .get().await().documents
                pupils += pupilDocs.map { pupil ->
                    PupilEntity(
                        id = pupil.id,
                        workspaceId = workspaceId,
                        classId = classId,
                        displayName = pupil.getString("displayName") ?: "Pupil",
                        localCode = pupil.getString("localPupilCode"),
                        syncState = SyncState.SYNCED,
                        version = pupil.getLong("version")?.toInt() ?: 1,
                    )
                }
            }
        }
        return RemoteBootstrap(workspace, classes, pupils)
    }
}
