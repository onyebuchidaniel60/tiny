package ng.tiny.education.ui.screens

import androidx.annotation.StringRes
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
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ng.tiny.education.R
import ng.tiny.education.core.database.OutboxCommandEntity
import ng.tiny.education.core.model.SyncState
import ng.tiny.education.core.model.WorkspaceType
import ng.tiny.education.ui.TinyViewModel
import ng.tiny.education.ui.components.InfoBanner
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.SectionHeading
import ng.tiny.education.ui.components.StatusPill
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.components.TinySecondaryButton
import ng.tiny.education.ui.theme.TinyButter
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyTomato

@Composable
fun SettingsScreen(
    viewModel: TinyViewModel,
    onOpenSync: () -> Unit,
    onOpenHelp: () -> Unit,
    onShowTeacherTour: () -> Unit,
    onShowGuardianTour: () -> Unit,
) {
    val preferences by viewModel.preferences.collectAsStateWithLifecycle()
    val workspace by viewModel.workspace.collectAsStateWithLifecycle()
    val pending by viewModel.pendingOutboxCount.collectAsStateWithLifecycle()
    var showCreateWorkspace by remember { mutableStateOf(false) }
    var workspaceName by remember { mutableStateOf("") }
    var workspaceType by remember { mutableStateOf(WorkspaceType.SCHOOL) }

    if (showCreateWorkspace) {
        AlertDialog(
            onDismissRequest = { showCreateWorkspace = false },
            title = { Text(stringResource(R.string.create_workspace)) },
            text = {
                Column {
                    OutlinedTextField(
                        value = workspaceName,
                        onValueChange = { workspaceName = it },
                        label = { Text(stringResource(R.string.workspace_name)) },
                        singleLine = true,
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = workspaceType == WorkspaceType.SCHOOL,
                            onClick = { workspaceType = WorkspaceType.SCHOOL },
                            label = { Text(stringResource(R.string.school)) },
                        )
                        FilterChip(
                            selected = workspaceType == WorkspaceType.INDEPENDENT,
                            onClick = { workspaceType = WorkspaceType.INDEPENDENT },
                            label = { Text(stringResource(R.string.independent)) },
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        stringResource(R.string.create_workspace_hint),
                        style = MaterialTheme.typography.labelSmall,
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.createWorkspace(workspaceName, workspaceType)
                        showCreateWorkspace = false
                        workspaceName = ""
                    },
                    enabled = workspaceName.isNotBlank(),
                ) { Text(stringResource(R.string.create)) }
            },
            dismissButton = { TextButton(onClick = { showCreateWorkspace = false }) { Text(stringResource(R.string.cancel)) } },
        )
    }

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(title = stringResource(R.string.settings_heading), subtitle = stringResource(R.string.settings_subtitle))
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.teacher_language), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        LanguageChip(stringResource(R.string.language_english), preferences.language == "en") { viewModel.setLanguage("en") }
                        LanguageChip(stringResource(R.string.language_hausa), preferences.language == "ha") { viewModel.setLanguage("ha") }
                    }
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        LanguageChip(stringResource(R.string.language_yoruba), preferences.language == "yo") { viewModel.setLanguage("yo") }
                        LanguageChip(stringResource(R.string.language_igbo), preferences.language == "ig") { viewModel.setLanguage("ig") }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        stringResource(R.string.language_draft_disclosure),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.workspace_setting), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    Text(workspace?.name ?: stringResource(R.string.demo_school_name), style = MaterialTheme.typography.bodyLarge)
                    Text(
                        stringResource(R.string.school_code_label, workspace?.schoolCode ?: "KOFAR001"),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(8.dp))
                    StatusPill(stringResource(R.string.saved_on_device), TinyCobalt)
                    Spacer(Modifier.height(10.dp))
                    TinySecondaryButton(
                        text = stringResource(R.string.create_workspace),
                        onClick = { showCreateWorkspace = true },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
        item {
            PaperCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(stringResource(R.string.wifi_only), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(stringResource(R.string.wifi_only_summary), style = MaterialTheme.typography.bodySmall)
                    }
                    Switch(
                        checked = preferences.wifiOnly,
                        onCheckedChange = { viewModel.setWifiOnly(it) },
                    )
                }
            }
        }
        item {
            PaperCard(onClick = onOpenSync) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(stringResource(R.string.sync_setting), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(
                            if (pending > 0) pluralStringResource(R.plurals.sync_center_pending, pending, pending)
                            else stringResource(R.string.sync_center_empty),
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                    StatusPill(
                        stringResource(if (pending > 0) R.string.pending_status else R.string.saved_on_device),
                        if (pending > 0) TinyButter else TinyForest,
                    )
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.help_about), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    Text(stringResource(R.string.help_subtitle), style = MaterialTheme.typography.bodySmall)
                    Spacer(Modifier.height(10.dp))
                    TinyPrimaryButton(
                        text = stringResource(R.string.open_help),
                        onClick = onOpenHelp,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(8.dp))
                    TinySecondaryButton(
                        text = stringResource(R.string.replay_teacher_tour),
                        onClick = onShowTeacherTour,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(8.dp))
                    TinySecondaryButton(
                        text = stringResource(R.string.replay_guardian_tour),
                        onClick = onShowGuardianTour,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.privacy_setting), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    Text(stringResource(R.string.settings_local_note), style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.about_setting), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    Text(stringResource(R.string.about_body), style = MaterialTheme.typography.bodySmall)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        stringResource(R.string.version_label, "0.1.0"),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        item {
            InfoBanner(stringResource(R.string.evaluation_disclosure), tone = TinyTomato)
        }
        item {
            TinySecondaryButton(
                text = stringResource(R.string.sign_out),
                onClick = { viewModel.signOut() },
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun LanguageChip(label: String, selected: Boolean, onClick: () -> Unit) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) },
    )
}

