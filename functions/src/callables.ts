import { randomBytes, randomUUID } from 'node:crypto';
import { onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { absencePupilIds, sessionDocumentId, validateAttendance } from './domain/attendance';
import { canNotifyGuardian, dedupeGuardiansByPhone, guardianPhoneKey, verificationCode, verificationCodeHash } from './domain/guardian';
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
    gradeLevel: z.enum(['P1', 'P2', 'P3', 'P4', 'P5', 'P6']),
    sectionLabel: z.string().min(1).max(30),
    academicYear: z.string().min(4).max(12),
    subjectIds: z.array(z.string()).max(20).default([]),
  }),
});

const registerPupilCommand = workspaceCommand.extend({
  payload: z.object({
    classId: z.string().min(3),
    displayName: z.string().min(1).max(120),
    localPupilCode: z.string().max(40).optional(),
  }),
});

const upsertGuardianCommand = workspaceCommand.extend({
  payload: z.object({
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
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
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
  });
  return { ok: true, outcome: 'accepted', workspaceId: command.workspaceId };
}));

export const createClassroom = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(createClassroomCommand, request.data);
  await requireManager(command.workspaceId, uid);
  const classId = `class_${randomUUID()}`;
  const uniqueKey = `${command.payload.gradeLevel}_${command.payload.sectionLabel}_${command.payload.academicYear}`.replace(/[^A-Za-z0-9_-]/g, '_');
  await db.runTransaction(async (transaction) => {
    const keyRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection('classKeys').doc(uniqueKey);
    const keySnap = await transaction.get(keyRef);
    if (keySnap.exists) throw new DomainError('VERSION_CONFLICT', 'A class with this grade, section and year already exists.');
    const now = new Date();
    transaction.set(db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.classrooms).doc(classId), {
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
  const pupilId = `pupil_${randomUUID()}`;
  await db.runTransaction(async (transaction) => {
    const classRef = db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.classrooms).doc(command.payload.classId);
    const classSnap = await transaction.get(classRef);
    if (!classSnap.exists) throw new DomainError('RESOURCE_NOT_FOUND', 'Class not found.');
    const now = new Date();
    transaction.set(db.collection(COLLECTIONS.workspaces).doc(command.workspaceId).collection(COLLECTIONS.pupils).doc(pupilId), {
      pupilId,
      workspaceId: command.workspaceId,
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
  const guardianId = keySnap.exists ? String(asRecord(keySnap.data()).guardianId) : `guardian_${randomUUID()}`;
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
    pupilId: command.payload.pupilId,
    guardianId: command.payload.guardianId,
    relationshipLabel: command.payload.relationshipLabel,
    notificationEligible: command.payload.notificationEligible,
    status: 'active',
    createdByUid: uid,
    createdAt: new Date(),
  }, { merge: true });
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

export const syncCommands = onCall(callableOptions, wrap(async (request) => {
  const uid = requireAuth(request);
  const command = parse(syncCommand, request.data);
  await requireMembership(command.workspaceId, uid);
  const validation = validateSyncBatch(command.payload.commands as SyncCommandRecord[]);
  if (!validation.valid) throw new DomainError('VALIDATION_FAILED', validation.errors.join(' '));
  const results = [] as Array<Record<string, unknown>>;
  for (const item of command.payload.commands) {
    const prior = await getWorkspaceReceipt(command.workspaceId, item.idempotencyKey);
    if (prior) {
      results.push({ idempotencyKey: item.idempotencyKey, outcome: 'alreadyApplied', data: { resultRef: prior.resultRef } });
      continue;
    }
    const supported = ['attendance.submit', 'progress.upsert', 'progress.approve', 'message.reply'];
    if (!supported.includes(item.commandType)) {
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
    await writeWorkspaceReceipt(command.workspaceId, {
      idempotencyKey: item.idempotencyKey,
      uid,
      workspaceId: command.workspaceId,
      commandType: item.commandType,
      payloadHash: payloadHash(item.payload),
      outcome: 'retryable',
      errorCode: 'SYNC_PROCESSOR_PENDING',
      createdAt: new Date(),
    });
    results.push({
      idempotencyKey: item.idempotencyKey,
      outcome: 'retryable',
      errorCode: 'SYNC_PROCESSOR_PENDING',
      message: 'The offline command processor is scaffolded; use the direct callable in this preview.',
    });
  }
  return { ok: true, results };
}));
