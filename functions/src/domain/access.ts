import { DomainError, type MembershipRecord } from '../shared/contracts';

export function isAdmin(membership: MembershipRecord): boolean {
  return membership.role === 'school_admin';
}

export function canManageWorkspace(membership: MembershipRecord): boolean {
  return membership.status === 'active' && isAdmin(membership);
}

export function canAccessClass(membership: MembershipRecord, classId: string): boolean {
  if (membership.status !== 'active') return false;
  if (isAdmin(membership)) return true;
  return membership.assignedClassIds.includes(classId);
}

export function assertActiveMembership(membership: MembershipRecord | null | undefined): MembershipRecord {
  if (!membership || membership.status !== 'active') {
    throw new DomainError('PERMISSION_DENIED', 'Active workspace membership is required.');
  }
  return membership;
}

export function assertAdmin(membership: MembershipRecord): void {
  assertActiveMembership(membership);
  if (!isAdmin(membership)) {
    throw new DomainError('PERMISSION_DENIED', 'School administrator permission is required.');
  }
}

export function assertClassAccess(membership: MembershipRecord, classId: string): void {
  assertActiveMembership(membership);
  if (!canAccessClass(membership, classId)) {
    throw new DomainError('PERMISSION_DENIED', 'Class access is required.');
  }
}
