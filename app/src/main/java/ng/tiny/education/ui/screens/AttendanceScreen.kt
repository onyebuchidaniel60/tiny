package ng.tiny.education.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ng.tiny.education.R
import ng.tiny.education.core.database.AttendanceEntryEntity
import ng.tiny.education.core.model.AttendanceSessionStatus
import ng.tiny.education.core.model.AttendanceStatus
import ng.tiny.education.ui.TinyViewModel
import ng.tiny.education.ui.components.InfoBanner
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.SectionHeading
import ng.tiny.education.ui.components.StatusPill
import ng.tiny.education.ui.components.TinyAvatar
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.components.TinySecondaryButton
import ng.tiny.education.ui.theme.TinyButter
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyTomato
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
fun AttendanceScreen(
    classId: String,
    viewModel: TinyViewModel,
    onBack: () -> Unit,
) {
    val today = remember { LocalDate.now() }
    val date = today.toString()
    val locale = LocalConfiguration.current.locales[0]
    val dateLabel = remember(today, locale) {
        today.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.FULL).withLocale(locale))
    }
    val session by viewModel.observeAttendance(classId, date).collectAsStateWithLifecycle(initialValue = null)
    val entries by remember(session?.id) {
        val id = session?.id
        if (id == null) kotlinx.coroutines.flow.flowOf(emptyList<AttendanceEntryEntity>())
        else viewModel.observeAttendanceEntries(id)
    }.collectAsStateWithLifecycle(initialValue = emptyList())
    val pupils by viewModel.observePupils(classId).collectAsStateWithLifecycle(initialValue = emptyList())
    val statuses = remember { mutableStateMapOf<String, AttendanceStatus>() }

    LaunchedEffect(entries) {
        entries.forEach { statuses[it.pupilId] = it.status }
    }

    val activeIds = pupils.map { it.id }
    val unmarked = activeIds.count { !statuses.containsKey(it) }
    val summary = ng.tiny.education.core.domain.AttendanceRules.summary(statuses.values)
    val isSubmitted = session?.status == AttendanceSessionStatus.SUBMITTED

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(
                title = stringResource(R.string.attendance_heading),
                subtitle = "$dateLabel · " + pluralStringResource(R.plurals.classes_pupil_count, pupils.size, pupils.size),
            )
            Spacer(Modifier.height(8.dp))
            InfoBanner(
                stringResource(R.string.attendance_local_note),
                tone = TinyCobalt,
            )
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusPill("${summary.present} ${stringResource(R.string.present)}", TinyForest)
                StatusPill("${summary.absent} ${stringResource(R.string.absent)}", TinyTomato)
                StatusPill("${summary.late} ${stringResource(R.string.late)}", TinyButter)
            }
        }
        items(pupils, key = { it.id }) { pupil ->
            PaperCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    TinyAvatar(pupil.displayName)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(pupil.displayName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                        Text(pupil.localCode ?: stringResource(R.string.no_local_code), style = MaterialTheme.typography.bodySmall)
                    }
                }
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChoice(
                        label = stringResource(R.string.present),
                        selected = statuses[pupil.id] == AttendanceStatus.PRESENT,
                        color = TinyForest,
                        onClick = { statuses[pupil.id] = AttendanceStatus.PRESENT },
                    )
                    StatusChoice(
                        label = stringResource(R.string.absent),
                        selected = statuses[pupil.id] == AttendanceStatus.ABSENT,
                        color = TinyTomato,
                        onClick = { statuses[pupil.id] = AttendanceStatus.ABSENT },
                    )
                    StatusChoice(
                        label = stringResource(R.string.late),
                        selected = statuses[pupil.id] == AttendanceStatus.LATE,
                        color = TinyButter,
                        onClick = { statuses[pupil.id] = AttendanceStatus.LATE },
                    )
                }
            }
        }
        item {
            if (unmarked > 0) {
                InfoBanner(
                    text = pluralStringResource(R.plurals.attendance_incomplete, unmarked, unmarked),
                    tone = TinyTomato,
                )
            } else {
                InfoBanner(
                    text = stringResource(R.string.attendance_absence_only_note),
                    tone = TinyForest,
                )
            }
        }
        item {
            if (isSubmitted) {
                PaperCard {
                    Column {
                        StatusPill(stringResource(R.string.status_submitted), TinyCobalt)
                        Spacer(Modifier.height(8.dp))
                        Text(stringResource(R.string.attendance_already_submitted), style = MaterialTheme.typography.bodyMedium)
                    }
                }
            } else {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TinySecondaryButton(
                        text = stringResource(R.string.save_draft),
                        onClick = {
                            viewModel.saveAttendanceDraft(classId, date, statuses.toMap())
                        },
                        modifier = Modifier.weight(1f),
                    )
                    TinyPrimaryButton(
                        text = stringResource(R.string.submit_attendance),
                        onClick = {
                            viewModel.submitAttendance(classId, date, statuses.toMap())
                        },
                        enabled = unmarked == 0,
                        modifier = Modifier.weight(1.4f),
                    )
                }
            }
        }
        item {
            TinySecondaryButton(
                text = stringResource(R.string.mark_all_present),
                onClick = { pupils.forEach { statuses[it.id] = AttendanceStatus.PRESENT } },
                modifier = Modifier.fillMaxWidth(),
            )
        }
        item {
            Text(
                stringResource(R.string.attendance_absence_only_note),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun StatusChoice(
    label: String,
    selected: Boolean,
    color: androidx.compose.ui.graphics.Color,
    onClick: () -> Unit,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = color.copy(alpha = 0.22f),
            selectedLabelColor = MaterialTheme.colorScheme.onSurface,
        ),
    )
}
