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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.List
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ng.tiny.education.R
import ng.tiny.education.core.database.ClassroomEntity
import ng.tiny.education.core.intelligence.PupilIntelligenceStatus
import ng.tiny.education.ui.TinyViewModel
import ng.tiny.education.ui.components.InfoBanner
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.SectionHeading
import ng.tiny.education.ui.components.StatusPill
import ng.tiny.education.ui.components.TinyAvatar
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.components.TinySecondaryButton
import ng.tiny.education.ui.theme.TinyButter
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyTomato
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
fun HomeScreen(
    viewModel: TinyViewModel,
    onOpenClasses: () -> Unit,
    onOpenAttendance: (String) -> Unit,
    onOpenMessages: () -> Unit,
    onOpenLesson: () -> Unit,
    onOpenSync: () -> Unit,
    onShowTour: () -> Unit,
    onOpenPupils: () -> Unit,
    onOpenIntelligence: () -> Unit,
    onOpenFollowUps: () -> Unit,
    onOpenPupil: (String) -> Unit,
) {
    val workspace by viewModel.workspace.collectAsStateWithLifecycle()
    val classes by viewModel.classes.collectAsStateWithLifecycle()
    val pupilCount by viewModel.pupilCount.collectAsStateWithLifecycle()
    val pending by viewModel.pendingOutboxCount.collectAsStateWithLifecycle()
    val unread by viewModel.unreadMessageCount.collectAsStateWithLifecycle()
    val directory by viewModel.pupilDirectory.collectAsStateWithLifecycle()
    val followUps by viewModel.followUps.collectAsStateWithLifecycle()
    val attention = directory.filter { it.status == PupilIntelligenceStatus.NEEDS_ATTENTION }
    val openFollowUps = followUps.count { it.status == "open" }
    val preferences by viewModel.preferences.collectAsStateWithLifecycle()
    val today = remember { LocalDate.now() }
    val locale = LocalConfiguration.current.locales[0]
    val dateLabel = remember(today, locale) {
        today.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.FULL).withLocale(locale))
    }
    val statsReady = workspace != null && (classes.isNotEmpty() || pupilCount > 0)

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Row(verticalAlignment = Alignment.Top) {
                Column(Modifier.weight(1f)) {
                    Text(
                        text = stringResource(R.string.home_greeting, preferences.teacherName),
                        style = MaterialTheme.typography.headlineMedium,
                    )
                    Text(
                        text = dateLabel,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                StatusPill(stringResource(R.string.saved_on_device), TinyForest)
            }
        }

        item {
            PaperCard {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        TinyAvatar(workspace?.name ?: stringResource(R.string.demo_school_name))
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(
                                workspace?.name ?: stringResource(R.string.demo_school_name),
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                stringResource(R.string.school_code_label, workspace?.schoolCode ?: "KOFAR001"),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        HomeStat(if (statsReady) "${classes.size}" else "—", stringResource(R.string.home_classes), TinyCobalt, Modifier.weight(1f))
                        HomeStat(if (statsReady) "$pupilCount" else "—", stringResource(R.string.home_pupils), TinyTomato, Modifier.weight(1f))
                        HomeStat(if (statsReady) "$pending" else "—", stringResource(R.string.home_pending), TinyButter, Modifier.weight(1f))
                    }
                }
            }
        }

        item {
            InfoBanner(
                text = stringResource(R.string.home_absence_note),
                tone = TinyCobalt,
            )
        }

        item {
            PaperCard(onClick = onOpenIntelligence) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(stringResource(R.string.pupils_attention), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.width(8.dp))
                            StatusPill("${attention.size}", if (attention.isEmpty()) TinyForest else TinyTomato)
                        }
                        Text(
                            if (attention.isEmpty()) stringResource(R.string.no_open_followups) else attention.take(3).joinToString(", ") { it.pupil.displayName },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            "$openFollowUps ${stringResource(R.string.open_followups).lowercase()} · ${stringResource(R.string.honest_scope)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TinyCobalt,
                        )
                    }
                    Text(stringResource(R.string.nav_insights), style = MaterialTheme.typography.labelLarge, color = TinyForest)
                }
                if (attention.isNotEmpty()) {
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        attention.take(3).forEach { profile ->
                            TinySecondaryButton(profile.pupil.displayName, { onOpenPupil(profile.pupil.id) })
                        }
                    }
                }
            }
        }

        item {
            SectionHeading(
                title = stringResource(R.string.home_quick_actions),
                subtitle = stringResource(R.string.home_today),
            )
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickAction(
                    title = stringResource(R.string.attendance_title),
                    subtitle = stringResource(R.string.mark_attendance),
                    icon = Icons.Outlined.List,
                    tint = TinyForest,
                    onClick = { classes.firstOrNull()?.let { onOpenAttendance(it.id) } },
                    modifier = Modifier.weight(1f),
                )
                QuickAction(
                    title = stringResource(R.string.lessons_title),
                    subtitle = stringResource(R.string.home_lesson_plans_body),
                    icon = Icons.Outlined.Star,
                    tint = TinyCobalt,
                    onClick = onOpenLesson,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickAction(
                    title = stringResource(R.string.pupil_directory),
                    subtitle = stringResource(R.string.pupil_directory_subtitle),
                    icon = Icons.Outlined.Person,
                    tint = TinyCobalt,
                    onClick = onOpenPupils,
                    modifier = Modifier.weight(1f),
                )
                QuickAction(
                    title = stringResource(R.string.followups),
                    subtitle = "$openFollowUps ${stringResource(R.string.open_followups).lowercase()}",
                    icon = Icons.Outlined.Check,
                    tint = TinyTomato,
                    onClick = onOpenFollowUps,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickAction(
                    title = stringResource(R.string.messages_title),
                    subtitle = if (unread > 0) stringResource(R.string.unread_count, unread) else stringResource(R.string.home_no_unread),
                    icon = Icons.Outlined.MailOutline,
                    tint = TinyTomato,
                    onClick = onOpenMessages,
                    modifier = Modifier.weight(1f),
                )
                QuickAction(
                    title = stringResource(R.string.sync_title),
                    subtitle = if (pending > 0) stringResource(R.string.sync_pending) else stringResource(R.string.saved_on_device),
                    icon = Icons.Outlined.Refresh,
                    tint = TinyForest,
                    onClick = onOpenSync,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        item {
            SectionHeading(
                title = stringResource(R.string.home_today),
                subtitle = stringResource(R.string.classes_subtitle),
            )
        }

        if (classes.isEmpty()) {
            item {
                PaperCard {
                    Text(stringResource(R.string.loading_workspace), style = MaterialTheme.typography.bodyLarge)
                }
            }
        } else {
            items(classes, key = { it.id }) { classroom ->
                ClassTodayCard(
                    classroom = classroom,
                    pupilCountFlow = viewModel.observeClassPupilCount(classroom.id),
                    onOpenClass = onOpenClasses,
                    onOpenAttendance = { onOpenAttendance(classroom.id) },
                )
            }
        }

        item {
            PaperCard(onClick = onOpenMessages) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.MailOutline, contentDescription = null, tint = TinyTomato)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(stringResource(R.string.home_parent_messages), style = MaterialTheme.typography.titleMedium)
                        Text(
                            if (unread > 0) pluralStringResource(R.plurals.home_unread_needs_reply, unread, unread) else stringResource(R.string.home_no_unread),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Text(stringResource(R.string.home_view_messages), style = MaterialTheme.typography.labelLarge, color = TinyForest)
                }
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                TinyPrimaryButton(
                    text = stringResource(R.string.home_open_classes),
                    onClick = onOpenClasses,
                    modifier = Modifier.weight(1f),
                )
                TinySecondaryButton(
                    text = stringResource(R.string.home_tour_start),
                    onClick = onShowTour,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        item {
            Text(
                stringResource(R.string.preview_data_notice),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 8.dp),
            )
        }
    }
}

@Composable
private fun HomeStat(value: String, label: String, color: Color, modifier: Modifier = Modifier) {
    Column(modifier = modifier.padding(vertical = 4.dp)) {
        Text(value, style = MaterialTheme.typography.headlineSmall, color = color, fontWeight = FontWeight.Black)
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun QuickAction(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    tint: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    PaperCard(onClick = onClick, modifier = modifier) {
        Column {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(26.dp))
            Spacer(Modifier.height(12.dp))
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun ClassTodayCard(
    classroom: ClassroomEntity,
    pupilCountFlow: kotlinx.coroutines.flow.Flow<Int>,
    onOpenClass: () -> Unit,
    onOpenAttendance: () -> Unit,
) {
    val count by pupilCountFlow.collectAsStateWithLifecycle(initialValue = 0)
    PaperCard(onClick = onOpenClass) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(48.dp)) {
                Text(
                    classroom.gradeLevel,
                    style = MaterialTheme.typography.headlineSmall,
                    color = TinyForest,
                    fontWeight = FontWeight.Black,
                )
            }
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text("${classroom.gradeLevel} ${classroom.label}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text(
                    pluralStringResource(R.plurals.classes_pupil_count, count, count),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Spacer(Modifier.height(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TinyPrimaryButton(
                text = stringResource(R.string.mark_attendance),
                onClick = onOpenAttendance,
                modifier = Modifier.weight(1f),
            )
            StatusPill(stringResource(R.string.saved_on_device), TinyCobalt)
        }
    }
}
