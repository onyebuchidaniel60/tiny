package ng.tiny.education

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.runBlocking
import ng.tiny.education.core.ai.AiLogicService
import ng.tiny.education.core.firebase.FirebaseRuntime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Live Firebase AI Logic smoke test. Runs only in the manual, private
 * firebase-ai-smoke CI job with a registered App Check debug token and the
 * real non-production project config. The APK is never uploaded.
 */
@RunWith(AndroidJUnit4::class)
class AiLogicLiveTest {
    @Test
    fun cloudGenerationReportsSdkSource() = runBlocking {
        val context = ApplicationProvider.getApplicationContext<Context>()
        assertTrue("Firebase must be configured for this live test", FirebaseRuntime.isConfigured(context))

        val service = AiLogicService(context)
        val deviceStatus = service.onDeviceStatus()
        assertFalse("A generic emulator must not claim on-device Gemini Nano", deviceStatus == "Available")

        val result = service.generateTeachingStrategy()
        assertTrue("AI Logic call failed: ${result.exceptionOrNull()?.message}", result.isSuccess)
        val generation = result.getOrThrow()
        assertTrue("AI Logic returned no text", generation.text.isNotBlank())
        assertEquals("Cloud Gemini", generation.source)
    }
}
