package ng.tiny.education

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import ng.tiny.education.ui.TinyApp
import ng.tiny.education.ui.theme.TinyTheme

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        val container = (application as TinyApplication).container
        installSplashScreen().setKeepOnScreenCondition { !container.seedReady.isCompleted }
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        lifecycleScope.launch {
            container.seedReady.await()
            setContent {
                TinyTheme {
                    TinyApp(container = container)
                }
            }
        }
    }
}
