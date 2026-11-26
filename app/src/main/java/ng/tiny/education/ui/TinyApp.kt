package ng.tiny.education.ui

import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import ng.tiny.education.AppContainer
import ng.tiny.education.R
import ng.tiny.education.ui.components.TinyBottomBar
import ng.tiny.education.ui.components.TinyTab
import ng.tiny.education.ui.components.TinyTopBar
import ng.tiny.education.ui.screens.AttendanceScreen
import ng.tiny.education.ui.screens.AiAssistantScreen
import ng.tiny.education.ui.screens.ClassDetailScreen
import ng.tiny.education.ui.screens.ClassesScreen
import ng.tiny.education.ui.screens.ConversationScreen
import ng.tiny.education.ui.screens.HomeScreen
import ng.tiny.education.ui.screens.LanguageScreen
import ng.tiny.education.ui.screens.LessonDetailScreen
import ng.tiny.education.ui.screens.LessonsScreen
import ng.tiny.education.ui.screens.MessagesScreen
import ng.tiny.education.ui.screens.ProgressScreen
import ng.tiny.education.ui.screens.SettingsScreen
import ng.tiny.education.ui.screens.SyncScreen
import ng.tiny.education.ui.screens.WelcomeScreen

private const val ROUTE_HOME = "home"
private const val ROUTE_CLASSES = "classes"
private const val ROUTE_CLASS_DETAIL = "class/{classId}"
private const val ROUTE_ATTENDANCE = "attendance/{classId}"
private const val ROUTE_LESSONS = "lessons"
private const val ROUTE_LESSON_DETAIL = "lesson/{lessonId}"
private const val ROUTE_AI = "ai"
private const val ROUTE_MESSAGES = "messages"
private const val ROUTE_CONVERSATION = "conversation/{conversationId}"
private const val ROUTE_PROGRESS = "progress/{pupilId}"
private const val ROUTE_SETTINGS = "settings"
private const val ROUTE_SYNC = "sync"

@Composable
fun TinyApp(container: AppContainer) {
    val viewModel: TinyViewModel = viewModel(factory = TinyViewModel.factory(container))
    val preferences by viewModel.preferences.collectAsStateWithLifecycle()
    var onboardingStage by rememberSaveable { mutableIntStateOf(if (preferences.onboarded) 2 else 0) }

    LaunchedEffect(preferences.language) {
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(preferences.language))
    }
    LaunchedEffect(preferences.onboarded) {
        if (preferences.onboarded) onboardingStage = 2
    }

    if (preferences.onboarded) {
        MainShell(viewModel = viewModel)
    } else {
        when (onboardingStage) {
            0 -> LanguageScreen(
                selectedLanguage = preferences.language,
                onLanguageSelected = viewModel::setLanguage,
                onContinue = { onboardingStage = 1 },
            )
            else -> WelcomeScreen(
                onExplore = {
                    viewModel.completeOnboarding()
                    onboardingStage = 2
                },
            )
        }
    }
}

