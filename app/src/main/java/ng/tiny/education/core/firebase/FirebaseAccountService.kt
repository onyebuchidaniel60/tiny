package ng.tiny.education.core.firebase

import android.content.Context
import com.google.firebase.functions.FirebaseFunctions
import java.util.UUID
import kotlinx.coroutines.tasks.await

data class RemoteWorkspace(
    val workspaceId: String,
    val schoolCode: String,
)

/**
 * Direct online account operations. These call the same validated callables as
 * the outbox processor; the local repository mirrors a successful response so
 * the teacher can continue offline.
 */
class FirebaseAccountService(context: Context) {
    private val functions: FirebaseFunctions? = FirebaseRuntime.functions(context)
    val configured: Boolean get() = functions != null

    suspend fun createWorkspace(name: String, type: String): Result<RemoteWorkspace> = call("createWorkspace") {
        mapOf(
            "idempotencyKey" to key(),
            "schemaVersion" to 1,
            "payload" to mapOf(
                "type" to type,
                "name" to name,
                "stateCode" to "NG",
                "lga" to "Unspecified",
                "community" to "Unspecified",
                "timezone" to "Africa/Lagos",
            ),
        )
    }.map { result ->
        RemoteWorkspace(
            workspaceId = result["workspaceId"] as? String ?: error("Workspace id missing."),
            schoolCode = result["schoolCode"] as? String ?: error("School code missing."),
        )
    }

    suspend fun createClass(
        workspaceId: String,
        classId: String,
        gradeLevel: String,
        sectionLabel: String,
        academicYear: String,
    ): Result<String> = call("createClassroom") {
        mapOf(
            "workspaceId" to workspaceId,
            "idempotencyKey" to key(),
            "schemaVersion" to 1,
            "payload" to mapOf(
                "classId" to classId,
                "gradeLevel" to gradeLevel,
                "sectionLabel" to sectionLabel,
                "academicYear" to academicYear,
                "subjectIds" to listOf<String>(),
            ),
        )
    }.map { result -> result["classId"] as? String ?: classId }

    suspend fun upsertGuardian(
        workspaceId: String,
        guardianId: String,
        displayName: String,
        phoneE164: String,
        locale: String,
    ): Result<String> = call("upsertGuardian") {
        mapOf(
            "workspaceId" to workspaceId,
            "idempotencyKey" to key(),
            "schemaVersion" to 1,
            "payload" to mapOf(
                "guardianId" to guardianId,
                "displayName" to displayName,
                "phoneE164" to phoneE164,
                "preferredLocale" to locale,
            ),
        )
    }.map { result -> result["guardianId"] as? String ?: guardianId }

    suspend fun linkGuardian(
        workspaceId: String,
        pupilId: String,
        guardianId: String,
        relationshipLabel: String,
    ): Result<Unit> = call("linkGuardianToPupil") {
        mapOf(
            "workspaceId" to workspaceId,
            "idempotencyKey" to key(),
            "schemaVersion" to 1,
            "payload" to mapOf(
                "pupilId" to pupilId,
                "guardianId" to guardianId,
                "relationshipLabel" to relationshipLabel,
                "notificationEligible" to true,
            ),
        )
    }.map { }

    suspend fun requestGuardianVerification(workspaceId: String, guardianId: String): Result<String> =
        call("requestGuardianVerification") {
            mapOf(
                "workspaceId" to workspaceId,
                "idempotencyKey" to key(),
                "schemaVersion" to 1,
                "payload" to mapOf("guardianId" to guardianId),
            )
        }.map { result ->
            result["code"] as? String ?: error("Verification code missing.")
        }

    suspend fun verifyGuardian(workspaceId: String, guardianId: String, code: String): Result<Unit> =
        call("verifyGuardianCode") {
            mapOf(
                "workspaceId" to workspaceId,
                "idempotencyKey" to key(),
                "schemaVersion" to 1,
                "payload" to mapOf("guardianId" to guardianId, "code" to code),
            )
        }.map { }

    private suspend fun call(
        name: String,
        data: () -> Map<String, Any?>,
    ): Result<Map<String, Any?>> = runCatching {
        val client = functions ?: error("Firebase is not configured.")
        val result = client.getHttpsCallable(name).call(data()).await()
        (result.data as? Map<*, *>)?.entries?.associate { it.key.toString() to it.value } ?: emptyMap()
    }

    private fun key() = "android-${UUID.randomUUID()}"
}
