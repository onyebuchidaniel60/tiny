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

enum class DeviceAiStatus {
    AVAILABLE,
    DOWNLOADABLE,
    DOWNLOADING,
    UNAVAILABLE,
    NOT_CONFIGURED,
}

enum class AiTask(val prompt: String) {
    LESSON_PLAN(
        "Draft a short Primary 4 basic science lesson outline about sources and uses of water using the 5E structure. " +
            "Use at most 140 English words. Do not mention any pupil, phone number, school record or diagnosis. Return plain text only.",
    ),
    EXPLAIN(
        "Explain the water cycle in simple English for a Primary 4 teacher, with one local example. " +
            "Use at most 100 words. Do not mention any pupil, phone number, school record or diagnosis. Return plain text only.",
    ),
    ADAPT(
        "Suggest three ways to adapt a Primary 4 lesson on water for pupils with mixed reading levels, using low-cost classroom materials. " +
            "Use at most 120 English words. Do not mention any pupil, phone number, school record or diagnosis. Return plain text only.",
    ),
    ASSESS(
        "Suggest a five-question quick check for understanding after a Primary 4 lesson on sources and uses of water. Include answers. " +
            "Use at most 140 English words. Do not mention any pupil, phone number, school record or diagnosis. Return plain text only.",
    ),
    SUPPORT(
        "Suggest two practical ways a teacher can support a pupil who is still unsure about sources of water, without labelling or diagnosing the child. " +
            "Use at most 100 English words. Do not mention any pupil, phone number, school record or diagnosis. Return plain text only.",
    ),
    PARENT_NOTE(
        "Draft a short, factual, friendly family message about the week's water lesson and one home activity. " +
            "Do not mention any pupil name, phone number, grade or diagnosis. Use at most 60 English words. Return plain text only.",
    ),
}

data class AiGeneration(
    val text: String,
    val source: String,
)

@OptIn(PublicPreviewAPI::class)
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

    suspend fun onDeviceStatus(): DeviceAiStatus {
        if (!configured) return DeviceAiStatus.NOT_CONFIGURED
        return runCatching {
            val status = model.onDeviceExtension?.checkStatus()
            when (status) {
                OnDeviceModelStatus.AVAILABLE -> DeviceAiStatus.AVAILABLE
                OnDeviceModelStatus.DOWNLOADABLE -> DeviceAiStatus.DOWNLOADABLE
                OnDeviceModelStatus.DOWNLOADING -> DeviceAiStatus.DOWNLOADING
                else -> DeviceAiStatus.UNAVAILABLE
            }
        }.getOrElse { DeviceAiStatus.UNAVAILABLE }
    }

    suspend fun generateTeachingStrategy(task: AiTask = AiTask.LESSON_PLAN): Result<AiGeneration> = runCatching {
        check(configured) { "Firebase AI Logic is not configured." }
        val response = model.generateContent(task.prompt)
        val text = response.text?.trim().orEmpty()
        check(text.isNotEmpty()) { "The model returned no text." }
        AiGeneration(
            text = text,
            source = inferenceSourceLabel(response.inferenceSource),
        )
    }
}
