import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, isEmulatorMode } from '../firebase/config';
import { useAuth } from '../firebase/auth';
import { useI18n } from '../i18n';
import { seedState } from '../data/seed';
import { clearLocalData, loadState, saveState } from '../data/db';
import { validateAttendance } from '../domain';
import type {
  AppState,
  AttendanceEntry,
  AttendanceSession,
  AttendanceStatus,
  Classroom,
  Conversation,
  Guardian,
  LessonPlan,
  Message,
  OutboxCommand,
  ProgressEntry,
  Pupil,
  PupilGuardianLink,
  WebSettings,
  Workspace,
  Assessment,
  FollowUp,
  AiAnalysis,
} from '../types';

const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
const now = () => new Date().toISOString();

interface StoreValue {
  state: AppState;
  ready: boolean;
  message: string | null;
  syncing: boolean;
  clearMessage: () => void;
  setMessage: (message: string | null) => void;
  addClass: (gradeLevel: string, sectionLabel: string, academicYear: string, subjectIds: string[]) => Classroom;
  addPupil: (classId: string, displayName: string, localCode: string) => Pupil;
  addGuardian: (displayName: string, phoneE164: string, locale: Guardian['preferredLocale']) => Guardian;
  linkGuardian: (pupilId: string, guardianId: string, relationshipLabel: string) => void;
  saveAttendance: (classId: string, schoolDate: string, entries: AttendanceEntry[], submit: boolean) => void;
  saveLesson: (lesson: Omit<LessonPlan, 'id' | 'workspaceId' | 'updatedAt' | 'version'> & { id?: string }) => LessonPlan;
  saveProgress: (entry: Omit<ProgressEntry, 'id' | 'workspaceId' | 'updatedAt' | 'revision'> & { id?: string }, approve?: boolean) => ProgressEntry;
  approveProgress: (entryId: string) => void;
  addAssessment: (input: {
    classId: string;
    pupilId: string;
    subjectId: string;
    objectiveId: string;
    objectiveLabel: string;
    score: number;
    maxScore: number;
    schoolDate: string;
    teacherNote: string;
  }) => Assessment;
  addFollowUp: (input: Omit<FollowUp, 'id' | 'workspaceId' | 'createdAt' | 'status'> & { status?: FollowUp['status'] }) => FollowUp;
  updateFollowUpStatus: (followUpId: string, status: FollowUp['status']) => void;
  saveAiAnalysis: (analysis: AiAnalysis) => void;
  sendMessage: (conversationId: string, body: string) => void;
  queueParentUpdate: (pupilId: string, body: string) => void;
  receiveGuardianMessage: (conversationId: string, body: string, broadcast?: boolean) => void;
  receiveTeacherMessage: (conversationId: string, body: string, broadcast?: boolean) => void;
  syncNow: () => Promise<void>;
  refreshRemote: () => Promise<void>;
  updateSettings: (settings: Partial<WebSettings>) => void;
  resetDemo: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((candidate) => candidate.id === item.id);
  if (index < 0) return [...items, item];
  const copy = [...items];
  copy[index] = item;
  return copy;
}

/**
 * Remote is authoritative for saved records, but a local record that is still
 * waiting in the outbox must remain visible and must not be silently replaced
 * by an older remote copy. Unrelated remote records always survive the merge.
 */
function mergePending<T extends { id: string }>(
  remote: T[],
  local: T[],
  pendingIds: Set<string>,
): T[] {
  const merged = new Map(remote.map((item) => [item.id, item]));
  for (const item of local) {
    if (pendingIds.has(item.id) || !merged.has(item.id)) merged.set(item.id, item);
  }
  return [...merged.values()];
}

function pendingEntityIds(outbox: OutboxCommand[]): Set<string> {
  const ids = new Set<string>();
  const keys = ['classId', 'pupilId', 'guardianId', 'lessonId', 'progressEntryId', 'assessmentId', 'followUpId', 'conversationId'];
  for (const command of outbox) {
    if (command.state !== 'pending' && command.state !== 'retryable' && command.state !== 'conflict') continue;
    for (const key of keys) {
      const value = command.payload[key];
      if (typeof value === 'string' && value) ids.add(value);
    }
    if (command.commandType === 'attendance.submit') {
      const classId = command.payload.classId;
      const schoolDate = command.payload.schoolDate;
      if (typeof classId === 'string' && typeof schoolDate === 'string') ids.add(`${classId}_${schoolDate}`);
    }
  }
  return ids;
}

