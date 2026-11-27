package ng.tiny.education.ui.components

import androidx.annotation.StringRes
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import ng.tiny.education.R

data class TourStep(
    @StringRes val titleRes: Int,
    @StringRes val bodyRes: Int,
)

@Composable
fun TourDialog(
    @StringRes titleRes: Int,
    @StringRes introRes: Int,
    steps: List<TourStep>,
    onComplete: () -> Unit,
    onDismiss: () -> Unit,
) {
    if (steps.isEmpty()) return
    var index by rememberSaveable { mutableIntStateOf(0) }
    val step = steps[index.coerceIn(0, steps.lastIndex)]
    val last = index == steps.lastIndex

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 2.dp,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(
                modifier = Modifier
                    .padding(22.dp)
                    .verticalScroll(rememberScrollState()),
            ) {
                Text(
                    text = stringResource(R.string.help_tours).uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(Modifier.height(4.dp))
                Text(stringResource(titleRes), style = MaterialTheme.typography.headlineMedium)
                Spacer(Modifier.height(8.dp))
                Text(
                    stringResource(introRes),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(14.dp))
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text(
                            stringResource(R.string.tour_step_of, index + 1, steps.size),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(stringResource(step.titleRes), style = MaterialTheme.typography.titleLarge)
                        Spacer(Modifier.height(6.dp))
                        Text(stringResource(step.bodyRes), style = MaterialTheme.typography.bodyMedium)
                    }
                }
                Spacer(Modifier.height(12.dp))
                LinearProgressIndicator(
                    progress = { (index + 1f) / steps.size },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(5.dp),
                )
                Spacer(Modifier.height(14.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    TextButton(onClick = onDismiss) {
                        Text(stringResource(R.string.tour_skip))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(
                            onClick = { index = (index - 1).coerceAtLeast(0) },
                            enabled = index > 0,
                        ) { Text(stringResource(R.string.tour_previous)) }
                        TextButton(
                            onClick = {
                                if (last) onComplete() else index += 1
                            },
                        ) {
                            Text(stringResource(if (last) R.string.tour_finish else R.string.tour_next))
                        }
                    }
                }
            }
        }
    }
}

fun teacherTourSteps(): List<TourStep> = listOf(
    TourStep(R.string.tour_step_1_title, R.string.tour_step_1_body),
    TourStep(R.string.tour_step_2_title, R.string.tour_step_2_body),
    TourStep(R.string.tour_step_3_title, R.string.tour_step_3_body),
    TourStep(R.string.tour_step_4_title, R.string.tour_step_4_body),
    TourStep(R.string.tour_step_5_title, R.string.tour_step_5_body),
    TourStep(R.string.tour_step_6_title, R.string.tour_step_6_body),
    TourStep(R.string.tour_step_7_title, R.string.tour_step_7_body),
    TourStep(R.string.tour_step_8_title, R.string.tour_step_8_body),
    TourStep(R.string.tour_step_9_title, R.string.tour_step_9_body),
    TourStep(R.string.tour_step_10_title, R.string.tour_step_10_body),
)

fun guardianTourSteps(): List<TourStep> = listOf(
    TourStep(R.string.tour_guardian_step_1_title, R.string.tour_guardian_step_1_body),
    TourStep(R.string.tour_guardian_step_2_title, R.string.tour_guardian_step_2_body),
    TourStep(R.string.tour_guardian_step_3_title, R.string.tour_guardian_step_3_body),
    TourStep(R.string.tour_guardian_step_4_title, R.string.tour_guardian_step_4_body),
)
