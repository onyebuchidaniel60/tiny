package ng.tiny.education.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp

private val LightColors = lightColorScheme(
    primary = TinyForest,
    onPrimary = TinyWhite,
    primaryContainer = TinyForestSoft,
    onPrimaryContainer = TinyInk,
    secondary = TinyTomato,
    onSecondary = TinyWhite,
    secondaryContainer = TinyTomatoSoft,
    onSecondaryContainer = TinyInk,
    tertiary = TinyCobalt,
    onTertiary = TinyWhite,
    tertiaryContainer = TinyCobaltSoft,
    onTertiaryContainer = TinyInk,
    background = TinyPaper,
    onBackground = TinyInk,
    surface = TinySurface,
    onSurface = TinyInk,
    surfaceVariant = TinySurfaceAlt,
    onSurfaceVariant = TinyInkSoft,
    outline = TinyLine,
    error = TinyDanger,
)

private val DarkColors = darkColorScheme(
    primary = TinyButter,
    onPrimary = TinyInk,
    primaryContainer = TinyForest,
    onPrimaryContainer = TinyWhite,
    secondary = TinyTomato,
    onSecondary = TinyWhite,
    secondaryContainer = TinyTomatoSoft,
    onSecondaryContainer = TinyInk,
    tertiary = TinyButter,
    onTertiary = TinyInk,
    tertiaryContainer = TinyCobalt,
    onTertiaryContainer = TinyWhite,
    background = TinyDarkBackground,
    onBackground = TinyPaper,
    surface = TinyDarkSurface,
    onSurface = TinyPaper,
    surfaceVariant = TinyDarkSurfaceAlt,
    onSurfaceVariant = TinyButterSoft,
    outline = TinyLine,
    error = TinyTomato,
)

private val TinyShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(18.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(32.dp),
)

@Composable
fun TinyTheme(
    // Tiny is intentionally light-first for low-end classroom devices. The
    // dark palette remains available behind this switch for a future explicit
    // accessibility setting, but is not the default product appearance.
    darkTheme: Boolean = false,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = TinyTypography,
        shapes = TinyShapes,
        content = content,
    )
}
