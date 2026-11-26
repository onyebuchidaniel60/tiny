import type { CallableRequest } from 'firebase-functions/v2/https';
import { db } from './firebase';
import { COLLECTIONS, DomainError, type MembershipRecord } from './contracts';

export function requireAuth(request: CallableRequest): string {
  const uid = request.auth?.uid;
  if (!uid) throw new DomainError('AUTH_REQUIRED', 'Sign-in is required.');
  return uid;
}

export async function getMembership(workspaceId: string, uid: string): Promise<MembershipRecord | null> {
  const snap = await db.collection(COLLECTIONS.workspaces).doc(workspaceId).collection(COLLECTIONS.members).doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as Partial<MembershipRecord>;
  if (!data.role || !data.status) return null;
  return {
    workspaceId,
    uid,
    role: data.role,
    status: data.status,
    assignedClassIds: data.assignedClassIds ?? [],
    version: data.version ?? 1,
  };
}

export async function requireMembership(workspaceId: string, uid: string): Promise<MembershipRecord> {
  const membership = await getMembership(workspaceId, uid);
  if (!membership || membership.status !== 'active') {
    throw new DomainError('PERMISSION_DENIED', 'Active workspace membership is required.');
  }
  return membership;
}

export async function requireAdmin(workspaceId: string, uid: string): Promise<MembershipRecord> {
  const membership = await requireMembership(workspaceId, uid);
  if (membership.role !== 'school_admin') throw new DomainError('PERMISSION_DENIED', 'School administrator permission is required.');
  return membership;
}

export async function requireManager(workspaceId: string, uid: string): Promise<MembershipRecord> {
  const membership = await requireMembership(workspaceId, uid);
  const workspace = await db.collection(COLLECTIONS.workspaces).doc(workspaceId).get();
  if (membership.role !== 'school_admin' && workspace.data()?.ownerUid !== uid) {
    throw new DomainError('PERMISSION_DENIED', 'Workspace management permission is required.');
  }
  return membership;
}

export async function requireClassAccess(workspaceId: string, uid: string, classId: string): Promise<MembershipRecord> {
  const membership = await requireMembership(workspaceId, uid);
  if (membership.role !== 'school_admin' && !membership.assignedClassIds.includes(classId)) {
    throw new DomainError('PERMISSION_DENIED', 'Class access is required.');
  }
  return membership;
}
