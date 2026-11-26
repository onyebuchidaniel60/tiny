package ng.tiny.education.core.domain

import org.junit.Assert.assertEquals
import org.junit.Test

class JsonStringsTest {
    @Test fun escapesQuotesBackslashesAndNewlines() {
        assertEquals("\"a\\\"b\\\\c\\nd\"", JsonStrings.quote("a\"b\\c\nd"))
    }

    @Test fun rendersNullForBlankOptionalValues() {
        assertEquals("null", JsonStrings.optional(null))
        assertEquals("null", JsonStrings.optional("  "))
        assertEquals("\"present\"", JsonStrings.optional("present"))
    }

    @Test fun escapesControlCharacters() {
        assertEquals("\"\\u0001\"", JsonStrings.quote("\u0001"))
    }
}
