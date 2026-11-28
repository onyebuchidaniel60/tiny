export type Role = 'school_admin' | 'teacher';

export type SyncStateValue = 'synced' | 'pending' | 'failed' | 'conflict' | 'needs_attention';

export type OutboxState = 'pending' | 'syncing' | 'synced' | 'retryable' | 'failed' | 'conflict';

export interface Workspace {
  id: string;
  name: string;
  type: 'school' | 'independent';
  schoolCode: string;
  verificationStatus: string;
  version: number;
}

export interface Classroom {
  id: string;
  workspaceId: string;
  gradeLevel: string;
  sectionLabel: string;
  academicYear: string;
  subjectIds: string[];
  teacherName: string;
  assignedTeacherUids: string[];
  version: number;
}

export interface Pupil {
  id: string;
  workspaceId: string;
  classId: string;
  displayName: string;
  localPupilCode: string;
  enrollmentStatus: 'active' | 'inactive';
  version: number;
}

export interface Guardian {
  id: string;
  workspaceId: string;
  displayName: string;
  phoneE164: string;
  preferredLocale: 'en' | 'ha' | 'yo' | 'ig' | 'pcm';
  verificationStatus: 'pending' | 'verified';
  consentStatus: 'pending' | 'opted_in' | 'opted_out';
  classIds: string[];
  pupilIds: string[];
}

export interface PupilGuardianLink {
  id: string;
  workspaceId: string;
  pupilId: string;
  guardianId: string;
  relationshipLabel: string;
  classId: string;
  notificationEligible: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceEntry {
  pupilId: string;
  status: AttendanceStatus;
}

export interface AttendanceSession {
  id: string;
  workspaceId: string;
  classId: string;
  schoolDate: string;
  status: 'draft' | 'submitted';
  entries: AttendanceEntry[];
  updatedAt: string;
  version: number;
}

export interface LessonPlan {
  id: string;
  workspaceId: string;
  classId: string;
  title: string;
  gradeLevel: string;
  subjectId: string;
  objective: string;
  engage: string;
  explore: string;
  explain: string;
  elaborate: string;
  evaluate: string;
  materials: string;
  status: 'draft' | 'ready';
  updatedAt: string;
  version: number;
}

export interface Assessment {
  id: string;
  workspaceId: string;
  classId: string;
  pupilId: string;
  subjectId: string;
  objectiveId: string;
  objectiveLabel: string;
  score: number;
  maxScore: number;
  schoolDate: string;
  teacherNote: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
}

export type FollowUpStatus = 'open' | 'done' | 'dismissed';
export type FollowUpSource = 'attendance' | 'assessment' | 'observation' | 'message' | 'manual' | 'ai';

export interface FollowUp {
  id: string;
  workspaceId: string;
  classId: string;
  pupilId?: string;
  title: string;
  detail: string;
  dueDate: string;
  status: FollowUpStatus;
  source: FollowUpSource;
  sourceId?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
  version?: number;
}

export type AiAnalysisScope = 'pupil' | 'class' | 'lesson' | 'parent_draft' | 'weekly';
export type AiAnalysisStatus = 'draft' | 'approved' | 'dismissed';

export interface AiAnalysis {
  id: string;
  workspaceId: string;
  scope: AiAnalysisScope;
  task: string;
  pupilId?: string;
  classId?: string;
  evidenceFingerprint: string;
  evidenceIds: string[];
  evidenceSummary: string;
  output: string;
  requestedMode: string;
  source: string;
  durationMs: number;
  fallback: boolean;
  status: AiAnalysisStatus;
  createdAt: string;
}

export type ProgressIndicator = 'doing_well' | 'developing' | 'needs_support' | 'not_assessed';

export interface ProgressEntry {
  id: string;
  workspaceId: string;
  pupilId: string;
  classId: string;
  periodStart: string;
  periodEnd: string;
  subjectId: string;
  objectiveId?: string;
  indicator: ProgressIndicator;
  teacherNote: string;
  homeActivity: string;
  approvalStatus: 'draft' | 'approved';
  revision: number;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  guardianId: string;
  pupilId: string;
  classId: string;
  status: 'waiting_teacher' | 'waiting_parent';
  lastMessageAt: string;
  unread: number;
}

export interface Message {
  id: string;
  conversationId: string;
  workspaceId: string;
  direction: 'inbound' | 'outbound';
  body: string;
  status: 'received' | 'queued' | 'mock_sent' | 'failed';
  provider: 'mock' | 'esms';
  createdAt: string;
}

export interface OutboxCommand {
  id: string;
  workspaceId: string;
  commandType: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  state: OutboxState;
  attempts: number;
  nextAttemptAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface WebSettings {
  language: 'en' | 'ha' | 'yo' | 'ig';
  reducedMotion: boolean;
  largeText: boolean;
}

export interface AppState {
  version: 1;
  mode: 'demo' | 'firebase';
  workspace: Workspace;
  classes: Classroom[];
  pupils: Pupil[];
  guardians: Guardian[];
  links: PupilGuardianLink[];
  attendance: AttendanceSession[];
  lessons: LessonPlan[];
  progress: ProgressEntry[];
  assessments: Assessment[];
  followUps: FollowUp[];
  aiAnalyses: AiAnalysis[];
  conversations: Conversation[];
  messages: Message[];
  outbox: OutboxCommand[];
  settings: WebSettings;
  lastRemoteSyncAt: string | null;
}

export interface DraftRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}
