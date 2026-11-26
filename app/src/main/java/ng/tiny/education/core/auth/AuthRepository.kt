package ng.tiny.education.core.auth

import android.app.Activity
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import com.google.firebase.auth.auth
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import ng.tiny.education.core.firebase.FirebaseRuntime

data class TinyUser(
    val uid: String,
    val phoneNumber: String?,
)

class AuthRepository(activityContext: android.content.Context) {
    val configured: Boolean = FirebaseRuntime.isConfigured(activityContext)

    private val auth: FirebaseAuth? = if (configured) Firebase.auth else null
    private val _user = MutableStateFlow(auth?.currentUser?.toTinyUser())
    val user: StateFlow<TinyUser?> = _user.asStateFlow()

    val isSignedIn: Boolean get() = _user.value != null

    fun requestCode(
        activity: Activity,
        phoneE164: String,
        onCodeSent: (verificationId: String, resendToken: PhoneAuthProvider.ForceResendingToken) -> Unit,
        onVerificationCompleted: (PhoneAuthCredential) -> Unit,
        onVerificationFailed: (Exception) -> Unit,
    ) {
        val firebaseAuth = auth ?: run {
            onVerificationFailed(IllegalStateException("Firebase Authentication is not configured."))
            return
        }
        val callbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
            override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                onVerificationCompleted(credential)
            }

            override fun onVerificationFailed(exception: com.google.firebase.FirebaseException) {
                onVerificationFailed(exception)
            }

            override fun onCodeSent(
                verificationId: String,
                token: PhoneAuthProvider.ForceResendingToken,
            ) {
                onCodeSent(verificationId, token)
            }
        }
        val options = PhoneAuthOptions.newBuilder(firebaseAuth)
            .setPhoneNumber(phoneE164)
            .setTimeout(60L, TimeUnit.SECONDS)
            .setActivity(activity)
            .setCallbacks(callbacks)
            .build()
        PhoneAuthProvider.verifyPhoneNumber(options)
    }

    suspend fun signInWithCode(verificationId: String, code: String): Result<TinyUser> = runCatching {
        val firebaseAuth = auth ?: error("Firebase Authentication is not configured.")
        val credential = PhoneAuthProvider.getCredential(verificationId, code)
        firebaseAuth.signInWithCredential(credential).await()
        val current = firebaseAuth.currentUser ?: error("Sign-in did not return a user.")
        val user = current.toTinyUser()
        _user.value = user
        user
    }

    suspend fun signInWithCredential(credential: PhoneAuthCredential): Result<TinyUser> = runCatching {
        val firebaseAuth = auth ?: error("Firebase Authentication is not configured.")
        firebaseAuth.signInWithCredential(credential).await()
        val current = firebaseAuth.currentUser ?: error("Sign-in did not return a user.")
        val user = current.toTinyUser()
        _user.value = user
        user
    }

    fun signOut() {
        auth?.signOut()
        _user.value = null
    }

    private fun FirebaseUser.toTinyUser() = TinyUser(uid = uid, phoneNumber = phoneNumber)
}
