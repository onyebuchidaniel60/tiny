package ng.tiny.education.core.firebase

import android.content.Context
import android.util.Log
import com.google.firebase.Firebase
import com.google.firebase.FirebaseApp
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory
import com.google.firebase.functions.FirebaseFunctions
import ng.tiny.education.BuildConfig

/**
 * Firebase is optional in the preview: without google-services.json the app
 * stays in local/mock mode. When configured, App Check is installed before any
 * Auth, Firestore, Functions or AI Logic call.
 */
object FirebaseRuntime {
    fun isConfigured(context: Context): Boolean =
        FirebaseApp.getApps(context).isNotEmpty()

    fun initialize(context: Context) {
        if (!isConfigured(context)) return
        val appCheck = FirebaseAppCheck.getInstance()
        if (BuildConfig.DEBUG) {
            appCheck.installAppCheckProviderFactory(DebugAppCheckProviderFactory.getInstance())
            Log.i("TinyFirebase", "App Check debug provider installed. Register its debug token before enforcing App Check.")
        } else {
            appCheck.installAppCheckProviderFactory(PlayIntegrityAppCheckProviderFactory.getInstance())
        }
    }

    fun functions(context: Context): FirebaseFunctions? {
        if (!isConfigured(context)) return null
        return FirebaseFunctions.getInstance(FirebaseApp.getInstance(), BuildConfig.FUNCTIONS_REGION).apply {
            if (BuildConfig.FUNCTIONS_EMULATOR) {
                useEmulator("10.0.2.2", 5001)
                Log.i("TinyFirebase", "Functions emulator enabled at 10.0.2.2:5001.")
            }
        }
    }
}
