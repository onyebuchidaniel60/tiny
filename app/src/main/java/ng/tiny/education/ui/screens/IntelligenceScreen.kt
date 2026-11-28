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
import androidx.compose.material3.MaterialTheme
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
import ng.tiny.education.core.ai.AiInferenceMode
import ng.tiny.education.core.database.AssessmentEntity
import ng.tiny.education.core.database.AttendanceEvidenceRow
import ng.tiny.education.core.database.ProgressEntryEntity
import ng.tiny.education.core.database.PupilEntity
import ng.tiny.education.core.intelligence.IntelligenceEngine
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
import java.time.Instant
import java.time.ZoneId

@Composable
fun IntelligenceScreen(
    viewModel: TinyViewModel,
    onOpenClass: (String) -> Unit,
    onOpenPupil: (String) -> Unit,
) {
    val classes by viewModel.classes.collectAsStateWithLifecycle()
    val followUps by viewModel.followUps.collectAsStateWithLifecycle()
    val analyses by viewModel.aiAnalyses.collectAsStateWithLifecycle()
    val firstClass = classes.firstOrNull()
    val pupils by remember(firstClass?.id) {
        firstClass?.let { viewModel.observePupils(it.id) } ?: kotlinx.coroutines.flow.flowOf(emptyList<PupilEntity>())
    }.collectAsStateWithLifecycle(initialValue = emptyList())
    val attendance by remember(firstClass?.id) {
        firstClass?.let { viewModel.observeAttendanceEvidence(it.id) } ?: kotlinx.coroutines.flow.flowOf(emptyList<AttendanceEvidenceRow>())
    }.collectAsStateWithLifecycle(initialValue = emptyList())
    val assessments by remember(firstClass?.id) {
        firstClass?.let { viewModel.observeClassAssessments(it.id) } ?: kotlinx.coroutines.flow.flowOf(emptyList<AssessmentEntity>())
    }.collectAsStateWithLifecycle(initialValue = emptyList())
    val progress by remember(firstClass?.id) {
        firstClass?.let { viewModel.observeClassProgress(it.id) } ?: kotlinx.coroutines.flow.flowOf(emptyList<ProgressEntryEntity>())
    }.collectAsStateWithLifecycle(initialValue = emptyList())
    val evidenceState by viewModel.evidenceState.collectAsStateWithLifecycle()
    var mode by remember { mutableStateOf(AiInferenceMode.PREFER_ON_DEVICE) }
    val intelligence = firstClass?.let { IntelligenceEngine.classroom(it, pupils, attendance, assessments, progress) }
    val result = evidenceState.result?.takeIf { it.task == "diagnostic" }

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(title = stringResource(R.string.intelligence_title), subtitle = stringResource(R.string.intelligence_subtitle))
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CountCard("${followUps.count { it.status == "open" }}", stringResource(R.string.open_followups), TinyButter, Modifier.weight(1f))
                CountCard("${analyses.size}", stringResource(R.string.analysis_saved), TinyCobalt, Modifier.weight(1f))
                CountCard("${intelligence?.attentionPupils?.size ?: 0}", stringResource(R.string.profile_needs_attention), TinyTomato, Modifier.weight(1f))
            }
        }
        item {
            PaperCard {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(R.string.analysis_diagnostics), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        StatusPill(stringResource(R.string.ai_optional), TinyCobalt)
                    }
                    Text(stringResource(R.string.ai_privacy_note), style = MaterialTheme.typography.bodySmall)
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FilterChip(selected = mode == AiInferenceMode.PREFER_ON_DEVICE, onClick = { mode = AiInferenceMode.PREFER_ON_DEVICE }, label = { Text(stringResource(R.string.mode_prefer_device)) })
                        FilterChip(selected = mode == AiInferenceMode.ONLY_IN_CLOUD, onClick = { mode = AiInferenceMode.ONLY_IN_CLOUD }, label = { Text(stringResource(R.string.mode_cloud_only)) })
                    }
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FilterChip(selected = mode == AiInferenceMode.ONLY_ON_DEVICE, onClick = { mode = AiInferenceMode.ONLY_ON_DEVICE }, label = { Text(stringResource(R.string.mode_device_only)) })
                    }
                    Spacer(Modifier.height(8.dp))
                    TinyPrimaryButton(
                        text = if (evidenceState.busy) stringResource(R.string.ai_thinking) else stringResource(R.string.run_diagnostic),
                        onClick = {
                            if (intelligence != null && firstClass != null) {
                                val prompt = IntelligenceEngine.classPrompt(intelligence, "Return one short factual sentence confirming you can analyse the supplied aggregate evidence. Do not add facts.")
                                val fallback = "The teaching assistant would summarise only the recorded attendance, assessment and observation evidence. This is a deterministic fallback, not a model response."
                                viewModel.generateEvidenceAnalysis(
                                    scope = "class", task = "diagnostic", pupilId = null, classId = firstClass.id,
                                    evidenceFingerprint = intelligence.evidenceFingerprint,
                                    evidenceIds = listOf(firstClass.id),
                                    evidenceSummary = "${intelligence.pupilCount} pupils · ${intelligence.markedAttendance} attendance · ${intelligence.assessmentCount} assessments",
                                    prompt = prompt, fallback = fallback, mode = mode,
                                )
                            }
                        },
                        enabled = !evidenceState.busy && intelligence != null,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    result?.let {
                        Spacer(Modifier.height(8.dp))
                        StatusPill(it.source, if (it.fallback) TinyButter else TinyForest)
                        Spacer(Modifier.height(6.dp))
                        Text(it.output, style = MaterialTheme.typography.bodyMedium)
                        Text(
                            "${stringResource(R.string.analysis_duration)}: ${it.durationMs} ms · ${stringResource(R.string.actual_source)}: ${it.source}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
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
                    Text(stringResource(R.string.class_intelligence), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    classes.forEach { classroom ->
                        TextButton(onClick = { onOpenClass(classroom.id) }, modifier = Modifier.fillMaxWidth()) {
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Text("${classroom.gradeLevel} ${classroom.label}", modifier = Modifier.weight(1f))
                                Text(stringResource(R.string.open))
                            }
                        }
                    }
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.pupils_attention), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    intelligence?.attentionPupils?.forEach { profile ->
                        TextButton(onClick = { onOpenPupil(profile.pupil.id) }, modifier = Modifier.fillMaxWidth()) {
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Text(profile.pupil.displayName, modifier = Modifier.weight(1f))
                                StatusPill("${profile.attendance.rate}%", TinyTomato)
                            }
                        }
                    }
                    if (intelligence?.attentionPupils.isNullOrEmpty()) Text(stringResource(R.string.empty_generic), style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        item {
            SectionHeading(title = stringResource(R.string.analysis_saved), subtitle = stringResource(R.string.recent_evidence))
        }
        items(analyses.take(8), key = { it.id }) { analysis ->
            PaperCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("${analysis.task} · ${analysis.source}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                        Text("${Instant.ofEpochMilli(analysis.createdAt).atZone(ZoneId.systemDefault()).toLocalDate()} · ${analysis.durationMs} ms · ${analysis.evidenceSummary}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    StatusPill(if (analysis.fallback) stringResource(R.string.analysis_fallback) else stringResource(R.string.ai_optional), if (analysis.fallback) TinyButter else TinyForest)
                }
            }
        }
        if (analyses.isEmpty()) item { PaperCard { Text(stringResource(R.string.no_analysis_yet)) } }
        item {
            InfoBanner(stringResource(R.string.analysis_fallback), tone = TinyCobalt)
        }
    }
}

@Composable
private fun CountCard(value: String, label: String, color: androidx.compose.ui.graphics.Color, modifier: Modifier = Modifier) {
    PaperCard(modifier = modifier) {
        Column {
            Text(value, style = MaterialTheme.typography.headlineSmall, color = color, fontWeight = FontWeight.Black)
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
