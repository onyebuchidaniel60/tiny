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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.flow.flowOf
import ng.tiny.education.R
import ng.tiny.education.core.ai.AiInferenceMode
import ng.tiny.education.core.database.AttendanceEvidenceRow
import ng.tiny.education.core.database.PupilEntity
import ng.tiny.education.core.intelligence.IntelligenceEngine
import ng.tiny.education.core.intelligence.PupilIntelligenceStatus
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
import java.time.LocalDate

@Composable
fun ClassIntelligenceScreen(
    classId: String,
    viewModel: TinyViewModel,
    onOpenPupil: (String) -> Unit,
    onOpenLesson: (String) -> Unit,
) {
    val classroom by viewModel.observeClass(classId).collectAsStateWithLifecycle(initialValue = null)
    val pupils by viewModel.observePupils(classId).collectAsStateWithLifecycle(initialValue = emptyList<PupilEntity>())
    val attendance by remember(classId) { viewModel.observeAttendanceEvidence(classId) }.collectAsStateWithLifecycle(initialValue = emptyList<AttendanceEvidenceRow>())
    val assessments by remember(classId) { viewModel.observeClassAssessments(classId) }.collectAsStateWithLifecycle(initialValue = emptyList())
    val progress by remember(classId) { viewModel.observeClassProgress(classId) }.collectAsStateWithLifecycle(initialValue = emptyList())
    val evidenceState by viewModel.evidenceState.collectAsStateWithLifecycle()
    val intelligence = classroom?.let { IntelligenceEngine.classroom(it, pupils, attendance, assessments, progress) }
    val review = evidenceState.result?.takeIf { it.task == "class_review" }

    if (intelligence == null) {
        PaperCard { Text(stringResource(R.string.class_not_found_body)) }
        return
    }

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(
                title = "${intelligence.classroom.gradeLevel} ${intelligence.classroom.label}",
                subtitle = stringResource(R.string.class_intelligence_subtitle),
            )
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ClassMetric("${intelligence.attendanceRate}%", stringResource(R.string.class_attendance), TinyForest, Modifier.weight(1f))
                ClassMetric("${intelligence.assessmentAverage}%", stringResource(R.string.class_assessment), TinyTomato, Modifier.weight(1f))
                ClassMetric("${intelligence.observationCount}", stringResource(R.string.observations), TinyCobalt, Modifier.weight(1f))
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.common_gaps), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    if (intelligence.commonGaps.isEmpty()) {
                        Text(stringResource(R.string.insufficient_evidence), style = MaterialTheme.typography.bodySmall)
                    } else {
                        intelligence.commonGaps.forEach { gap ->
                            Row(Modifier.fillMaxWidth().padding(vertical = 5.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(gap.objectiveLabel, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                                    Text("${pluralStringResource(R.plurals.observation_count, gap.supportObservations, gap.supportObservations)} - ${gap.pupilsBelow} ${stringResource(R.string.pupils).lowercase()} < 50%", style = MaterialTheme.typography.labelSmall)
                                }
                                StatusPill("${gap.average}%", TinyTomato)
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    TinyPrimaryButton(
                        text = stringResource(R.string.plan_from_evidence),
                        onClick = {
                            val plan = IntelligenceEngine.deterministicLessonPlan(intelligence)
                            viewModel.createEvidenceLesson(classId, plan, onOpenLesson)
                        },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.class_strengths), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    intelligence.strengths.forEach { gap ->
                        Text("• ${gap.objectiveLabel} — ${gap.average}%", style = MaterialTheme.typography.bodySmall)
                    }
                    if (intelligence.strengths.isEmpty()) Text(stringResource(R.string.insufficient_evidence), style = MaterialTheme.typography.bodySmall)
                    Spacer(Modifier.height(8.dp))
                    Text(stringResource(R.string.pupils_improving), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    intelligence.improvingPupils.forEach { profile ->
                        TextButton(onClick = { onOpenPupil(profile.pupil.id) }) { Text(profile.pupil.displayName) }
                    }
                    if (intelligence.improvingPupils.isEmpty()) Text(stringResource(R.string.empty_generic), style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.pupils_attention), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    if (intelligence.attentionPupils.isEmpty()) {
                        Text(stringResource(R.string.empty_generic), style = MaterialTheme.typography.bodySmall)
                    } else {
                        intelligence.attentionPupils.forEach { profile ->
                            Row(Modifier.fillMaxWidth().padding(vertical = 5.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(profile.pupil.displayName, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                                    Text("${profile.attendance.rate}% ${stringResource(R.string.attendance_rate).lowercase()}", style = MaterialTheme.typography.labelSmall)
                                }
                                StatusPill(stringResource(R.string.status_needs_attention), TinyTomato)
                                TextButton(onClick = { onOpenPupil(profile.pupil.id) }) { Text(stringResource(R.string.open)) }
                            }
                        }
                    }
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
                    TinySecondaryButton(
                        text = if (evidenceState.busy) stringResource(R.string.ai_thinking) else stringResource(R.string.generate_evidence_review),
                        onClick = {
                            val prompt = IntelligenceEngine.classPrompt(intelligence, "Analyse this class evidence and suggest the most useful teaching and follow-up actions.")
                            val fallback = IntelligenceEngine.deterministicClassReview(intelligence)
                            viewModel.generateEvidenceAnalysis(
                                scope = "class", task = "class_review", pupilId = null, classId = classId,
                                evidenceFingerprint = intelligence.evidenceFingerprint,
                                evidenceIds = listOf(classId) + intelligence.attentionPupils.map { it.pupil.id },
                                evidenceSummary = "${intelligence.pupilCount} pupils · ${intelligence.markedAttendance} attendance · ${intelligence.assessmentCount} assessments",
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
            InfoBanner(stringResource(R.string.override_note), tone = TinyForest)
        }
    }
}

@Composable
private fun ClassMetric(value: String, label: String, color: androidx.compose.ui.graphics.Color, modifier: Modifier = Modifier) {
    PaperCard(modifier = modifier) {
        Column {
            Text(value, style = MaterialTheme.typography.headlineSmall, color = color, fontWeight = FontWeight.Black)
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
