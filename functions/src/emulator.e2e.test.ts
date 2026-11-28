import { createHmac } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import functionsTest from 'firebase-functions-test';
import { wrapV2 } from 'firebase-functions-test/lib/v2';
import { createRequest, createResponse } from 'node-mocks-http';
import {
  approveProgressEntry,
  createClassroom,
  createProgressEntry,
  createWorkspace,
  linkGuardianToPupil,
  registerPupil,
  requestGuardianVerification,
  sendTeacherMessage,
  submitAttendanceSession,
  syncCommands,
  upsertGuardian,
  verifyGuardianCode,
} from './callables';
import { runWeeklyDigests } from './jobs';
import { esmsInbound } from './webhooks';
import { db } from './shared/firebase';

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'demo-tiny-e2e';
const test = functionsTest({ projectId: PROJECT_ID });
const auth = { auth: { uid: 'owner-e2e', token: { uid: 'owner-e2e' } } };

const wrapCallable = (fn: unknown) => {
  const wrapped = wrapV2(fn as never) as unknown as (request: unknown) => Promise<Record<string, unknown>>;
  return (data: unknown, context?: { auth?: unknown }) => wrapped({
    data,
    auth: context?.auth,
    rawRequest: {},
    instanceIdToken: '',
  });
};

const createWorkspaceFn = wrapCallable(createWorkspace);
const createClassroomFn = wrapCallable(createClassroom);
const registerPupilFn = wrapCallable(registerPupil);
const upsertGuardianFn = wrapCallable(upsertGuardian);
const linkGuardianFn = wrapCallable(linkGuardianToPupil);
const requestVerificationFn = wrapCallable(requestGuardianVerification);
const verifyGuardianFn = wrapCallable(verifyGuardianCode);
const submitAttendanceFn = wrapCallable(submitAttendanceSession);
const createProgressFn = wrapCallable(createProgressEntry);
const approveProgressFn = wrapCallable(approveProgressEntry);
const sendMessageFn = wrapCallable(sendTeacherMessage);
const syncFn = wrapCallable(syncCommands);

