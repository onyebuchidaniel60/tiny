package ng.tiny.education.ui.screens

import android.app.Activity
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import ng.tiny.education.R
import ng.tiny.education.core.auth.AuthRepository
import ng.tiny.education.core.domain.PhoneNormalizer
import ng.tiny.education.ui.components.InfoBanner
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.components.TinySecondaryButton
import ng.tiny.education.ui.components.TinyWordmark
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyTomato

@Composable
fun PhoneAuthScreen(
    authRepository: AuthRepository,
    onSignedIn: () -> Unit,
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val scope = rememberCoroutineScope()
    var phone by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var verificationId by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun finishSignIn(result: Result<*>) {
        busy = false
        result.onSuccess { onSignedIn() }
            .onFailure { error = context.getString(R.string.auth_error) }
    }

    fun requestCode() {
        val normalized = PhoneNormalizer.normalize(phone)
        if (normalized == null) {
            error = context.getString(R.string.auth_phone_invalid)
            return
        }
        if (activity == null) {
            error = context.getString(R.string.auth_activity_required)
            return
        }
        error = null
        busy = true
        authRepository.requestCode(
            activity = activity,
            phoneE164 = normalized,
            onCodeSent = { id, _ ->
                verificationId = id
                busy = false
            },
            onVerificationCompleted = { credential ->
                scope.launch { finishSignIn(authRepository.signInWithCredential(credential)) }
            },
            onVerificationFailed = {
                busy = false
                error = context.getString(R.string.auth_verification_failed)
            },
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        TinyWordmark(modifier = Modifier.align(Alignment.Start))
        Spacer(Modifier.height(36.dp))
        Text(
            text = stringResource(R.string.auth_title),
            style = MaterialTheme.typography.displaySmall,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(10.dp))
        Text(
            text = stringResource(R.string.auth_subtitle),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(24.dp))
        PaperCard {
            Column {
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text(stringResource(R.string.auth_phone)) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(10.dp))
                if (verificationId != null) {
                    OutlinedTextField(
                        value = code,
                        onValueChange = { code = it },
                        label = { Text(stringResource(R.string.auth_code)) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(12.dp))
                    TinyPrimaryButton(
                        text = stringResource(R.string.auth_confirm),
                        onClick = {
                            val id = verificationId ?: return@TinyPrimaryButton
                            busy = true
                            scope.launch {
                                finishSignIn(authRepository.signInWithCode(id, code))
                            }
                        },
                        enabled = code.length >= 6 && !busy,
                        modifier = Modifier.fillMaxWidth(),
                    )
                } else {
                    TinyPrimaryButton(
                        text = stringResource(R.string.auth_send_code),
                        onClick = { requestCode() },
                        enabled = phone.isNotBlank() && !busy,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                if (busy) {
                    Spacer(Modifier.height(12.dp))
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
                }
                error?.let {
                    Spacer(Modifier.height(12.dp))
                    InfoBanner(it, tone = TinyTomato)
                }
            }
        }
        Spacer(Modifier.height(18.dp))
        InfoBanner(stringResource(R.string.auth_privacy_note), tone = TinyCobalt)
        Spacer(Modifier.height(18.dp))
        TinySecondaryButton(
            text = stringResource(R.string.auth_retry),
            onClick = { verificationId = null; code = ""; error = null },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(10.dp))
        Text(
            text = stringResource(R.string.auth_test_number_note),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
    }
}
