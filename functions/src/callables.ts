import { randomBytes, randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { absencePupilIds, sessionDocumentId, validateAttendance } from './domain/attendance';
import { canNotifyGuardian, dedupeGuardiansByPhone, guardianPhoneKey, hashMatches, verificationCode, verificationCodeHash } from './domain/guardian';
import { normalizeNigerianPhone } from './domain/phone';
import { assertValidProgress, nextRevision, progressDocumentId } from './domain/progress';
import { validateSyncBatch } from './domain/sync';
import { requireAdmin, requireAuth, requireClassAccess, requireManager, requireMembership } from './shared/auth';
import {
  COLLECTIONS,
  DomainError,
  REGION,
  audit,
  type AttendanceEntryRecord,
  type GuardianRecord,
  type MembershipRecord,
  type ProgressInput,
  type SyncCommandRecord,
} from './shared/contracts';
import { toHttpsError } from './shared/errors';
import { db } from './shared/firebase';
import { getUserReceipt, getWorkspaceReceipt, payloadHash, writeUserReceipt, writeWorkspaceReceipt } from './shared/receipts';

const callableOptions = {
  region: REGION,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
};

function wrap<T>(handler: (request: CallableRequest) => Promise<T>) {
  return async (request: CallableRequest): Promise<T> => {
    try {
      return await handler(request);
    } catch (error) {
      throw toHttpsError(error);
    }
  };
}

const workspaceCommand = z.object({
  workspaceId: z.string().min(3).max(120),
  idempotencyKey: z.string().min(8).max(200),
  schemaVersion: z.number().int().positive().default(1),
  payload: z.record(z.unknown()),
});

const createWorkspaceCommand = z.object({
  idempotencyKey: z.string().min(8).max(200),
  schemaVersion: z.number().int().positive().default(1),
  payload: z.object({
    type: z.enum(['school', 'independent']),
    name: z.string().min(2).max(120),
    stateCode: z.string().min(2).max(20),
    lga: z.string().min(1).max(100),
    community: z.string().min(1).max(100),
    timezone: z.string().default('Africa/Lagos'),
  }),
});

const createInvitationCommand = workspaceCommand.extend({
  payload: z.object({
    teacherPhoneE164: z.string().min(7).max(20),
    classIds: z.array(z.string()).max(20).default([]),
    expiresInDays: z.literal(7).default(7),
  }),
});

const acceptInvitationCommand = workspaceCommand.extend({
  payload: z.object({ token: z.string().min(20).max(200) }),
});

const createClassroomCommand = workspaceCommand.extend({
  payload: z.object({
    classId: z.string().regex(/^class_[A-Za-z0-9-]{6,80}$/).optional(),
    gradeLevel: z.enum(['P1', 'P2', 'P3', 'P4', 'P5', 'P6']),
    sectionLabel: z.string().min(1).max(30),
    academicYear: z.string().min(4).max(12),
    subjectIds: z.array(z.string()).max(20).default([]),
  }),
});

const registerPupilCommand = workspaceCommand.extend({
  payload: z.object({
    classId: z.string().min(3),
    // Optional client-generated identifier lets offline registration use a
    // stable document id instead of creating a duplicate on every retry.
    pupilId: z.string().regex(/^pupil_[A-Za-z0-9-]{6,80}$/).optional(),
    displayName: z.string().min(1).max(120),
    localPupilCode: z.string().max(40).optional(),
  }),
});

const upsertGuardianCommand = workspaceCommand.extend({
  payload: z.object({
    guardianId: z.string().regex(/^guardian_[A-Za-z0-9-]{6,80}$/).optional(),
    displayName: z.string().min(1).max(100),
    phoneE164: z.string().min(7).max(20),
    preferredLocale: z.enum(['en', 'ha', 'yo', 'ig', 'pcm']),
  }),
});

const linkGuardianCommand = workspaceCommand.extend({
  payload: z.object({
    pupilId: z.string().min(3),
    guardianId: z.string().min(3),
    relationshipLabel: z.string().min(1).max(60),
    notificationEligible: z.boolean().default(true),
  }),
});

const requestVerificationCommand = workspaceCommand.extend({
  payload: z.object({ guardianId: z.string().min(3) }),
});

const verifyGuardianCommand = workspaceCommand.extend({
  payload: z.object({
    guardianId: z.string().min(3),
    code: z.string().min(6).max(12),
  }),
});

const attendanceCommand = workspaceCommand.extend({
  payload: z.object({
    classId: z.string().min(3),
    schoolDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    rosterVersion: z.number().int().positive().optional(),
    entries: z.array(z.object({
      pupilId: z.string().min(3),
      status: z.enum(['present', 'absent', 'late']),
    })).min(1).max(200),
  }),
});

const progressCommand = workspaceCommand.extend({
  payload: z.object({
    pupilId: z.string().min(3),
    classId: z.string().min(3),
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    subjectId: z.string().min(1).max(80),
    objectiveId: z.string().max(80).optional(),
    indicator: z.enum(['doing_well', 'developing', 'needs_support', 'not_assessed']),
    teacherNote: z.string().max(300).optional(),
    homeActivity: z.string().max(240).optional(),
  }),
});

const approveProgressCommand = workspaceCommand.extend({
  payload: z.object({ progressEntryId: z.string().min(3) }),
});

const assessmentCommand = workspaceCommand.extend({
  payload: z.object({
    assessmentId: z.string().regex(/^assessment_[A-Za-z0-9-]{6,90}$/).optional(),
    classId: z.string().min(3),
    pupilId: z.string().min(3),
    subjectId: z.string().min(1).max(80),
    objectiveId: z.string().min(1).max(80),
    objectiveLabel: z.string().min(1).max(160),
    score: z.number().nonnegative().max(1000),
    maxScore: z.number().positive().max(1000),
    schoolDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    teacherNote: z.string().max(300).optional(),
    expectedVersion: z.number().int().positive().optional().nullable(),
  }),
});

const lessonCommand = workspaceCommand.extend({
  payload: z.object({
    lessonId: z.string().regex(/^lesson_[A-Za-z0-9-]{3,90}$/).optional(),
    classId: z.string().min(3),
    gradeLevel: z.string().min(2).max(8),
    subjectId: z.string().min(1).max(80),
    title: z.string().min(1).max(160),
    objective: z.string().max(500).default(''),
    engage: z.string().max(1000).default(''),
    explore: z.string().max(1000).default(''),
    explain: z.string().max(1000).default(''),
    elaborate: z.string().max(1000).default(''),
    evaluate: z.string().max(1000).default(''),
    materials: z.string().max(500).default(''),
    status: z.enum(['draft', 'ready']).default('draft'),
    expectedVersion: z.number().int().positive().optional().nullable(),
  }),
});

const followUpCommand = workspaceCommand.extend({
  payload: z.object({
    followUpId: z.string().regex(/^followup_[A-Za-z0-9-]{6,90}$/).optional(),
    classId: z.string().min(3),
    pupilId: z.string().min(3).optional(),
    title: z.string().min(1).max(160),
    detail: z.string().max(500).default(''),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    source: z.enum(['attendance', 'assessment', 'observation', 'message', 'manual', 'ai']).default('manual'),
    sourceId: z.string().max(120).optional(),
    expectedVersion: z.number().int().positive().optional().nullable(),
  }),
});

const followUpStatusCommand = workspaceCommand.extend({
  payload: z.object({
    followUpId: z.string().min(3),
    status: z.enum(['open', 'done', 'dismissed']),
  }),
});

const messageCommand = workspaceCommand.extend({
  payload: z.object({
    conversationId: z.string().min(3),
    body: z.string().min(1).max(1000),
    locale: z.enum(['en', 'ha', 'yo', 'ig', 'pcm']),
    clientMessageId: z.string().min(3).max(100),
  }),
});

const syncCommand = z.object({
  workspaceId: z.string().min(3),
  idempotencyKey: z.string().min(8),
  schemaVersion: z.number().int().positive(),
  payload: z.object({
    commands: z.array(z.object({
      idempotencyKey: z.string().min(8),
      commandType: z.string().min(3),
      schemaVersion: z.number().int().positive(),
      clientCreatedAt: z.string().optional(),
      expectedVersion: z.number().int().optional().nullable(),
      payload: z.record(z.unknown()),
    })).min(1).max(20),
  }),
});

function parse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new DomainError('VALIDATION_FAILED', result.error.issues.map((issue) => issue.message).join(' '));
  }
  return result.data;
}

function schoolCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(randomBytes(8), (byte) => alphabet[byte % alphabet.length]).join('');
}

function invitationToken(): string {
  return randomBytes(24).toString('base64url');
}

function hashToken(token: string): string {
  return require('node:crypto').createHash('sha256').update(token).digest('hex');
}

function phoneHashSecret(): string {
  const secret = process.env.PHONE_HASH_SECRET;
  if (secret) return secret;
  if (process.env.FUNCTIONS_EMULATOR === 'true') return 'tiny-emulator-only-phone-hash-secret';
  throw new DomainError('APP_CHECK_REQUIRED', 'PHONE_HASH_SECRET is not configured.');
}

function responseReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function timestampMillis(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value !== null && 'toMillis' in value && typeof (value as { toMillis: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

export const createWorkspace = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(createWorkspaceCommand, request.data);
  const hash = payloadHash(command.payload);
  const prior = await getUserReceipt(uid, command.idempotencyKey);
  if (prior) {
    if (prior.payloadHash !== hash) throw new DomainError('IDEMPOTENCY_KEY_REUSED', 'This key was used with a different payload.');
    return { ok: true, outcome: 'alreadyApplied', workspaceId: prior.resultRef };
  }

  let code = schoolCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await db.collection('schoolCodes').doc(code).get();
    if (!existing.exists) break;
    code = schoolCode();
  }

  const workspaceId = `ws_${randomUUID()}`;
  await db.runTransaction(async (transaction) => {
    const codeRef = db.collection('schoolCodes').doc(code);
    const codeSnap = await transaction.get(codeRef);
    if (codeSnap.exists) throw new DomainError('RETRYABLE', 'School code collision; retry the command.', true);
    const workspaceRef = db.collection(COLLECTIONS.workspaces).doc(workspaceId);
    const now = new Date();
    transaction.set(workspaceRef, {
      workspaceId,
      type: command.payload.type,
      name: command.payload.name,
      schoolCode: code,
      ownerUid: uid,
      stateCode: command.payload.stateCode,
      lga: command.payload.lga,
      community: command.payload.community,
      timezone: command.payload.timezone,
      verificationStatus: 'active_unverified',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      version: 1,
    });
    transaction.set(workspaceRef.collection(COLLECTIONS.members).doc(uid), {
      workspaceId,
      uid,
      role: command.payload.type === 'school' ? 'school_admin' : 'teacher',
      status: 'active',
      assignedClassIds: [],
      createdAt: now,
      updatedAt: now,
      version: 1,
    });
    transaction.set(codeRef, { workspaceId, createdAt: now });
    transaction.set(db.collection(COLLECTIONS.users).doc(uid).collection('workspaces').doc(workspaceId), {
      workspaceId,
      role: command.payload.type === 'school' ? 'school_admin' : 'teacher',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  });

  await writeUserReceipt(uid, {
    idempotencyKey: command.idempotencyKey,
    uid,
    workspaceId,
    commandType: 'workspace.create',
    payloadHash: hash,
    outcome: 'accepted',
    resultRef: workspaceId,
    createdAt: new Date(),
  });
  await audit(db, workspaceId, 'workspace.created', 'workspace', workspaceId, 'Workspace created.', uid);
  return { ok: true, outcome: 'accepted', workspaceId, schoolCode: code };
}));

export const createInvitation = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(createInvitationCommand, request.data);
  await requireAdmin(command.workspaceId, uid);
  const phone = normalizeNigerianPhone(command.payload.teacherPhoneE164);
  if (!phone) throw new DomainError('VALIDATION_FAILED', 'Enter a valid Nigerian phone number.');
  const token = invitationToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId)
    .collection(COLLECTIONS.invitations).doc(tokenHash).set({
      invitationId: tokenHash,
      workspaceId: command.workspaceId,
      phoneE164: phone,
      classIds: command.payload.classIds,
      status: 'pending',
      expiresAt,
      createdByUid: uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  return { ok: true, outcome: 'accepted', invitationToken: token, expiresAt: expiresAt.toISOString() };
}));

