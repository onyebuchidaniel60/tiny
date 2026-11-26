package ng.tiny.education

import android.app.Application
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import ng.tiny.education.core.auth.AuthRepository
import ng.tiny.education.core.database.TinyDatabase
import ng.tiny.education.core.firebase.FirebaseRuntime
import ng.tiny.education.core.network.MockSmsGateway
import ng.tiny.education.core.preferences.PreferencesRepository
import ng.tiny.education.core.security.DatabaseKeyProvider
import ng.tiny.education.core.sync.FirebaseSyncTransport
import ng.tiny.education.core.sync.MockSyncEngine
import ng.tiny.education.core.sync.RoomSyncStore
import ng.tiny.education.core.sync.SyncProcessor
import ng.tiny.education.core.sync.SyncScheduler
import ng.tiny.education.data.TinyRepository

class TinyApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        FirebaseRuntime.initialize(this)
        container = AppContainer(this)
        container.applicationScope.launch {
            try {
                container.repository.seedDemoData()
                if (container.firebaseConfigured && container.authRepository.isSignedIn) {
                    container.syncScheduler.requestSync()
                }
            } finally {
                container.seedReady.complete(Unit)
            }
        }
    }
}

class AppContainer(application: Application) {
    val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    val seedReady = CompletableDeferred<Unit>()
    val firebaseConfigured = FirebaseRuntime.isConfigured(application)
    val authRepository = AuthRepository(application)
    val accountService = ng.tiny.education.core.firebase.FirebaseAccountService(application)
    val aiService = ng.tiny.education.core.ai.AiLogicService(application)
    val bootstrapSource = ng.tiny.education.core.firebase.FirestoreBootstrapSource(application)
    val syncScheduler = SyncScheduler(application)
    private val keyProvider = DatabaseKeyProvider(application)
    private val database = TinyDatabase.build(application, keyProvider)
    private val functions = FirebaseRuntime.functions(application)
    val syncProcessor = if (firebaseConfigured && functions != null) {
        SyncProcessor(RoomSyncStore(database.dao()), FirebaseSyncTransport(functions))
    } else {
        null
    }
    val preferences = PreferencesRepository(application)
    val repository = TinyRepository(
        database = database,
        smsGateway = MockSmsGateway(),
        syncEngine = MockSyncEngine(),
        syncProcessor = syncProcessor,
        requestSync = syncScheduler::requestSync,
    )
}