function remoteString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function remoteNumber(value: unknown, fallback = 1): number {
  return typeof value === 'number' ? value : fallback;
}

function remoteStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function remoteDate(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === 'string' ? value : now();
}

async function readRemote(uid: string): Promise<Partial<AppState> | null> {
  if (!db) return null;
  const indexSnap = await getDocs(collection(db, 'users', uid, 'workspaces'));
  if (indexSnap.empty) return null;
  const workspaceId = indexSnap.docs[0].id;
  const workspaceSnap = await getDoc(doc(db, 'workspaces', workspaceId));
  if (!workspaceSnap.exists()) return null;
  const data = workspaceSnap.data();
  const workspace: Workspace = {
    id: workspaceId,
    // The project's non-production evaluation workspace was seeded with a
    // development label. Present the same sample school without that label.
    name: ['Tiny Synthetic E2E', 'Tiny Web Demo Primary', 'Kofar Demo Primary'].includes(remoteString(data.name, 'Workspace'))
      ? 'Kofar Primary'
      : remoteString(data.name, 'Workspace'),
    type: data.type === 'independent' ? 'independent' : 'school',
    schoolCode: remoteString(data.schoolCode, '--------'),
    verificationStatus: remoteString(data.verificationStatus, 'active_unverified'),
    version: remoteNumber(data.version),
  };

  const [classesSnap, pupilsSnap, guardiansSnap, linksSnap, lessonsSnap, progressSnap, assessmentsSnap, followUpsSnap, conversationsSnap] = await Promise.all([
    getDocs(collection(db, 'workspaces', workspaceId, 'classes')),
    getDocs(collection(db, 'workspaces', workspaceId, 'pupils')),
    getDocs(collection(db, 'workspaces', workspaceId, 'guardians')),
    getDocs(collection(db, 'workspaces', workspaceId, 'pupilGuardianLinks')),
    getDocs(collection(db, 'workspaces', workspaceId, 'lessonPlans')),
    getDocs(collection(db, 'workspaces', workspaceId, 'progressEntries')),
    getDocs(collection(db, 'workspaces', workspaceId, 'assessments')),
    getDocs(collection(db, 'workspaces', workspaceId, 'followUps')),
    getDocs(collection(db, 'workspaces', workspaceId, 'conversations')),
  ]);

  const classes: Classroom[] = classesSnap.docs.map((item) => {
    const row = item.data();
    return {
      id: item.id,
      workspaceId,
      gradeLevel: remoteString(row.gradeLevel, 'P?'),
      sectionLabel: remoteString(row.sectionLabel, ''),
      academicYear: remoteString(row.academicYear, ''),
      subjectIds: remoteStrings(row.subjectIds),
      teacherName: remoteString(row.teacherName, 'Teacher'),
      assignedTeacherUids: remoteStrings(row.assignedTeacherUids),
      version: remoteNumber(row.version),
    };
  });

  const pupils: Pupil[] = pupilsSnap.docs.map((item) => {
    const row = item.data();
    return {
      id: item.id,
      workspaceId,
      classId: remoteString(row.classId),
      displayName: remoteString(row.displayName, 'Pupil'),
      localPupilCode: remoteString(row.localPupilCode),
      enrollmentStatus: row.enrollmentStatus === 'inactive' ? 'inactive' : 'active',
      version: remoteNumber(row.version),
    };
  });

  const guardians: Guardian[] = guardiansSnap.docs.map((item) => {
    const row = item.data();
    return {
      id: item.id,
      workspaceId,
      displayName: remoteString(row.displayName, 'Guardian'),
      phoneE164: remoteString(row.phoneE164),
      preferredLocale: (['en', 'ha', 'yo', 'ig', 'pcm'].includes(row.preferredLocale) ? row.preferredLocale : 'en') as Guardian['preferredLocale'],
      verificationStatus: row.verificationStatus === 'verified' ? 'verified' : 'pending',
      consentStatus: row.consentStatus === 'opted_in' ? 'opted_in' : row.consentStatus === 'opted_out' ? 'opted_out' : 'pending',
      classIds: remoteStrings(row.classIds),
      pupilIds: remoteStrings(row.pupilIds),
    };
  });

  const links: PupilGuardianLink[] = linksSnap.docs.map((item) => {
    const row = item.data();
    return {
      id: item.id,
      workspaceId,
      pupilId: remoteString(row.pupilId),
      guardianId: remoteString(row.guardianId),
      relationshipLabel: remoteString(row.relationshipLabel, 'Guardian'),
      classId: remoteString(row.classId),
      notificationEligible: row.notificationEligible !== false,
    };
  });

  const lessons: LessonPlan[] = lessonsSnap.docs.map((item) => {
    const row = item.data();
    return {
      id: item.id,
      workspaceId,
      classId: remoteString(row.classId),
      title: remoteString(row.title, 'Untitled lesson'),
      gradeLevel: remoteString(row.gradeLevel, 'P?'),
      subjectId: remoteString(row.subjectId, 'basic_science'),
      objective: remoteString(row.objective),
      engage: remoteString(row.engage),
      explore: remoteString(row.explore),
      explain: remoteString(row.explain),
      elaborate: remoteString(row.elaborate),
      evaluate: remoteString(row.evaluate),
      materials: remoteString(row.materials),
      status: row.status === 'draft' ? 'draft' : 'ready',
      updatedAt: remoteDate(row.updatedAt),
      version: remoteNumber(row.version),
    };
  });

  const progress: ProgressEntry[] = progressSnap.docs.map((item) => {
    const row = item.data();
    return {
      id: item.id,
      workspaceId,
      pupilId: remoteString(row.pupilId),
      classId: remoteString(row.classId),
      periodStart: remoteString(row.periodStart),
      periodEnd: remoteString(row.periodEnd),
      subjectId: remoteString(row.subjectId, 'basic_science'),
      objectiveId: remoteString(row.objectiveId) || undefined,
      indicator: (['doing_well', 'developing', 'needs_support', 'not_assessed'].includes(row.indicator) ? row.indicator : 'developing') as ProgressEntry['indicator'],
      teacherNote: remoteString(row.teacherNote),
      homeActivity: remoteString(row.homeActivity),
      approvalStatus: row.approvalStatus === 'approved' ? 'approved' : 'draft',
      revision: remoteNumber(row.revision),
      updatedAt: remoteDate(row.updatedAt),
    };
  });

  const assessments: Assessment[] = assessmentsSnap.docs.map((item) => {
    const row = item.data();
    return {
      id: item.id,
      workspaceId,
      classId: remoteString(row.classId),
      pupilId: remoteString(row.pupilId),
      subjectId: remoteString(row.subjectId, 'basic_science'),
      objectiveId: remoteString(row.objectiveId),
      objectiveLabel: remoteString(row.objectiveLabel),
      score: remoteNumber(row.score),
      maxScore: remoteNumber(row.maxScore, 100),
      schoolDate: remoteString(row.schoolDate),
      teacherNote: remoteString(row.teacherNote),
      createdAt: remoteDate(row.createdAt),
      updatedAt: remoteDate(row.updatedAt),
      version: remoteNumber(row.version, 1),
    };
  });

  const followUps: FollowUp[] = followUpsSnap.docs.map((item) => {
    const row = item.data();
    return {
      id: item.id,
      workspaceId,
      classId: remoteString(row.classId),
      pupilId: remoteString(row.pupilId) || undefined,
      title: remoteString(row.title),
      detail: remoteString(row.detail),
      dueDate: remoteString(row.dueDate),
      status: (['open', 'done', 'dismissed'].includes(row.status) ? row.status : 'open') as FollowUp['status'],
      source: (['attendance', 'assessment', 'observation', 'message', 'manual', 'ai'].includes(row.source) ? row.source : 'manual') as FollowUp['source'],
      sourceId: remoteString(row.sourceId) || undefined,
      createdAt: remoteDate(row.createdAt),
      completedAt: row.completedAt ? remoteDate(row.completedAt) : undefined,
      updatedAt: remoteDate(row.updatedAt),
      version: remoteNumber(row.version, 1),
    };
  });

  const attendanceSessionsSnap = await getDocs(collection(db, 'workspaces', workspaceId, 'attendanceSessions'));
  const attendance: AttendanceSession[] = [];
  for (const item of attendanceSessionsSnap.docs) {
    const row = item.data();
    const entriesSnap = await getDocs(query(
      collection(db, 'workspaces', workspaceId, 'attendanceEntries'),
      where('sessionId', '==', item.id),
    ));
    const entries: AttendanceEntry[] = entriesSnap.docs.map((entry) => {
      const entryRow = entry.data();
      const status = entryRow.status === 'absent' ? 'absent' : entryRow.status === 'late' ? 'late' : 'present';
      return { pupilId: remoteString(entryRow.pupilId), status: status as AttendanceStatus };
    });
    attendance.push({
      id: item.id,
      workspaceId,
      classId: remoteString(row.classId),
      schoolDate: remoteString(row.schoolDate),
      status: row.status === 'submitted' ? 'submitted' : 'draft',
      entries,
      updatedAt: remoteDate(row.updatedAt),
      version: remoteNumber(row.version),
    });
  }

  const conversations: Conversation[] = conversationsSnap.docs.map((item) => {
    const row = item.data();
    return {
      id: item.id,
      workspaceId,
      guardianId: remoteString(row.guardianId),
      pupilId: remoteString(row.pupilId),
      classId: remoteString(row.classId),
      status: row.status === 'waiting_parent' ? 'waiting_parent' : 'waiting_teacher',
      lastMessageAt: remoteDate(row.lastMessageAt),
      unread: remoteNumber(row.unread, 0),
    };
  });

  const messages: Message[] = [];
  for (const conversation of conversations) {
    const messagesSnap = await getDocs(collection(db, 'workspaces', workspaceId, 'conversations', conversation.id, 'messages'));
    for (const item of messagesSnap.docs) {
      const row = item.data();
      messages.push({
        id: item.id,
        conversationId: conversation.id,
        workspaceId,
        direction: row.direction === 'inbound' ? 'inbound' : 'outbound',
        body: remoteString(row.body),
        status: row.status === 'received' ? 'received' : row.status === 'failed' ? 'failed' : row.status === 'queued' ? 'queued' : 'mock_sent',
        provider: row.provider === 'esms' ? 'esms' : 'mock',
        createdAt: remoteDate(row.createdAt),
      });
    }
  }

  return {
    mode: 'firebase',
    workspace,
    classes,
    pupils,
    guardians,
    links,
    attendance,
    lessons,
    progress,
    assessments,
    followUps,
    conversations,
    messages,
    lastRemoteSyncAt: now(),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, mode: authMode } = useAuth();
  const { t } = useI18n();
  const remoteSyncUnavailable = t('sync_unavailable');
  const [state, setState] = useState<AppState>(seedState);
  const stateRef = useRef(state);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadState().then((saved) => {
      if (!mounted) return;
      if (saved && saved.version === 1) setState(saved);
      setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const update = (producer: (current: AppState) => AppState) => {
    // Compute and persist the next state at action time. This protects an edit
    // that is immediately followed by navigation, refresh or a dropped network.
    const next = producer(structuredClone(stateRef.current));
    stateRef.current = next;
    setState(next);
    void saveState(next);
  };

  const refreshRemote = async () => {
    if (!user || !db) return;
    try {
      const remote = await readRemote(user.uid);
      if (!remote) {
        setMessage(t('storage_no_remote'));
        return;
      }
      update((current) => {
        const pendingIds = pendingEntityIds(current.outbox);
        return {
          ...current,
          ...remote,
          classes: mergePending(remote.classes ?? [], current.classes, pendingIds),
          pupils: mergePending(remote.pupils ?? [], current.pupils, pendingIds),
          guardians: mergePending(remote.guardians ?? [], current.guardians, pendingIds),
          links: mergePending(remote.links ?? [], current.links, pendingIds),
          lessons: mergePending(remote.lessons ?? [], current.lessons, pendingIds),
          progress: mergePending(remote.progress ?? [], current.progress, pendingIds),
          assessments: mergePending(remote.assessments ?? [], current.assessments, pendingIds),
          followUps: mergePending(remote.followUps ?? [], current.followUps, pendingIds),
          attendance: mergePending(remote.attendance ?? [], current.attendance, pendingIds),
          outbox: current.outbox,
          settings: current.settings,
          aiAnalyses: current.aiAnalyses,
          version: 1,
          workspace: remote.workspace ?? current.workspace,
        };
      });
      setMessage(t('storage_remote_loaded'));
    } catch {
      setMessage(t('storage_bootstrap_failed'));
    }
  };

  useEffect(() => {
    if (ready && authMode === 'firebase' && user) {
      void refreshRemote();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authMode, user?.uid]);

  const enqueue = (current: AppState, commandType: string, payload: Record<string, unknown>): OutboxCommand => {
    const command: OutboxCommand = {
      id: id('outbox'),
      workspaceId: current.workspace.id,
      commandType,
      payload,
      idempotencyKey: `web-${commandType}-${crypto.randomUUID()}`,
      state: 'pending',
      attempts: 0,
      nextAttemptAt: null,
      lastError: isEmulatorMode ? null : remoteSyncUnavailable,
      createdAt: now(),
    };
    current.outbox.push(command);
    return command;
  };

  const addClass: StoreValue['addClass'] = (gradeLevel, sectionLabel, academicYear, subjectIds) => {
    const classroom: Classroom = {
      id: id('class'),
      workspaceId: state.workspace.id,
      gradeLevel,
      sectionLabel,
      academicYear,
      subjectIds,
      teacherName: 'Ms. Bello',
      assignedTeacherUids: [user?.uid ?? 'local-teacher'],
      version: 1,
    };
    update((current) => {
      current.classes.push(classroom);
      enqueue(current, 'class.create', {
        classId: classroom.id,
        gradeLevel,
        sectionLabel,
        academicYear,
        subjectIds,
      });
      return current;
    });
    setMessage(t('class_saved_local'));
    return classroom;
  };

  const addPupil: StoreValue['addPupil'] = (classId, displayName, localCode) => {
    const pupil: Pupil = {
      id: id('pupil'),
      workspaceId: state.workspace.id,
      classId,
      displayName,
      localPupilCode: localCode,
      enrollmentStatus: 'active',
      version: 1,
    };
    update((current) => {
      current.pupils.push(pupil);
      enqueue(current, 'pupil.register', { classId, pupilId: pupil.id, displayName, localPupilCode: localCode });
      return current;
    });
    setMessage(t('pupil_saved_local'));
    return pupil;
  };

  const addGuardian: StoreValue['addGuardian'] = (displayName, phoneE164, locale) => {
    const guardian: Guardian = {
      id: id('guardian'),
      workspaceId: state.workspace.id,
      displayName,
      phoneE164,
      preferredLocale: locale,
      verificationStatus: 'pending',
      consentStatus: 'pending',
      classIds: [],
      pupilIds: [],
    };
    update((current) => {
      current.guardians.push(guardian);
      enqueue(current, 'guardian.upsert', {
        guardianId: guardian.id,
        displayName,
        phoneE164,
        preferredLocale: locale,
      });
      return current;
    });
    setMessage(t('guardian_saved'));
    return guardian;
  };

  const linkGuardian: StoreValue['linkGuardian'] = (pupilId, guardianId, relationshipLabel) => {
    const pupil = state.pupils.find((item) => item.id === pupilId);
    const guardian = state.guardians.find((item) => item.id === guardianId);
    if (!pupil || !guardian) throw new Error(t('pupil_guardian_required'));
    const link: PupilGuardianLink = {
      id: id('link'),
      workspaceId: state.workspace.id,
      pupilId,
      guardianId,
      relationshipLabel,
      classId: pupil.classId,
      notificationEligible: true,
    };
    update((current) => {
      current.links.push(link);
      const target = current.guardians.find((item) => item.id === guardianId);
      if (target) {
        if (!target.pupilIds.includes(pupilId)) target.pupilIds.push(pupilId);
        if (!target.classIds.includes(pupil.classId)) target.classIds.push(pupil.classId);
      }
      enqueue(current, 'guardian.link', { pupilId, guardianId, relationshipLabel, notificationEligible: true });
      return current;
    });
    setMessage(t('guardian_link_saved'));
  };

  const saveAttendance: StoreValue['saveAttendance'] = (classId, schoolDate, entries, submit) => {
    const active = state.pupils.filter((pupil) => pupil.classId === classId && pupil.enrollmentStatus === 'active');
    if (submit) {
      const validation = validateAttendance(active.map((pupil) => pupil.id), entries);
      if (!validation.valid) {
        throw new Error(t('attendance_submit_incomplete', { count: active.length }));
      }
    }
    const session: AttendanceSession = {
      id: `${classId}_${schoolDate}`,
      workspaceId: state.workspace.id,
      classId,
      schoolDate,
      status: submit ? 'submitted' : 'draft',
      entries,
      updatedAt: now(),
      version: 1,
    };
    update((current) => {
      current.attendance = upsert(current.attendance, session);
      if (submit) enqueue(current, 'attendance.submit', { classId, schoolDate, entries });
      return current;
    });
    setMessage(submit ? t('attendance_submitted_body') : t('attendance_saved'));
  };

  const saveLesson: StoreValue['saveLesson'] = (lesson) => {
    const existing = lesson.id ? state.lessons.find((item) => item.id === lesson.id) : undefined;
    const saved: LessonPlan = {
      ...lesson,
      id: lesson.id ?? id('lesson'),
      workspaceId: state.workspace.id,
      updatedAt: now(),
      version: existing ? existing.version + 1 : 1,
    };
    update((current) => {
      current.lessons = upsert(current.lessons, saved);
      enqueue(current, 'lesson.upsert', {
        lessonId: saved.id,
        classId: saved.classId,
        gradeLevel: saved.gradeLevel,
        subjectId: saved.subjectId,
        title: saved.title,
        objective: saved.objective,
        engage: saved.engage,
        explore: saved.explore,
        explain: saved.explain,
        elaborate: saved.elaborate,
        evaluate: saved.evaluate,
        materials: saved.materials,
        status: saved.status,
        expectedVersion: existing?.version ?? null,
      });
      return current;
    });
    setMessage(t('lesson_saved'));
    return saved;
  };

  const saveProgress: StoreValue['saveProgress'] = (entry, approve) => {
    const saved: ProgressEntry = {
      ...entry,
      id: entry.id ?? id('progress'),
      workspaceId: state.workspace.id,
      approvalStatus: approve ? 'approved' : 'draft',
      revision: entry.approvalStatus === 'approved' && !approve ? 2 : 1,
      updatedAt: now(),
    };
    update((current) => {
      current.progress = upsert(current.progress, saved);
      enqueue(current, 'progress.upsert', {
        clientEntryId: saved.id,
        pupilId: saved.pupilId,
        classId: saved.classId,
        periodStart: saved.periodStart,
        periodEnd: saved.periodEnd,
        subjectId: saved.subjectId,
        objectiveId: saved.objectiveId,
        indicator: saved.indicator,
        teacherNote: saved.teacherNote,
        homeActivity: saved.homeActivity,
      });
      return current;
    });
    setMessage(approve ? t('progress_approved') : t('progress_saved'));
    return saved;
  };

  const approveProgress: StoreValue['approveProgress'] = (entryId) => {
    update((current) => {
      const entry = current.progress.find((item) => item.id === entryId);
      if (entry) {
        entry.approvalStatus = 'approved';
        entry.revision += 1;
        entry.updatedAt = now();
        enqueue(current, 'progress.approve', { progressEntryId: entryId });
      }
      return current;
    });
    setMessage(t('progress_approved'));
  };

  const addAssessment: StoreValue['addAssessment'] = (input) => {
    const assessment: Assessment = {
      id: id('assessment'),
      workspaceId: state.workspace.id,
      ...input,
      createdAt: now(),
      updatedAt: now(),
    };
    update((current) => {
      current.assessments.push(assessment);
      enqueue(current, 'assessment.record', {
        assessmentId: assessment.id,
        classId: assessment.classId,
        pupilId: assessment.pupilId,
        subjectId: assessment.subjectId,
        objectiveId: assessment.objectiveId,
        objectiveLabel: assessment.objectiveLabel,
        score: assessment.score,
        maxScore: assessment.maxScore,
        schoolDate: assessment.schoolDate,
        teacherNote: assessment.teacherNote,
      });
      return current;
    });
    setMessage(t('assessment_saved'));
    return assessment;
  };

  const addFollowUp: StoreValue['addFollowUp'] = (input) => {
    const followUp: FollowUp = {
      id: id('followup'),
      workspaceId: state.workspace.id,
      ...input,
      status: input.status ?? 'open',
      createdAt: now(),
    };
    update((current) => {
      current.followUps.push(followUp);
      enqueue(current, 'followup.upsert', {
        followUpId: followUp.id,
        classId: followUp.classId,
        pupilId: followUp.pupilId,
        title: followUp.title,
        detail: followUp.detail,
        dueDate: followUp.dueDate,
        source: followUp.source,
        sourceId: followUp.sourceId,
      });
      return current;
    });
    setMessage(t('followup_saved'));
    return followUp;
  };

  const updateFollowUpStatus: StoreValue['updateFollowUpStatus'] = (followUpId, status) => {
    update((current) => {
      const item = current.followUps.find((candidate) => candidate.id === followUpId);
      if (item) {
        item.status = status;
        item.completedAt = status === 'done' ? now() : undefined;
        item.updatedAt = now();
        enqueue(current, 'followup.status', { followUpId, status });
      }
      return current;
    });
    setMessage(status === 'done' ? t('followup_done') : t('followup_updated'));
  };

  const saveAiAnalysis: StoreValue['saveAiAnalysis'] = (analysis) => {
    update((current) => {
      current.aiAnalyses = [analysis, ...current.aiAnalyses].slice(0, 40);
      return current;
    });
  };

  const sendMessage: StoreValue['sendMessage'] = (conversationId, body) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation) throw new Error(t('conversation_not_found'));
    const message: Message = {
      id: id('msg'),
      conversationId,
      workspaceId: state.workspace.id,
      direction: 'outbound',
      body: trimmed,
      status: 'queued',
      provider: 'mock',
      createdAt: now(),
    };
    update((current) => {
      current.messages.push(message);
      const target = current.conversations.find((item) => item.id === conversationId);
      if (target) {
        target.status = 'waiting_parent';
        target.lastMessageAt = message.createdAt;
        target.unread = 0;
      }
      enqueue(current, 'message.reply', {
        conversationId,
        body: trimmed,
        locale: 'en',
        clientMessageId: message.id,
      });
      return current;
    });
    try {
      const channel = new BroadcastChannel('tiny-web-messages');
      channel.postMessage({ kind: 'outbound', conversationId, body: trimmed });
      channel.close();
    } catch {
      // BroadcastChannel is optional.
    }
    setMessage(t('reply_queued'));
  };

  const queueParentUpdate: StoreValue['queueParentUpdate'] = (pupilId, body) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const pupil = state.pupils.find((item) => item.id === pupilId);
    const link = state.links.find((item) => item.pupilId === pupilId && item.notificationEligible);
    const guardian = state.guardians.find((item) => item.id === link?.guardianId);
    if (!pupil || !guardian) {
      setMessage(t('guardian_not_found'));
      return;
    }
    let conversationId = state.conversations.find((item) => item.pupilId === pupilId && item.guardianId === guardian.id)?.id;
    update((current) => {
      if (!conversationId) {
        conversationId = id('conversation');
        current.conversations.push({
          id: conversationId,
          workspaceId: current.workspace.id,
          guardianId: guardian.id,
          pupilId,
          classId: pupil.classId,
          status: 'waiting_parent',
          lastMessageAt: now(),
          unread: 0,
        });
      }
      const message: Message = {
        id: id('msg'),
        conversationId: conversationId!,
        workspaceId: current.workspace.id,
        direction: 'outbound',
        body: trimmed,
        status: 'queued',
        provider: 'mock',
        createdAt: now(),
      };
      current.messages.push(message);
      const conversation = current.conversations.find((item) => item.id === conversationId);
      if (conversation) {
        conversation.status = 'waiting_parent';
        conversation.lastMessageAt = message.createdAt;
        conversation.unread = 0;
      }
      enqueue(current, 'message.reply', {
        conversationId,
        body: trimmed,
        locale: guardian.preferredLocale,
        clientMessageId: message.id,
      });
      return current;
    });
    setMessage(t('parent_draft_queued'));
  };

  const receiveGuardianMessage: StoreValue['receiveGuardianMessage'] = (conversationId, body, broadcast = true) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const message: Message = {
      id: id('msg'),
      conversationId,
      workspaceId: state.workspace.id,
      direction: 'inbound',
      body: trimmed,
      status: 'received',
      provider: 'mock',
      createdAt: now(),
    };
    update((current) => {
      current.messages.push(message);
      const target = current.conversations.find((item) => item.id === conversationId);
      if (target) {
        target.status = 'waiting_teacher';
        target.lastMessageAt = message.createdAt;
        target.unread += 1;
      }
      return current;
    });
    if (!broadcast) return;
    // Notify any other open tab (teacher + guardian simulator).
    try {
      const channel = new BroadcastChannel('tiny-web-messages');
      channel.postMessage({ conversationId, body: trimmed });
      channel.close();
    } catch {
      // BroadcastChannel is optional.
    }
  };

  const receiveTeacherMessage: StoreValue['receiveTeacherMessage'] = (conversationId, body, broadcast = false) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const message: Message = {
      id: id('msg'),
      conversationId,
      workspaceId: state.workspace.id,
      direction: 'outbound',
      body: trimmed,
      status: 'queued',
      provider: 'mock',
      createdAt: now(),
    };
    update((current) => {
      current.messages.push(message);
      const target = current.conversations.find((item) => item.id === conversationId);
      if (target) {
        target.status = 'waiting_parent';
        target.lastMessageAt = message.createdAt;
        target.unread = 0;
      }
      return current;
    });
    if (!broadcast) return;
    try {
      const channel = new BroadcastChannel('tiny-web-messages');
      channel.postMessage({ kind: 'outbound', conversationId, body: trimmed });
      channel.close();
    } catch {
      // BroadcastChannel is optional.
    }
  };

  const syncNow = async () => {    if (syncing) return;
    const pending = state.outbox.filter((item) => item.state === 'pending' || item.state === 'retryable');
    setSyncing(true);
    try {
      if (pending.length === 0) {
        setMessage(t('no_queued_commands'));
        return;
      }
      if (!functions || !isEmulatorMode) {
        update((current) => {
          current.outbox = current.outbox.map((item) =>
            pending.some((candidate) => candidate.id === item.id)
              ? { ...item, lastError: remoteSyncUnavailable }
              : item,
          );
          return current;
        });
        setMessage(t('sync_unavailable'));
        return;
      }
      const callable = httpsCallable(functions, 'syncCommands');
      const response = await callable({
        workspaceId: state.workspace.id,
        idempotencyKey: `web-batch-${crypto.randomUUID()}`,
        schemaVersion: 1,
        payload: {
          commands: pending.map((item) => ({
            idempotencyKey: item.idempotencyKey,
            commandType: item.commandType,
            schemaVersion: 1,
            payload: item.payload,
          })),
        },
      });
      const results = (response.data as { results?: Array<{ idempotencyKey: string; outcome: string; errorCode?: string; message?: string }> }).results ?? [];
      update((current) => {
        current.outbox = current.outbox.map((item) => {
          const result = results.find((candidate) => candidate.idempotencyKey === item.idempotencyKey);
          if (!result) return item;
          if (result.outcome === 'accepted' || result.outcome === 'alreadyApplied') {
            return { ...item, state: 'synced', attempts: item.attempts + 1, lastError: null };
          }
          if (result.outcome === 'conflict') {
            return { ...item, state: 'conflict', attempts: item.attempts + 1, lastError: result.message ?? result.errorCode ?? 'Conflict' };
          }
          if (result.outcome === 'rejected') {
            return { ...item, state: 'failed', attempts: item.attempts + 1, lastError: result.message ?? result.errorCode ?? 'Rejected' };
          }
          return { ...item, state: 'retryable', attempts: item.attempts + 1, lastError: result.message ?? 'Retry later' };
        });
        return current;
      });
      setMessage(t('sync_complete'));
    } catch (error) {
      update((current) => {
        current.outbox = current.outbox.map((item) =>
          pending.some((candidate) => candidate.id === item.id)
            ? { ...item, state: 'retryable', attempts: item.attempts + 1, lastError: error instanceof Error ? error.message : 'Sync failed' }
            : item,
        );
        return current;
      });
      setMessage(t('sync_failed'));
    } finally {
      setSyncing(false);
    }
  };

  const updateSettings: StoreValue['updateSettings'] = (settings) => {
    update((current) => {
      current.settings = { ...current.settings, ...settings };
      return current;
    });
  };

  const resetDemo = async () => {
    await clearLocalData();
    const seed = seedState();
    stateRef.current = seed;
    setState(seed);
    void saveState(seed);
    setMessage(t('reset_local_done'));
  };

  const value = useMemo<StoreValue>(() => ({
    state,
    ready,
    message,
    syncing,
    clearMessage: () => setMessage(null),
    setMessage,
    addClass,
    addPupil,
    addGuardian,
    linkGuardian,
    saveAttendance,
    saveLesson,
    saveProgress,
    approveProgress,
    addAssessment,
    addFollowUp,
    updateFollowUpStatus,
    saveAiAnalysis,
    sendMessage,
    queueParentUpdate,
    receiveGuardianMessage,
    receiveTeacherMessage,
    syncNow,
    refreshRemote,
    updateSettings,
    resetDemo,
  }), [state, ready, message, syncing, user, t]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}
