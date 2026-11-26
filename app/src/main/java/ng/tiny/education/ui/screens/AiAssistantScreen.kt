package ng.tiny.education.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Info
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
                    androidx.compose.foundation.layout.Column(Modifier.weight(1f)) {
                        Text("On-device model: ${aiState.deviceStatus}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(
                            if (aiState.deviceStatus == "Available") "Gemini Nano is available on this device."
                            else "Cloud inference is used only when configured; the curated fallback remains available.",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                    StatusPill(if (aiState.deviceStatus == "Available") "Nano" else "Fallback", if (aiState.deviceStatus == "Available") TinyForest else TinyTomato)
                }
            }
        }
        item {
            PaperCard {
                androidx.compose.foundation.layout.Column {
                    Text("Ask the teaching helper", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Uses a de-identified Primary 4 science prompt. Teacher review is required before using or sharing any suggestion.",
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Spacer(Modifier.height(10.dp))
                    TinyPrimaryButton(
                        text = if (aiState.busy) "Thinking..." else "Generate a strategy",
                        onClick = { viewModel.requestAiSuggestion() },
                        enabled = !aiState.busy,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    aiState.text?.let { text ->
                        Spacer(Modifier.height(12.dp))
                        Text(text, style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "Source: ${aiState.source ?: "unknown"}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TinyCobalt,
                        )
                    }
                    aiState.error?.let { error ->
                        Spacer(Modifier.height(10.dp))
                        InfoBanner(error, tone = TinyTomato)
                    }
                }
            }
        }
        item {
            PaperCard {
                androidx.compose.foundation.layout.Column {
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
                        "${stringResource(R.string.ai_source_label)}: ${stringResource(R.string.ai_source_offline)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        item {
            TinyPrimaryButton(
                text = stringResource(R.string.ai_try),
                onClick = { strategyIndex = (strategyIndex + 1) % strategies.size },
                modifier = Modifier.fillMaxWidth(),
            )
        }
        item {
            Text(
                "The hybrid AI acceptance gate is separate: on-device Gemini Nano requires supported physical hardware, and cloud AI requires the non-production Firebase project. Neither is claimed in this preview.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
