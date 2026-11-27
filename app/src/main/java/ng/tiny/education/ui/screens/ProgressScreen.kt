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
    val defaultRelationship = stringResource(R.string.parent_relationship)
    var guardianRelationship by remember(defaultRelationship) { mutableStateOf(defaultRelationship) }
    var verifyingGuardianId by remember { mutableStateOf<String?>(null) }
    var verificationCode by remember { mutableStateOf("") }

    if (showAddGuardian) {
        AlertDialog(
            onDismissRequest = { showAddGuardian = false },
            title = { Text(stringResource(R.string.add_guardian)) },
            text = {
                Column {
                    OutlinedTextField(
                        value = guardianName,
                        onValueChange = { guardianName = it },
                        label = { Text(stringResource(R.string.guardian_name)) },
                        singleLine = true,
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = guardianPhone,
                        onValueChange = { guardianPhone = it },
                        label = { Text(stringResource(R.string.guardian_phone)) },
                        singleLine = true,
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = guardianRelationship,
                        onValueChange = { guardianRelationship = it },
                        label = { Text(stringResource(R.string.relationship)) },
                        singleLine = true,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        stringResource(R.string.guardian_synthetic_note),
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
                ) { Text(stringResource(R.string.add)) }
            },
            dismissButton = { TextButton(onClick = { showAddGuardian = false }) { Text(stringResource(R.string.cancel)) } },
        )
    }

    verifyingGuardianId?.let { guardianId ->
        AlertDialog(
            onDismissRequest = {
                verifyingGuardianId = null
                verificationCode = ""
                viewModel.clearGuardianCode()
            },
            title = { Text(stringResource(R.string.verify_guardian)) },
            text = {
                Column {
                    Text(
                        guardianCode?.let { stringResource(R.string.in_person_code, it) }
                            ?: stringResource(R.string.verification_prompt),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = verificationCode,
                        onValueChange = { verificationCode = it },
                        label = { Text(stringResource(R.string.verification_code)) },
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
                ) { Text(stringResource(R.string.verify)) }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        verifyingGuardianId = null
                        verificationCode = ""
                        viewModel.clearGuardianCode()
                    },
                ) { Text(stringResource(R.string.cancel)) }
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
            InfoBanner(stringResource(R.string.not_assessed_note), tone = TinyCobalt)
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.new_observation), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(10.dp))
                    Text(stringResource(R.string.indicator), style = MaterialTheme.typography.labelLarge)
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        IndicatorChoice(stringResource(R.string.doing_well), indicator == ProgressIndicator.DOING_WELL, TinyForest) { indicator = ProgressIndicator.DOING_WELL }
                        IndicatorChoice(stringResource(R.string.developing), indicator == ProgressIndicator.DEVELOPING, TinyButter) { indicator = ProgressIndicator.DEVELOPING }
                    }
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        IndicatorChoice(stringResource(R.string.needs_support), indicator == ProgressIndicator.NEEDS_SUPPORT, TinyTomato) { indicator = ProgressIndicator.NEEDS_SUPPORT }
                        IndicatorChoice(stringResource(R.string.not_assessed), indicator == ProgressIndicator.NOT_ASSESSED, TinyCobalt) { indicator = ProgressIndicator.NOT_ASSESSED }
                    }
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = note,
                        onValueChange = { note = it.take(300) },
                        label = { Text(stringResource(R.string.factual_observation)) },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        supportingText = { Text("${note.length}/300 · ${stringResource(R.string.factual_hint)}") },
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = homeActivity,
                        onValueChange = { homeActivity = it.take(240) },
                        label = { Text(stringResource(R.string.home_activity)) },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        supportingText = { Text("${homeActivity.length}/240 · ${stringResource(R.string.optional)}") },
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
                        stringResource(R.string.approval_reset_notice),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        item {
            SectionHeading(title = stringResource(R.string.family_contacts), subtitle = stringResource(R.string.family_contacts_subtitle))
        }
        item {
            TinySecondaryButton(
                text = stringResource(R.string.add_guardian),
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
            item { PaperCard { Text(stringResource(R.string.no_guardian)) } }
        }
        item {
            SectionHeading(title = stringResource(R.string.history), subtitle = stringResource(R.string.digest_note))
        }
        items(entries, key = { it.id }) { entry ->
            ProgressEntryCard(entry = entry, onApprove = { viewModel.approveProgress(entry.id) })
        }
        if (entries.isEmpty()) {
            item { PaperCard { Text(stringResource(R.string.no_progress_entries)) } }
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
            selectedContainerColor = color.copy(alpha = 0.22f),
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
                        guardian?.displayName ?: stringResource(R.string.guardian),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        "${guardian?.phoneE164 ?: "—"} · ${link.relationshipLabel}",
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                val verified = guardian?.verificationStatus == GuardianVerificationStatus.VERIFIED
                StatusPill(
                    stringResource(if (verified) R.string.verified else R.string.pending),
                    if (verified) TinyForest else TinyTomato,
                )
            }
            if (guardian?.verificationStatus != GuardianVerificationStatus.VERIFIED) {
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TinySecondaryButton(
                        text = stringResource(R.string.request_code),
                        onClick = onRequestCode,
                        modifier = Modifier.weight(1f),
                    )
                    TinyPrimaryButton(
                        text = stringResource(R.string.enter_code),
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
    val indicatorLabel = when (entry.indicator) {
        ProgressIndicator.DOING_WELL -> stringResource(R.string.doing_well)
        ProgressIndicator.DEVELOPING -> stringResource(R.string.developing)
        ProgressIndicator.NEEDS_SUPPORT -> stringResource(R.string.needs_support)
        ProgressIndicator.NOT_ASSESSED -> stringResource(R.string.not_assessed)
    }
    val indicatorColor = when (entry.indicator) {
        ProgressIndicator.DOING_WELL -> TinyForest
        ProgressIndicator.DEVELOPING -> TinyButter
        ProgressIndicator.NEEDS_SUPPORT -> TinyTomato
        ProgressIndicator.NOT_ASSESSED -> TinyCobalt
    }
    PaperCard {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                StatusPill(indicatorLabel, indicatorColor)
                Spacer(Modifier.weight(1f))
                StatusPill(
                    stringResource(if (entry.approvalStatus == ApprovalStatus.APPROVED) R.string.approved else R.string.pending_approval),
                    if (entry.approvalStatus == ApprovalStatus.APPROVED) TinyForest else TinyCobalt,
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(entry.teacherNote ?: stringResource(R.string.no_note), style = MaterialTheme.typography.bodyMedium)
            entry.homeActivity?.let {
                Spacer(Modifier.height(6.dp))
                Text(
                    stringResource(R.string.home_prefix, it),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(
                stringResource(R.string.revision_label, entry.revision) + " · ${entry.periodStart} – ${entry.periodEnd}",
                style = MaterialTheme.typography.labelSmall,
            )
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
