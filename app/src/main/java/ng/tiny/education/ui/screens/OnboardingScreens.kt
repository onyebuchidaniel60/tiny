package ng.tiny.education.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import ng.tiny.education.R
import ng.tiny.education.ui.components.CheckBullet
import ng.tiny.education.ui.components.DotAccent
import ng.tiny.education.ui.components.DoodleUnderline
import ng.tiny.education.ui.components.PaperCard
import ng.tiny.education.ui.components.TinyPrimaryButton
import ng.tiny.education.ui.components.TinyWordmark
import ng.tiny.education.ui.theme.TinyButter
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyInk
import ng.tiny.education.ui.theme.TinyPaper
import ng.tiny.education.ui.theme.TinyTomato

@Composable
fun LanguageScreen(
    selectedLanguage: String,
    onLanguageSelected: (String) -> Unit,
    onContinue: () -> Unit,
) {
    var selected by remember(selectedLanguage) { mutableStateOf(selectedLanguage) }
    val languages = listOf(
        "en" to stringResource(R.string.language_english),
        "ha" to stringResource(R.string.language_hausa),
        "yo" to stringResource(R.string.language_yoruba),
        "ig" to stringResource(R.string.language_igbo),
    )
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 20.dp),
    ) {
        TinyWordmark()
        Spacer(Modifier.height(44.dp))
        Box {
            Text(
                text = stringResource(R.string.language_title),
                style = MaterialTheme.typography.displaySmall,
                modifier = Modifier.padding(end = 16.dp),
            )
            DotAccent(modifier = Modifier.align(Alignment.TopEnd).padding(top = 0.dp))
        }
        DoodleUnderline(modifier = Modifier.width(180.dp), color = TinyTomato)
        Spacer(Modifier.height(12.dp))
        Text(
            text = stringResource(R.string.language_subtitle),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(28.dp))
        languages.forEach { (code, label) ->
            val isSelected = selected == code
            Surface(
                onClick = { selected = code },
                color = if (isSelected) TinyButter.copy(alpha = 0.45f) else MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 10.dp)
                    .border(
                        width = if (isSelected) 2.dp else 1.dp,
                        color = if (isSelected) TinyInk else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(16.dp),
                    ),
            ) {
                Row(
                    Modifier.padding(horizontal = 18.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .size(26.dp)
                            .background(if (isSelected) TinyForest else Color.Transparent, CircleShape)
                            .border(1.dp, TinyInk.copy(alpha = 0.6f), CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        if (isSelected) {
                            Text("✓", color = TinyPaper, style = MaterialTheme.typography.labelLarge)
                        }
                    }
                    Spacer(Modifier.width(14.dp))
                    Text(label, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.weight(1f))
                    Text(code.uppercase(), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        Text(
            text = stringResource(R.string.language_draft_note),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(28.dp))
        TinyPrimaryButton(
            text = stringResource(R.string.continue_label),
            onClick = {
                onLanguageSelected(selected)
                onContinue()
            },
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
fun WelcomeScreen(onExplore: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 20.dp),
    ) {
        TinyWordmark()
        Spacer(Modifier.height(38.dp))
        Text(
            text = stringResource(R.string.welcome_title),
            style = MaterialTheme.typography.displayMedium,
        )
        DoodleUnderline(modifier = Modifier.width(210.dp), color = TinyTomato)
        Spacer(Modifier.height(16.dp))
        Text(
            text = stringResource(R.string.welcome_body),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(28.dp))
        PaperCard {
            Column {
                Text(stringResource(R.string.welcome_whats_inside), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(12.dp))
                CheckBullet(stringResource(R.string.welcome_bullet_1))
                Spacer(Modifier.height(8.dp))
                CheckBullet(stringResource(R.string.welcome_bullet_2))
                Spacer(Modifier.height(8.dp))
                CheckBullet(stringResource(R.string.welcome_bullet_3))
                Spacer(Modifier.height(8.dp))
                CheckBullet(stringResource(R.string.welcome_bullet_4))
                Spacer(Modifier.height(8.dp))
                CheckBullet(stringResource(R.string.welcome_bullet_5))
            }
        }
        Spacer(Modifier.height(20.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            FeatureChip(stringResource(R.string.welcome_offline), TinyForest)
            FeatureChip(stringResource(R.string.welcome_sms), TinyCobalt)
            FeatureChip(stringResource(R.string.welcome_languages), TinyTomato)
        }
        Spacer(Modifier.height(28.dp))
        TinyPrimaryButton(
            text = stringResource(R.string.welcome_cta),
            onClick = onExplore,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(16.dp))
        Text(
            text = stringResource(R.string.preview_data_notice),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun FeatureChip(label: String, color: Color) {
    Surface(
        color = color.copy(alpha = 0.12f),
        contentColor = color,
        shape = RoundedCornerShape(50),
        modifier = Modifier.border(1.dp, color.copy(alpha = 0.3f), RoundedCornerShape(50)),
    ) {
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
            textAlign = TextAlign.Center,
        )
    }
}
