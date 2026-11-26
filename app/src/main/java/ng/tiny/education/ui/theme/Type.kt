package ng.tiny.education.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val display = FontFamily.Serif
private val body = FontFamily.SansSerif

val TinyTypography = Typography(
    displayLarge = TextStyle(fontFamily = display, fontWeight = FontWeight.Bold, fontSize = 48.sp, lineHeight = 52.sp),
    displayMedium = TextStyle(fontFamily = display, fontWeight = FontWeight.Bold, fontSize = 38.sp, lineHeight = 42.sp),
    displaySmall = TextStyle(fontFamily = display, fontWeight = FontWeight.Bold, fontSize = 30.sp, lineHeight = 34.sp),
    headlineLarge = TextStyle(fontFamily = display, fontWeight = FontWeight.Bold, fontSize = 30.sp, lineHeight = 34.sp),
    headlineMedium = TextStyle(fontFamily = display, fontWeight = FontWeight.Bold, fontSize = 26.sp, lineHeight = 30.sp),
    headlineSmall = TextStyle(fontFamily = display, fontWeight = FontWeight.Bold, fontSize = 22.sp, lineHeight = 27.sp),
    titleLarge = TextStyle(fontFamily = body, fontWeight = FontWeight.SemiBold, fontSize = 20.sp, lineHeight = 26.sp),
    titleMedium = TextStyle(fontFamily = body, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 22.sp),
    titleSmall = TextStyle(fontFamily = body, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 19.sp),
    bodyLarge = TextStyle(fontFamily = body, fontWeight = FontWeight.Normal, fontSize = 17.sp, lineHeight = 25.sp),
    bodyMedium = TextStyle(fontFamily = body, fontWeight = FontWeight.Normal, fontSize = 15.sp, lineHeight = 22.sp),
    bodySmall = TextStyle(fontFamily = body, fontWeight = FontWeight.Normal, fontSize = 13.sp, lineHeight = 18.sp),
    labelLarge = TextStyle(fontFamily = body, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, lineHeight = 20.sp),
    labelMedium = TextStyle(fontFamily = body, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, lineHeight = 17.sp),
    labelSmall = TextStyle(fontFamily = body, fontWeight = FontWeight.Medium, fontSize = 11.sp, lineHeight = 15.sp),
)