export const acceptInvitation = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(acceptInvitationCommand, request.data);
  const tokenHash = hashToken(command.payload.token);
  const invitationRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId)
    .collection(COLLECTIONS.invitations).doc(tokenHash);
  const invitationSnap = await invitationRef.get();
  if (!invitationSnap.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Invitation not found.');
  const invitation = asRecord(invitationSnap.data());
  if (invitation.status !== 'pending') throw new DomainError('VERSION_CONFLICT', 'Invitation is no longer valid.');
  if (timestampMillis(invitation.expiresAt) < Date.now()) throw new DomainError('VERSION_CONFLICT', 'Invitation has expired.');
  const authPhone = normalizeNigerianPhone(String(request.auth?.token.phone_number ?? ''));
  if (invitation.phoneE164 && authPhone && invitation.phoneE164 !== authPhone) {
    throw new DomainError('PERMISSION_DENIED', 'This invitation belongs to a different phone number.');
  }
  await db.runTransaction(async (transaction) => {
    const fresh = await transaction.get(invitationRef);
    if (!fresh.exists || asRecord(fresh.data()).status !== 'pending') {
      throw new DomainError('VERSION_CONFLICT', 'Invitation is no longer valid.');
    }
    const now = new Date();
    transaction.set(
      db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.members).doc(uid),
      {
        workspaceId: command.workspaceId,
        uid,
        role: 'teacher',
        status: 'active',
        assignedClassIds: (invitation.classIds as string[] | undefined) ?? [],
        invitationId: tokenHash,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
        version: 1,
      },
    );
    transaction.update(invitationRef, { status: 'accepted', acceptedByUid: uid, updatedAt: now });
    transaction.set(
      db.collection(COLLECTIONS.users).doc(uid).collection('workspaces').doc(command.workspaceId),
      {
        workspaceId: command.workspaceId,
        role: 'teacher',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
  });
  return { ok: true, outcome: 'accepted', workspaceId: command.workspaceId };
}));

export const createClassroom = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(createClassroomCommand, request.data);
  await requireManager(command.workspaceId, uid);
  const classId = command.payload.classId ?? `class_${randomUUID()}`;
  const uniqueKey = `${command.payload.gradeLevel}_${command.payload.sectionLabel}_${command.payload.academicYear}`.replace(/[^A-Za-z0-9_-]/g, '_');
  await db.runTransaction(async (transaction) => {
    const classRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.classrooms).doc(classId);
    const existingClass = await transaction.get(classRef);
    if (existingClass.exists && asRecord(existingClass.data()).sectionLabel !== command.payload.sectionLabel) {
      throw new DomainError('VERSION_CONFLICT', 'This class id already exists with different details.');
    }
    const keyRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection('classKeys').doc(uniqueKey);
    const keySnap = await transaction.get(keyRef);
    if (keySnap.exists && String(asRecord(keySnap.data()).classId) !== classId) {
      throw new DomainError('VERSION_CONFLICT', 'A class with this grade, section and year already exists.');
    }
    const now = new Date();
    transaction.set(classRef, {
      classId,
      workspaceId: command.workspaceId,
      gradeLevel: command.payload.gradeLevel,
      sectionLabel: command.payload.sectionLabel,
      academicYear: command.payload.academicYear,
      subjectIds: command.payload.subjectIds,
      assignedTeacherUids: [uid],
      status: 'active',
      createdAt: now,
      updatedAt: now,
      version: 1,
    });
    transaction.set(keyRef, { classId, workspaceId: command.workspaceId });
  });
  return { ok: true, outcome: 'accepted', classId };
}));

export const registerPupil = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(registerPupilCommand, request.data);
  await requireClassAccess(command.workspaceId, uid, command.payload.classId);
  const pupilId = command.payload.pupilId ?? `pupil_${randomUUID()}`;
  await db.runTransaction(async (transaction) => {
    const classRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.classrooms).doc(command.payload.classId);
    const classSnap = await transaction.get(classRef);
    if (!classSnap.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Class not found.');
    const pupilRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.pupils).doc(pupilId);
    const existingPupil = await transaction.get(pupilRef);
    if (existingPupil.exists && asRecord(existingPupil.data()).classId !== command.payload.classId) {
      throw new DomainError('VERSION_CONFLICT', 'This pupil id already belongs to another class.');
    }
    const now = new Date();
    transaction.set(pupilRef, {
      pupilId,
      workspaceId: command.workspaceId,
      classId: command.payload.classId,
      displayName: command.payload.displayName,
      localPupilCode: command.payload.localPupilCode ?? null,
      enrollmentStatus: 'active',
      createdAt: now,
      updatedAt: now,
      version: 1,
    });
    transaction.set(db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection('enrollments').doc(`${command.payload.classId}_${pupilId}`), {
      enrollmentId: `${command.payload.classId}_${pupilId}`,
      workspaceId: command.workspaceId,
      pupilId,
      classId: command.payload.classId,
      startDate: now.toISOString().slice(0, 10),
      status: 'active',
      createdAt: now,
      createdByUid: uid,
    });
  });
  return { ok: true, outcome: 'accepted', pupilId };
}));

