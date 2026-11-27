package ng.tiny.education.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ng.tiny.education.R
import ng.tiny.education.ui.components.InfoBanner
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.SectionHeading
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.components.TinySecondaryButton
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyTomato

private data class HelpArticle(val titleRes: Int, val bodyRes: Int)

private val helpArticles = listOf(
    HelpArticle(R.string.help_getting_started, R.string.help_getting_started_body),
    HelpArticle(R.string.help_classes, R.string.help_classes_body),
    HelpArticle(R.string.help_pupils, R.string.help_pupils_body),
    HelpArticle(R.string.help_guardians, R.string.help_guardians_body),
    HelpArticle(R.string.help_attendance, R.string.help_attendance_body),
    HelpArticle(R.string.help_lessons, R.string.help_lessons_body),
    HelpArticle(R.string.help_progress, R.string.help_progress_body),
    HelpArticle(R.string.help_messages, R.string.help_messages_body),
    HelpArticle(R.string.help_ai, R.string.help_ai_body),
    HelpArticle(R.string.help_offline, R.string.help_offline_body),
    HelpArticle(R.string.help_sync, R.string.help_sync_body),
    HelpArticle(R.string.help_troubleshooting, R.string.help_troubleshooting_body),
    HelpArticle(R.string.help_privacy, R.string.help_privacy_body),
)

@Composable
fun HelpScreen(
    onBack: () -> Unit,
    onShowTeacherTour: () -> Unit,
    onShowGuardianTour: () -> Unit,
) {
    var query by remember { mutableStateOf("") }
    var expanded by remember { mutableIntStateOf(-1) }
    val allTitles = helpArticles.map { stringResource(it.titleRes) }
    val allBodies = helpArticles.map { stringResource(it.bodyRes) }
    val filtered = helpArticles.filterIndexed { index, _ ->
        query.isBlank() || (allTitles[index] + " " + allBodies[index]).contains(query.trim(), ignoreCase = true)
    }

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(title = stringResource(R.string.help_title), subtitle = stringResource(R.string.help_subtitle))
            Spacer(Modifier.height(10.dp))
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                label = { Text(stringResource(R.string.help_search)) },
                placeholder = { Text(stringResource(R.string.help_search_placeholder)) },
                leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.help_tours), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    Text(stringResource(R.string.help_tour_teacher_body), style = MaterialTheme.typography.bodySmall)
                    Spacer(Modifier.height(10.dp))
                    TinyPrimaryButton(
                        text = stringResource(R.string.teacher_tour_button),
                        onClick = onShowTeacherTour,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(8.dp))
                    TinySecondaryButton(
                        text = stringResource(R.string.guardian_tour_button),
                        onClick = onShowGuardianTour,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
        item {
            SectionHeading(
                title = stringResource(R.string.help_articles),
                subtitle = stringResource(R.string.help_article_count, filtered.size),
            )
        }
        if (filtered.isEmpty()) {
            item { PaperCard { Text(stringResource(R.string.help_no_results)) } }
        }
        items(filtered.size) { position ->
            val article = filtered[position]
            val index = helpArticles.indexOf(article)
            val isOpen = expanded == index
            PaperCard(onClick = { expanded = if (isOpen) -1 else index }) {
                Row(verticalAlignment = Alignment.Top) {
                    Surface(
                        color = TinyForest.copy(alpha = 0.14f),
                        shape = CircleShape,
                        modifier = Modifier.size(34.dp),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text("${index + 1}", style = MaterialTheme.typography.labelMedium, color = TinyForest, fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(stringResource(article.titleRes), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        if (isOpen) {
                            Spacer(Modifier.height(6.dp))
                            Text(stringResource(article.bodyRes), style = MaterialTheme.typography.bodyMedium)
                        } else {
                            Spacer(Modifier.height(3.dp))
                            Text(
                                stringResource(R.string.help_tip) + " · " + stringResource(R.string.open),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.help_guardian_guide_body), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    for (step in listOf(
                        R.string.help_guardian_step_1,
                        R.string.help_guardian_step_2,
                        R.string.help_guardian_step_3,
                        R.string.help_guardian_step_4,
                    )) {
                        Text("• " + stringResource(step), style = MaterialTheme.typography.bodySmall)
                        Spacer(Modifier.height(5.dp))
                    }
                }
            }
        }
        item {
            InfoBanner(stringResource(R.string.help_limitations_body), tone = TinyTomato)
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.help_contact), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Text(stringResource(R.string.help_contact_body), style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        item {
            TinySecondaryButton(
                text = stringResource(R.string.help_back),
                onClick = onBack,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
