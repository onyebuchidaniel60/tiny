package ng.tiny.education.core.domain

/** Simple GSM-7/UCS-2 segment estimate for parent SMS cost and template limits. */
object SmsSegments {
    private val gsm7Chars: Set<Char> = buildSet {
        addAll("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".toList())
        addAll(" @£$¥èéùìòÇ\nØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!\"#¤%&'()*+,-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~]|€".toList())
    }

    fun isGsm7(text: String): Boolean = text.all { it in gsm7Chars }

    fun estimate(text: String): Int {
        if (text.isEmpty()) return 0
        return if (isGsm7(text)) {
            if (text.length <= 160) 1 else (text.length + 152) / 153
        } else {
            if (text.length <= 70) 1 else (text.length + 66) / 67
        }.coerceAtLeast(1)
    }

    fun fits(text: String, maxSegments: Int = 2): Boolean = estimate(text) <= maxSegments
}