export const upsertGuardian = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(upsertGuardianCommand, request.data);
  await requireMembership(command.workspaceId, uid);
  const phone = normalizeNigerianPhone(command.payload.phoneE164);
  if (!phone) throw new DomainError('VALIDATION_FAILED', 'Enter a valid Nigerian phone number.');
  const endpointHash = guardianPhoneKey(command.workspaceId, phone, phoneHashSecret());
  const keyRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.phoneKeys).doc(endpointHash);
  const keySnap = await keyRef.get();
  const guardianId = keySnap.exists
    ? String(asRecord(keySnap.data()).guardianId)
    : (command.payload.guardianId ?? `guardian_${randomUUID()}`);
  await db.runTransaction(async (transaction) => {
    const freshKey = await transaction.get(keyRef);
    const now = new Date();
    const guardianRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.guardians).doc(guardianId);
    const existingGuardian = await transaction.get(guardianRef);
    if (existingGuardian.exists) {
      transaction.update(guardianRef, {
        displayName: command.payload.displayName,
        preferredLocale: command.payload.preferredLocale,
        updatedAt: now,
      });
    } else {
      transaction.set(guardianRef, {
        guardianId,
        workspaceId: command.workspaceId,
        displayName: command.payload.displayName,
        phoneE164: phone,
        phoneEndpointHash: endpointHash,
        preferredLocale: command.payload.preferredLocale,
        verificationStatus: 'pending',
        consentStatus: 'not_recorded',
        consentCategories: [],
        createdAt: now,
        updatedAt: now,
        version: 1,
      });
    }
    if (!freshKey.exists) {
      transaction.set(keyRef, { workspaceId: command.workspaceId, guardianId, createdAt: now });
    }
  });
  return { ok: true, outcome: 'accepted', guardianId, verificationStatus: 'pending' };
}));

export const linkGuardianToPupil = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(linkGuardianCommand, request.data);
  const pupilSnap = await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.pupils).doc(command.payload.pupilId).get();
  if (!pupilSnap.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Pupil not found.');
  const classId = String(asRecord(pupilSnap.data()).classId);
  await requireClassAccess(command.workspaceId, uid, classId);
  const guardianSnap = await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.guardians).doc(command.payload.guardianId).get();
  if (!guardianSnap.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Guardian not found.');
  const linkId = `${command.payload.pupilId}_${command.payload.guardianId}`;
  await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.links).doc(linkId).set({
    linkId,
    workspaceId: command.workspaceId,
    classId,
    pupilId: command.payload.pupilId,
    guardianId: command.payload.guardianId,
    relationshipLabel: command.payload.relationshipLabel,
    notificationEligible: command.payload.notificationEligible,
    status: 'active',
    createdByUid: uid,
    createdAt: new Date(),
  }, { merge: true });
  // Denormalised class/pupil scope for Firestore rules. Rules cannot run
  // collection queries, so the guardian document carries the classes it is
  // linked to and the teacher's membership carries assigned classes.
  await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.guardians).doc(command.payload.guardianId).update({
    classIds: FieldValue.arrayUnion(classId),
    pupilIds: FieldValue.arrayUnion(command.payload.pupilId),
    updatedAt: new Date(),
  });
  return { ok: true, outcome: 'accepted', linkId };
}));

export const requestGuardianVerification = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(requestVerificationCommand, request.data);
  const guardianSnap = await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.guardians).doc(command.payload.guardianId).get();
  if (!guardianSnap.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Guardian not found.');
  await requireMembership(command.workspaceId, uid);
  const code = verificationCode();
  const codeHash = verificationCodeHash(command.workspaceId, command.payload.guardianId, code);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection('guardianVerificationChallenges').add({
    workspaceId: command.workspaceId,
    guardianId: command.payload.guardianId,
    intendedPhoneHash: asRecord(guardianSnap.data()).phoneEndpointHash,
    codeHash,
    expiresAt,
    failedAttemptCount: 0,
    maxAttempts: 5,
    status: 'pending',
    noticeVersion: 'preview-1',
    createdByUid: uid,
    createdAt: new Date(),
  });
  return { ok: true, outcome: 'accepted', code, expiresAt: expiresAt.toISOString(), maxAttempts: 5 };
}));

export const verifyGuardianCode = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(verifyGuardianCommand, request.data);
  await requireMembership(command.workspaceId, uid);
  const guardianRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId)
    .collection(COLLECTIONS.guardians).doc(command.payload.guardianId);
  const guardianSnap = await guardianRef.get();
  if (!guardianSnap.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Guardian not found.');

  const challenges = await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId)
    .collection('guardianVerificationChallenges')
    .where('guardianId', '==', command.payload.guardianId)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  if (challenges.empty) throw new DomainError('RESOURCE_NOT_FOUND', 'No pending verification challenge.');
  const challenge = challenges.docs[0];
  const data = asRecord(challenge.data());
  if (timestampMillis(data.expiresAt) < Date.now()) {
    await challenge.ref.update({ status: 'expired', updatedAt: new Date() });
    throw new DomainError('VALIDATION_FAILED', 'The verification code has expired. Request a new code.');
  }
  const actualHash = verificationCodeHash(command.workspaceId, command.payload.guardianId, command.payload.code);
  if (!hashMatches(String(data.codeHash), actualHash)) {
    const attempts = Number(data.failedAttemptCount ?? 0) + 1;
    const maxAttempts = Number(data.maxAttempts ?? 5);
    await challenge.ref.update({
      failedAttemptCount: attempts,
      status: attempts >= maxAttempts ? 'locked' : 'pending',
      updatedAt: new Date(),
    });
    throw new DomainError('VALIDATION_FAILED', 'The verification code is incorrect.');
  }

  const now = new Date();
  await db.runTransaction(async (transaction) => {
    const fresh = await transaction.get(challenge.ref);
    if (!fresh.exists || asRecord(fresh.data()).status !== 'pending') {
      throw new DomainError('VERSION_CONFLICT', 'This verification challenge is no longer valid.');
    }
    transaction.update(challenge.ref, {
      status: 'verified',
      verifiedAt: now,
      verifiedByUid: uid,
      updatedAt: now,
    });
    transaction.update(guardianRef, {
      verificationStatus: 'verified',
      consentStatus: 'opted_in',
      consentRecordedAt: now,
      verifiedAt: now,
      verificationMethod: 'in_person_code',
      updatedAt: now,
    });
  });
  await audit(db, command.workspaceId, 'guardian.verified', 'guardian', command.payload.guardianId, 'Guardian phone verified and opt-in recorded.', uid);
  return { ok: true, outcome: 'accepted', guardianId: command.payload.guardianId, verificationStatus: 'verified', consentStatus: 'opted_in' };
}));

