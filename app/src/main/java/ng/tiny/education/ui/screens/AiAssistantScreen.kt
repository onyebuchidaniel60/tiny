package ng.tiny.education.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ng.tiny.education.R
import ng.tiny.education.core.ai.AiTask
import ng.tiny.education.core.ai.DeviceAiStatus
import ng.tiny.education.ui.TinyViewModel
import ng.tiny.education.ui.components.InfoBanner
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.SectionHeading
import ng.tiny.education.ui.components.StatusPill
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.components.TinySecondaryButton
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyTomato

@Composable
fun AiAssistantScreen(viewModel: TinyViewModel, onBack: () -> Unit) {
    val aiState by viewModel.aiState.collectAsStateWithLifecycle()
    var strategyIndex by remember { mutableIntStateOf(0) }
    val strategies = listOf(
        stringResource(R.string.ai_strategy_1_title) to stringResource(R.string.ai_strategy_1_body),
        stringResource(R.string.ai_strategy_2_title) to stringResource(R.string.ai_strategy_2_body),
        stringResource(R.string.ai_strategy_3_title) to stringResource(R.string.ai_strategy_3_body),
    )
    LaunchedEffect(Unit) { viewModel.refreshAiStatus() }
    val available = aiState.deviceStatus == DeviceAiStatus.AVAILABLE
    val statusLabel = when (aiState.deviceStatus) {
        DeviceAiStatus.AVAILABLE -> stringResource(R.string.ai_status_available_value)
        DeviceAiStatus.DOWNLOADABLE -> stringResource(R.string.ai_status_downloadable_value)
        DeviceAiStatus.DOWNLOADING -> stringResource(R.string.ai_status_downloading_value)
        DeviceAiStatus.NOT_CONFIGURED -> stringResource(R.string.ai_status_not_configured_value)
        DeviceAiStatus.UNAVAILABLE -> stringResource(R.string.ai_status_unavailable_value)
    }

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeading(
                title = stringResource(R.string.ai_title),
                subtitle = stringResource(R.string.ai_subtitle),
            )
            Spacer(Modifier.height(8.dp))
            InfoBanner(stringResource(R.string.ai_privacy_note), tone = TinyTomato)
        }
        item {
            PaperCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Info, contentDescription = null, tint = TinyCobalt)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(
                            stringResource(R.string.ai_device_model, statusLabel),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            if (available) stringResource(R.string.ai_device_available) else stringResource(R.string.ai_device_unavailable),
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                    StatusPill(
                        stringResource(if (available) R.string.ai_nano_short else R.string.ai_fallback_short),
                        if (available) TinyForest else TinyTomato,
                    )
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.ai_ask_title), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    Text(stringResource(R.string.ai_ask_body), style = MaterialTheme.typography.bodySmall)
                    Spacer(Modifier.height(10.dp))
                    Text(stringResource(R.string.ai_mode_label), style = MaterialTheme.typography.labelLarge)
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FilterChip(
                            selected = aiState.task == AiTask.LESSON_PLAN,
                            onClick = { viewModel.setAiTask(AiTask.LESSON_PLAN) },
                            label = { Text(stringResource(R.string.ai_mode_lesson_plan)) },
                        )
                        FilterChip(
                            selected = aiState.task == AiTask.EXPLAIN,
                            onClick = { viewModel.setAiTask(AiTask.EXPLAIN) },
                            label = { Text(stringResource(R.string.ai_mode_explain)) },
                        )
                    }
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FilterChip(
                            selected = aiState.task == AiTask.ADAPT,
                            onClick = { viewModel.setAiTask(AiTask.ADAPT) },
                            label = { Text(stringResource(R.string.ai_mode_adapt)) },
                        )
                        FilterChip(
                            selected = aiState.task == AiTask.ASSESS,
                            onClick = { viewModel.setAiTask(AiTask.ASSESS) },
                            label = { Text(stringResource(R.string.ai_mode_assess)) },
                        )
                    }
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FilterChip(
                            selected = aiState.task == AiTask.SUPPORT,
                            onClick = { viewModel.setAiTask(AiTask.SUPPORT) },
                            label = { Text(stringResource(R.string.ai_mode_support)) },
                        )
                        FilterChip(
                            selected = aiState.task == AiTask.PARENT_NOTE,
                            onClick = { viewModel.setAiTask(AiTask.PARENT_NOTE) },
                            label = { Text(stringResource(R.string.ai_mode_parent_note)) },
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    TinyPrimaryButton(
                        text = if (aiState.busy) stringResource(R.string.ai_thinking) else stringResource(R.string.ai_generate),
                        onClick = { viewModel.requestAiSuggestion() },
                        enabled = !aiState.busy,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    aiState.text?.let { text ->
                        Spacer(Modifier.height(12.dp))
                        Text(text, style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.height(6.dp))
                        Text(
                            stringResource(R.string.ai_source) + ": " + (aiState.source ?: stringResource(R.string.status_unknown)),
                            style = MaterialTheme.typography.labelSmall,
                            color = TinyCobalt,
                        )
                    }
                    if (aiState.error) {
                        Spacer(Modifier.height(10.dp))
                        InfoBanner(stringResource(R.string.ai_error), tone = TinyTomato)
                    }
                }
            }
        }
        item {
            PaperCard {
                Column {
                    Text(stringResource(R.string.ai_offline_title), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    StatusPill(stringResource(R.string.ai_source_offline), TinyForest)
                    Spacer(Modifier.height(8.dp))
                    Text(stringResource(R.string.ai_offline_body), style = MaterialTheme.typography.bodyMedium)
                    Spacer(Modifier.height(18.dp))
                    Text(strategies[strategyIndex].first, style = MaterialTheme.typography.headlineSmall)
                    Spacer(Modifier.height(8.dp))
                    Text(strategies[strategyIndex].second, style = MaterialTheme.typography.bodyLarge)
                    Spacer(Modifier.height(12.dp))
                    Text(
                        stringResource(R.string.ai_source) + ": " + stringResource(R.string.ai_source_offline),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        item {
            TinySecondaryButton(
                text = stringResource(R.string.ai_try),
                onClick = { strategyIndex = (strategyIndex + 1) % strategies.size },
                modifier = Modifier.fillMaxWidth(),
            )
        }
        item {
            Text(
                stringResource(R.string.ai_acceptance_note),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
