package ng.tiny.education.core.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PhoneNormalizerTest {
    @Test fun normalizesNigerianLocalNumber() {
        assertEquals("+2348031234567", PhoneNormalizer.normalize("0803 123 4567"))
    }

    @Test fun normalizesCountryCodeNumber() {
        assertEquals("+2348031234567", PhoneNormalizer.normalize("2348031234567"))
    }

    @Test fun rejectsInvalidLengthOrPrefix() {
        assertNull(PhoneNormalizer.normalize("12345"))
        assertNull(PhoneNormalizer.normalize("06031234567"))
        assertNull(PhoneNormalizer.normalize("hello"))
    }

    @Test fun normalizedValueIsStable() {
        assertTrue(PhoneNormalizer.isNormalized("+2348031234567"))
        assertFalse(PhoneNormalizer.isNormalized("08031234567"))
    }
}
