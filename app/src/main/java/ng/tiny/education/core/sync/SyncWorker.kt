package ng.tiny.education.core.sync

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit
import ng.tiny.education.TinyApplication

class SyncScheduler(private val context: Context) {
    fun requestSync() {
        val request = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build(),
            )
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork(
            UNIQUE_WORK,
            ExistingWorkPolicy.KEEP,
            request,
        )
    }

    private companion object {
        const val UNIQUE_WORK = "tiny-outbox-sync"
    }
}

class SyncWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val app = applicationContext as? TinyApplication ?: return Result.success()
        val container = app.container
        if (!container.firebaseConfigured || !container.authRepository.isSignedIn) {
            return Result.success()
        }
        val workspace = container.repository.currentWorkspace() ?: return Result.success()
        val processor = container.syncProcessor ?: return Result.success()
        val result = processor.process(workspace.id)
        return if (result.retryable > 0) Result.retry() else Result.success()
    }
}
