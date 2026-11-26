import type { Firestore } from 'firebase-admin/firestore';

export const REGION = 'africa-south1';
export const MAX_SYNC_BATCH = 20;
export const MAX_NOTE_LENGTH = 300;
export const MAX_HOME_ACTIVITY_LENGTH = 240;
export const MAX_SMS_SEGMENTS = 2;

export const COLLECTIONS = {
  users: 'users',
  workspaces: 'workspaces',
  members: 'members',
  invitations: 'invitations',
  classrooms: 'classes',
  pupils: 'pupils',
  guardians: 'guardians',
  links: 'pupilGuardianLinks',
  phoneKeys: 'guardianPhoneKeys',
  attendanceSessions: 'attendanceSessions',
  attendanceEntries: 'attendanceEntries',
  notificationJobs: 'notificationJobs',
  progressEntries: 'progressEntries',
  progressRevisions: 'revisions',
  conversations: 'conversations',
  messages: 'messages',
  commandReceipts: 'commandReceipts',
  auditEvents: 'auditEvents',
  webhookReceipts: 'providerWebhookReceipts',
} as const;

export interface WorkspaceRecord {
  workspaceId: string;
  type: 'school' | 'independent';
  name: string;
  schoolCode: string;
  ownerUid: string;
  verificationStatus: 'active_unverified' | 'pending' | 'verified' | 'suspended';
  status: 'active' | 'suspended' | 'closed';
  createdAt: unknown;
  updatedAt: unknown;
  version: number;
}

export interface MembershipRecord {
  workspaceId: string;
  uid: string;
  role: 'school_admin' | 'teacher';
  status: 'invited' | 'active' | 'revoked' | 'expired';
  assignedClassIds: string[];
  version: number;
}

export interface GuardianRecord {
  guardianId: string;
  workspaceId: string;
  displayName: string;
  phoneE164: string;
  phoneEndpointHash: string;
  preferredLocale: 'en' | 'ha' | 'yo' | 'ig' | 'pcm';
  verificationStatus: 'pending' | 'verified' | 'revoked';
  consentStatus: 'not_recorded' | 'opted_in' | 'opted_out';
  consentCategories: string[];
  createdAt: unknown;
  updatedAt: unknown;
  version: number;
}

export interface AttendanceEntryRecord {
  pupilId: string;
  status: 'present' | 'absent' | 'late';
}

export interface ProgressInput {
  pupilId: string;
  classId: string;
  periodStart: string;
  periodEnd: string;
  subjectId: string;
  objectiveId?: string;
  indicator: 'doing_well' | 'developing' | 'needs_support' | 'not_assessed';
  teacherNote?: string;
  homeActivity?: string;
}

export interface SyncCommandRecord {
  idempotencyKey: string;
  commandType: string;
  schemaVersion: number;
  payload: Record<string, unknown>;
}

export type SyncOutcome = 'accepted' | 'alreadyApplied' | 'conflict' | 'rejected' | 'retryable';

export interface SyncCommandResult {
  idempotencyKey: string;
  outcome: SyncOutcome;
  errorCode?: string;
  message?: string;
  data?: Record<string, unknown>;
}

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export function requireNonEmpty(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new DomainError('VALIDATION_FAILED', `${field} is required.`);
  }
  return value.trim();
}

export function assertWorkspaceId(workspaceId: string): void {
  if (!/^[A-Za-z0-9_-]{3,120}$/.test(workspaceId)) {
    throw new DomainError('VALIDATION_FAILED', 'Invalid workspace identifier.');
  }
}

export async function audit(
  db: Firestore,
  workspaceId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  summary: string,
  actorUid?: string,
): Promise<void> {
  await db.collection(COLLECTIONS.workspaces).doc(workspaceId).collection(COLLECTIONS.auditEvents).add({
    workspaceId,
    actorUid: actorUid ?? null,
    action,
    resourceType,
    resourceId,
    summary,
    createdAt: new Date(),
  });
}