@Composable
private fun MainShell(viewModel: TinyViewModel) {
    val navController = rememberNavController()
    val snackbarHostState = remember { SnackbarHostState() }
    val message by viewModel.message.collectAsStateWithLifecycle()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val route = backStackEntry?.destination?.route
    val isMainRoute = route == ROUTE_HOME || route == ROUTE_CLASSES || route == ROUTE_LESSONS || route == ROUTE_MESSAGES

    LaunchedEffect(message) {
        message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    Scaffold(
        containerColor = androidx.compose.material3.MaterialTheme.colorScheme.background,
        topBar = {
            TinyTopBar(
                title = titleForRoute(route),
                onSettings = { navController.navigate(ROUTE_SETTINGS) },
                onBack = if (isMainRoute) null else ({ navController.popBackStack() }),
            )
        },
        bottomBar = {
            if (isMainRoute) {
                TinyBottomBar(currentRoute = route) { tab ->
                    navController.navigate(tab.route) {
                        popUpTo(ROUTE_HOME) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = ROUTE_HOME,
            modifier = Modifier.padding(padding),
        ) {
            composable(ROUTE_HOME) {
                HomeScreen(
                    viewModel = viewModel,
                    onOpenClasses = { navController.navigate(ROUTE_CLASSES) },
                    onOpenAttendance = { navController.navigate("attendance/$it") },
                    onOpenMessages = { navController.navigate(ROUTE_MESSAGES) },
                    onOpenLesson = { navController.navigate(ROUTE_LESSONS) },
                    onOpenSync = { navController.navigate(ROUTE_SYNC) },
                )
            }
            composable(ROUTE_CLASSES) {
                ClassesScreen(
                    viewModel = viewModel,
                    onOpenClass = { navController.navigate("class/$it") },
                    onOpenAttendance = { navController.navigate("attendance/$it") },
                )
            }
            composable(
                route = ROUTE_CLASS_DETAIL,
                arguments = listOf(navArgument("classId") { type = NavType.StringType }),
            ) { entry ->
                val classId = entry.arguments?.getString("classId").orEmpty()
                ClassDetailScreen(
                    classId = classId,
                    viewModel = viewModel,
                    onBack = { navController.popBackStack() },
                    onAttendance = { navController.navigate("attendance/$classId") },
                    onProgress = { navController.navigate("progress/$it") },
                )
            }
            composable(
                route = ROUTE_ATTENDANCE,
                arguments = listOf(navArgument("classId") { type = NavType.StringType }),
            ) { entry ->
                AttendanceScreen(
                    classId = entry.arguments?.getString("classId").orEmpty(),
                    viewModel = viewModel,
                    onBack = { navController.popBackStack() },
                )
            }
            composable(ROUTE_LESSONS) {
                LessonsScreen(
                    viewModel = viewModel,
                    onOpenLesson = { navController.navigate("lesson/$it") },
                    onOpenAi = { navController.navigate(ROUTE_AI) },
                )
            }
            composable(
                route = ROUTE_LESSON_DETAIL,
                arguments = listOf(navArgument("lessonId") { type = NavType.StringType }),
            ) { entry ->
                LessonDetailScreen(
                    lessonId = entry.arguments?.getString("lessonId").orEmpty(),
                    viewModel = viewModel,
                    onBack = { navController.popBackStack() },
                )
            }
            composable(ROUTE_AI) {
                AiAssistantScreen(onBack = { navController.popBackStack() })
            }
            composable(ROUTE_MESSAGES) {
                MessagesScreen(viewModel = viewModel, onOpenConversation = { navController.navigate("conversation/$it") })
            }
            composable(
                route = ROUTE_CONVERSATION,
                arguments = listOf(navArgument("conversationId") { type = NavType.StringType }),
            ) { entry ->
                ConversationScreen(
                    conversationId = entry.arguments?.getString("conversationId").orEmpty(),
                    viewModel = viewModel,
                    onBack = { navController.popBackStack() },
                )
            }
            composable(
                route = ROUTE_PROGRESS,
                arguments = listOf(navArgument("pupilId") { type = NavType.StringType }),
            ) { entry ->
                ProgressScreen(
                    pupilId = entry.arguments?.getString("pupilId").orEmpty(),
                    viewModel = viewModel,
                    onBack = { navController.popBackStack() },
                )
            }
            composable(ROUTE_SETTINGS) {
                SettingsScreen(viewModel = viewModel, onOpenSync = { navController.navigate(ROUTE_SYNC) })
            }
            composable(ROUTE_SYNC) {
                SyncScreen(viewModel = viewModel, onBack = { navController.popBackStack() })
            }
        }
    }
}

@Composable
private fun titleForRoute(route: String?): String = when (route) {
    ROUTE_HOME -> stringResource(R.string.nav_home)
    ROUTE_CLASSES -> stringResource(R.string.nav_classes)
    ROUTE_CLASS_DETAIL -> stringResource(R.string.class_detail_title)
    ROUTE_ATTENDANCE -> stringResource(R.string.attendance_title)
    ROUTE_LESSONS -> stringResource(R.string.nav_lessons)
    ROUTE_LESSON_DETAIL -> stringResource(R.string.lesson_plan)
    ROUTE_AI -> stringResource(R.string.ai_title)
    ROUTE_MESSAGES -> stringResource(R.string.nav_messages)
    ROUTE_CONVERSATION -> stringResource(R.string.conversation_title)
    ROUTE_PROGRESS -> stringResource(R.string.progress_title)
    ROUTE_SETTINGS -> stringResource(R.string.settings_title)
    ROUTE_SYNC -> stringResource(R.string.sync_center_title)
    else -> stringResource(R.string.app_name)
}
