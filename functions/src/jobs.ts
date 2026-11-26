import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from './shared/firebase';
import { COLLECTIONS, REGION } from './shared/contracts';
import { buildDigest, type DigestPupil } from './domain/digest';

/**
 * Creates digest jobs for approved progress in each workspace.
 *
 * This is deliberately conservative: it only reads a bounded page of
 * workspaces and only includes teacher-approved, non-not-assessed entries.
 * It never sends SMS; the mock/sandbox outbox drain is a separate gate.
 */
export const runWeeklyDigests = onSchedule(
  {
    schedule: '0 15 * * 5',
    timeZone: 'Africa/Lagos',
    region: REGION,
  },
  async () => {
    const workspaces = await db.collection(COLLECTIONS.workspaces).limit(50).get();
    let created = 0;
    for (const workspace of workspaces.docs) {
      const workspaceData = workspace.data();
      const progress = await workspace.ref.collection(COLLECTIONS.progressEntries)
        .where('approvalStatus', '==', 'approved')
        .limit(100)
        .get();
      const byGuardian = new Map<string, DigestPupil[]>();
      for (const entry of progress.docs) {
        const data = entry.data();
        if (data.indicator === 'not_assessed') continue;
        const links = await workspace.ref.collection(COLLECTIONS.links)
          .where('pupilId', '==', data.pupilId)
          .where('status', '==', 'active')
          .limit(10)
          .get();
        for (const link of links.docs) {
          const guardianId = String(link.data().guardianId ?? '');
          if (!guardianId) continue;
          const guardian = await workspace.ref.collection(COLLECTIONS.guardians).doc(guardianId).get();
          const g = guardian.data();
          if (!g || g.verificationStatus !== 'verified' || g.consentStatus !== 'opted_in') continue;
          const list = byGuardian.get(guardianId) ?? [];
          list.push({
            displayName: String(data.pupilId),
            indicator: data.indicator,
            note: data.teacherNote ?? undefined,
            homeActivity: data.homeActivity ?? undefined,
          });
          byGuardian.set(guardianId, list);
        }
      }
      for (const [guardianId, pupils] of byGuardian) {
        const digest = buildDigest({
          guardianId,
          workspaceName: String(workspaceData.name ?? 'School'),
          locale: 'en',
          pupils,
        });
        const jobId = `digest_${workspace.id}_${guardianId}_${new Date().toISOString().slice(0, 10)}`;
        await workspace.ref.collection(COLLECTIONS.notificationJobs).doc(jobId).set({
          notificationJobId: jobId,
          workspaceId: workspace.id,
          type: 'weekly_digest',
          guardianId,
          pupilIds: [],
          locale: 'en',
          templateId: 'digest_v1',
          idempotencyKey: jobId,
          contentPayload: digest,
          segmentEstimate: Math.max(1, Math.ceil(digest.length / 160)),
          status: 'queued',
          attemptCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          mode: 'mock',
        }, { merge: true });
        created += 1;
      }
    }
    logger.info('Weekly digest jobs prepared', { created, mode: 'mock' });
  },
);
