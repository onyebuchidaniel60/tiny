package ng.tiny.education

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.w3c.dom.Element
import java.io.File
import javax.xml.parsers.DocumentBuilderFactory

/**
 * Guards the generated Android resources against the partial-translation defect.
 * English is the contract; every other language must define the same string and
 * plural keys with the same interpolation placeholders.
 */
class LocalizationTest {
    private val languages = listOf("values", "values-ha", "values-yo", "values-ig")

    private fun readResources(folder: String): Map<String, String> {
        val file = File("src/main/res/$folder/strings.xml")
        assertTrue("Missing $file", file.exists())
        val document = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(file)
        val result = mutableMapOf<String, String>()
        val strings = document.getElementsByTagName("string")
        for (index in 0 until strings.length) {
            val element = strings.item(index) as Element
            result["string:${element.getAttribute("name")}"] = element.textContent
        }
        val plurals = document.getElementsByTagName("plurals")
        for (index in 0 until plurals.length) {
            val element = plurals.item(index) as Element
            val name = element.getAttribute("name")
            val items = element.getElementsByTagName("item")
            for (itemIndex in 0 until items.length) {
                val item = items.item(itemIndex) as Element
                result["plurals:$name:${item.getAttribute("quantity")}"] = item.textContent
            }
        }
        return result
    }

    private fun placeholders(value: String): List<String> =
        Regex("%(\\d+)\\$[sd]").findAll(value).map { it.value }.sorted().toList()

    @Test
    fun everyLanguageDefinesTheSameKeysAndPlaceholders() {
        val english = readResources("values")
        assertTrue("English resources are unexpectedly small", english.size > 100)
        for (language in languages.drop(1)) {
            val translated = readResources(language)
            assertEquals("$language key set differs from English", english.keys.sorted(), translated.keys.sorted())
            for ((key, value) in english) {
                val translatedValue = translated.getValue(key)
                assertTrue("$language has an empty value for $key", translatedValue.isNotBlank())
                assertEquals("$language placeholder mismatch for $key", placeholders(value), placeholders(translatedValue))
            }
        }
    }

    @Test
    fun coreClassroomTermsAreTranslatedInEveryLanguage() {
        val required = listOf(
            "string:nav_classes",
            "string:attendance_title",
            "string:lessons_title",
            "string:progress_title",
            "string:guardians_title",
            "string:messages_title",
            "string:help_title",
            "string:tour_teacher_title",
            "string:tour_guardian_title",
        )
        for (language in languages.drop(1)) {
            val translated = readResources(language)
            for (key in required) {
                assertTrue("$language is missing $key", translated.containsKey(key))
            }
        }
    }
}
