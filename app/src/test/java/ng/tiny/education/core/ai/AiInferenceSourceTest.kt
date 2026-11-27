package ng.tiny.education.core.ai

import com.google.firebase.ai.InferenceSource
import com.google.firebase.ai.type.PublicPreviewAPI
import org.junit.Assert.assertEquals
import org.junit.Test

@OptIn(PublicPreviewAPI::class)
class AiInferenceSourceTest {
    @Test
    fun labelsSdkReportedSourcesHonestly() {
        assertEquals("On-device Gemini Nano", inferenceSourceLabel(InferenceSource.ON_DEVICE))
        assertEquals("Cloud Gemini", inferenceSourceLabel(InferenceSource.IN_CLOUD))
        assertEquals("Unknown inference source", inferenceSourceLabel(null))
    }
}