@Composable
fun SyncScreen(
    viewModel: TinyViewModel,
    onBack: () -> Unit,
) {
    val outbox by viewModel.outbox.collectAsStateWithLifecycle()
    val pending by viewModel.pendingOutboxCount.collectAsStateWithLifecycle()
    val backend = viewModel.backendSyncEnabled
    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(
                title = stringResource(R.string.sync_center_title),
                subtitle = if (backend) stringResource(R.string.sync_subtitle) else stringResource(R.string.mock_sync_notice),
            )
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusPill(
                    if (pending > 0) pluralStringResource(R.plurals.sync_center_pending, pending, pending)
                    else stringResource(R.string.sync_center_empty),
                    if (pending > 0) TinyButter else TinyForest,
                )
                StatusPill(
                    stringResource(if (backend) R.string.firebase else R.string.local_workspace),
                    TinyCobalt,
                )
            }
        }
        item {
            TinyPrimaryButton(
                text = stringResource(R.string.sync_now),
                onClick = { viewModel.syncNow() },
                modifier = Modifier.fillMaxWidth(),
            )
        }
        items(outbox, key = { it.id }) { command ->
            OutboxRow(command)
        }
        if (outbox.isEmpty()) {
            item { PaperCard { Text(stringResource(R.string.sync_center_empty)) } }
        }
        item {
            InfoBanner(
                stringResource(if (backend) R.string.sync_subtitle else R.string.sync_unavailable),
                tone = if (backend) TinyForest else TinyTomato,
            )
        }
    }
}

@Composable
private fun OutboxRow(command: OutboxCommandEntity) {
    PaperCard {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(commandLabel(command.commandType), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.weight(1f))
                StatusPill(syncStateLabel(command.syncState), TinyCobalt)
            }
            Spacer(Modifier.height(4.dp))
            Text(
                stringResource(R.string.attempt, command.attempts) + " · v${command.schemaVersion}",
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@Composable
private fun commandLabel(commandType: String): String = when (commandType) {
    "class.create" -> stringResource(R.string.command_class_create)
    "pupil.register" -> stringResource(R.string.command_pupil_register)
    "guardian.upsert" -> stringResource(R.string.command_guardian_upsert)
    "guardian.link" -> stringResource(R.string.command_guardian_link)
    "attendance.submit" -> stringResource(R.string.command_attendance_submit)
    "progress.upsert" -> stringResource(R.string.command_progress_upsert)
    "progress.approve" -> stringResource(R.string.command_progress_approve)
    "message.reply" -> stringResource(R.string.command_message_reply)
    else -> commandType
}

@Composable
private fun syncStateLabel(state: SyncState): String = when (state) {
    SyncState.LOCAL_ONLY -> stringResource(R.string.local_only)
    SyncState.PENDING_SYNC -> stringResource(R.string.pending_status)
    SyncState.SYNCED -> stringResource(R.string.synced_status)
    SyncState.CONFLICT -> stringResource(R.string.conflict)
    SyncState.NEEDS_ATTENTION -> stringResource(R.string.needs_attention)
}
