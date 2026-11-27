package ng.tiny.education.ui

import androidx.annotation.StringRes

/** A snackbar message that is resolved against the current locale at render time. */
data class UiMessage(
    @StringRes val resId: Int,
    val args: List<Any> = emptyList(),
)
