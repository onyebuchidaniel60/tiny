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
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.List
import androidx.compose.material.icons.outlined.MailOutline
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ng.tiny.education.R
import ng.tiny.education.core.database.ClassroomEntity
import ng.tiny.education.ui.TinyViewModel
import ng.tiny.education.ui.components.DoodleUnderline
import ng.tiny.education.ui.components.InfoBanner
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.PreviewChip
import ng.tiny.education.ui.components.SectionHeading
import ng.tiny.education.ui.components.StatusPill
import ng.tiny.education.ui.components.TinyAvatar
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.theme.TinyButter
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyTomato
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun HomeScreen(
    viewModel: TinyViewModel,
    onOpenClasses: () -> Unit,
    onOpenAttendance: (String) -> Unit,
    onOpenMessages: () -> Unit,
    onOpenLesson: () -> Unit,
    onOpenSync: () -> Unit,
) {
    val workspace by viewModel.workspace.collectAsStateWithLifecycle()
    val classes by viewModel.classes.collectAsStateWithLifecycle()
    val pupilCount by viewModel.pupilCount.collectAsStateWithLifecycle()
    val pending by viewModel.pendingOutboxCount.collectAsStateWithLifecycle()
    val unread by viewModel.unreadMessageCount.collectAsStateWithLifecycle()
    val preferences by viewModel.preferences.collectAsStateWithLifecycle()
    val today = remember { LocalDate.now() }
    val dateLabel = remember(today) { today.format(DateTimeFormatter.ofPattern("EEEE, d MMMM")) }

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Row(verticalAlignment = Alignment.Top) {
                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        StatusPill(stringResource(R.string.preview_build), TinyCobalt)
                        Spacer(Modifier.width(8.dp))
                        StatusPill(stringResource(R.string.home_sample_data), TinyTomato)
                    }
                    Spacer(Modifier.height(10.dp))
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
                PreviewChip()
            }
            DoodleUnderline(Modifier.width(150.dp), TinyTomato)
        }

        item {
            PaperCard {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        TinyAvatar(workspace?.name ?: "Tiny")
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(
                                workspace?.name ?: stringResource(R.string.school_demo_name),
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                stringResource(R.string.school_code_label, workspace?.schoolCode ?: "KOFAR001"),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        StatusPill(stringResource(R.string.mock_mode), TinyForest)
                    }
                    Spacer(Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        HomeStat("${classes.size}", stringResource(R.string.nav_classes), TinyCobalt, Modifier.weight(1f))
                        HomeStat("$pupilCount", "Pupils", TinyTomato, Modifier.weight(1f))
                        HomeStat("$pending", "Pending", TinyButter, Modifier.weight(1f))
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
            SectionHeading(
                title = stringResource(R.string.home_quick_actions),
                subtitle = "Get the classroom work done with fewer taps.",
            )
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickAction(
                    title = "Attendance",
                    subtitle = "Mark a register",
                    icon = Icons.Outlined.List,
                    tint = TinyForest,
                    onClick = { classes.firstOrNull()?.let { onOpenAttendance(it.id) } },
                    modifier = Modifier.weight(1f),
                )
                QuickAction(
                    title = "Lesson",
                    subtitle = "Open a 5E plan",
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
                    title = "Messages",
                    subtitle = if (unread > 0) "$unread unread" else "Parent inbox",
                    icon = Icons.Outlined.MailOutline,
                    tint = TinyTomato,
                    onClick = onOpenMessages,
                    modifier = Modifier.weight(1f),
                )
                QuickAction(
                    title = "Sync",
                    subtitle = if (pending > 0) "$pending local" else "Up to date",
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
                subtitle = "Your classes and the next useful action.",
            )
        }

        if (classes.isEmpty()) {
            item {
                PaperCard {
                    Text("Preparing your demo workspace…", style = MaterialTheme.typography.bodyLarge)
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
                        Text(stringResource(R.string.home_messages), style = MaterialTheme.typography.titleMedium)
                        Text(
                            if (unread > 0) "$unread conversation needs a reply" else "No unread parent messages",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Text(stringResource(R.string.home_view_messages), style = MaterialTheme.typography.labelLarge, color = TinyForest)
                }
            }
        }

        item {
            TinyPrimaryButton(
                text = "Open the preview workspace",
                onClick = onOpenClasses,
                modifier = Modifier.fillMaxWidth(),
            )
        }

        item {
            Text(
                stringResource(R.string.preview_notice),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 8.dp),
            )
        }
    }
}

@Composable
private fun HomeStat(value: String, label: String, color: Color, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .padding(vertical = 4.dp),
    ) {
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
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .padding(0.dp),
            ) {
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
                    "$count pupils · ${classroom.subjectSummary}",
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
            StatusPill("Local", TinyCobalt)
        }
    }
}
