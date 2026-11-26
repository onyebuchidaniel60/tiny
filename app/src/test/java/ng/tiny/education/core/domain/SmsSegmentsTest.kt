package ng.tiny.education.core.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SmsSegmentsTest {
    @Test fun shortAsciiFitsOneSegment() {
        assertTrue(SmsSegments.isGsm7("Tiny: Amina is absent today."))
        assertEquals(1, SmsSegments.estimate("Tiny: Amina is absent today."))
    }

    @Test fun longAsciiUsesConcatenatedSegments() {
        val text = "A".repeat(161)
        assertEquals(2, SmsSegments.estimate(text))
    }

    @Test fun unicodeUsesUcs2Limits() {
        val text = "Tiny: Ẹ káàárọ̀"
        assertFalse(SmsSegments.isGsm7(text))
        assertEquals(1, SmsSegments.estimate(text))
        assertFalse(SmsSegments.fits("Ẹ".repeat(71), maxSegments = 1))
    }

    @Test fun emptyMessageHasZeroSegments() {
        assertEquals(0, SmsSegments.estimate(""))
    }
}
