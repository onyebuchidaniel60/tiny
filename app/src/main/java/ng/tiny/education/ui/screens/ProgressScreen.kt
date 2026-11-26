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
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
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
import ng.tiny.education.core.database.ProgressEntryEntity
import ng.tiny.education.core.database.PupilGuardianLinkEntity
import ng.tiny.education.core.model.ApprovalStatus
import ng.tiny.education.core.model.GuardianVerificationStatus
import ng.tiny.education.core.model.ProgressIndicator
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
fun ProgressScreen(
    pupilId: String,
    viewModel: TinyViewModel,
    onBack: () -> Unit,
) {
    val pupil by viewModel.observePupil(pupilId).collectAsStateWithLifecycle(initialValue = null)
    val entries by viewModel.observeProgress(pupilId).collectAsStateWithLifecycle(initialValue = emptyList())
    val links by viewModel.observeGuardianLinks(pupilId).collectAsStateWithLifecycle(initialValue = emptyList())
    val guardianCode by viewModel.guardianCode.collectAsStateWithLifecycle()
    var indicator by remember { mutableStateOf(ProgressIndicator.DOING_WELL) }
    var note by remember { mutableStateOf("") }
    var homeActivity by remember { mutableStateOf("") }
    var showAddGuardian by remember { mutableStateOf(false) }
    var guardianName by remember { mutableStateOf("") }
    var guardianPhone by remember { mutableStateOf("") }
    var guardianRelationship by remember { mutableStateOf("Parent") }
    var verifyingGuardianId by remember { mutableStateOf<String?>(null) }
    var verificationCode by remember { mutableStateOf("") }

    if (showAddGuardian) {
        AlertDialog(
            onDismissRequest = { showAddGuardian = false },
            title = { Text("Add guardian") },
            text = {
                Column {
                    OutlinedTextField(
                        value = guardianName,
                        onValueChange = { guardianName = it },
                        label = { Text("Guardian name") },
                        singleLine = true,
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = guardianPhone,
                        onValueChange = { guardianPhone = it },
                        label = { Text("Nigerian phone, e.g. 0803 123 4567") },
                        singleLine = true,
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = guardianRelationship,
                        onValueChange = { guardianRelationship = it },
                        label = { Text("Relationship") },
                        singleLine = true,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Synthetic test numbers only. A shared endpoint is reused for siblings.",
                        style = MaterialTheme.typography.labelSmall,
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.addGuardian(
                            pupilId = pupilId,
                            displayName = guardianName,
                            phone = guardianPhone,
                            locale = "en",
                            relationship = guardianRelationship,
                        )
                        showAddGuardian = false
                        guardianName = ""
                        guardianPhone = ""
                    },
                    enabled = guardianName.isNotBlank() && guardianPhone.isNotBlank(),
                ) { Text("Add") }
            },
            dismissButton = { TextButton(onClick = { showAddGuardian = false }) { Text("Cancel") } },
        )
    }

    verifyingGuardianId?.let { guardianId ->
        AlertDialog(
            onDismissRequest = {
                verifyingGuardianId = null
                verificationCode = ""
                viewModel.clearGuardianCode()
            },
            title = { Text("Verify guardian") },
            text = {
                Column {
                    Text(
                        guardianCode?.let { "In-person code: $it" }
                            ?: "Request a code, read it to the guardian, then enter it here.",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = verificationCode,
                        onValueChange = { verificationCode = it },
                        label = { Text("Verification code") },
                        singleLine = true,
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.verifyGuardian(guardianId, verificationCode)
                        verifyingGuardianId = null
                        verificationCode = ""
                    },
                    enabled = verificationCode.isNotBlank(),
                ) { Text("Verify") }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        verifyingGuardianId = null
                        verificationCode = ""
                        viewModel.clearGuardianCode()
                    },
                ) { Text("Cancel") }
            },
        )
    }

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(
                title = pupil?.displayName ?: stringResource(R.string.progress_title),
                subtitle = stringResource(R.string.progress_subtitle),
            )
            Spacer(Modifier.height(8.dp))
            InfoBanner(stringResource(R.string.progress_not_assessed_note), tone = TinyCobalt)
        }
        item {
            PaperCard {
                Column {
                    Text("New observation", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(10.dp))
                    Text("Indicator", style = MaterialTheme.typography.labelLarge)
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        IndicatorChoice("Doing well", indicator == ProgressIndicator.DOING_WELL, TinyForest) { indicator = ProgressIndicator.DOING_WELL }
                        IndicatorChoice("Developing", indicator == ProgressIndicator.DEVELOPING, TinyButter) { indicator = ProgressIndicator.DEVELOPING }
                    }
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        IndicatorChoice("Needs support", indicator == ProgressIndicator.NEEDS_SUPPORT, TinyTomato) { indicator = ProgressIndicator.NEEDS_SUPPORT }
                        IndicatorChoice("Not assessed", indicator == ProgressIndicator.NOT_ASSESSED, TinyCobalt) { indicator = ProgressIndicator.NOT_ASSESSED }
                    }
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = note,
                        onValueChange = { note = it.take(300) },
                        label = { Text(stringResource(R.string.teacher_note)) },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        supportingText = { Text("${note.length}/300 · factual and constructive") },
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = homeActivity,
                        onValueChange = { homeActivity = it.take(240) },
                        label = { Text(stringResource(R.string.home_activity)) },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        supportingText = { Text("${homeActivity.length}/240 · optional") },
                    )
                    Spacer(Modifier.height(10.dp))
                    TinyPrimaryButton(
                        text = stringResource(R.string.save_draft),
                        onClick = {
                            val classId = pupil?.classId ?: return@TinyPrimaryButton
                            viewModel.saveProgress(
                                pupilId = pupilId,
                                classId = classId,
                                subjectId = "basic_science",
                                indicator = indicator,
                                note = note,
                                homeActivity = homeActivity,
                                existingEntryId = entries.firstOrNull()?.id,
                            )
                        },
                        enabled = pupil != null,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Editing an approved entry creates a new revision and resets approval.",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        item {
            SectionHeading(title = "Family contacts", subtitle = "Verified, opted-in endpoints receive child-specific SMS.")}
        item {
            TinySecondaryButton(
                text = "Add guardian",
                onClick = { showAddGuardian = true },
                modifier = Modifier.fillMaxWidth(),
            )
        }
        items(links, key = { it.id }) { link ->
            GuardianContactCard(
                link = link,
                viewModel = viewModel,
                onRequestCode = {
                    viewModel.requestGuardianVerification(link.guardianId)
                    verifyingGuardianId = link.guardianId
                },
                onVerify = { verifyingGuardianId = link.guardianId },
            )
        }
        if (links.isEmpty()) {
            item { PaperCard { Text("No guardian is linked to this pupil yet.") } }
        }
        item {
            SectionHeading(title = "History", subtitle = "Only approved entries can enter a parent digest.")
        }
        items(entries, key = { it.id }) { entry ->
            ProgressEntryCard(entry = entry, onApprove = { viewModel.approveProgress(entry.id) })
        }
        if (entries.isEmpty()) {
            item { PaperCard { Text("No progress observations recorded yet.") } }
        }
    }
}

