package ng.tiny.education.core.domain

import ng.tiny.education.core.model.ProgressIndicator
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DigestBuilderTest {
    @Test fun onlyProvidedApprovedDataIsRendered() {
        val digest = DigestBuilder.build(
            DigestGroup(
                guardianId = "g1",
                workspaceName = "Demo Primary",
                locale = "en",
                pupils = listOf(
                    DigestPupil("Amina", ProgressIndicator.DOING_WELL, "Explained three uses of water.", "Name two water sources."),
                ),
            ),
        )
        assertTrue(digest.contains("Amina"))
        assertTrue(digest.contains("Doing well"))
        assertFalse(digest.contains("ranking"))
    }

    @Test fun digestStaysWithinSegmentBudget() {
        val digest = DigestBuilder.build(
            DigestGroup(
                guardianId = "g1",
                workspaceName = "Demo Primary",
                locale = "en",
                pupils = (1..8).map {
                    DigestPupil("Pupil $it", ProgressIndicator.DEVELOPING, "A short factual observation.", null)
                },
            ),
            maxSegments = 2,
        )
        assertTrue(SmsSegments.fits(digest, 2))
    }
}