export const submitAttendanceSession = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(attendanceCommand, request.data);
  await requireClassAccess(command.workspaceId, uid, command.payload.classId);
  const classSnap = await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.classrooms).doc(command.payload.classId).get();
  if (!classSnap.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Class not found.');
  const pupilsSnap = await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.pupils)
    .where('classId', '==', command.payload.classId).where('enrollmentStatus', '==', 'active').get();
  const activeIds = pupilsSnap.docs.map((doc) => doc.id);
  const entries = command.payload.entries as AttendanceEntryRecord[];
  const validation = validateAttendance(activeIds, entries, command.payload.schoolDate);
  if (!validation.valid) {
    throw new DomainError('VALIDATION_FAILED', `Attendance is incomplete or invalid. Missing: ${validation.missingPupilIds.length}.`);
  }
  const sessionId = sessionDocumentId(command.payload.classId, command.payload.schoolDate);
  const sessionRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.attendanceSessions).doc(sessionId);
  const prior = await sessionRef.get();
  if (prior.exists) throw new DomainError('ATTENDANCE_ALREADY_SUBMITTED', 'Attendance is already submitted for this class and date.');

  const absent = absencePupilIds(entries);
  const eligibleGuardians: Array<{ guardianId: string; phoneEndpointHash: string; locale: string; pupilId: string }> = [];
  for (const pupilId of absent) {
    const links = await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.links)
      .where('pupilId', '==', pupilId).where('status', '==', 'active').where('notificationEligible', '==', true).get();
    for (const link of links.docs) {
      const guardianId = String(asRecord(link.data()).guardianId);
      const guardianSnap = await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.guardians).doc(guardianId).get();
      if (!guardianSnap.exists) continue;
      const guardian = guardianSnap.data() as GuardianRecord;
      if (!canNotifyGuardian(guardian)) continue;
      eligibleGuardians.push({ guardianId, phoneEndpointHash: guardian.phoneEndpointHash, locale: guardian.preferredLocale, pupilId });
    }
  }
  const seenEndpoints = new Set<string>();
  const deduped = eligibleGuardians.filter((item) => {
    if (seenEndpoints.has(item.phoneEndpointHash)) return false;
    seenEndpoints.add(item.phoneEndpointHash);
    return true;
  });
  const dedupedIds = new Set(deduped.map((item) => item.guardianId));

  await db.runTransaction(async (transaction) => {
    const fresh = await transaction.get(sessionRef);
    if (fresh.exists) throw new DomainError('ATTENDANCE_ALREADY_SUBMITTED', 'Attendance is already submitted for this class and date.');
    const now = new Date();
    transaction.set(sessionRef, {
      sessionId,
      workspaceId: command.workspaceId,
      classId: command.payload.classId,
      schoolDate: command.payload.schoolDate,
      submittedByUid: uid,
      submittedAt: now,
      rosterVersion: command.payload.rosterVersion ?? 1,
      status: 'submitted',
      version: 1,
      clientSessionId: command.idempotencyKey,
    });
    for (const entry of entries) {
      transaction.set(
        db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.attendanceEntries).doc(`${sessionId}_${entry.pupilId}`),
        {
          attendanceEntryId: `${sessionId}_${entry.pupilId}`,
          workspaceId: command.workspaceId,
          sessionId,
          classId: command.payload.classId,
          pupilId: entry.pupilId,
          status: entry.status,
          originalStatus: entry.status,
          currentVersion: 1,
          createdAt: now,
          updatedAt: now,
        },
      );
    }
    for (const guardian of deduped) {
      if (!dedupedIds.has(guardian.guardianId)) continue;
      const jobRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.notificationJobs).doc(`${sessionId}_${guardian.guardianId}_absence`);
      transaction.set(jobRef, {
        notificationJobId: jobRef.id,
        workspaceId: command.workspaceId,
        type: 'absence',
        classId: command.payload.classId,
        guardianId: guardian.guardianId,
        pupilIds: [guardian.pupilId],
        locale: guardian.locale,
        templateId: 'absence_v1',
        responseReference: responseReference(),
        idempotencyKey: jobRef.id,
        segmentEstimate: 1,
        status: 'queued',
        attemptCount: 0,
        createdAt: now,
        updatedAt: now,
        mode: 'mock',
      });
    }
  });
  await audit(db, command.workspaceId, 'attendance.submitted', 'attendance_session', sessionId, 'Attendance accepted; absence jobs queued (mock).', uid);
  return { ok: true, outcome: 'accepted', sessionId, absentCount: absent.length, notificationJobs: deduped.length };
}));

export const createProgressEntry = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(progressCommand, request.data);
  await requireClassAccess(command.workspaceId, uid, command.payload.classId);
  const input: ProgressInput = command.payload;
  assertValidProgress(input);
  const progressEntryId = progressDocumentId(input);
  const entryRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.progressEntries).doc(progressEntryId);
  const existing = await entryRef.get();
  const currentRevision = existing.exists ? Number(asRecord(existing.data()).currentRevisionNumber ?? 1) : 0;
  const wasApproved = existing.exists && asRecord(existing.data()).approvalStatus === 'approved';
  const revision = existing.exists ? nextRevision(currentRevision, wasApproved) : 1;
  await db.runTransaction(async (transaction) => {
    const fresh = await transaction.get(entryRef);
    if (fresh.exists && Number(asRecord(fresh.data()).currentRevisionNumber ?? 1) !== currentRevision) {
      throw new DomainError('VERSION_CONFLICT', 'Progress entry changed; refresh and retry.');
    }
    const now = new Date();
    transaction.set(entryRef, {
      progressEntryId,
      workspaceId: command.workspaceId,
      pupilId: input.pupilId,
      classId: input.classId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      subjectId: input.subjectId,
      objectiveId: input.objectiveId ?? null,
      indicator: input.indicator,
      teacherNote: input.teacherNote ?? null,
      homeActivity: input.homeActivity ?? null,
      createdByUid: existing.exists ? asRecord(existing.data()).createdByUid ?? uid : uid,
      currentRevisionNumber: revision,
      approvalStatus: 'draft',
      approvedRevisionNumber: null,
      approvedByUid: null,
      approvedAt: null,
      createdAt: existing.exists ? asRecord(existing.data()).createdAt : now,
      updatedAt: now,
      version: existing.exists ? Number(asRecord(existing.data()).version ?? 1) + 1 : 1,
    });
    transaction.set(entryRef.collection(COLLECTIONS.progressRevisions).doc(`rev_${revision}`), {
      revisionId: `rev_${revision}`,
      workspaceId: command.workspaceId,
      progressEntryId,
      revisionNumber: revision,
      pupilId: input.pupilId,
      classId: input.classId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      subjectId: input.subjectId,
      objectiveId: input.objectiveId ?? null,
      indicator: input.indicator,
      teacherNote: input.teacherNote ?? null,
      homeActivity: input.homeActivity ?? null,
      changedByUid: uid,
      createdAt: now,
    });
  });
  return { ok: true, outcome: 'accepted', progressEntryId, revision };
}));

