package ng.tiny.education.ui

import androidx.annotation.StringRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import ng.tiny.education.AppContainer
import ng.tiny.education.R
import ng.tiny.education.core.ai.AiInferenceMode
import ng.tiny.education.core.ai.AiTask
import ng.tiny.education.core.ai.DeviceAiStatus
import ng.tiny.education.core.database.AiAnalysisEntity
import ng.tiny.education.core.database.AssessmentEntity
import ng.tiny.education.core.database.AttendanceSessionEntity
import ng.tiny.education.core.database.ClassroomEntity
import ng.tiny.education.core.database.ConversationEntity
import ng.tiny.education.core.database.FollowUpEntity
import ng.tiny.education.core.database.LessonPlanEntity
import ng.tiny.education.core.database.ProgressEntryEntity
import ng.tiny.education.core.intelligence.IntelligenceEngine
import ng.tiny.education.core.intelligence.PupilIntelligence
import ng.tiny.education.core.model.AttendanceStatus
import ng.tiny.education.core.model.LessonStatus
import ng.tiny.education.core.model.ProgressIndicator
import ng.tiny.education.core.model.SyncState
import ng.tiny.education.core.preferences.TinyPreferences

data class AiUiState(
    val deviceStatus: DeviceAiStatus = DeviceAiStatus.UNAVAILABLE,
    val task: AiTask = AiTask.LESSON_PLAN,
    val busy: Boolean = false,
    val text: String? = null,
    val source: String? = null,
    val error: Boolean = false,
)

