package ng.tiny.education

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import ng.tiny.education.ui.TinyApp
import ng.tiny.education.ui.theme.TinyTheme

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val container = (application as TinyApplication).container
        setContent {
            TinyTheme {
                TinyApp(container = container)
            }
        }
    }
}