export const approveProgressEntry = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(approveProgressCommand, request.data);
  const entryRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.progressEntries).doc(command.payload.progressEntryId);
  const entry = await entryRef.get();
  if (!entry.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Progress entry not found.');
  const data = asRecord(entry.data());
  await requireClassAccess(command.workspaceId, uid, String(data.classId));
  const membership = await requireMembership(command.workspaceId, uid);
  if (data.createdByUid !== uid && membership.role !== 'school_admin') {
    throw new DomainError('PERMISSION_DENIED', 'Only the authoring teacher or a school admin may approve this entry.');
  }
  const now = new Date();
  await entryRef.update({
    approvalStatus: 'approved',
    approvedRevisionNumber: data.currentRevisionNumber,
    approvedByUid: uid,
    approvedAt: now,
    updatedAt: now,
  });
  await audit(db, command.workspaceId, 'progress.approved', 'progress_entry', command.payload.progressEntryId, 'Approved for digest.', uid);
  return { ok: true, outcome: 'accepted', progressEntryId: command.payload.progressEntryId };
}));

export const sendTeacherMessage = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(messageCommand, request.data);
  await requireMembership(command.workspaceId, uid);
  const conversationRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.conversations).doc(command.payload.conversationId);
  const conversation = await conversationRef.get();
  if (!conversation.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Conversation not found.');
  const guardianId = String(asRecord(conversation.data()).guardianId);
  const guardian = await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.guardians).doc(guardianId).get();
  if (!guardian.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Guardian not found.');
  const messageId = `msg_${randomUUID()}`;
  const now = new Date();
  await conversationRef.collection(COLLECTIONS.messages).doc(messageId).set({
    messageId,
    workspaceId: command.workspaceId,
    conversationId: command.payload.conversationId,
    direction: 'outbound',
    senderType: 'teacher',
    senderUid: uid,
    body: command.payload.body,
    locale: command.payload.locale,
    provider: 'mock',
    providerMessageId: null,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
  });
  await conversationRef.update({ status: 'waiting_parent', lastMessageAt: now, updatedAt: now });
  await db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.notificationJobs).add({
    workspaceId: command.workspaceId,
    type: 'teacher_reply',
    guardianId,
    pupilIds: [],
    locale: command.payload.locale,
    templateId: 'teacher_reply_v1',
    idempotencyKey: `${command.payload.clientMessageId}_reply`,
    segmentEstimate: Math.ceil(command.payload.body.length / 160),
    status: 'queued',
    attemptCount: 0,
    createdAt: now,
    updatedAt: now,
    mode: 'mock',
  });
  return { ok: true, outcome: 'accepted', messageId, status: 'queued', provider: 'mock' };
}));

export const recordAssessment = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(assessmentCommand, request.data);
  await requireClassAccess(command.workspaceId, uid, command.payload.classId);
  const workspaceRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId);
  const classRef = workspaceRef.collection(COLLECTIONS.classrooms).doc(command.payload.classId);
  const pupilRef = workspaceRef.collection(COLLECTIONS.pupils).doc(command.payload.pupilId);
  const [classSnap, pupilSnap] = await Promise.all([classRef.get(), pupilRef.get()]);
  if (!classSnap.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Class not found.');
  if (!pupilSnap.exists || asRecord(pupilSnap.data()).classId !== command.payload.classId) {
    throw new DomainError('VALIDATION_FAILED', 'This pupil is not enrolled in the selected class.');
  }
  if (command.payload.score > command.payload.maxScore) {
    throw new DomainError('VALIDATION_FAILED', 'The assessment score cannot exceed the maximum score.');
  }
  const assessmentId = command.payload.assessmentId ?? `assessment_${randomUUID()}`;
  const entryRef = workspaceRef.collection(COLLECTIONS.assessments).doc(assessmentId);
  const existing = await entryRef.get();
  if (existing.exists && (
    asRecord(existing.data()).classId !== command.payload.classId ||
    asRecord(existing.data()).pupilId !== command.payload.pupilId
  )) {
    throw new DomainError('VERSION_CONFLICT', 'This assessment id already belongs to another pupil or class.');
  }
  const currentVersion = existing.exists ? Number(asRecord(existing.data()).version ?? 1) : 0;
  const expectedVersion = command.payload.expectedVersion ?? null;
  if (existing.exists && expectedVersion !== null && currentVersion !== expectedVersion) {
    throw new DomainError('VERSION_CONFLICT', 'Assessment changed on another device; refresh and retry.');
  }
  await db.runTransaction(async (transaction) => {
    const fresh = await transaction.get(entryRef);
    const freshVersion = fresh.exists ? Number(asRecord(fresh.data()).version ?? 1) : 0;
    if (fresh.exists && expectedVersion !== null && freshVersion !== expectedVersion) {
      throw new DomainError('VERSION_CONFLICT', 'Assessment changed on another device; refresh and retry.');
    }
    const now = new Date();
    transaction.set(entryRef, {
      assessmentId,
      workspaceId: command.workspaceId,
      classId: command.payload.classId,
      pupilId: command.payload.pupilId,
      subjectId: command.payload.subjectId,
      objectiveId: command.payload.objectiveId,
      objectiveLabel: command.payload.objectiveLabel,
      score: command.payload.score,
      maxScore: command.payload.maxScore,
      schoolDate: command.payload.schoolDate,
      teacherNote: command.payload.teacherNote ?? '',
      recordedByUid: fresh.exists ? asRecord(fresh.data()).recordedByUid ?? uid : uid,
      createdAt: fresh.exists ? asRecord(fresh.data()).createdAt : now,
      updatedAt: now,
      version: freshVersion + 1,
    });
  });
  await audit(db, command.workspaceId, 'assessment.recorded', 'assessment', assessmentId, 'Assessment recorded by teacher.', uid);
  return { ok: true, outcome: 'accepted', assessmentId, version: currentVersion + 1 };
}));

