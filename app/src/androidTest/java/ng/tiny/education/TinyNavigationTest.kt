package ng.tiny.education

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class TinyNavigationTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun onboardingToAttendanceJourney() {
        composeRule.waitUntil(timeoutMillis = 30_000) {
            composeRule.onAllNodesWithText("Choose your language").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Continue").performScrollTo().performClick()

        composeRule.waitUntil(timeoutMillis = 15_000) {
            composeRule.onAllNodesWithText("Explore the preview").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Explore the preview").performScrollTo().performClick()

        composeRule.waitUntil(timeoutMillis = 30_000) {
            composeRule.onAllNodesWithText("Good morning, Ms. Bello").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Good morning, Ms. Bello").assertIsDisplayed()

        composeRule.onNodeWithTag("tab_classes").performClick()
        composeRule.waitUntil(timeoutMillis = 15_000) {
            composeRule.onAllNodesWithText("Your classes").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.waitUntil(timeoutMillis = 20_000) {
            composeRule.onAllNodesWithText("P4 Blue").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("P4 Blue").performScrollTo().performClick()
        composeRule.onNodeWithText("Roster").assertIsDisplayed()

        composeRule.waitUntil(timeoutMillis = 15_000) {
            composeRule.onAllNodesWithText("Mark attendance").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Mark attendance").performScrollTo().performClick()
        composeRule.waitUntil(timeoutMillis = 15_000) {
            composeRule.onAllNodesWithText("Mark the register").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Mark the register").assertIsDisplayed()
    }
}
