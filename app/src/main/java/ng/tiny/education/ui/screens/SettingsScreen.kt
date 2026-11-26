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
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ng.tiny.education.R
import ng.tiny.education.core.database.OutboxCommandEntity
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
) {
    val preferences by viewModel.preferences.collectAsStateWithLifecycle()
    val workspace by viewModel.workspace.collectAsStateWithLifecycle()
    val pending by viewModel.pendingOutboxCount.collectAsStateWithLifecycle()

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(title = stringResource(R.string.settings_heading), subtitle = stringResource(R.string.settings_preview_note))
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.language_setting), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        LanguageChip("English", preferences.language == "en") { viewModel.setLanguage("en") }
                        LanguageChip("Hausa", preferences.language == "ha") { viewModel.setLanguage("ha") }
                    }
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        LanguageChip("Yoruba", preferences.language == "yo") { viewModel.setLanguage("yo") }
                        LanguageChip("Igbo", preferences.language == "ig") { viewModel.setLanguage("ig") }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Draft translations. Native review is pending; missing strings fall back to English.",
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
                    Text(workspace?.name ?: "Demo workspace", style = MaterialTheme.typography.bodyLarge)
                    Text(
                        stringResource(R.string.school_code_label, workspace?.schoolCode ?: "KOFAR001"),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(8.dp))
                    StatusPill("Public preview · synthetic data", TinyCobalt)
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
                            if (pending == 1) stringResource(R.string.sync_center_pending_one)
                            else if (pending > 1) stringResource(R.string.sync_center_pending, pending)
                            else stringResource(R.string.sync_center_empty),
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                    StatusPill(if (pending > 0) "Pending" else "Local", if (pending > 0) TinyButter else TinyForest)
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.privacy_setting), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "The preview stores synthetic data in an encrypted local database. No real pupil or guardian information should be entered. Cloud sync and live SMS are disabled.",
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.about_setting), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Tiny is an offline-first teacher-support and parent-engagement product for rural primary schools. Parents use SMS; pupils have no accounts.",
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        stringResource(R.string.version_label, "0.1.0-preview"),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        item {
            InfoBanner(stringResource(R.string.preview_notice), tone = TinyTomato)
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
    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(title = stringResource(R.string.sync_heading), subtitle = stringResource(R.string.sync_center_mock_note))
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusPill("$pending pending", if (pending > 0) TinyButter else TinyForest)
                StatusPill("Mock engine", TinyCobalt)
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
                "The mock sync engine never marks a record as cloud-synced. Real acknowledgement requires a deployed backend, which is not authorized under Spark/NGN 0.",
                tone = TinyTomato,
            )
        }
    }
}

@Composable
private fun OutboxRow(command: OutboxCommandEntity) {
    PaperCard {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(command.commandType, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.weight(1f))
                StatusPill(command.syncState.name.lowercase().replace('_', ' '), TinyCobalt)
            }
            Spacer(Modifier.height(4.dp))
            Text("Attempts: ${command.attempts} · schema v${command.schemaVersion}", style = MaterialTheme.typography.bodySmall)
            command.lastError?.let {
                Spacer(Modifier.height(4.dp))
                Text(it, style = MaterialTheme.typography.bodySmall, color = TinyTomato)
            }
        }
    }
}
