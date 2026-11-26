package ng.tiny.education

import android.app.Application
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import ng.tiny.education.core.database.TinyDatabase
import ng.tiny.education.core.network.MockSmsGateway
import ng.tiny.education.core.preferences.PreferencesRepository
import ng.tiny.education.core.security.DatabaseKeyProvider
import ng.tiny.education.core.sync.MockSyncEngine
import ng.tiny.education.data.TinyRepository

class TinyApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        container.applicationScope.launch {
            try {
                container.repository.seedDemoData()
            } finally {
                container.seedReady.complete(Unit)
            }
        }
    }
}

class AppContainer(application: Application) {
    val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    val seedReady = CompletableDeferred<Unit>()
    private val keyProvider = DatabaseKeyProvider(application)
    private val database = TinyDatabase.build(application, keyProvider)
    val preferences = PreferencesRepository(application)
    val repository = TinyRepository(
        database = database,
        smsGateway = MockSmsGateway(),
        syncEngine = MockSyncEngine(),
    )
}
