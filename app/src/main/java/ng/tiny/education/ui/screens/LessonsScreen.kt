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
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import ng.tiny.education.core.database.LessonPlanEntity
import ng.tiny.education.ui.TinyViewModel
import ng.tiny.education.ui.components.InfoBanner
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.SectionHeading
import ng.tiny.education.ui.components.StatusPill
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.theme.TinyButter
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyTomato

@Composable
fun LessonsScreen(
    viewModel: TinyViewModel,
    onOpenLesson: (String) -> Unit,
    onOpenAi: () -> Unit,
) {
    val lessons by viewModel.lessons.collectAsStateWithLifecycle()
    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(
                title = stringResource(R.string.lessons_heading),
                subtitle = stringResource(R.string.lessons_subtitle),
            )
            Spacer(Modifier.height(8.dp))
            InfoBanner(
                "These plans are stored locally. They are teacher-authored scaffolds, not a claim of full NERDC curriculum coverage.",
                tone = TinyCobalt,
            )
        }
        item {
            PaperCard(onClick = onOpenAi) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Star, contentDescription = null, tint = TinyTomato)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(stringResource(R.string.ai_title), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("Curated offline help when a model is unavailable.", style = MaterialTheme.typography.bodySmall)
                    }
                    StatusPill("Optional", TinyCobalt)
                }
            }
        }
        item {
            PaperCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Star, contentDescription = null, tint = TinyTomato)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(stringResource(R.string.teaching_tip_title), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(stringResource(R.string.teaching_tip_body), style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
        item {
            SectionHeading(title = "Saved plans", subtitle = "5E structure, available without a network.")
        }
        items(lessons, key = { it.id }) { lesson ->
            LessonCard(lesson = lesson, onClick = { onOpenLesson(lesson.id) })
        }
        if (lessons.isEmpty()) {
            item { PaperCard { Text("No lesson plans yet.") } }
        }
    }
}

@Composable
private fun LessonCard(lesson: LessonPlanEntity, onClick: () -> Unit) {
    PaperCard(onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    StatusPill(lesson.gradeLevel, TinyForest)
                    StatusPill(lesson.subjectId.replace('_', ' '), TinyCobalt)
                }
                Spacer(Modifier.height(8.dp))
                Text(lesson.topic, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text(
                    stringResource(R.string.duration_minutes, lesson.durationMinutes),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Icon(Icons.Outlined.Star, contentDescription = null, tint = TinyButter)
        }
        Spacer(Modifier.height(10.dp))
        Text(lesson.objective, style = MaterialTheme.typography.bodyMedium, maxLines = 3)
    }
}

@Composable
fun LessonDetailScreen(
    lessonId: String,
    viewModel: TinyViewModel,
    onBack: () -> Unit,
) {
    val lesson by viewModel.observeLesson(lessonId).collectAsStateWithLifecycle(initialValue = null)
    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            lesson?.let { plan ->
                SectionHeading(title = plan.topic, subtitle = "${plan.gradeLevel} · ${plan.subjectId.replace('_', ' ')}")
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusPill(stringResource(R.string.duration_minutes, plan.durationMinutes), TinyCobalt)
                    StatusPill("Offline", TinyForest)
                }
            }
        }
        lesson?.let { plan ->
            item { LessonSection(stringResource(R.string.objective_label), plan.objective) }
            item { LessonSection(stringResource(R.string.materials), plan.materials) }
            item { LessonSection(stringResource(R.string.prior_knowledge), plan.priorKnowledge) }
            item {
                SectionHeading(title = stringResource(R.string.lesson_5e), subtitle = "A practical sequence, not a script.")
            }
            item { LessonSection(stringResource(R.string.engage), plan.engage) }
            item { LessonSection(stringResource(R.string.explore), plan.explore) }
            item { LessonSection(stringResource(R.string.explain), plan.explain) }
            item { LessonSection(stringResource(R.string.elaborate), plan.elaborate) }
            item { LessonSection(stringResource(R.string.evaluate), plan.evaluate) }
            item {
                TinyPrimaryButton(
                    text = stringResource(R.string.save_lesson),
                    onClick = { viewModel.showMessage("Lesson is already saved locally in this preview.") },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            item {
                InfoBanner(
                    "Curriculum source/version metadata is not yet attached to this demo plan. Do not present it as a verified NERDC pack.",
                    tone = TinyTomato,
                )
            }
        }
        if (lesson == null) {
            item { PaperCard { Text("Lesson not found.") } }
        }
    }
}

@Composable
private fun LessonSection(title: String, body: String) {
    PaperCard {
        Column {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(6.dp))
            Text(body, style = MaterialTheme.typography.bodyMedium)
        }
    }
}
