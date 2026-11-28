package ng.tiny.education.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.List
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import ng.tiny.education.R
import ng.tiny.education.ui.theme.TinyButter
import ng.tiny.education.ui.theme.TinyCobalt
import ng.tiny.education.ui.theme.TinyForest
import ng.tiny.education.ui.theme.TinyInk
import ng.tiny.education.ui.theme.TinyLine
import ng.tiny.education.ui.theme.TinyPaper
import ng.tiny.education.ui.theme.TinyTomato

enum class TinyTab(val route: String) {
    HOME("home"),
    CLASSES("classes"),
    PUPILS("pupils"),
    LESSONS("lessons"),
    MESSAGES("messages"),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TinyTopBar(
    title: String,
    onSettings: () -> Unit,
    onHelp: () -> Unit,
    onBack: (() -> Unit)? = null,
) {
    CenterAlignedTopAppBar(
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        },
        navigationIcon = {
            if (onBack != null) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Outlined.ArrowBack, contentDescription = stringResource(R.string.cd_back))
                }
            }
        },
        actions = {
            IconButton(onClick = onHelp) {
                Icon(Icons.Outlined.Info, contentDescription = stringResource(R.string.cd_help))
            }
            IconButton(onClick = onSettings) {
                Icon(Icons.Outlined.Settings, contentDescription = stringResource(R.string.cd_settings))
            }
        },
        colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
            containerColor = MaterialTheme.colorScheme.background,
            titleContentColor = MaterialTheme.colorScheme.onBackground,
            navigationIconContentColor = MaterialTheme.colorScheme.onBackground,
            actionIconContentColor = MaterialTheme.colorScheme.onBackground,
        ),
    )
}

@Composable
fun TinyBottomBar(currentRoute: String?, onNavigate: (TinyTab) -> Unit) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
    ) {
        NavigationBarItem(
            selected = currentRoute?.startsWith("home") == true,
            onClick = { onNavigate(TinyTab.HOME) },
            modifier = Modifier.testTag("tab_home"),
            icon = { Icon(Icons.Outlined.Home, contentDescription = stringResource(R.string.nav_home)) },
            label = { Text(stringResource(R.string.nav_home)) },
        )
        NavigationBarItem(
            selected = currentRoute?.startsWith("classes") == true || currentRoute?.startsWith("attendance") == true,
            onClick = { onNavigate(TinyTab.CLASSES) },
            modifier = Modifier.testTag("tab_classes"),
            icon = { Icon(Icons.Outlined.List, contentDescription = stringResource(R.string.nav_classes)) },
            label = { Text(stringResource(R.string.nav_classes)) },
        )
        NavigationBarItem(
            selected = currentRoute?.startsWith("pupils") == true || currentRoute?.startsWith("pupil/") == true,
            onClick = { onNavigate(TinyTab.PUPILS) },
            modifier = Modifier.testTag("tab_pupils"),
            icon = { Icon(Icons.Outlined.Person, contentDescription = stringResource(R.string.nav_pupils)) },
            label = { Text(stringResource(R.string.nav_pupils)) },
        )
        NavigationBarItem(
            selected = currentRoute?.startsWith("lessons") == true,
            onClick = { onNavigate(TinyTab.LESSONS) },
            modifier = Modifier.testTag("tab_lessons"),
            icon = { Icon(Icons.Outlined.Star, contentDescription = stringResource(R.string.nav_lessons)) },
            label = { Text(stringResource(R.string.nav_lessons)) },
        )
        NavigationBarItem(
            selected = currentRoute?.startsWith("messages") == true || currentRoute?.startsWith("conversation") == true,
            onClick = { onNavigate(TinyTab.MESSAGES) },
            modifier = Modifier.testTag("tab_messages"),
            icon = { Icon(Icons.Outlined.MailOutline, contentDescription = stringResource(R.string.nav_messages)) },
            label = { Text(stringResource(R.string.nav_messages)) },
        )
    }
}

@Composable
fun TinyScaffold(
    title: String,
    currentRoute: String?,
    onNavigate: (TinyTab) -> Unit,
    onSettings: () -> Unit,
    onHelp: () -> Unit,
    onBack: (() -> Unit)? = null,
    bottomBar: Boolean = true,
    content: @Composable (androidx.compose.foundation.layout.PaddingValues) -> Unit,
) {
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = { TinyTopBar(title = title, onSettings = onSettings, onHelp = onHelp, onBack = onBack) },
        bottomBar = {
            if (bottomBar) {
                TinyBottomBar(currentRoute = currentRoute, onNavigate = onNavigate)
            }
        },
    ) { padding -> content(padding) }
}

