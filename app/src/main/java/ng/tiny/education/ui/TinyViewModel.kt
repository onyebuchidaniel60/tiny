package ng.tiny.education.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import ng.tiny.education.AppContainer
import ng.tiny.education.core.database.AttendanceSessionEntity
import ng.tiny.education.core.database.ClassroomEntity
import ng.tiny.education.core.database.ConversationEntity
import ng.tiny.education.core.database.LessonPlanEntity
import ng.tiny.education.core.database.ProgressEntryEntity
import ng.tiny.education.core.model.AttendanceStatus
import ng.tiny.education.core.model.ProgressIndicator
import ng.tiny.education.core.preferences.TinyPreferences

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

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    fun clearMessage() {
        _message.value = null
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

    fun signOut() = viewModelScope.launch {
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
    fun observeMessages(conversationId: String) = repository.observeMessages(conversationId)

    fun addPupil(classId: String, displayName: String, localPupilCode: String?) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        repository.addPupil(ws.id, classId, displayName, localPupilCode)
            .onSuccess { _message.value = "Pupil added locally and queued." }
            .onFailure { _message.value = it.message ?: "Could not add pupil." }
    }

    fun saveAttendanceDraft(classId: String, schoolDate: String, statuses: Map<String, AttendanceStatus>) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        repository.saveAttendanceDraft(ws.id, classId, schoolDate, statuses)
            .onSuccess { _message.value = "Draft saved on this phone." }
            .onFailure { _message.value = it.message ?: "Could not save draft." }
    }

    fun submitAttendance(classId: String, schoolDate: String, statuses: Map<String, AttendanceStatus>) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        repository.submitAttendance(ws.id, classId, schoolDate, statuses)
            .onSuccess { _message.value = "Attendance submitted locally and queued for mock sync." }
            .onFailure { _message.value = it.message ?: "Could not submit attendance." }
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
            .onSuccess { _message.value = "Progress draft saved locally." }
            .onFailure { _message.value = it.message ?: "Could not save progress." }
    }

    fun approveProgress(entryId: String) = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        repository.approveProgress(ws.id, entryId)
            .onSuccess { _message.value = "Progress approved for the next digest." }
            .onFailure { _message.value = it.message ?: "Could not approve progress." }
    }

    fun sendReply(conversationId: String, body: String) = viewModelScope.launch {
        repository.sendReply(conversationId, body)
            .onSuccess { _message.value = "Reply queued through the mock adapter." }
            .onFailure { _message.value = it.message ?: "Could not queue reply." }
    }

    fun markConversationRead(conversationId: String) = viewModelScope.launch {
        repository.markConversationRead(conversationId)
    }

    fun syncNow() = viewModelScope.launch {
        val ws = workspace.value ?: return@launch
        val result = repository.syncNow(ws.id)
        _message.value = result.message
    }

    fun showMessage(value: String) {
        _message.value = value
    }

    companion object {
        fun factory(container: AppContainer) = viewModelFactory {
            initializer { TinyViewModel(container) }
        }
    }
}