export const upsertLesson = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(lessonCommand, request.data);
  await requireClassAccess(command.workspaceId, uid, command.payload.classId);
  const workspaceRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId);
  const classSnap = await workspaceRef.collection(COLLECTIONS.classrooms).doc(command.payload.classId).get();
  if (!classSnap.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Class not found.');
  const lessonId = command.payload.lessonId ?? `lesson_${randomUUID()}`;
  const lessonRef = workspaceRef.collection(COLLECTIONS.lessonPlans).doc(lessonId);
  const existing = await lessonRef.get();
  if (existing.exists && asRecord(existing.data()).classId !== command.payload.classId) {
    throw new DomainError('VERSION_CONFLICT', 'This lesson id already belongs to another class.');
  }
  const currentVersion = existing.exists ? Number(asRecord(existing.data()).version ?? 1) : 0;
  const expectedVersion = command.payload.expectedVersion ?? null;
  if (existing.exists && expectedVersion !== null && currentVersion !== expectedVersion) {
    throw new DomainError('VERSION_CONFLICT', 'Lesson changed on another device; refresh and retry.');
  }
  await db.runTransaction(async (transaction) => {
    const fresh = await transaction.get(lessonRef);
    const freshVersion = fresh.exists ? Number(asRecord(fresh.data()).version ?? 1) : 0;
    if (fresh.exists && expectedVersion !== null && freshVersion !== expectedVersion) {
      throw new DomainError('VERSION_CONFLICT', 'Lesson changed on another device; refresh and retry.');
    }
    const now = new Date();
    transaction.set(lessonRef, {
      lessonId,
      workspaceId: command.workspaceId,
      classId: command.payload.classId,
      gradeLevel: command.payload.gradeLevel,
      subjectId: command.payload.subjectId,
      title: command.payload.title,
      objective: command.payload.objective,
      engage: command.payload.engage,
      explore: command.payload.explore,
      explain: command.payload.explain,
      elaborate: command.payload.elaborate,
      evaluate: command.payload.evaluate,
      materials: command.payload.materials,
      status: command.payload.status,
      createdByUid: fresh.exists ? asRecord(fresh.data()).createdByUid ?? uid : uid,
      createdAt: fresh.exists ? asRecord(fresh.data()).createdAt : now,
      updatedAt: now,
      version: freshVersion + 1,
    });
  });
  await audit(db, command.workspaceId, 'lesson.saved', 'lesson_plan', lessonId, 'Lesson plan saved by teacher.', uid);
  return { ok: true, outcome: 'accepted', lessonId, version: currentVersion + 1 };
}));

export const upsertFollowUp = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(followUpCommand, request.data);
  await requireClassAccess(command.workspaceId, uid, command.payload.classId);
  const workspaceRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId);
  if (command.payload.pupilId) {
    const pupilSnap = await workspaceRef.collection(COLLECTIONS.pupils).doc(command.payload.pupilId).get();
    if (!pupilSnap.exists || asRecord(pupilSnap.data()).classId !== command.payload.classId) {
      throw new DomainError('VALIDATION_FAILED', 'This pupil is not enrolled in the selected class.');
    }
  }
  const followUpId = command.payload.followUpId ?? `followup_${randomUUID()}`;
  const ref = workspaceRef.collection(COLLECTIONS.followUps).doc(followUpId);
  const existing = await ref.get();
  if (existing.exists && asRecord(existing.data()).classId !== command.payload.classId) {
    throw new DomainError('VERSION_CONFLICT', 'This follow-up id already belongs to another class.');
  }
  const currentVersion = existing.exists ? Number(asRecord(existing.data()).version ?? 1) : 0;
  const expectedVersion = command.payload.expectedVersion ?? null;
  if (existing.exists && expectedVersion !== null && currentVersion !== expectedVersion) {
    throw new DomainError('VERSION_CONFLICT', 'Follow-up changed on another device; refresh and retry.');
  }
  await db.runTransaction(async (transaction) => {
    const fresh = await transaction.get(ref);
    const freshVersion = fresh.exists ? Number(asRecord(fresh.data()).version ?? 1) : 0;
    if (fresh.exists && expectedVersion !== null && freshVersion !== expectedVersion) {
      throw new DomainError('VERSION_CONFLICT', 'Follow-up changed on another device; refresh and retry.');
    }
    const prior = fresh.exists ? asRecord(fresh.data()) : null;
    const now = new Date();
    transaction.set(ref, {
      followUpId,
      workspaceId: command.workspaceId,
      classId: command.payload.classId,
      pupilId: command.payload.pupilId ?? null,
      title: command.payload.title,
      detail: command.payload.detail,
      dueDate: command.payload.dueDate,
      status: prior?.status ?? 'open',
      source: command.payload.source,
      sourceId: command.payload.sourceId ?? null,
      completedAt: prior?.completedAt ?? null,
      createdByUid: prior?.createdByUid ?? uid,
      createdAt: prior?.createdAt ?? now,
      updatedAt: now,
      version: freshVersion + 1,
    });
  });
  await audit(db, command.workspaceId, 'followup.saved', 'follow_up', followUpId, 'Teacher follow-up saved.', uid);
  return { ok: true, outcome: 'accepted', followUpId, version: currentVersion + 1 };
}));

