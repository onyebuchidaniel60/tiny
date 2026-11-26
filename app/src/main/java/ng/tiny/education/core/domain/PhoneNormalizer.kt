package ng.tiny.education.core.domain

/** Nigerian phone normalization used by guardian linking and inbound sender matching. */
object PhoneNormalizer {
    private val allowed = Regex("^[0-9+ ()-]+$")

    fun normalize(raw: String): String? {
        val trimmed = raw.trim()
        if (trimmed.isEmpty() || !allowed.matches(trimmed)) return null
        val digits = trimmed.filter { it.isDigit() }
        val national = when {
            digits.startsWith("234") && digits.length == 13 -> digits.removePrefix("234")
            digits.startsWith("0") && digits.length == 11 -> digits.removePrefix("0")
            digits.length == 10 -> digits
            else -> return null
        }
        if (!national.matches(Regex("^[789][0-9]{9}$"))) return null
        return "+234$national"
    }

    fun isNormalized(value: String): Boolean = normalize(value) == value
}