let workspaceId = '';
let classId = '';
const pupilA = 'pupil_e2e0001';
const pupilB = 'pupil_e2e0002';
const pupilC = 'pupil_e2e0003';
let guardianId = '';
const conversationId = 'conversation_e2e0001';
let schoolCode = '';
describe('Tiny backend emulator E2E', () => {
  beforeAll(async () => {
    await db.recursiveDelete(db.collection('workspaces'));
    await db.recursiveDelete(db.collection('schoolCodes'));
    await db.recursiveDelete(db.collection('providerWebhookReceipts'));
    await db.recursiveDelete(db.collection('users'));
  });

  afterAll(async () => {
    await test.cleanup();
  });

  it('creates a school workspace and classroom', async () => {
    const workspace = await createWorkspaceFn({
      idempotencyKey: 'ws-create-e2e-0001',
      schemaVersion: 1,
      payload: {
        type: 'school',
        name: 'E2E Demo Primary',
        stateCode: 'KN',
        lga: 'Demo',
        community: 'Demo',
        timezone: 'Africa/Lagos',
      },
    }, auth);
    expect(workspace.outcome).toBe('accepted');
    expect(typeof workspace.workspaceId).toBe('string');
    workspaceId = String(workspace.workspaceId);
    schoolCode = String(workspace.schoolCode);
    expect(schoolCode).toHaveLength(8);

    const classroom = await createClassroomFn({
      workspaceId,
      idempotencyKey: 'class-create-e2e-0001',
      schemaVersion: 1,
      payload: {
        gradeLevel: 'P4',
        sectionLabel: 'Blue',
        academicYear: '2026/2027',
        subjectIds: ['basic_science'],
      },
    }, auth);
    expect(classroom.outcome).toBe('accepted');
    classId = String(classroom.classId);
  });

  it('rejects a second workspace when the idempotency key is reused', async () => {
    const repeated = await createWorkspaceFn({
      idempotencyKey: 'ws-create-e2e-0001',
      schemaVersion: 1,
      payload: {
        type: 'school',
        name: 'E2E Demo Primary',
        stateCode: 'KN',
        lga: 'Demo',
        community: 'Demo',
        timezone: 'Africa/Lagos',
      },
    }, auth);
    expect(repeated.outcome).toBe('alreadyApplied');
    expect(repeated.workspaceId).toBe(workspaceId);

    await expect(createWorkspaceFn({
      idempotencyKey: 'ws-create-e2e-0001',
      schemaVersion: 1,
      payload: {
        type: 'school',
        name: 'Different Payload Primary',
        stateCode: 'KN',
        lga: 'Demo',
        community: 'Demo',
        timezone: 'Africa/Lagos',
      },
    }, auth)).rejects.toThrow(/different payload/i);
  });

  it('rejects a callable request without authentication', async () => {
    await expect(createClassroomFn({
      workspaceId,
      idempotencyKey: 'class-unauthenticated-0001',
      schemaVersion: 1,
      payload: {
        gradeLevel: 'P5',
        sectionLabel: 'Gold',
        academicYear: '2026/2027',
      },
    }, {})).rejects.toThrow(/sign-in is required/i);
  });

  it('registers pupils, links a guardian and verifies consent', async () => {
    for (const [pupilId, name] of [[pupilA, 'Synthetic One'], [pupilB, 'Synthetic Two']] as const) {
      const pupil = await registerPupilFn({
        workspaceId,
        idempotencyKey: `pupil-create-${pupilId}`,
        schemaVersion: 1,
        payload: { classId, pupilId, displayName: name, localPupilCode: pupilId.slice(-4) },
      }, auth);
      expect(pupil.outcome).toBe('accepted');
      expect(pupil.pupilId).toBe(pupilId);
    }

    const guardian = await upsertGuardianFn({
      workspaceId,
      idempotencyKey: 'guardian-upsert-e2e-0001',
      schemaVersion: 1,
      payload: {
        displayName: 'Synthetic Guardian',
        phoneE164: '+2348031234567',
        preferredLocale: 'en',
      },
    }, auth);
    expect(guardian.guardianId).toBeDefined();
    guardianId = String(guardian.guardianId);
    expect(guardian.verificationStatus).toBe('pending');

    const link = await linkGuardianFn({
      workspaceId,
      idempotencyKey: 'guardian-link-e2e-0001',
      schemaVersion: 1,
      payload: {
        pupilId: pupilA,
        guardianId,
        relationshipLabel: 'Parent',
        notificationEligible: true,
      },
    }, auth);
    expect(link.outcome).toBe('accepted');

    const guardianDoc = await db.collection('workspaces').doc(workspaceId).collection('guardians').doc(guardianId).get();
    expect(guardianDoc.data()?.classIds).toEqual([classId]);
    expect(guardianDoc.data()?.pupilIds).toEqual([pupilA]);

    const challenge = await requestVerificationFn({
      workspaceId,
      idempotencyKey: 'guardian-verify-e2e-0001',
      schemaVersion: 1,
      payload: { guardianId },
    }, auth);
    expect(String(challenge.code)).toHaveLength(8);

    const verified = await verifyGuardianFn({
      workspaceId,
      idempotencyKey: 'guardian-verify-submit-e2e-0001',
      schemaVersion: 1,
      payload: { guardianId, code: String(challenge.code) },
    }, auth);
    expect(verified.outcome).toBe('accepted');
    expect(verified.verificationStatus).toBe('verified');
    expect(verified.consentStatus).toBe('opted_in');

    const verifiedDoc = await guardianDoc.ref.get();
    expect(verifiedDoc.data()?.verificationStatus).toBe('verified');
    expect(verifiedDoc.data()?.consentStatus).toBe('opted_in');
  });

  it('submits attendance once and queues an absence job only for the absent pupil', async () => {
    const result = await submitAttendanceFn({
      workspaceId,
      idempotencyKey: 'attendance-e2e-2026-11-20',
      schemaVersion: 1,
      payload: {
        classId,
        schoolDate: '2026-11-20',
        entries: [
          { pupilId: pupilA, status: 'absent' },
          { pupilId: pupilB, status: 'present' },
        ],
      },
    }, auth);
    expect(result.outcome).toBe('accepted');
    expect(result.absentCount).toBe(1);
    expect(result.notificationJobs).toBe(1);

    const jobs = await db.collection('workspaces').doc(workspaceId).collection('notificationJobs').get();
    expect(jobs.size).toBe(1);
    const job = jobs.docs[0].data();
    expect(job.type).toBe('absence');
    expect(job.classId).toBe(classId);
    expect(job.status).toBe('queued');
    expect(job.mode).toBe('mock');

    await expect(submitAttendanceFn({
      workspaceId,
      idempotencyKey: 'attendance-e2e-2026-11-20-duplicate',
      schemaVersion: 1,
      payload: {
        classId,
        schoolDate: '2026-11-20',
        entries: [
          { pupilId: pupilA, status: 'present' },
          { pupilId: pupilB, status: 'present' },
        ],
      },
    }, auth)).rejects.toThrow(/already submitted/i);
  });

  it('creates and approves a teacher progress entry', async () => {
    const created = await createProgressFn({
      workspaceId,
      idempotencyKey: 'progress-e2e-0001',
      schemaVersion: 1,
      payload: {
        pupilId: pupilA,
        classId,
        periodStart: '2026-11-16',
        periodEnd: '2026-11-20',
        subjectId: 'basic_science',
        indicator: 'doing_well',
        teacherNote: 'Explained three uses of water clearly.',
        homeActivity: 'Name two sources of water at home.',
      },
    }, auth);
    expect(created.outcome).toBe('accepted');
    expect(created.revision).toBe(1);

    const approved = await approveProgressFn({
      workspaceId,
      idempotencyKey: 'progress-approve-e2e-0001',
      schemaVersion: 1,
      payload: { progressEntryId: created.progressEntryId },
    }, auth);
    expect(approved.outcome).toBe('accepted');

    const entry = await db.collection('workspaces').doc(workspaceId).collection('progressEntries')
      .doc(String(created.progressEntryId)).get();
    expect(entry.data()?.approvalStatus).toBe('approved');
    expect(entry.data()?.teacherNote).toBe('Explained three uses of water clearly.');
  });

  it('queues a teacher reply against a guardian conversation', async () => {
    await db.collection('workspaces').doc(workspaceId).collection('conversations').doc(conversationId).set({
      conversationId,
      workspaceId,
      guardianId,
      pupilId: pupilA,
      classId,
      status: 'waiting_teacher',
      lastMessageAt: new Date(),
      version: 1,
    });

    const result = await sendMessageFn({
      workspaceId,
      idempotencyKey: 'message-e2e-0001',
      schemaVersion: 1,
      payload: {
        conversationId,
        body: 'Synthetic teacher reply.',
        locale: 'en',
        clientMessageId: 'client-message-e2e-0001',
      },
    }, auth);
    expect(result.outcome).toBe('accepted');
    expect(result.status).toBe('queued');
    expect(result.provider).toBe('mock');
  });

  it('applies a mixed offline sync batch and replays it idempotently', async () => {
    const commands = [
      {
        idempotencyKey: 'sync-class-create-0001',
        commandType: 'class.create',
        schemaVersion: 1,
        payload: {
          classId: 'class_sync0001',
          gradeLevel: 'P5',
          sectionLabel: 'Gold',
          academicYear: '2026/2027',
          subjectIds: [],
        },
      },
      {
        idempotencyKey: 'sync-pupil-register-0001',
        commandType: 'pupil.register',
        schemaVersion: 1,
        payload: { classId, pupilId: pupilC, displayName: 'Synthetic Three' },
      },
      {
        idempotencyKey: 'sync-attendance-0001',
        commandType: 'attendance.submit',
        schemaVersion: 1,
        payload: {
          classId,
          schoolDate: '2026-11-21',
          entries: [
            { pupilId: pupilA, status: 'present' },
            { pupilId: pupilB, status: 'present' },
            { pupilId: pupilC, status: 'present' },
          ],
        },
      },
      {
        idempotencyKey: 'sync-progress-0001',
        commandType: 'progress.upsert',
        schemaVersion: 1,
        payload: {
          pupilId: pupilB,
          classId,
          periodStart: '2026-11-23',
          periodEnd: '2026-11-27',
          subjectId: 'basic_science',
          indicator: 'developing',
          teacherNote: 'Names sources with prompting.',
        },
      },
      {
        idempotencyKey: 'sync-message-0001',
        commandType: 'message.reply',
        schemaVersion: 1,
        payload: {
          conversationId,
          body: 'Synthetic sync reply.',
          locale: 'en',
          clientMessageId: 'sync-client-message-0001',
        },
      },
    ];

    const first = await syncFn({
      workspaceId,
      idempotencyKey: 'sync-batch-e2e-0001',
      schemaVersion: 1,
      payload: { commands },
    }, auth);
    const firstResults = first.results as Array<Record<string, unknown>>;
    expect(firstResults.map((item) => item.outcome)).toEqual(['accepted', 'accepted', 'accepted', 'accepted', 'accepted']);

    const second = await syncFn({
      workspaceId,
      idempotencyKey: 'sync-batch-e2e-0002',
      schemaVersion: 1,
      payload: { commands },
    }, auth);
    const secondResults = second.results as Array<Record<string, unknown>>;
    expect(secondResults.map((item) => item.outcome)).toEqual(['alreadyApplied', 'alreadyApplied', 'alreadyApplied', 'alreadyApplied', 'alreadyApplied']);

    const rejected = await syncFn({
      workspaceId,
      idempotencyKey: 'sync-batch-e2e-0003',
      schemaVersion: 1,
      payload: {
        commands: [{
          idempotencyKey: 'sync-unsupported-0001',
          commandType: 'lesson.archive',
          schemaVersion: 1,
          payload: {},
        }],
      },
    }, auth);
    const rejectedResults = rejected.results as Array<Record<string, unknown>>;
    expect(rejectedResults[0].outcome).toBe('rejected');
    expect(rejectedResults[0].errorCode).toBe('COMMAND_NOT_SUPPORTED');
  });

  it('syncs lesson, assessment and follow-up records and rejects a stale assessment version', async () => {
    const base = {
      schemaVersion: 1,
    };
    const assessmentPayload = {
      assessmentId: 'assessment_sync0001',
      classId,
      pupilId: pupilA,
      subjectId: 'basic_science',
      objectiveId: 'water_sources',
      objectiveLabel: 'Water sources and uses',
      score: 72,
      maxScore: 100,
      schoolDate: '2026-11-26',
      teacherNote: 'Recorded during the evidence sync test.',
    };
    const commands = [
      {
        ...base,
        idempotencyKey: 'sync-lesson-upsert-0001',
        commandType: 'lesson.upsert',
        payload: {
          lessonId: 'lesson_sync0001',
          classId,
          gradeLevel: 'P4',
          subjectId: 'basic_science',
          title: 'Evidence-informed water lesson',
          objective: 'Re-teach water sources with local examples.',
          engage: 'Show a cup of water.',
          explore: 'Pairs sort sources and uses.',
          explain: 'Model source, use, clean and safe.',
          elaborate: 'Plan one safe-water habit.',
          evaluate: 'Exit ticket with two sources.',
          materials: 'Cup, picture cards, chalkboard',
          status: 'draft',
        },
      },
      {
        ...base,
        idempotencyKey: 'sync-assessment-0001',
        commandType: 'assessment.record',
        payload: assessmentPayload,
      },
      {
        ...base,
        idempotencyKey: 'sync-followup-0001',
        commandType: 'followup.upsert',
        payload: {
          followUpId: 'followup_sync0001',
          classId,
          pupilId: pupilA,
          title: 'Check water-source understanding',
          detail: 'Use a concrete sorting activity and record a new observation.',
          dueDate: '2026-12-02',
          source: 'assessment',
          sourceId: 'assessment_sync0001',
        },
      },
      {
        ...base,
        idempotencyKey: 'sync-followup-status-0001',
        commandType: 'followup.status',
        payload: { followUpId: 'followup_sync0001', status: 'done' },
      },
    ];

    const applied = await syncFn({
      workspaceId,
      idempotencyKey: 'sync-evidence-batch-e2e-0001',
      schemaVersion: 1,
      payload: { commands },
    }, auth);
    const appliedResults = applied.results as Array<Record<string, unknown>>;
    expect(appliedResults.map((item) => item.outcome)).toEqual(['accepted', 'accepted', 'accepted', 'accepted']);

    const workspaceRef = db.collection('workspaces').doc(workspaceId);
    const lesson = await workspaceRef.collection('lessonPlans').doc('lesson_sync0001').get();
    expect(lesson.data()?.title).toBe('Evidence-informed water lesson');
    expect(lesson.data()?.version).toBe(1);
    const assessment = await workspaceRef.collection('assessments').doc('assessment_sync0001').get();
    expect(assessment.data()?.score).toBe(72);
    expect(assessment.data()?.version).toBe(1);
    const followUp = await workspaceRef.collection('followUps').doc('followup_sync0001').get();
    expect(followUp.data()?.status).toBe('done');
    expect(followUp.data()?.completedAt).toBeTruthy();

    const updatedAssessment = await syncFn({
      workspaceId,
      idempotencyKey: 'sync-evidence-batch-e2e-0002',
      schemaVersion: 1,
      payload: {
        commands: [{
          ...base,
          idempotencyKey: 'sync-assessment-update-0001',
          commandType: 'assessment.record',
          payload: { ...assessmentPayload, score: 78, expectedVersion: 1 },
        }],
      },
    }, auth);
    expect((updatedAssessment.results as Array<Record<string, unknown>>)[0].outcome).toBe('accepted');
    const refreshed = await workspaceRef.collection('assessments').doc('assessment_sync0001').get();
    expect(refreshed.data()?.score).toBe(78);
    expect(refreshed.data()?.version).toBe(2);

    const staleAssessment = await syncFn({
      workspaceId,
      idempotencyKey: 'sync-evidence-batch-e2e-0003',
      schemaVersion: 1,
      payload: {
        commands: [{
          ...base,
          idempotencyKey: 'sync-assessment-stale-0001',
          commandType: 'assessment.record',
          payload: { ...assessmentPayload, score: 40, expectedVersion: 1 },
        }],
      },
    }, auth);
    const staleResult = (staleAssessment.results as Array<Record<string, unknown>>)[0];
    expect(staleResult.outcome).toBe('conflict');
    const afterStale = await workspaceRef.collection('assessments').doc('assessment_sync0001').get();
    expect(afterStale.data()?.score).toBe(78);
    expect(afterStale.data()?.version).toBe(2);
  });

  it('verifies a signed inbound SMS, routes it and deduplicates the event', async () => {
    const payload = {
      eventId: 'evt-e2e-0001',
      from: '+2348031234567',
      text: `TINY ${schoolCode} Good morning, a question about homework.`,
    };
    const raw = JSON.stringify(payload);
    const signature = createHmac('sha256', process.env.ESMS_WEBHOOK_SECRET as string).update(raw).digest('hex');

    const invoke = async () => {
      const req = createRequest({
        method: 'POST',
        url: '/esmsInbound',
        body: payload,
        headers: { 'x-webhook-signature': signature },
      });
      (req as unknown as { rawBody: Buffer }).rawBody = Buffer.from(raw);
      const res = createResponse();
      const handler = esmsInbound as unknown as (request: unknown, response: unknown) => Promise<void>;
      await handler(req, res);
      return res;
    };

    const first = await invoke();
    expect(first.statusCode).toBe(200);
    expect(first._getJSONData().ok).toBe(true);

    const conversation = await db.collection('workspaces').doc(workspaceId).collection('conversations')
      .doc(`${workspaceId}_${guardianId}`).get();
    expect(conversation.exists).toBe(true);
    expect(conversation.data()?.classId).toBe(classId);
    const messages = await conversation.ref.collection('messages').get();
    expect(messages.size).toBe(1);
    expect(messages.docs[0].data().body).toContain('question about homework');

    const duplicate = await invoke();
    expect(duplicate.statusCode).toBe(200);
    expect(duplicate._getJSONData().duplicate).toBe(true);
    const afterDuplicate = await conversation.ref.collection('messages').get();
    expect(afterDuplicate.size).toBe(1);
  });

  it('creates a weekly digest job for approved progress only', async () => {
    const wrapped = wrapV2(runWeeklyDigests as never) as unknown as (event: unknown) => Promise<void>;
    await wrapped({});
    const jobs = await db.collection('workspaces').doc(workspaceId).collection('notificationJobs')
      .where('type', '==', 'weekly_digest').get();
    expect(jobs.size).toBe(1);
    expect(jobs.docs[0].data().status).toBe('queued');
    expect(jobs.docs[0].data().mode).toBe('mock');
  });
});