export const updateFollowUpStatus = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(followUpStatusCommand, request.data);
  const workspaceRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId);
  const ref = workspaceRef.collection(COLLECTIONS.followUps).doc(command.payload.followUpId);
  const existing = await ref.get();
  if (!existing.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Follow-up not found.');
  const classId = String(asRecord(existing.data()).classId);
  await requireClassAccess(command.workspaceId, uid, classId);
  const status = command.payload.status;
  await ref.update({
    status,
    completedAt: status === 'done' ? new Date() : null,
    updatedAt: new Date(),
    version: Number(asRecord(existing.data()).version ?? 1) + 1,
  });
  await audit(db, command.workspaceId, `followup.${status}`, 'follow_up', command.payload.followUpId, 'Teacher follow-up status updated.', uid);
  return { ok: true, outcome: 'accepted', followUpId: command.payload.followUpId, status };
}));

/**
 * Applies supported offline commands through the same authenticated,
 * membership-checked callable logic used by the direct endpoints. Each command
 * gets its own receipt; successful receipts make retries idempotent.
 */
export const syncCommands = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(syncCommand, request.data);
  await requireMembership(command.workspaceId, uid);
  const validation = validateSyncBatch(command.payload.commands as SyncCommandRecord[]);
  if (!validation.valid) throw new DomainError('VALIDATION_FAILED', validation.errors.join(' '));

  const handlers: Record<string, (child: CallableRequest) => Promise<unknown>> = {
    'attendance.submit': (submitAttendanceSession as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
    'progress.upsert': (createProgressEntry as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
    'progress.approve': (approveProgressEntry as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
    'message.reply': (sendTeacherMessage as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
    'pupil.register': (registerPupil as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
    'class.create': (createClassroom as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
    'guardian.upsert': (upsertGuardian as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
    'guardian.link': (linkGuardianToPupil as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
    'guardian.verify': (verifyGuardianCode as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
    'assessment.record': (recordAssessment as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
    'lesson.upsert': (upsertLesson as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
    'followup.upsert': (upsertFollowUp as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
    'followup.status': (updateFollowUpStatus as unknown as { run: (child: CallableRequest) => Promise<unknown> }).run,
  };

  const results = [] as Array<Record<string, unknown>>;
  for (const item of command.payload.commands) {
    const prior = await getWorkspaceReceipt(command.workspaceId, item.idempotencyKey);
    if (prior && prior.outcome !== 'retryable') {
      results.push({ idempotencyKey: item.idempotencyKey, outcome: 'alreadyApplied', data: { resultRef: prior.resultRef } });
      continue;
    }
    const handler = handlers[item.commandType];
    if (!handler) {
      await writeWorkspaceReceipt(command.workspaceId, {
        idempotencyKey: item.idempotencyKey,
        uid,
        workspaceId: command.workspaceId,
        commandType: item.commandType,
        payloadHash: payloadHash(item.payload),
        outcome: 'rejected',
        errorCode: 'COMMAND_NOT_SUPPORTED',
        createdAt: new Date(),
      });
      results.push({ idempotencyKey: item.idempotencyKey, outcome: 'rejected', errorCode: 'COMMAND_NOT_SUPPORTED' });
      continue;
    }

    const childRequest = {
      ...request,
      data: {
        workspaceId: command.workspaceId,
        idempotencyKey: item.idempotencyKey,
        schemaVersion: item.schemaVersion,
        payload: item.payload,
      },
    } as CallableRequest;

    try {
      const data = await handler(childRequest);
      const resultRef = typeof data === 'object' && data !== null
        ? String(
            asRecord(data).sessionId ??
            asRecord(data).progressEntryId ??
            asRecord(data).messageId ??
            asRecord(data).pupilId ??
            asRecord(data).classId ??
            asRecord(data).guardianId ??
            asRecord(data).linkId ??
            asRecord(data).assessmentId ??
            asRecord(data).lessonId ??
            asRecord(data).followUpId ??
            '',
          )
        : '';
      await writeWorkspaceReceipt(command.workspaceId, {
        idempotencyKey: item.idempotencyKey,
        uid,
        workspaceId: command.workspaceId,
        commandType: item.commandType,
        payloadHash: payloadHash(item.payload),
        outcome: 'accepted',
        ...(resultRef ? { resultRef } : {}),
        createdAt: new Date(),
      });
      results.push({ idempotencyKey: item.idempotencyKey, outcome: 'accepted', data });
    } catch (error) {
      const { outcome, errorCode, message } = classifySyncFailure(error);
      if (outcome !== 'retryable') {
        await writeWorkspaceReceipt(command.workspaceId, {
          idempotencyKey: item.idempotencyKey,
          uid,
          workspaceId: command.workspaceId,
          commandType: item.commandType,
          payloadHash: payloadHash(item.payload),
          outcome,
          errorCode,
          createdAt: new Date(),
        });
      }
      results.push({ idempotencyKey: item.idempotencyKey, outcome, errorCode, message });
    }
  }
  return { ok: true, results };
}));

function classifySyncFailure(error: unknown): {
  outcome: 'rejected' | 'conflict' | 'retryable';
  errorCode: string;
  message: string;
} {
  if (error instanceof HttpsError) {
    const code = error.code;
    if (code === 'unavailable' || code === 'resource-exhausted' || code === 'internal' || code === 'deadline-exceeded') {
      return { outcome: 'retryable', errorCode: code.replace(/-/g, '_').toUpperCase(), message: error.message };
    }
    if (code === 'already-exists' || code === 'aborted') {
      return { outcome: 'conflict', errorCode: code.replace(/-/g, '_').toUpperCase(), message: error.message };
    }
    return { outcome: 'rejected', errorCode: code.replace(/-/g, '_').toUpperCase(), message: error.message };
  }
  return { outcome: 'retryable', errorCode: 'INTERNAL', message: 'The command could not be applied.' };
}
