package ng.tiny.education.core.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.tinyDataStore: DataStore<Preferences> by preferencesDataStore(name = "tiny_preferences")

data class TinyPreferences(
    val language: String = "en",
    val onboarded: Boolean = false,
    val activeWorkspaceId: String? = null,
    val wifiOnly: Boolean = true,
    val teacherName: String = "Ms. Bello",
    val teacherTourCompleted: Boolean = false,
    val guardianTourCompleted: Boolean = false,
)

class PreferencesRepository(private val context: Context) {
    private object Keys {
        val language = stringPreferencesKey("language")
        val onboarded = booleanPreferencesKey("onboarded")
        val activeWorkspaceId = stringPreferencesKey("active_workspace_id")
        val wifiOnly = booleanPreferencesKey("wifi_only")
        val teacherName = stringPreferencesKey("teacher_name")
        val teacherTourCompleted = booleanPreferencesKey("teacher_tour_completed")
        val guardianTourCompleted = booleanPreferencesKey("guardian_tour_completed")
    }

    private val localeMirror = context.getSharedPreferences("tiny_locale", Context.MODE_PRIVATE)

    val preferences: Flow<TinyPreferences> = context.tinyDataStore.data.map { prefs ->
        TinyPreferences(
            language = prefs[Keys.language] ?: "en",
            onboarded = prefs[Keys.onboarded] ?: false,
            activeWorkspaceId = prefs[Keys.activeWorkspaceId],
            wifiOnly = prefs[Keys.wifiOnly] ?: true,
            teacherName = prefs[Keys.teacherName] ?: "Ms. Bello",
            teacherTourCompleted = prefs[Keys.teacherTourCompleted] ?: false,
            guardianTourCompleted = prefs[Keys.guardianTourCompleted] ?: false,
        )
    }

    suspend fun setLanguage(language: String) {
        context.tinyDataStore.edit { it[Keys.language] = language }
        // Mirrored synchronously so a cold start can apply the locale before the
        // first activity is composed, avoiding an English flash.
        localeMirror.edit().putString(KEY_LANGUAGE, language).apply()
    }

    suspend fun setTeacherTourCompleted(completed: Boolean) {
        context.tinyDataStore.edit { it[Keys.teacherTourCompleted] = completed }
    }

    suspend fun setGuardianTourCompleted(completed: Boolean) {
        context.tinyDataStore.edit { it[Keys.guardianTourCompleted] = completed }
    }

    suspend fun setOnboarded(onboarded: Boolean) {
        context.tinyDataStore.edit { it[Keys.onboarded] = onboarded }
    }

    suspend fun setActiveWorkspace(workspaceId: String?) {
        context.tinyDataStore.edit { prefs ->
            if (workspaceId == null) prefs.remove(Keys.activeWorkspaceId) else prefs[Keys.activeWorkspaceId] = workspaceId
        }
    }

    suspend fun setWifiOnly(enabled: Boolean) {
        context.tinyDataStore.edit { it[Keys.wifiOnly] = enabled }
    }

    suspend fun clearPreviewSession() {
        context.tinyDataStore.edit { prefs ->
            prefs[Keys.onboarded] = false
            prefs.remove(Keys.activeWorkspaceId)
        }
    }

    companion object {
        private const val KEY_LANGUAGE = "language"
        private val supportedLanguages = setOf("en", "ha", "yo", "ig")

        /** Read before Compose starts so the correct resources are loaded. */
        fun storedLanguage(context: Context): String {
            val value = context.getSharedPreferences("tiny_locale", Context.MODE_PRIVATE)
                .getString(KEY_LANGUAGE, "en")
            return if (value in supportedLanguages) value.orEmpty() else "en"
        }
    }
}
