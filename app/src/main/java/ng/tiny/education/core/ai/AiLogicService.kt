package ng.tiny.education.core.ai

import android.content.Context
import com.google.firebase.Firebase
import com.google.firebase.ai.InferenceMode
import com.google.firebase.ai.InferenceSource
import com.google.firebase.ai.OnDeviceConfig
import com.google.firebase.ai.OnDeviceModelStatus
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.GenerativeBackend
import com.google.firebase.ai.type.PublicPreviewAPI
import ng.tiny.education.BuildConfig
import ng.tiny.education.core.firebase.FirebaseRuntime

data class AiGeneration(
    val text: String,
    val source: String,
)

internal fun inferenceSourceLabel(source: InferenceSource?): String = when (source) {
    InferenceSource.ON_DEVICE -> "On-device Gemini Nano"
    InferenceSource.IN_CLOUD -> "Cloud Gemini"
    else -> "Unknown inference source"
}

@OptIn(PublicPreviewAPI::class)
class AiLogicService(context: Context) {
    val configured: Boolean = FirebaseRuntime.isConfigured(context)

    private val model by lazy {
        Firebase.ai(
            backend = GenerativeBackend.googleAI(),
            useLimitedUseAppCheckTokens = true,
        ).generativeModel(
            modelName = BuildConfig.CLOUD_MODEL_NAME,
            onDeviceConfig = OnDeviceConfig(mode = InferenceMode.PREFER_ON_DEVICE),
        )
    }

    suspend fun onDeviceStatus(): String {
        if (!configured) return "Firebase not configured"
        return runCatching {
            val status = model.onDeviceExtension?.checkStatus()
            if (status == OnDeviceModelStatus.AVAILABLE) "Available"
            else if (status == OnDeviceModelStatus.DOWNLOADABLE) "Downloadable"
            else if (status == OnDeviceModelStatus.DOWNLOADING) "Downloading"
            else "Unavailable on this device"
        }.getOrElse { "Unavailable: ${it.message ?: "check failed"}" }
    }

    suspend fun generateTeachingStrategy(): Result<AiGeneration> = runCatching {
        check(configured) { "Firebase AI Logic is not configured." }
        val prompt = """
            Suggest one short, practical classroom strategy for a Primary 4 basic science lesson
            about sources and uses of water. Use at most 90 English words. Do not mention any pupil,
            phone number, school record or diagnosis. Return plain text only.
        """.trimIndent()
        val response = model.generateContent(prompt)
        val text = response.text?.trim().orEmpty()
        check(text.isNotEmpty()) { "The model returned no text." }
        AiGeneration(
            text = text,
            source = inferenceSourceLabel(response.inferenceSource),
        )
    }
}
