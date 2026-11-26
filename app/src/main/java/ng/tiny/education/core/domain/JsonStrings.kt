package ng.tiny.education.core.domain

/** Minimal JSON string escaping for durable outbox payloads. */
object JsonStrings {
    fun quote(value: String): String = buildString {
        append('"')
        for (char in value) {
            when (char) {
                '\\' -> append("\\\\")
                '"' -> append("\\\"")
                '\n' -> append("\\n")
                '\r' -> append("\\r")
                '\t' -> append("\\t")
                else -> {
                    if (char < ' ') append("\\u%04x".format(char.code)) else append(char)
                }
            }
        }
        append('"')
    }

    fun optional(value: String?): String = if (value.isNullOrBlank()) "null" else quote(value)
}