data class EvidenceUiState(
    val busy: Boolean = false,
    val result: AiAnalysisEntity? = null,
    val error: Boolean = false,
)

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class TinyViewModel(private val container: AppContainer) : ViewModel() {
    private val repository = container.repository
    private val preferencesRepository = container.preferences

    val preferences: StateFlow<TinyPreferences> = preferencesRepository.preferences
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), TinyPreferences())

    val workspace = repository.observeWorkspace()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    val classes: StateFlow<List<ClassroomEntity>> = workspace
        .flatMapLatest { ws -> if (ws == null) flowOf(emptyList()) else repository.observeClasses(ws.id) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val pupilCount = workspace
        .flatMapLatest { ws -> if (ws == null) flowOf(0) else repository.observePupilCount(ws.id) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), 0)

    val lessons: StateFlow<List<LessonPlanEntity>> = workspace
        .flatMapLatest { ws -> if (ws == null) flowOf(emptyList()) else repository.observeLessonPlans(ws.id) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val conversations: StateFlow<List<ConversationEntity>> = workspace
        .flatMapLatest { ws -> if (ws == null) flowOf(emptyList()) else repository.observeConversations(ws.id) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val pendingOutboxCount = workspace
        .flatMapLatest { ws -> if (ws == null) flowOf(0) else repository.observePendingOutboxCount(ws.id) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), 0)

    val outbox = workspace
        .flatMapLatest { ws -> if (ws == null) flowOf(emptyList()) else repository.observeOutbox(ws.id) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val unreadMessageCount = conversations
        .map { list -> list.sumOf { it.unreadCount } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), 0)

    val followUps = workspace
        .flatMapLatest { ws -> if (ws == null) flowOf(emptyList()) else repository.observeFollowUps(ws.id) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val pupilDirectory: StateFlow<List<PupilIntelligence>> = workspace
        .flatMapLatest { ws ->
            if (ws == null) {
                flowOf(emptyList())
            } else {
                combine(
                    repository.observeAllPupils(ws.id),
                    repository.observeAttendanceEvidenceForWorkspace(ws.id),
                    repository.observeAssessments(ws.id),
                    repository.observeWorkspaceProgress(ws.id),
                ) { pupils, attendance, assessments, progress ->
                    pupils.map { pupil -> IntelligenceEngine.pupil(pupil, attendance, assessments, progress) }
                }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val aiAnalyses = workspace
        .flatMapLatest { ws -> if (ws == null) flowOf(emptyList()) else repository.observeAiAnalyses(ws.id) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _evidenceState = MutableStateFlow(EvidenceUiState())
    val evidenceState: StateFlow<EvidenceUiState> = _evidenceState.asStateFlow()

    private val _message = MutableStateFlow<UiMessage?>(null)
    val message: StateFlow<UiMessage?> = _message.asStateFlow()

    val authUser = container.authRepository.user
    val backendSyncEnabled: Boolean
        get() = container.firebaseConfigured && container.authRepository.isSignedIn

    private val _aiState = MutableStateFlow(AiUiState())
    val aiState: StateFlow<AiUiState> = _aiState.asStateFlow()

    private val _guardianCode = MutableStateFlow<String?>(null)
    val guardianCode: StateFlow<String?> = _guardianCode.asStateFlow()
    private val localGuardianChallenges = mutableMapOf<String, String>()

    fun clearMessage() {
        _message.value = null
    }

    fun showMessage(@StringRes resId: Int, vararg args: Any) {
        _message.value = UiMessage(resId, args.toList())
    }

    fun setLanguage(language: String) = viewModelScope.launch {
        preferencesRepository.setLanguage(language)
    }

    fun completeOnboarding() = viewModelScope.launch {
        preferencesRepository.setOnboarded(true)
        workspace.value?.id?.let { preferencesRepository.setActiveWorkspace(it) }
    }

    fun setWifiOnly(enabled: Boolean) = viewModelScope.launch {
        preferencesRepository.setWifiOnly(enabled)
    }

    fun setTeacherTourCompleted(completed: Boolean) = viewModelScope.launch {
        preferencesRepository.setTeacherTourCompleted(completed)
    }

    fun setGuardianTourCompleted(completed: Boolean) = viewModelScope.launch {
        preferencesRepository.setGuardianTourCompleted(completed)
    }

    fun signOut() = viewModelScope.launch {
        container.authRepository.signOut()
        preferencesRepository.clearPreviewSession()
    }

    fun observeAttendance(classId: String, schoolDate: String) = repository.observeAttendanceSession(classId, schoolDate)
    fun observeAttendanceEntries(sessionId: String) = repository.observeAttendanceEntries(sessionId)
    fun observeClass(classId: String) = repository.observeClass(classId)
    fun observeClassPupilCount(classId: String) = repository.observeClassPupilCount(classId)
    fun observePupils(classId: String) = repository.observePupils(classId)
    fun observePupil(pupilId: String) = repository.observePupil(pupilId)
    fun observeLesson(lessonId: String) = repository.observeLessonPlan(lessonId)
    fun observeProgress(pupilId: String) = repository.observeProgress(pupilId)
    fun observeConversation(conversationId: String) = repository.observeConversation(conversationId)
    fun observeGuardian(guardianId: String) = repository.observeGuardian(guardianId)
    fun observeGuardianLinks(pupilId: String) = repository.observeGuardianLinks(pupilId)
    fun observeMessages(conversationId: String) = repository.observeMessages(conversationId)
    fun observePupilAssessments(pupilId: String) = repository.observePupilAssessments(pupilId)
    fun observeClassAssessments(classId: String) = repository.observeClassAssessments(classId)
    fun observeAttendanceEvidence(classId: String) = repository.observeAttendanceEvidence(classId)
    fun observeClassProgress(classId: String) = repository.observeClassProgress(classId)
    fun observePupilFollowUps(pupilId: String) = repository.observePupilFollowUps(pupilId)

    fun saveAssessment(
        pupilId: String,
        classId: String,
        subjectId: String,
        objectiveId: String,
        objectiveLabel: String,
        score: Double,
        maxScore: Double,
        schoolDate: String,
        teacherNote: String,
    ) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        repository.saveAssessment(
            AssessmentEntity(
                id = "assessment_${java.util.UUID.randomUUID()}",
                workspaceId = ws.id,
                classId = classId,
                pupilId = pupilId,
                subjectId = subjectId,
                objectiveId = objectiveId,
                objectiveLabel = objectiveLabel,
                score = score,
                maxScore = maxScore,
                schoolDate = schoolDate,
                teacherNote = teacherNote,
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis(),
            ),
        ).onSuccess { _message.value = UiMessage(R.string.assessment_saved) }
            .onFailure { _message.value = UiMessage(R.string.error_generic) }
    }

    fun addFollowUp(
        pupilId: String?,
        classId: String,
        title: String,
        detail: String,
        dueDate: String,
        source: String,
    ) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        repository.saveFollowUp(
            FollowUpEntity(
                id = "followup_${java.util.UUID.randomUUID()}",
                workspaceId = ws.id,
                classId = classId,
                pupilId = pupilId,
                title = title,
                detail = detail,
                dueDate = dueDate,
                status = "open",
                source = source,
                sourceId = null,
                createdAt = System.currentTimeMillis(),
                completedAt = null,
            ),
        ).onSuccess { _message.value = UiMessage(R.string.followup_saved) }
            .onFailure { _message.value = UiMessage(R.string.error_generic) }
    }

    fun updateFollowUpStatus(followUpId: String, status: String) = viewModelScope.launch {
        repository.updateFollowUpStatus(followUpId, status)
            .onSuccess { _message.value = UiMessage(if (status == "done") R.string.followup_done else R.string.followup_updated) }
            .onFailure { _message.value = UiMessage(R.string.error_generic) }
    }

    fun generateEvidenceAnalysis(
        scope: String,
        task: String,
        pupilId: String?,
        classId: String?,
        evidenceFingerprint: String,
        evidenceIds: List<String>,
        evidenceSummary: String,
        prompt: String,
        fallback: String,
        mode: AiInferenceMode = AiInferenceMode.PREFER_ON_DEVICE,
    ) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        if (_evidenceState.value.busy) return@launch
        _evidenceState.value = EvidenceUiState(busy = true)
        val generated = container.aiService.generateEvidence(prompt, mode)
        val generation = generated.getOrNull()
        val entity = AiAnalysisEntity(
            id = "analysis_${java.util.UUID.randomUUID()}",
            workspaceId = ws.id,
            scope = scope,
            task = task,
            pupilId = pupilId,
            classId = classId,
            evidenceFingerprint = evidenceFingerprint,
            evidenceIdsJson = evidenceIds.joinToString(prefix = "[\"", separator = "\",\"", postfix = "\"]"),
            evidenceSummary = evidenceSummary,
            output = generation?.text ?: fallback,
            requestedMode = generation?.requestedMode?.label ?: mode.label,
            source = generation?.source ?: "Curated offline library",
            durationMs = generation?.durationMs ?: 0,
            fallback = generation == null,
            status = "draft",
            createdAt = System.currentTimeMillis(),
        )
        repository.saveAiAnalysis(entity)
        _evidenceState.value = EvidenceUiState(busy = false, result = entity, error = generation == null)
    }

    fun clearEvidenceResult() {
        _evidenceState.value = EvidenceUiState()
    }

    fun resetDemoData() = viewModelScope.launch {
        repository.resetDemoData()
        _message.value = UiMessage(R.string.reset_local_done)
    }

    fun createEvidenceLesson(
        classId: String,
        plan: List<Pair<String, String>>,
        onCreated: (String) -> Unit,
    ) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        val classroom = classes.value.find { it.id == classId } ?: return@launch
        val lessonId = "lesson_${java.util.UUID.randomUUID()}"
        val find = { key: String -> plan.firstOrNull { it.first == key }?.second.orEmpty() }
        val lesson = LessonPlanEntity(
            id = lessonId,
            workspaceId = ws.id,
            classId = classId,
            gradeLevel = classroom.gradeLevel,
            subjectId = "basic_science",
            topic = find("Objective").take(70).ifBlank { "Evidence-informed lesson" },
            objective = find("Objective"),
            durationMinutes = 40,
            materials = "Locally available objects, chalkboard, pupil exercise books",
            priorKnowledge = find("Prior knowledge"),
            engage = find("Engage"),
            explore = find("Explore"),
            explain = find("Explain"),
            elaborate = find("Elaborate"),
            evaluate = find("Evaluate"),
            status = LessonStatus.DRAFT,
            syncState = SyncState.LOCAL_ONLY,
            updatedAt = System.currentTimeMillis(),
        )
        repository.saveLesson(lesson)
            .onSuccess {
                _message.value = UiMessage(R.string.lesson_saved)
                onCreated(lessonId)
            }
            .onFailure { _message.value = UiMessage(R.string.error_generic) }
    }

    fun addPupil(classId: String, displayName: String, localPupilCode: String?) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        repository.addPupil(ws.id, classId, displayName, localPupilCode)
            .onSuccess { _message.value = UiMessage(R.string.pupil_saved_local) }
            .onFailure { _message.value = UiMessage(R.string.error_generic) }
    }

    fun saveAttendanceDraft(classId: String, schoolDate: String, statuses: Map<String, AttendanceStatus>) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        repository.saveAttendanceDraft(ws.id, classId, schoolDate, statuses)
            .onSuccess { _message.value = UiMessage(R.string.attendance_saved) }
            .onFailure { _message.value = UiMessage(R.string.error_generic) }
    }

    fun submitAttendance(classId: String, schoolDate: String, statuses: Map<String, AttendanceStatus>) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        repository.submitAttendance(ws.id, classId, schoolDate, statuses)
            .onSuccess { _message.value = UiMessage(R.string.attendance_submitted) }
            .onFailure { _message.value = UiMessage(R.string.error_generic) }
    }

    fun saveProgress(
        pupilId: String,
        classId: String,
        subjectId: String,
        indicator: ProgressIndicator,
        note: String?,
        homeActivity: String?,
        existingEntryId: String?,
    ) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        repository.saveProgress(ws.id, pupilId, classId, subjectId, indicator, note, homeActivity, existingEntryId)
            .onSuccess { _message.value = UiMessage(R.string.progress_saved) }
            .onFailure { _message.value = UiMessage(R.string.error_generic) }
    }

    fun approveProgress(entryId: String) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        repository.approveProgress(ws.id, entryId)
            .onSuccess { _message.value = UiMessage(R.string.progress_approved) }
            .onFailure { _message.value = UiMessage(R.string.error_generic) }
    }

    fun sendReply(conversationId: String, body: String) = viewModelScope.launch {
        repository.sendReply(conversationId, body)
            .onSuccess { _message.value = UiMessage(R.string.reply_queued) }
            .onFailure { _message.value = UiMessage(R.string.error_generic) }
    }

    fun markConversationRead(conversationId: String) = viewModelScope.launch {
        repository.markConversationRead(conversationId)
    }

    fun syncNow() = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        val result = repository.syncNow(ws.id)
        _message.value = if (result.usedBackend) {
            UiMessage(if (result.retryable) R.string.sync_failed else R.string.sync_complete)
        } else {
            UiMessage(R.string.sync_unavailable)
        }
    }

    fun createWorkspace(name: String, type: ng.tiny.education.core.model.WorkspaceType) = viewModelScope.launch {
        if (name.isBlank()) {
            _message.value = UiMessage(R.string.required_field)
            return@launch
        }
        if (backendSyncEnabled && container.accountService.configured) {
            container.accountService.createWorkspace(name.trim(), type.name.lowercase())
                .onSuccess { remote ->
                    repository.saveRemoteWorkspace(remote.workspaceId, name.trim(), type, remote.schoolCode)
                    _message.value = UiMessage(R.string.workspace_created, listOf(remote.schoolCode))
                }
                .onFailure { _message.value = UiMessage(R.string.error_generic) }
        } else {
            repository.createLocalWorkspace(name, type)
                .onSuccess { _message.value = UiMessage(R.string.local_workspace_created) }
                .onFailure { _message.value = UiMessage(R.string.error_generic) }
        }
    }

    fun createClass(gradeLevel: String, label: String, academicYear: String) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        val classId = "class_${java.util.UUID.randomUUID()}"
        val subjectSummary = "Basic Science · Mathematics · English"
        if (backendSyncEnabled && container.accountService.configured) {
            container.accountService.createClass(ws.id, classId, gradeLevel, label, academicYear)
                .onSuccess { remoteId ->
                    repository.saveRemoteClass(
                        workspaceId = ws.id,
                        classId = remoteId,
                        gradeLevel = gradeLevel,
                        label = label,
                        academicYear = academicYear,
                        subjectSummary = subjectSummary,
                        teacherName = preferences.value.teacherName,
                    )
                    _message.value = UiMessage(R.string.class_created_backend)
                }
                .onFailure { _message.value = UiMessage(R.string.error_generic) }
        } else {
            repository.createLocalClass(ws.id, gradeLevel, label, academicYear, subjectSummary, preferences.value.teacherName)
                .onSuccess { _message.value = UiMessage(R.string.class_created_local) }
                .onFailure { _message.value = UiMessage(R.string.error_generic) }
        }
    }

    fun addGuardian(
        pupilId: String,
        displayName: String,
        phone: String,
        locale: String,
        relationship: String,
    ) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        if (displayName.isBlank() || phone.isBlank()) {
            _message.value = UiMessage(R.string.required_field)
            return@launch
        }
        if (backendSyncEnabled && container.accountService.configured) {
            val proposedId = "guardian_${java.util.UUID.randomUUID()}"
            container.accountService.upsertGuardian(ws.id, proposedId, displayName.trim(), phone.trim(), locale)
                .onSuccess { guardianId ->
                    container.accountService.linkGuardian(ws.id, pupilId, guardianId, relationship)
                        .onSuccess {
                            repository.saveRemoteGuardianAndLink(
                                ws.id, pupilId, guardianId, displayName, phone, locale, relationship,
                            )
                            _message.value = UiMessage(R.string.guardian_linked_backend)
                        }
                        .onFailure { _message.value = UiMessage(R.string.error_generic) }
                }
                .onFailure { _message.value = UiMessage(R.string.error_generic) }
        } else {
            repository.addLocalGuardianAndLink(ws.id, pupilId, displayName, phone, locale, relationship)
                .onSuccess { _message.value = UiMessage(R.string.guardian_saved) }
                .onFailure { _message.value = UiMessage(R.string.error_generic) }
        }
    }

    fun requestGuardianVerification(guardianId: String) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        if (backendSyncEnabled && container.accountService.configured) {
            container.accountService.requestGuardianVerification(ws.id, guardianId)
                .onSuccess {
                    _guardianCode.value = it
                    _message.value = UiMessage(R.string.verification_code_issued)
                }
                .onFailure { _message.value = UiMessage(R.string.error_generic) }
        } else {
            val code = (100000..999999).random().toString()
            localGuardianChallenges[guardianId] = code
            _guardianCode.value = code
            _message.value = UiMessage(R.string.preview_verification_code, listOf(code))
        }
    }

    fun verifyGuardian(guardianId: String, code: String) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        if (backendSyncEnabled && container.accountService.configured) {
            container.accountService.verifyGuardian(ws.id, guardianId, code)
                .onSuccess {
                    repository.markGuardianVerified(guardianId)
                    _guardianCode.value = null
                    _message.value = UiMessage(R.string.guardian_verified)
                }
                .onFailure { _message.value = UiMessage(R.string.verification_code_mismatch) }
        } else {
            val expected = localGuardianChallenges[guardianId]
            if (expected != null && expected == code.trim()) {
                repository.markGuardianVerified(guardianId)
                localGuardianChallenges.remove(guardianId)
                _guardianCode.value = null
                _message.value = UiMessage(R.string.guardian_verified)
            } else {
                _message.value = UiMessage(R.string.verification_code_mismatch)
            }
        }
    }

    fun clearGuardianCode() {
        _guardianCode.value = null
    }

    fun refreshAiStatus() = viewModelScope.launch {
        if (!container.aiService.configured) {
            _aiState.value = _aiState.value.copy(deviceStatus = DeviceAiStatus.NOT_CONFIGURED)
            return@launch
        }
        _aiState.value = _aiState.value.copy(deviceStatus = container.aiService.onDeviceStatus())
    }

    fun setAiTask(task: AiTask) {
        _aiState.value = _aiState.value.copy(task = task, text = null, source = null, error = false)
    }

    fun requestAiSuggestion() = viewModelScope.launch {
        if (_aiState.value.busy) return@launch
        _aiState.value = _aiState.value.copy(busy = true, error = false)
        container.aiService.generateTeachingStrategy(_aiState.value.task)
            .onSuccess { generation ->
                _aiState.value = _aiState.value.copy(
                    busy = false,
                    text = generation.text,
                    source = generation.source,
                )
            }
            .onFailure {
                _aiState.value = _aiState.value.copy(busy = false, error = true)
            }
    }

    fun bootstrapRemoteWorkspace() = viewModelScope.launch {
        if (!container.firebaseConfigured) return@launch
        val uid = container.authRepository.user.value?.uid ?: return@launch
        runCatching {
            val ids = container.bootstrapSource.workspaceIds(uid)
            val first = ids.firstOrNull() ?: return@runCatching
            val bootstrap = container.bootstrapSource.loadWorkspace(first) ?: return@runCatching
            repository.applyRemoteBootstrap(bootstrap)
            container.syncScheduler.requestSync()
        }.onFailure {
            _message.value = UiMessage(R.string.storage_bootstrap_failed)
        }
    }

    companion object {
        fun factory(container: AppContainer) = viewModelFactory {
            initializer { TinyViewModel(container) }
        }
    }
}
