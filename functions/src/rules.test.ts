import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-tiny-rules',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'workspaces/ws1'), { workspaceId: 'ws1', name: 'Demo', type: 'school' });
    await setDoc(doc(db, 'workspaces/ws1/members/admin1'), { uid: 'admin1', role: 'school_admin', status: 'active' });
    await setDoc(doc(db, 'workspaces/ws1/members/teacher1'), {
      uid: 'teacher1', role: 'teacher', status: 'active', assignedClassIds: ['class1'],
    });
    await setDoc(doc(db, 'workspaces/ws1/classes/class1'), { assignedTeacherUids: ['teacher1'] });
    await setDoc(doc(db, 'workspaces/ws1/classes/class2'), { assignedTeacherUids: ['otherTeacher'] });
    await setDoc(doc(db, 'workspaces/ws1/pupils/pupil1'), { classId: 'class1', displayName: 'Synthetic Pupil' });
    await setDoc(doc(db, 'workspaces/ws1/pupils/pupil2'), { classId: 'class2', displayName: 'Other Pupil' });
    await setDoc(doc(db, 'workspaces/ws1/guardians/guardian1'), { displayName: 'Synthetic Guardian' });
  });
});

describe('Tiny Firestore rules', () => {
  it('denies unauthenticated workspace reads', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'workspaces/ws1')));
  });

  it('allows active members to read workspace metadata', async () => {
    const db = testEnv.authenticatedContext('teacher1').firestore();
    await assertSucceeds(getDoc(doc(db, 'workspaces/ws1')));
  });

  it('denies non-members', async () => {
    const db = testEnv.authenticatedContext('outsider').firestore();
    await assertFails(getDoc(doc(db, 'workspaces/ws1')));
  });

  it('denies all direct client writes', async () => {
    const db = testEnv.authenticatedContext('admin1').firestore();
    await assertFails(setDoc(doc(db, 'workspaces/ws1/pupils/pupil1'), { displayName: 'Tampered' }));
    await assertFails(setDoc(doc(db, 'workspaces/ws1/guardians/guardian1'), { displayName: 'Tampered' }));
  });

  it('scopes pupil reads to the assigned class', async () => {
    const db = testEnv.authenticatedContext('teacher1').firestore();
    await assertSucceeds(getDoc(doc(db, 'workspaces/ws1/pupils/pupil1')));
    await assertFails(getDoc(doc(db, 'workspaces/ws1/pupils/pupil2')));
  });

  it('restricts guardian contact reads to administrators', async () => {
    const adminDb = testEnv.authenticatedContext('admin1').firestore();
    const teacherDb = testEnv.authenticatedContext('teacher1').firestore();
    await assertSucceeds(getDoc(doc(adminDb, 'workspaces/ws1/guardians/guardian1')));
    await assertFails(getDoc(doc(teacherDb, 'workspaces/ws1/guardians/guardian1')));
  });
});
