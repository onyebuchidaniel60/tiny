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
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import ng.tiny.education.core.database.ConversationEntity
import ng.tiny.education.core.database.MessageEntity
import ng.tiny.education.core.model.ConversationStatus
import ng.tiny.education.core.model.MessageDirection
import ng.tiny.education.core.model.MessageStatus
import ng.tiny.education.ui.TinyViewModel
import ng.tiny.education.ui.components.InfoBanner
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.SectionHeading
import ng.tiny.education.ui.components.StatusPill
import ng.tiny.education.ui.components.TinyAvatar
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyTomato

@Composable
fun MessagesScreen(
    viewModel: TinyViewModel,
    onOpenConversation: (String) -> Unit,
) {
    val conversations by viewModel.conversations.collectAsStateWithLifecycle()
    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(
                title = stringResource(R.string.messages_heading),
                subtitle = stringResource(R.string.messages_subtitle),
            )
            Spacer(Modifier.height(8.dp))
            InfoBanner(stringResource(R.string.mock_inbox_notice), tone = TinyTomato)
        }
        items(conversations, key = { it.id }) { conversation ->
            ConversationCard(
                conversation = conversation,
                viewModel = viewModel,
                onClick = { onOpenConversation(conversation.id) },
            )
        }
        if (conversations.isEmpty()) {
            item {
                PaperCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.MailOutline, contentDescription = null, tint = TinyCobalt)
                        Spacer(Modifier.width(12.dp))
                        Text(stringResource(R.string.no_messages), style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
        }
    }
}

@Composable
private fun ConversationCard(
    conversation: ConversationEntity,
    viewModel: TinyViewModel,
    onClick: () -> Unit,
) {
    val guardian by viewModel.observeGuardian(conversation.guardianId).collectAsStateWithLifecycle(initialValue = null)
    val pupil by remember(conversation.pupilId) {
        if (conversation.pupilId == null) kotlinx.coroutines.flow.flowOf(null)
        else viewModel.observePupil(conversation.pupilId)
    }.collectAsStateWithLifecycle(initialValue = null)
    PaperCard(onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            TinyAvatar(guardian?.displayName ?: stringResource(R.string.guardian))
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    guardian?.displayName ?: stringResource(R.string.guardian),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    pupil?.let { stringResource(R.string.about_pupil, it.displayName) }
                        ?: stringResource(R.string.learner_context_pending),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (conversation.unreadCount > 0) {
                StatusPill(stringResource(R.string.unread_count, conversation.unreadCount), TinyTomato)
            } else {
                StatusPill(conversationStatusLabel(conversation.status), TinyCobalt)
            }
        }
        Spacer(Modifier.height(10.dp))
        Text(
            stringResource(R.string.preferred_language) + ": " +
                (guardian?.preferredLocale?.uppercase() ?: "EN"),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
fun ConversationScreen(
    conversationId: String,
    viewModel: TinyViewModel,
    onBack: () -> Unit,
) {
    val conversation by viewModel.observeConversation(conversationId).collectAsStateWithLifecycle(initialValue = null)
    val guardian by remember(conversation?.guardianId) {
        val id = conversation?.guardianId
        if (id == null) kotlinx.coroutines.flow.flowOf(null) else viewModel.observeGuardian(id)
    }.collectAsStateWithLifecycle(initialValue = null)
    val pupil by remember(conversation?.pupilId) {
        val id = conversation?.pupilId
        if (id == null) kotlinx.coroutines.flow.flowOf(null) else viewModel.observePupil(id)
    }.collectAsStateWithLifecycle(initialValue = null)
    val messages by viewModel.observeMessages(conversationId).collectAsStateWithLifecycle(initialValue = emptyList())
    val listState = rememberLazyListState()
    var reply by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { viewModel.markConversationRead(conversationId) }
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.lastIndex)
    }

    Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 16.dp)) {
        SectionHeading(
            title = guardian?.displayName ?: stringResource(R.string.guardian),
            subtitle = pupil?.let { stringResource(R.string.about_pupil, it.displayName) }
                ?: stringResource(R.string.learner_context_pending),
        )
        Spacer(Modifier.height(8.dp))
        InfoBanner(stringResource(R.string.mock_inbox_notice), tone = TinyTomato)
        Spacer(Modifier.height(10.dp))
        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 8.dp),
        ) {
            items(messages, key = { it.id }) { message ->
                MessageBubble(message)
            }
        }
        OutlinedTextField(
            value = reply,
            onValueChange = { reply = it },
            modifier = Modifier.fillMaxWidth(),
            minLines = 2,
            maxLines = 4,
            label = { Text(stringResource(R.string.write_reply)) },
            supportingText = {
                Text(stringResource(R.string.queued_reply_note), style = MaterialTheme.typography.labelSmall)
            },
        )
        Spacer(Modifier.height(8.dp))
        TinyPrimaryButton(
            text = stringResource(R.string.queue_reply),
            onClick = {
                if (reply.isNotBlank()) {
                    viewModel.sendReply(conversationId, reply)
                    reply = ""
                }
            },
            enabled = reply.isNotBlank(),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        Text(
            stringResource(R.string.provider_status, conversationStatusLabel(conversation?.status)),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun MessageBubble(message: MessageEntity) {
    val isTeacher = message.direction == MessageDirection.OUTBOUND
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isTeacher) Arrangement.End else Arrangement.Start,
    ) {
        PaperCard(modifier = Modifier.fillMaxWidth(0.86f)) {
            Column {
                Text(
                    stringResource(if (isTeacher) R.string.teacher else R.string.parent),
                    style = MaterialTheme.typography.labelSmall,
                    color = if (isTeacher) TinyForest else TinyTomato,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(Modifier.height(4.dp))
                Text(message.body, style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(4.dp))
                Text(
                    messageStatusLabel(message.status),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun conversationStatusLabel(status: ConversationStatus?): String = when (status) {
    ConversationStatus.WAITING_TEACHER -> stringResource(R.string.needs_reply)
    ConversationStatus.WAITING_PARENT -> stringResource(R.string.waiting)
    ConversationStatus.RESOLVED -> stringResource(R.string.status_ready)
    else -> stringResource(R.string.open)
}

@Composable
private fun messageStatusLabel(status: MessageStatus): String = when (status) {
    MessageStatus.RECEIVED -> stringResource(R.string.status_received)
    MessageStatus.QUEUED -> stringResource(R.string.status_queued)
    MessageStatus.ACCEPTED -> stringResource(R.string.status_accepted)
    MessageStatus.DELIVERED -> stringResource(R.string.status_delivered)
    MessageStatus.FAILED -> stringResource(R.string.status_failed)
    MessageStatus.UNKNOWN -> stringResource(R.string.status_unknown)
    MessageStatus.SUPPRESSED -> stringResource(R.string.status_suppressed)
}
