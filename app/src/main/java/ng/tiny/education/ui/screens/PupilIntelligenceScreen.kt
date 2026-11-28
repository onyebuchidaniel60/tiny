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
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.flow.flowOf
import ng.tiny.education.R
import ng.tiny.education.core.ai.AiInferenceMode
import ng.tiny.education.core.database.AssessmentEntity
import ng.tiny.education.core.database.AttendanceEvidenceRow
import ng.tiny.education.core.database.ProgressEntryEntity
import ng.tiny.education.core.intelligence.EvidenceConfidence
import ng.tiny.education.core.intelligence.IntelligenceEngine
import ng.tiny.education.core.intelligence.PupilIntelligence
import ng.tiny.education.core.intelligence.PupilIntelligenceStatus
import ng.tiny.education.core.model.ProgressIndicator
import ng.tiny.education.ui.TinyViewModel
import ng.tiny.education.ui.components.InfoBanner
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.SectionHeading
import ng.tiny.education.ui.components.StatusPill
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.components.TinySecondaryButton
import ng.tiny.education.ui.components.TinyAvatar
import ng.tiny.education.ui.theme.TinyButter
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyTomato
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

@Composable
fun PupilIntelligenceScreen(
    pupilId: String,
    viewModel: TinyViewModel,
    onBack: () -> Unit,
) {
    val pupil by viewModel.observePupil(pupilId).collectAsStateWithLifecycle(initialValue = null)
    val classroom by remember(pupil?.classId) {
        pupil?.classId?.let { viewModel.observeClass(it) } ?: flowOf(null)
    }.collectAsStateWithLifecycle(initialValue = null)
    val attendance by remember(pupil?.classId) {
        pupil?.classId?.let { viewModel.observeAttendanceEvidence(it) } ?: flowOf(emptyList())
    }.collectAsStateWithLifecycle(initialValue = emptyList<AttendanceEvidenceRow>())
    val assessments by viewModel.observePupilAssessments(pupilId).collectAsStateWithLifecycle(initialValue = emptyList())
    val progress by viewModel.observeProgress(pupilId).collectAsStateWithLifecycle(initialValue = emptyList())
    val followUps by viewModel.observePupilFollowUps(pupilId).collectAsStateWithLifecycle(initialValue = emptyList())
    val evidenceState by viewModel.evidenceState.collectAsStateWithLifecycle()
    val locale = LocalConfiguration.current.locales[0]
    val dateFormatter = remember(locale) { DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale) }
    var showAssessment by remember { mutableStateOf(false) }
    var objective by remember { mutableStateOf("") }
    var score by remember { mutableStateOf("") }
    var maxScore by remember { mutableStateOf("100") }
    var assessmentDate by remember { mutableStateOf(LocalDate.now().toString()) }
    var assessmentNote by remember { mutableStateOf("") }
    var draft by remember { mutableStateOf("") }

    val profile = pupil?.let { IntelligenceEngine.pupil(it, attendance, assessments, progress) }
    val review = evidenceState.result?.takeIf { it.task == "pupil_review" }
    val parentDraft = evidenceState.result?.takeIf { it.task == "parent_draft" }

    LaunchedEffect(parentDraft?.id) {
        if (parentDraft != null) draft = parentDraft.output
    }

    if (showAssessment) {
        AlertDialog(
            onDismissRequest = { showAssessment = false },
            title = { Text(stringResource(R.string.record_assessment)) },
            text = {
                Column {
                    OutlinedTextField(value = objective, onValueChange = { objective = it }, label = { Text(stringResource(R.string.assessment_objective)) }, singleLine = true)
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        OutlinedTextField(value = score, onValueChange = { score = it }, label = { Text(stringResource(R.string.assessment_score)) }, modifier = Modifier.weight(1f), singleLine = true)
                        OutlinedTextField(value = maxScore, onValueChange = { maxScore = it }, label = { Text(stringResource(R.string.assessment_max)) }, modifier = Modifier.weight(1f), singleLine = true)
                    }
                    Spacer(Modifier.height(6.dp))
                    OutlinedTextField(value = assessmentDate, onValueChange = { assessmentDate = it }, label = { Text(stringResource(R.string.assessment_date)) }, singleLine = true)
                    Spacer(Modifier.height(6.dp))
                    OutlinedTextField(value = assessmentNote, onValueChange = { assessmentNote = it }, label = { Text(stringResource(R.string.assessment_note)) }, minLines = 2)
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val parsedScore = score.toDoubleOrNull()
                        val parsedMax = maxScore.toDoubleOrNull()
                        if (objective.isNotBlank() && parsedScore != null && parsedMax != null && parsedMax > 0) {
                            viewModel.saveAssessment(
                                pupilId = pupilId,
                                classId = pupil?.classId.orEmpty(),
                                subjectId = "basic_science",
                                objectiveId = objective.trim().lowercase().replace(Regex("[^a-z0-9]+"), "_"),
                                objectiveLabel = objective.trim(),
                                score = parsedScore,
                                maxScore = parsedMax,
                                schoolDate = assessmentDate,
                                teacherNote = assessmentNote.trim(),
                            )
                            showAssessment = false
                            objective = ""
                            score = ""
                            assessmentNote = ""
                        }
                    },
                    enabled = objective.isNotBlank() && score.toDoubleOrNull() != null,
                ) { Text(stringResource(R.string.save_assessment)) }
            },
            dismissButton = { TextButton(onClick = { showAssessment = false }) { Text(stringResource(R.string.cancel)) } },
        )
    }

    if (profile == null) {
        PaperCard { Text(stringResource(R.string.error_not_found)) }
        return
    }

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Row(verticalAlignment = Alignment.Top) {
                TinyAvatar(profile.pupil.displayName, Modifier.padding(end = 12.dp))
                Column(Modifier.weight(1f)) {
                    Text(profile.pupil.displayName, style = MaterialTheme.typography.headlineMedium)
                    Text(
                        "${classroom?.gradeLevel ?: ""} ${classroom?.label ?: ""} · ${profile.pupil.localCode ?: stringResource(R.string.no_local_code)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(stringResource(statusRes(profile.status)), style = MaterialTheme.typography.titleLarge, color = statusColor(profile.status), fontWeight = FontWeight.Bold)
                }
                StatusPill(stringResource(confidenceRes(profile.confidence)), TinyCobalt)
            }
            Spacer(Modifier.height(8.dp))
            val reasonText = StringBuilder()
            for (reason in profile.statusReasonKeys) {
                if (reasonText.isNotEmpty()) reasonText.append(' ')
                reasonText.append(
                    stringResource(
                        when (reason) {
                            "status_reason_attendance" -> R.string.status_reason_attendance
                            "status_reason_assessment" -> R.string.status_reason_assessment
                            "status_reason_observations" -> R.string.status_reason_observations
                            "status_reason_assessment_trend" -> R.string.status_reason_assessment_trend
                            "status_reason_recent_observation" -> R.string.status_reason_recent_observation
                            "status_reason_strong_evidence" -> R.string.status_reason_strong_evidence
                            "status_reason_steady" -> R.string.status_reason_steady
                            else -> R.string.status_reason_insufficient
                        },
                    ),
                )
            }
            Text(
                reasonText.toString(),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricBox("${profile.attendance.rate}%", stringResource(R.string.attendance_rate), TinyForest, Modifier.weight(1f))
                MetricBox(profile.assessments.average.takeIf { it > 0 }?.let { "$it%" } ?: "—", stringResource(R.string.assessment_average), TinyTomato, Modifier.weight(1f))
                MetricBox("${profile.observations.count}", stringResource(R.string.observations), TinyCobalt, Modifier.weight(1f))
            }
        }
        item {
            InfoBanner(stringResource(R.string.override_note), tone = TinyCobalt)
        }
        item {
            PaperCard {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(R.string.attendance_title), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        StatusPill("${profile.attendance.rate}%", if (profile.attendance.rate < 75) TinyTomato else TinyForest)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text("${stringResource(R.string.present)} ${profile.attendance.present} · ${stringResource(R.string.absent)} ${profile.attendance.absent} · ${stringResource(R.string.late)} ${profile.attendance.late}", style = MaterialTheme.typography.bodySmall)
                    profile.attendance.lastDate?.let {
                        Text("${stringResource(R.string.recent_evidence)}: ${formatDate(it, dateFormatter)}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(R.string.assessment_trend), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        TinySecondaryButton(stringResource(R.string.record_assessment), onClick = { showAssessment = true })
                    }
                    if (assessments.isEmpty()) {
                        Text(stringResource(R.string.no_assessments), style = MaterialTheme.typography.bodySmall)
                    } else {
                        assessments.take(6).forEach { assessment ->
                            AssessmentRow(assessment, dateFormatter)
                        }
                    }
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.observations), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    if (progress.isEmpty()) {
                        Text(stringResource(R.string.no_observations), style = MaterialTheme.typography.bodySmall)
                    } else {
                        progress.take(4).forEach { entry -> ObservationRow(entry, dateFormatter) }
                    }
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.profile_strengths), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    profile.strengths.forEach { Text("• " + stringResource(strengthRes(it)), style = MaterialTheme.typography.bodySmall) }
                    Spacer(Modifier.height(8.dp))
                    Text(stringResource(R.string.profile_needs_attention), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    profile.needsAttention.forEach { Text("• " + stringResource(attentionRes(it)), style = MaterialTheme.typography.bodySmall) }
                    Spacer(Modifier.height(8.dp))
                    Text(stringResource(R.string.next_actions), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    profile.nextActions.forEach { Text("• " + stringResource(actionRes(it)), style = MaterialTheme.typography.bodySmall) }
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(R.string.followups), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        StatusPill("${followUps.count { it.status == "open" }}", TinyButter)
                    }
                    followUps.filter { it.status == "open" }.forEach { followUp ->
                        Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(followUp.title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                                Text(followUp.detail, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("${stringResource(R.string.due_date)}: ${followUp.dueDate}", style = MaterialTheme.typography.labelSmall)
                            }
                            TextButton(onClick = { viewModel.updateFollowUpStatus(followUp.id, "done") }) { Text(stringResource(R.string.mark_done)) }
                        }
                    }
                    val suggestedTitle = stringResource(actionRes(profile.nextActions.firstOrNull() ?: "action_continue_monitoring"))
                    val followUpNote = stringResource(R.string.override_note)
                    TinySecondaryButton(
                        text = stringResource(R.string.add_suggested_followup),
                        onClick = {
                            viewModel.addFollowUp(
                                pupilId = pupilId,
                                classId = profile.pupil.classId,
                                title = suggestedTitle,
                                detail = followUpNote,
                                dueDate = LocalDate.now().plusDays(3).toString(),
                                source = "manual",
                            )
                        },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(R.string.generate_evidence_review), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        StatusPill(stringResource(R.string.ai_optional), TinyCobalt)
                    }
                    Text(stringResource(R.string.ai_privacy_note), style = MaterialTheme.typography.bodySmall)
                    Spacer(Modifier.height(8.dp))
                    TinyPrimaryButton(
                        text = if (evidenceState.busy) stringResource(R.string.ai_thinking) else stringResource(R.string.generate_evidence_review),
                        onClick = {
                            val prompt = IntelligenceEngine.pupilPrompt(profile, "Review the pupil progress evidence and identify what the teacher should do next.")
                            val fallback = IntelligenceEngine.deterministicPupilReview(profile)
                            viewModel.generateEvidenceAnalysis(
                                scope = "pupil", task = "pupil_review", pupilId = pupilId, classId = profile.pupil.classId,
                                evidenceFingerprint = profile.evidenceIds.joinToString("|"), evidenceIds = profile.evidenceIds,
                                evidenceSummary = "${profile.attendance.marked} attendance · ${profile.assessments.count} assessments · ${profile.observations.count} observations",
                                prompt = prompt, fallback = fallback, mode = AiInferenceMode.PREFER_ON_DEVICE,
                            )
                        },
                        enabled = !evidenceState.busy,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    review?.let {
                        Spacer(Modifier.height(8.dp))
                        StatusPill(it.source, if (it.fallback) TinyButter else TinyForest)
                        Spacer(Modifier.height(6.dp))
                        Text(it.output, style = MaterialTheme.typography.bodyMedium)
                        Text(
                            if (it.fallback) stringResource(R.string.analysis_fallback) else stringResource(R.string.ai_review_note),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.parent_draft), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(stringResource(R.string.parent_draft_note), style = MaterialTheme.typography.bodySmall)
                    Spacer(Modifier.height(8.dp))
                    TinySecondaryButton(
                        text = stringResource(R.string.generate_parent_draft),
                        onClick = {
                            val prompt = IntelligenceEngine.pupilPrompt(profile, "Draft a factual, respectful parent update using only the recorded evidence. Do not name the pupil.")
                            val fallback = IntelligenceEngine.deterministicParentDraft(profile, "basic science")
                            viewModel.generateEvidenceAnalysis(
                                scope = "parent_draft", task = "parent_draft", pupilId = pupilId, classId = profile.pupil.classId,
                                evidenceFingerprint = profile.evidenceIds.joinToString("|"), evidenceIds = profile.evidenceIds,
                                evidenceSummary = "Parent draft from pupil evidence", prompt = prompt, fallback = fallback,
                            )
                        },
                        enabled = !evidenceState.busy,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    if (draft.isNotBlank()) {
                        Spacer(Modifier.height(8.dp))
                        OutlinedTextField(value = draft, onValueChange = { draft = it }, modifier = Modifier.fillMaxWidth(), minLines = 4)
                        Spacer(Modifier.height(8.dp))
                        Text(stringResource(R.string.parent_draft_note), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
        item {
            InfoBanner(stringResource(R.string.analysis_saved), tone = TinyForest)
        }
    }
}

@Composable
private fun MetricBox(value: String, label: String, color: androidx.compose.ui.graphics.Color, modifier: Modifier = Modifier) {
    PaperCard(modifier = modifier) {
        Column {
            Text(value, style = MaterialTheme.typography.headlineSmall, color = color, fontWeight = FontWeight.Black)
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun AssessmentRow(assessment: AssessmentEntity, formatter: DateTimeFormatter) {
    Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(
            "${(assessment.score / assessment.maxScore * 100).toInt()}%",
            style = MaterialTheme.typography.titleMedium,
            color = if (assessment.score / assessment.maxScore < 0.5) TinyTomato else TinyForest,
            modifier = Modifier.width(52.dp),
        )
        Column(Modifier.weight(1f)) {
            Text(assessment.objectiveLabel, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            Text("${assessment.subjectId.replace('_', ' ')} · ${formatDate(assessment.schoolDate, formatter)}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun ObservationRow(entry: ProgressEntryEntity, formatter: DateTimeFormatter) {
    Column(Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Text(
            "${entry.indicator.name.lowercase().replace('_', ' ')} · ${entry.subjectId.replace('_', ' ')}",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
        )
        Text(formatDate(entry.periodEnd, formatter), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        entry.teacherNote?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
        entry.homeActivity?.let { Text("${stringResource(R.string.home_activity)}: $it", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
    }
}

private fun formatDate(value: String, formatter: DateTimeFormatter): String = runCatching {
    LocalDate.parse(value).format(formatter)
}.getOrDefault(value)

internal fun statusRes(status: PupilIntelligenceStatus): Int = when (status) {
    PupilIntelligenceStatus.INSUFFICIENT -> R.string.status_insufficient
    PupilIntelligenceStatus.NEEDS_ATTENTION -> R.string.status_needs_attention
    PupilIntelligenceStatus.IMPROVING -> R.string.status_improving
    PupilIntelligenceStatus.STRONG -> R.string.status_strong
    PupilIntelligenceStatus.MAKING_PROGRESS -> R.string.status_making_progress
}

private fun statusColor(status: PupilIntelligenceStatus): androidx.compose.ui.graphics.Color = when (status) {
    PupilIntelligenceStatus.NEEDS_ATTENTION -> TinyTomato
    PupilIntelligenceStatus.IMPROVING -> TinyCobalt
    PupilIntelligenceStatus.STRONG -> TinyForest
    else -> TinyButter
}

internal fun confidenceRes(confidence: EvidenceConfidence): Int = when (confidence) {
    EvidenceConfidence.LOW -> R.string.confidence_low
    EvidenceConfidence.MEDIUM -> R.string.confidence_medium
    EvidenceConfidence.HIGH -> R.string.confidence_high
}

private fun strengthRes(key: String): Int = when (key) {
    "strength_attendance" -> R.string.strength_attendance
    "strength_assessment" -> R.string.strength_assessment
    "strength_observation" -> R.string.strength_observation
    else -> R.string.strength_improving
}

private fun attentionRes(key: String): Int = when (key) {
    "attention_attendance" -> R.string.attention_attendance
    "attention_assessment" -> R.string.attention_assessment
    "attention_observation" -> R.string.attention_observation
    "attention_missing_assessments" -> R.string.attention_missing_assessments
    else -> R.string.attention_missing_observations
}

private fun actionRes(key: String): Int = when (key) {
    "action_contact_family" -> R.string.action_contact_family
    "action_plan_support" -> R.string.action_plan_support
    "action_record_assessment" -> R.string.action_record_assessment
    "action_record_observation" -> R.string.action_record_observation
    else -> R.string.action_continue_monitoring
}
