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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.List
import androidx.compose.material3.Icon
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import ng.tiny.education.core.database.ClassroomEntity
import ng.tiny.education.core.database.PupilEntity
import ng.tiny.education.ui.TinyViewModel
import ng.tiny.education.ui.components.InfoBanner
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.SectionHeading
import ng.tiny.education.ui.components.StatusPill
import ng.tiny.education.ui.components.TinyAvatar
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.components.TinySecondaryButton
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyTomato

@Composable
fun ClassesScreen(
    viewModel: TinyViewModel,
    onOpenClass: (String) -> Unit,
    onOpenAttendance: (String) -> Unit,
) {
    val classes by viewModel.classes.collectAsStateWithLifecycle()
    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(
                title = stringResource(R.string.classes_heading),
                subtitle = stringResource(R.string.classes_subtitle),
            )
            Spacer(Modifier.height(8.dp))
            InfoBanner("This preview stores class records locally in an encrypted Room database. Cloud class sync is not connected.")
        }
        items(classes, key = { it.id }) { classroom ->
            ClassCard(
                classroom = classroom,
                pupilCountFlow = viewModel.observeClassPupilCount(classroom.id),
                onOpen = { onOpenClass(classroom.id) },
                onAttendance = { onOpenAttendance(classroom.id) },
            )
        }
        if (classes.isEmpty()) {
            item { PaperCard { Text("Preparing the sample classes…") } }
        }
    }
}

@Composable
private fun ClassCard(
    classroom: ClassroomEntity,
    pupilCountFlow: kotlinx.coroutines.flow.Flow<Int>,
    onOpen: () -> Unit,
    onAttendance: () -> Unit,
) {
    val count by pupilCountFlow.collectAsStateWithLifecycle(initialValue = 0)
    PaperCard(onClick = onOpen) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            TinyAvatar(classroom.teacherName)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text("${classroom.gradeLevel} ${classroom.label}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text(
                    "$count pupils · ${classroom.academicYear}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            StatusPill("Local", TinyCobalt)
        }
        Spacer(Modifier.height(10.dp))
        Text(classroom.subjectSummary, style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TinyPrimaryButton(stringResource(R.string.mark_attendance), onAttendance, Modifier.weight(1f))
            TinySecondaryButton("Open", onOpen)
        }
    }
}

@Composable
fun ClassDetailScreen(
    classId: String,
    viewModel: TinyViewModel,
    onBack: () -> Unit,
    onAttendance: () -> Unit,
    onProgress: (String) -> Unit,
) {
    val classroom by viewModel.observeClass(classId).collectAsStateWithLifecycle(initialValue = null)
    val pupils by viewModel.observePupils(classId).collectAsStateWithLifecycle(initialValue = emptyList())
    var showAddPupil by remember { mutableStateOf(false) }
    var pupilName by remember { mutableStateOf("") }
    var pupilCode by remember { mutableStateOf("") }

    if (showAddPupil) {
        AlertDialog(
            onDismissRequest = { showAddPupil = false },
            title = { Text(stringResource(R.string.add_pupil)) },
            text = {
                Column {
                    OutlinedTextField(
                        value = pupilName,
                        onValueChange = { pupilName = it },
                        label = { Text(stringResource(R.string.pupil_name)) },
                        singleLine = true,
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = pupilCode,
                        onValueChange = { pupilCode = it },
                        label = { Text(stringResource(R.string.local_code)) },
                        singleLine = true,
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.addPupil(classId, pupilName, pupilCode)
                        showAddPupil = false
                        pupilName = ""
                        pupilCode = ""
                    },
                    enabled = pupilName.isNotBlank(),
                ) { Text(stringResource(R.string.add)) }
            },
            dismissButton = {
                TextButton(onClick = { showAddPupil = false }) { Text(stringResource(R.string.cancel)) }
            },
        )
    }

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            classroom?.let { cls ->
                SectionHeading(
                    title = "${cls.gradeLevel} ${cls.label}",
                    subtitle = "${cls.academicYear} · ${cls.subjectSummary}",
                )
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TinyPrimaryButton(stringResource(R.string.mark_attendance), onAttendance, Modifier.weight(1f))
                TinySecondaryButton("Progress", { pupils.firstOrNull()?.let { onProgress(it.id) } })
            }
        }
        item {
            SectionHeading(title = stringResource(R.string.roster), subtitle = "Active pupils in this class.")
            Spacer(Modifier.height(8.dp))
            TinySecondaryButton(
                text = stringResource(R.string.add_pupil),
                onClick = { showAddPupil = true },
                modifier = Modifier.fillMaxWidth(),
            )
        }
        items(pupils, key = { it.id }) { pupil ->
            PupilRow(pupil = pupil, onProgress = { onProgress(pupil.id) })
        }
        if (pupils.isEmpty()) {
            item { PaperCard { Text("No active pupils in this class yet.") } }
        }
        item {
            InfoBanner(
                "Pupil names shown here are synthetic demo records. Real pupil data must not be used in this preview.",
                tone = TinyTomato,
            )
        }
    }
}

@Composable
private fun PupilRow(pupil: PupilEntity, onProgress: () -> Unit) {
    PaperCard(onClick = onProgress) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            TinyAvatar(pupil.displayName)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(pupil.displayName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(
                    pupil.localCode ?: "No local code",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Icon(Icons.Outlined.Edit, contentDescription = "Record progress", tint = TinyForest)
        }
    }
}
