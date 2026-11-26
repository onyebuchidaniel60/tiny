package ng.tiny.education.core.domain

import ng.tiny.education.core.model.ProgressIndicator

data class DigestPupil(
    val displayName: String,
    val indicator: ProgressIndicator,
    val note: String?,
    val homeActivity: String?,
)

data class DigestGroup(
    val guardianId: String,
    val workspaceName: String,
    val locale: String,
    val pupils: List<DigestPupil>,
)

object DigestBuilder {
    fun build(group: DigestGroup, maxSegments: Int = 2): String {
        val header = "Tiny weekly update — ${group.workspaceName}"
        val lines = group.pupils.map { pupil ->
            val indicator = when (pupil.indicator) {
                ProgressIndicator.DOING_WELL -> "Doing well"
                ProgressIndicator.DEVELOPING -> "Developing"
                ProgressIndicator.NEEDS_SUPPORT -> "Needs support"
                ProgressIndicator.NOT_ASSESSED -> "Not assessed"
            }
            buildString {
                append("${pupil.displayName}: $indicator.")
                pupil.note?.takeIf { it.isNotBlank() }?.let { append(" $it") }
            }
        }
        val home = group.pupils.mapNotNull { it.homeActivity?.takeIf(String::isNotBlank) }
            .distinct()
            .joinToString(" ")
        val footer = "Reply to your school if you have a question."

        val full = (listOf(header) + lines + listOfNotNull(home.takeIf { it.isNotBlank() }) + footer).joinToString("\n")
        val withoutHome = (listOf(header) + lines + footer).joinToString("\n")
        val compact = (listOf(header) + lines.take(1) + footer).joinToString("\n")
        return listOf(full, withoutHome, compact)
            .firstOrNull { SmsSegments.fits(it, maxSegments) }
            ?: header
    }
}