@Composable
private fun IndicatorChoice(label: String, selected: Boolean, color: androidx.compose.ui.graphics.Color, onClick: () -> Unit) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = color.copy(alpha = 0.20f),
            selectedLabelColor = MaterialTheme.colorScheme.onSurface,
        ),
    )
}

@Composable
private fun GuardianContactCard(
    link: PupilGuardianLinkEntity,
    viewModel: TinyViewModel,
    onRequestCode: () -> Unit,
    onVerify: () -> Unit,
) {
    val guardian by viewModel.observeGuardian(link.guardianId).collectAsStateWithLifecycle(initialValue = null)
    PaperCard {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(
                        guardian?.displayName ?: "Guardian",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        "${guardian?.phoneE164 ?: "No phone"} · ${link.relationshipLabel}",
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                val verified = guardian?.verificationStatus == GuardianVerificationStatus.VERIFIED
                StatusPill(
                    if (verified) "Verified" else "Pending",
                    if (verified) TinyForest else TinyTomato,
                )
            }
            if (guardian?.verificationStatus != GuardianVerificationStatus.VERIFIED) {
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TinySecondaryButton(
                        text = "Request code",
                        onClick = onRequestCode,
                        modifier = Modifier.weight(1f),
                    )
                    TinyPrimaryButton(
                        text = "Enter code",
                        onClick = onVerify,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}

@Composable
private fun ProgressEntryCard(entry: ProgressEntryEntity, onApprove: () -> Unit) {
    PaperCard {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                StatusPill(entry.indicator.name.lowercase().replace('_', ' '), when (entry.indicator) {
                    ProgressIndicator.DOING_WELL -> TinyForest
                    ProgressIndicator.DEVELOPING -> TinyButter
                    ProgressIndicator.NEEDS_SUPPORT -> TinyTomato
                    ProgressIndicator.NOT_ASSESSED -> TinyCobalt
                })
                Spacer(Modifier.weight(1f))
                StatusPill(entry.approvalStatus.name.lowercase(), if (entry.approvalStatus == ApprovalStatus.APPROVED) TinyForest else TinyCobalt)
            }
            Spacer(Modifier.height(8.dp))
            Text(entry.teacherNote ?: "No note recorded.", style = MaterialTheme.typography.bodyMedium)
            entry.homeActivity?.let {
                Spacer(Modifier.height(6.dp))
                Text("Home activity: $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(Modifier.height(8.dp))
            Text("Revision ${entry.revision} · ${entry.periodStart} to ${entry.periodEnd}", style = MaterialTheme.typography.labelSmall)
            if (entry.approvalStatus != ApprovalStatus.APPROVED) {
                Spacer(Modifier.height(8.dp))
                TinySecondaryButton(
                    text = stringResource(R.string.approve_progress),
                    onClick = onApprove,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}
