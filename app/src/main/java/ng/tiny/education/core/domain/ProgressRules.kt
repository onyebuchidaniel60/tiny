package ng.tiny.education.core.domain

import ng.tiny.education.core.model.ProgressIndicator

data class ProgressDraft(
    val indicator: ProgressIndicator,
    val teacherNote: String?,
    val homeActivity: String?,
)

data class ProgressValidation(
    val valid: Boolean,
    val errors: List<String>,
)

object ProgressRules {
    const val MAX_NOTE = 300
    const val MAX_HOME_ACTIVITY = 240

    fun validate(draft: ProgressDraft): ProgressValidation {
        val errors = buildList {
            if ((draft.teacherNote?.length ?: 0) > MAX_NOTE) add("Teacher note exceeds $MAX_NOTE characters.")
            if ((draft.homeActivity?.length ?: 0) > MAX_HOME_ACTIVITY) add("Home activity exceeds $MAX_HOME_ACTIVITY characters.")
            if (draft.indicator == ProgressIndicator.NOT_ASSESSED && !draft.teacherNote.isNullOrBlank()) {
                add("A not-assessed entry should not carry a negative progress judgment.")
            }
        }
        return ProgressValidation(errors.isEmpty(), errors)
    }

    fun editingResetsApproval(wasApproved: Boolean): Boolean = wasApproved

    fun eligibleForDigest(indicator: ProgressIndicator, approved: Boolean): Boolean =
        approved && indicator != ProgressIndicator.NOT_ASSESSED
}
