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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ng.tiny.education.R
import ng.tiny.education.core.intelligence.PupilIntelligenceStatus
import ng.tiny.education.ui.TinyViewModel
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.SectionHeading
import ng.tiny.education.ui.components.StatusPill
import ng.tiny.education.ui.components.TinyAvatar
import ng.tiny.education.ui.components.TinySecondaryButton
import ng.tiny.education.ui.theme.TinyButter
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyTomato

@Composable
fun PupilDirectoryScreen(
    viewModel: TinyViewModel,
    onOpenPupil: (String) -> Unit,
    onOpenFollowUps: () -> Unit,
) {
    val directory by viewModel.pupilDirectory.collectAsStateWithLifecycle()
    val classes by viewModel.classes.collectAsStateWithLifecycle()
    var filter by remember { mutableStateOf("all") }
    val visible = directory.filter { filter == "all" || it.pupil.classId == filter }

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            SectionHeading(title = stringResource(R.string.pupil_directory), subtitle = stringResource(R.string.pupil_directory_subtitle))
            Spacer(Modifier.height(8.dp))
            TinySecondaryButton(stringResource(R.string.open_followups), onOpenFollowUps, Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FilterChip(selected = filter == "all", onClick = { filter = "all" }, label = { Text(stringResource(R.string.view_all)) })
                classes.forEach { classroom ->
                    FilterChip(selected = filter == classroom.id, onClick = { filter = classroom.id }, label = { Text("${classroom.gradeLevel} ${classroom.label}") })
                }
            }
        }
        items(visible, key = { it.pupil.id }) { profile ->
            val classroom = classes.find { it.id == profile.pupil.classId }
            PaperCard(onClick = { onOpenPupil(profile.pupil.id) }) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    TinyAvatar(profile.pupil.displayName)
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)) {
                        Text(profile.pupil.displayName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(
                            "${classroom?.gradeLevel ?: ""} ${classroom?.label ?: ""} · ${profile.pupil.localCode ?: stringResource(R.string.no_local_code)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            "${profile.attendance.rate}% ${stringResource(R.string.attendance_rate).lowercase()} · ${profile.assessments.count} ${stringResource(R.string.assessment_title).lowercase()}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        StatusPill(stringResource(statusRes(profile.status)), statusColor(profile.status))
                        Text(stringResource(confidenceRes(profile.confidence)), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
        if (visible.isEmpty()) item { PaperCard { Text(stringResource(R.string.empty_generic)) } }
    }
}

private fun statusColor(status: PupilIntelligenceStatus): androidx.compose.ui.graphics.Color = when (status) {
    PupilIntelligenceStatus.NEEDS_ATTENTION -> TinyTomato
    PupilIntelligenceStatus.IMPROVING -> TinyCobalt
    PupilIntelligenceStatus.STRONG -> TinyForest
    else -> TinyButter
}
