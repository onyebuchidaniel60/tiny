package ng.tiny.education.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import ng.tiny.education.ui.TinyViewModel
import ng.tiny.education.ui.components.InfoBanner
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.SectionHeading
import ng.tiny.education.ui.components.StatusPill
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.components.TinySecondaryButton
import ng.tiny.education.ui.theme.TinyButter
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyTomato
import java.time.LocalDate

@Composable
fun FollowUpsScreen(viewModel: TinyViewModel) {
    val followUps by viewModel.followUps.collectAsStateWithLifecycle()
    val classes by viewModel.classes.collectAsStateWithLifecycle()
    var showAdd by remember { mutableStateOf(false) }
    var title by remember { mutableStateOf("") }
    var detail by remember { mutableStateOf("") }
    var classId by remember { mutableStateOf("") }
    var dueDate by remember { mutableStateOf(LocalDate.now().plusDays(3).toString()) }

    if (showAdd) {
        AlertDialog(
            onDismissRequest = { showAdd = false },
            title = { Text(stringResource(R.string.save_followup)) },
            text = {
                Column {
                    OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text(stringResource(R.string.followup_title)) }, singleLine = true)
                    Spacer(Modifier.height(6.dp))
                    OutlinedTextField(value = detail, onValueChange = { detail = it }, label = { Text(stringResource(R.string.followup_detail)) }, minLines = 2)
                    Spacer(Modifier.height(6.dp))
                    OutlinedTextField(value = dueDate, onValueChange = { dueDate = it }, label = { Text(stringResource(R.string.due_date)) }, singleLine = true)
                    Spacer(Modifier.height(6.dp))
                    Text(stringResource(R.string.class_label), style = MaterialTheme.typography.labelLarge)
                    classes.forEach { classroom ->
                        TextButton(onClick = { classId = classroom.id }) {
                            Text("${if (classId == classroom.id) "✓ " else ""}${classroom.gradeLevel} ${classroom.label}")
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.addFollowUp(
                            pupilId = null,
                            classId = classId.ifBlank { classes.firstOrNull()?.id.orEmpty() },
                            title = title.trim(),
                            detail = detail.trim(),
                            dueDate = dueDate,
                            source = "manual",
                        )
                        showAdd = false
                        title = ""
                        detail = ""
                    },
                    enabled = title.isNotBlank() && classes.isNotEmpty(),
                ) { Text(stringResource(R.string.save)) }
            },
            dismissButton = { TextButton(onClick = { showAdd = false }) { Text(stringResource(R.string.cancel)) } },
        )
    }

    val open = followUps.filter { it.status == "open" }
    val done = followUps.filter { it.status != "open" }
    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(title = stringResource(R.string.open_followups), subtitle = stringResource(R.string.override_note))
            Spacer(Modifier.height(8.dp))
            TinyPrimaryButton(stringResource(R.string.save_followup), { showAdd = true }, Modifier.fillMaxWidth())
        }
        item {
            StatusPill("${open.size} ${stringResource(R.string.open_followups).lowercase()}", if (open.isEmpty()) TinyForest else TinyButter)
        }
        items(open, key = { it.id }) { item ->
            PaperCard {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(item.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text(item.detail, style = MaterialTheme.typography.bodySmall)
                            Text("${stringResource(R.string.due_date)}: ${item.dueDate}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        TextButton(onClick = { viewModel.updateFollowUpStatus(item.id, "done") }) { Text(stringResource(R.string.mark_done)) }
                    }
                }
            }
        }
        if (open.isEmpty()) {
            item { PaperCard { Text(stringResource(R.string.no_open_followups)) } }
        }
        if (done.isNotEmpty()) {
            item { SectionHeading(title = stringResource(R.string.followup_done), subtitle = null) }
            items(done, key = { it.id }) { item ->
                PaperCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(item.title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                            Text(
                                "${stringResource(R.string.followup_done)} · " + (item.completedAt?.let {
                                    java.time.Instant.ofEpochMilli(it).atZone(java.time.ZoneId.systemDefault()).toLocalDate()
                                } ?: ""),
                                style = MaterialTheme.typography.labelSmall,
                            )
                        }
                        StatusPill(stringResource(R.string.followup_done), TinyForest)
                    }
                }
            }
        }
        item {
            InfoBanner(stringResource(R.string.override_note), tone = TinyTomato)
        }
    }
}