@Composable
fun TinyWordmark(modifier: Modifier = Modifier) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = modifier) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(TinyForest, CircleShape)
                .border(1.dp, TinyForest.copy(alpha = 0.6f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                painter = painterResource(R.drawable.ic_tiny_mark),
                contentDescription = stringResource(R.string.cd_app_logo),
                tint = TinyPaper,
                modifier = Modifier.size(24.dp),
            )
        }
        Spacer(Modifier.width(10.dp))
        Column {
            Text(stringResource(R.string.app_name), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
            Text(
                stringResource(R.string.app_tagline),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
fun PreviewChip(text: String? = null) {
    Surface(
        color = TinyButter,
        contentColor = TinyInk,
        shape = RoundedCornerShape(50),
        modifier = Modifier.border(1.dp, TinyInk.copy(alpha = 0.55f), RoundedCornerShape(50)),
    ) {
        Text(
            text = text ?: stringResource(R.string.preview_build),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
        )
    }
}

@Composable
fun PaperCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    val shape = MaterialTheme.shapes.large
    val base = modifier
        .fillMaxWidth()
        .shadow(2.dp, shape)
        .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.55f), shape)
    if (onClick == null) {
        Surface(color = MaterialTheme.colorScheme.surface, shape = shape, modifier = base) {
            Column(Modifier.padding(18.dp)) { content() }
        }
    } else {
        Surface(
            onClick = onClick,
            color = MaterialTheme.colorScheme.surface,
            shape = shape,
            modifier = base,
        ) {
            Column(Modifier.padding(18.dp)) { content() }
        }
    }
}

@Composable
fun SectionHeading(title: String, subtitle: String? = null, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.headlineSmall)
        if (subtitle != null) {
            Spacer(Modifier.height(4.dp))
            Text(
                subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
fun StatusPill(text: String, color: Color = TinyForest) {
    Surface(
        color = color.copy(alpha = 0.14f),
        contentColor = color,
        shape = RoundedCornerShape(50),
        modifier = Modifier.border(1.dp, color.copy(alpha = 0.35f), RoundedCornerShape(50)),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
        )
    }
}

@Composable
fun TinyPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(52.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = TinyForest,
            contentColor = TinyPaper,
            disabledContainerColor = TinyForest.copy(alpha = 0.35f),
        ),
    ) {
        Text(text, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
fun TinySecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(48.dp),
        shape = RoundedCornerShape(14.dp),
    ) {
        Text(text, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
fun InfoBanner(text: String, modifier: Modifier = Modifier, tone: Color = TinyCobalt) {
    Surface(
        color = tone.copy(alpha = 0.10f),
        shape = MaterialTheme.shapes.medium,
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, tone.copy(alpha = 0.25f), MaterialTheme.shapes.medium),
    ) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.Top) {
            Icon(Icons.Outlined.Info, contentDescription = null, tint = tone, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(8.dp))
            Text(text, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
        }
    }
}

@Composable
fun DoodleUnderline(modifier: Modifier = Modifier, color: Color = TinyTomato) {
    Canvas(modifier = modifier.height(10.dp).fillMaxWidth()) {
        val path = Path().apply {
            moveTo(0f, size.height * 0.55f)
            cubicTo(
                size.width * 0.20f, size.height * 0.05f,
                size.width * 0.38f, size.height * 0.95f,
                size.width * 0.55f, size.height * 0.45f,
            )
            cubicTo(
                size.width * 0.72f, size.height * 0.0f,
                size.width * 0.88f, size.height * 0.85f,
                size.width, size.height * 0.35f,
            )
        }
        drawPath(path, color = color, style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round))
    }
}

@Composable
fun DotAccent(modifier: Modifier = Modifier, color: Color = TinyButter) {
    Canvas(modifier = modifier.size(52.dp)) {
        drawCircle(color, radius = size.minDimension * 0.34f, center = Offset(size.width * 0.42f, size.height * 0.46f))
        drawCircle(TinyInk, radius = 2.dp.toPx(), center = Offset(size.width * 0.78f, size.height * 0.20f))
        drawCircle(TinyTomato, radius = 2.dp.toPx(), center = Offset(size.width * 0.18f, size.height * 0.78f))
    }
}

@Composable
fun CheckBullet(text: String, modifier: Modifier = Modifier) {
    Row(modifier = modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        Box(
            modifier = Modifier
                .padding(top = 2.dp)
                .size(22.dp)
                .background(TinyForest, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Outlined.Check, contentDescription = null, tint = TinyPaper, modifier = Modifier.size(14.dp))
        }
        Spacer(Modifier.width(10.dp))
        Text(text, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun TinyAvatar(name: String, modifier: Modifier = Modifier) {
    val initials = name.trim().split(Regex("\\s+")).take(2).mapNotNull { it.firstOrNull()?.uppercase() }.joinToString("")
    Box(
        modifier = modifier
            .size(42.dp)
            .background(TinyTomato.copy(alpha = 0.16f), CircleShape)
            .border(1.dp, TinyTomato.copy(alpha = 0.4f), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(initials.ifBlank { "T" }, style = MaterialTheme.typography.labelLarge, color = TinyTomato)
    }
}
