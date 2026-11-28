import type { AppState, Assessment, AttendanceStatus, ProgressEntry } from './types';

export type PupilStatus = 'insufficient' | 'needs_attention' | 'improving' | 'strong' | 'making_progress';
export type EvidenceConfidence = 'low' | 'medium' | 'high';

export interface AttendanceStats {
  marked: number;
  present: number;
  absent: number;
  late: number;
  attended: number;
  rate: number;
  lastDate: string | null;
  recentAbsences: number;
  consecutiveAbsences: number;
}

export interface AssessmentStats {
  count: number;
  average: number;
  latest: number | null;
  latestDate: string | null;
  trend: number;
  belowSupport: Assessment[];
  strong: Assessment[];
}

export interface ObservationStats {
  count: number;
  doingWell: number;
  developing: number;
  needsSupport: number;
  notAssessed: number;
  approved: number;
  latest: ProgressEntry | null;
  recent: ProgressEntry[];
}

export interface PupilIntelligence {
  pupilId: string;
  pupilName: string;
  classId: string;
  status: PupilStatus;
  statusReasons: string[];
  confidence: EvidenceConfidence;
  attendance: AttendanceStats;
  assessments: AssessmentStats;
  observations: ObservationStats;
  evidenceIds: string[];
  evidenceFingerprint: string;
  updatedAt: string | null;
  strengths: string[];
  needsAttention: string[];
  nextActions: string[];
}

export interface ClassGap {
  objectiveId: string;
  objectiveLabel: string;
  average: number;
  pupilsBelow: number;
  supportObservations: number;
}

export interface ClassIntelligence {
  classId: string;
  pupilCount: number;
  attendanceRate: number;
  markedAttendance: number;
  assessmentAverage: number;
  assessmentCount: number;
  observationCount: number;
  commonGaps: ClassGap[];
  strengths: ClassGap[];
  attentionPupils: PupilIntelligence[];
  improvingPupils: PupilIntelligence[];
  strongPupils: PupilIntelligence[];
  evidenceFingerprint: string;
  coverage: 'low' | 'medium' | 'high';
}

// Keep the web and Android engines numerically identical: both expose
// whole-number percentages to the UI and to the deterministic text.
const percent = (value: number) => Math.round(value);

function sortByDate<T extends { schoolDate: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.schoolDate.localeCompare(b.schoolDate));
}

export function buildAttendanceStats(state: AppState, pupilId: string): AttendanceStats {
  const submitted = state.attendance.filter((session) => session.status === 'submitted').sort((a, b) => a.schoolDate.localeCompare(b.schoolDate));
  const rows = submitted.flatMap((session) => {
    const entry = session.entries.find((candidate) => candidate.pupilId === pupilId);
    return entry ? [{ date: session.schoolDate, status: entry.status as AttendanceStatus }] : [];
  });
  const present = rows.filter((row) => row.status === 'present').length;
  const absent = rows.filter((row) => row.status === 'absent').length;
  const late = rows.filter((row) => row.status === 'late').length;
  const marked = present + absent + late;
  const attended = present + late;
  let consecutiveAbsences = 0;
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (rows[index].status !== 'absent') break;
    consecutiveAbsences += 1;
  }
  return {
    marked,
    present,
    absent,
    late,
    attended,
    rate: marked ? percent((attended / marked) * 100) : 0,
    lastDate: rows.at(-1)?.date ?? null,
    recentAbsences: rows.slice(-7).filter((row) => row.status === 'absent').length,
    consecutiveAbsences,
  };
}

export function buildAssessmentStats(state: AppState, pupilId: string): AssessmentStats {
  const rows = sortByDate(state.assessments.filter((assessment) => assessment.pupilId === pupilId));
  const percentages = rows.map((row) => (row.maxScore > 0 ? (row.score / row.maxScore) * 100 : 0));
  const average = percentages.length ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length : 0;
  const midpoint = Math.floor(percentages.length / 2);
  const earlier = percentages.slice(0, midpoint);
  const later = percentages.slice(midpoint);
  const earlierAverage = earlier.length ? earlier.reduce((sum, value) => sum + value, 0) / earlier.length : 0;
  const laterAverage = later.length ? later.reduce((sum, value) => sum + value, 0) / later.length : 0;
  const latest = percentages.at(-1) ?? null;
  return {
    count: rows.length,
    average: percent(average),
    latest: latest === null ? null : percent(latest),
    latestDate: rows.at(-1)?.schoolDate ?? null,
    trend: percentages.length >= 2 ? percent(laterAverage - earlierAverage) : 0,
    belowSupport: rows.filter((row) => row.maxScore > 0 && (row.score / row.maxScore) * 100 < 50),
    strong: rows.filter((row) => row.maxScore > 0 && (row.score / row.maxScore) * 100 >= 75),
  };
}

export function buildObservationStats(state: AppState, pupilId: string): ObservationStats {
  const rows = [...state.progress]
    .filter((entry) => entry.pupilId === pupilId)
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));
  return {
    count: rows.length,
    doingWell: rows.filter((row) => row.indicator === 'doing_well').length,
    developing: rows.filter((row) => row.indicator === 'developing').length,
    needsSupport: rows.filter((row) => row.indicator === 'needs_support').length,
    notAssessed: rows.filter((row) => row.indicator === 'not_assessed').length,
    approved: rows.filter((row) => row.approvalStatus === 'approved').length,
    latest: rows[0] ?? null,
    recent: rows.slice(0, 3),
  };
}

function latestTimestamp(values: Array<string | undefined | null>): string | null {
  return values.filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
}

export function buildPupilIntelligence(state: AppState, pupilId: string): PupilIntelligence | null {
  const pupil = state.pupils.find((candidate) => candidate.id === pupilId);
  if (!pupil) return null;
  const attendance = buildAttendanceStats(state, pupilId);
  const assessments = buildAssessmentStats(state, pupilId);
  const observations = buildObservationStats(state, pupilId);
  const reasons: string[] = [];
  let status: PupilStatus = 'making_progress';

  const evidenceCount = attendance.marked + assessments.count + observations.count;
  if (attendance.marked < 3 && assessments.count < 2 && observations.count === 0) {
    status = 'insufficient';
    reasons.push('status_reason_insufficient');
  } else if (attendance.rate < 75 || assessments.average < 45 || observations.needsSupport >= 2) {
    status = 'needs_attention';
    if (attendance.rate < 75) reasons.push('status_reason_attendance');
    if (assessments.average < 45 && assessments.count > 0) reasons.push('status_reason_assessment');
    if (observations.needsSupport >= 2) reasons.push('status_reason_observations');
  } else if (assessments.trend >= 8 || (observations.needsSupport > 0 && observations.latest?.indicator === 'doing_well')) {
    status = 'improving';
    if (assessments.trend >= 8) reasons.push('status_reason_assessment_trend');
    if (observations.latest?.indicator === 'doing_well') reasons.push('status_reason_recent_observation');
  } else if (attendance.rate >= 90 && assessments.average >= 75 && observations.needsSupport === 0) {
    status = 'strong';
    reasons.push('status_reason_strong_evidence');
  } else {
    status = 'making_progress';
    reasons.push('status_reason_steady');
  }

  const confidence: EvidenceConfidence = evidenceCount >= 10 && assessments.count >= 2 && observations.count >= 2
    ? 'high'
    : evidenceCount >= 4
      ? 'medium'
      : 'low';

  const strengths: string[] = [];
  if (attendance.rate >= 90) strengths.push('strength_attendance');
  if (assessments.average >= 75) strengths.push('strength_assessment');
  if (observations.doingWell >= 1) strengths.push('strength_observation');
  if (assessments.trend > 0) strengths.push('strength_improving');

  const needsAttention: string[] = [];
  if (attendance.rate < 80) needsAttention.push('attention_attendance');
  if (assessments.belowSupport.length >= 1) needsAttention.push('attention_assessment');
  if (observations.needsSupport >= 1) needsAttention.push('attention_observation');
  if (assessments.count === 0) needsAttention.push('attention_missing_assessments');
  if (observations.count === 0) needsAttention.push('attention_missing_observations');

  const nextActions: string[] = [];
  if (attendance.consecutiveAbsences >= 2 || attendance.recentAbsences >= 2) nextActions.push('action_contact_family');
  if (assessments.belowSupport.length > 0) nextActions.push('action_plan_support');
  if (assessments.count === 0) nextActions.push('action_record_assessment');
  if (observations.count === 0) nextActions.push('action_record_observation');
  if (nextActions.length === 0) nextActions.push('action_continue_monitoring');

  const evidenceIds = [
    ...state.attendance.filter((session) => session.entries.some((entry) => entry.pupilId === pupilId)).map((session) => session.id),
    ...state.assessments.filter((assessment) => assessment.pupilId === pupilId).map((assessment) => assessment.id),
    ...state.progress.filter((entry) => entry.pupilId === pupilId).map((entry) => entry.id),
  ];
  return {
    pupilId,
    pupilName: pupil.displayName,
    classId: pupil.classId,
    status,
    statusReasons: reasons,
    confidence,
    attendance,
    assessments,
    observations,
    evidenceIds,
    evidenceFingerprint: evidenceIds.join('|'),
    updatedAt: latestTimestamp([
      attendance.lastDate ? `${attendance.lastDate}T00:00:00.000Z` : null,
      assessments.latestDate ? `${assessments.latestDate}T00:00:00.000Z` : null,
      observations.latest?.updatedAt,
    ]),
    strengths,
    needsAttention,
    nextActions,
  };
}

export function buildClassIntelligence(state: AppState, classId: string): ClassIntelligence | null {
  const classroom = state.classes.find((candidate) => candidate.id === classId);
  if (!classroom) return null;
  const pupils = state.pupils.filter((pupil) => pupil.classId === classId && pupil.enrollmentStatus === 'active');
  const profiles = pupils.map((pupil) => buildPupilIntelligence(state, pupil.id)).filter((profile): profile is PupilIntelligence => Boolean(profile));
  const sessions = state.attendance.filter((session) => session.classId === classId && session.status === 'submitted');
  let marked = 0;
  let attended = 0;
  for (const session of sessions) {
    for (const entry of session.entries) {
      if (!pupils.some((pupil) => pupil.id === entry.pupilId)) continue;
      marked += 1;
      if (entry.status === 'present' || entry.status === 'late') attended += 1;
    }
  }
  const classAssessments = state.assessments.filter((assessment) => assessment.classId === classId);
  const assessmentAverage = classAssessments.length
    ? classAssessments.reduce((sum, assessment) => sum + (assessment.maxScore > 0 ? (assessment.score / assessment.maxScore) * 100 : 0), 0) / classAssessments.length
    : 0;
  const byObjective = new Map<string, { label: string; scores: number[]; support: number }>();
  for (const assessment of classAssessments) {
    const current = byObjective.get(assessment.objectiveId) ?? { label: assessment.objectiveLabel, scores: [], support: 0 };
    if (assessment.maxScore > 0) current.scores.push((assessment.score / assessment.maxScore) * 100);
    byObjective.set(assessment.objectiveId, current);
  }
  for (const profile of profiles) {
    for (const entry of state.progress.filter((item) => item.pupilId === profile.pupilId && item.objectiveId)) {
      const objectiveId = entry.objectiveId as string;
      const current = byObjective.get(objectiveId) ?? { label: objectiveId.replaceAll('_', ' '), scores: [], support: 0 };
      if (entry.indicator === 'needs_support') current.support += 1;
      byObjective.set(objectiveId, current);
    }
  }
  const gaps: ClassGap[] = [...byObjective.entries()].map(([objectiveId, row]) => ({
    objectiveId,
    objectiveLabel: row.label,
    average: row.scores.length ? percent(row.scores.reduce((sum, score) => sum + score, 0) / row.scores.length) : 0,
    pupilsBelow: row.scores.filter((score) => score < 50).length,
    supportObservations: row.support,
  }));
  const commonGaps = gaps.filter((gap) => gap.average > 0 && gap.average < 55 || gap.supportObservations >= 2 || gap.pupilsBelow >= 2).sort((a, b) => a.average - b.average);
  const strengths = gaps.filter((gap) => gap.average >= 70 && gap.supportObservations === 0).sort((a, b) => b.average - a.average);
  const evidenceCount = marked + classAssessments.length + profiles.reduce((sum, profile) => sum + profile.observations.count, 0);
  return {
    classId,
    pupilCount: pupils.length,
    attendanceRate: marked ? percent((attended / marked) * 100) : 0,
    markedAttendance: marked,
    assessmentAverage: percent(assessmentAverage),
    assessmentCount: classAssessments.length,
    observationCount: profiles.reduce((sum, profile) => sum + profile.observations.count, 0),
    commonGaps: commonGaps.slice(0, 5),
    strengths: strengths.slice(0, 4),
    attentionPupils: profiles.filter((profile) => profile.status === 'needs_attention'),
    improvingPupils: profiles.filter((profile) => profile.status === 'improving'),
    strongPupils: profiles.filter((profile) => profile.status === 'strong'),
    evidenceFingerprint: `${classroom.id}|${evidenceCount}|${classAssessments.map((assessment) => assessment.id).join(',')}|${profiles.map((profile) => profile.evidenceFingerprint).join(';')}`,
    coverage: evidenceCount >= 25 ? 'high' : evidenceCount >= 10 ? 'medium' : 'low',
  };
}

export interface SuggestedFollowUp {
  key: string;
  pupilId: string;
  classId: string;
  titleKey: string;
  detailKey: string;
  source: 'attendance' | 'assessment' | 'observation';
  sourceId?: string;
}

export function buildSuggestedFollowUps(state: AppState, classId?: string): SuggestedFollowUp[] {
  const pupils = state.pupils.filter((pupil) => pupil.enrollmentStatus === 'active' && (!classId || pupil.classId === classId));
  const suggestions: SuggestedFollowUp[] = [];
  for (const pupil of pupils) {
    const profile = buildPupilIntelligence(state, pupil.id);
    if (!profile) continue;
    if (profile.attendance.rate < 80) {
      suggestions.push({
        key: `attendance:${pupil.id}`,
        pupilId: pupil.id,
        classId: pupil.classId,
        titleKey: 'suggest_attendance_title',
        detailKey: 'suggest_attendance_detail',
        source: 'attendance',
        sourceId: profile.attendance.lastDate ?? undefined,
      });
    }
    if (profile.assessments.average > 0 && profile.assessments.average < 50) {
      suggestions.push({
        key: `assessment:${pupil.id}`,
        pupilId: pupil.id,
        classId: pupil.classId,
        titleKey: 'suggest_assessment_title',
        detailKey: 'suggest_assessment_detail',
        source: 'assessment',
        sourceId: profile.assessments.belowSupport.at(-1)?.id,
      });
    }
    if (profile.observations.needsSupport >= 2) {
      suggestions.push({
        key: `observation:${pupil.id}`,
        pupilId: pupil.id,
        classId: pupil.classId,
        titleKey: 'suggest_observation_title',
        detailKey: 'suggest_observation_detail',
        source: 'observation',
        sourceId: profile.observations.latest?.id,
      });
    }
  }
  return suggestions;
}

const PHONE_PATTERN = /\+?\d[\d\s-]{7,}\d/g;
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/g;

export function sanitizeEvidenceText(value: string, names: string[]): string {
  let safe = value;
  for (const name of names.filter(Boolean)) {
    safe = safe.replaceAll(name, 'the pupil');
    for (const part of name.split(/\s+/)) {
      if (part.length > 2) safe = safe.replaceAll(part, 'the pupil');
    }
  }
  return safe.replace(PHONE_PATTERN, '[phone hidden]').replace(EMAIL_PATTERN, '[email hidden]').slice(0, 600);
}

export interface EvidenceContext {
  prompt: string;
  evidenceIds: string[];
  fingerprint: string;
  summary: string;
}

export function buildPupilEvidenceContext(state: AppState, profile: PupilIntelligence, task: string): EvidenceContext {
  const classroom = state.classes.find((candidate) => candidate.id === profile.classId);
  const names = [
    profile.pupilName,
    ...state.guardians.map((guardian) => guardian.displayName),
  ];
  const observations = profile.observations.recent
    .map((entry) => `- ${entry.periodStart} to ${entry.periodEnd}, ${entry.subjectId}: ${entry.indicator}. ${sanitizeEvidenceText(entry.teacherNote ?? '', names)}`)
    .join('\n');
  const assessments = state.assessments
    .filter((assessment) => assessment.pupilId === profile.pupilId)
    .slice(-4)
    .map((assessment) => `- ${assessment.schoolDate}, ${assessment.subjectId}, ${assessment.objectiveLabel}: ${assessment.score}/${assessment.maxScore}`)
    .join('\n');
  const prompt = [
    `Task: ${task}.`,
    'You are assisting a primary-school teacher in Nigeria. Return plain text only, at most 160 English words.',
    'Use only the evidence below. Do not invent events, grades, diagnoses, family details or another pupil. Do not name the pupil. Distinguish facts from suggested actions.',
    `Class: ${classroom?.gradeLevel ?? 'Primary'} ${classroom?.sectionLabel ?? ''}.`,
    `Attendance: ${profile.attendance.marked} marked sessions; present ${profile.attendance.present}, late ${profile.attendance.late}, absent ${profile.attendance.absent}; rate ${profile.attendance.rate}%; consecutive absences ${profile.attendance.consecutiveAbsences}.`,
    `Assessment trend: ${profile.assessments.count} records; average ${profile.assessments.average}%; latest ${profile.assessments.latest ?? 'none'}; change ${profile.assessments.trend} points.`,
    'Recent assessment evidence:',
    assessments || '- none recorded',
    'Recent teacher observations:',
    observations || '- none recorded',
    `Deterministic status: ${profile.status}. Do not override the attendance percentage or status calculation.`,
  ].join('\n');
  return {
    prompt,
    evidenceIds: profile.evidenceIds,
    fingerprint: profile.evidenceFingerprint,
    summary: `${profile.attendance.marked} attendance records · ${profile.assessments.count} assessments · ${profile.observations.count} observations`,
  };
}

export function buildClassEvidenceContext(state: AppState, intelligence: ClassIntelligence, task: string): EvidenceContext {
  const classroom = state.classes.find((candidate) => candidate.id === intelligence.classId);
  const prompt = [
    `Task: ${task}.`,
    'You are assisting a primary-school teacher in Nigeria. Return plain text only, at most 160 English words.',
    'Use only the aggregate evidence below. Do not invent individual pupil facts, grades, diagnoses or another class. Distinguish facts from suggested teaching actions.',
    `Class: ${classroom?.gradeLevel ?? 'Primary'} ${classroom?.sectionLabel ?? ''}; ${intelligence.pupilCount} active pupils.`,
    `Attendance: ${intelligence.markedAttendance} marked entries; class rate ${intelligence.attendanceRate}%.`,
    `Assessments: ${intelligence.assessmentCount} records; average ${intelligence.assessmentAverage}%.`,
    `Observations: ${intelligence.observationCount} records.`,
    `Common gaps: ${intelligence.commonGaps.map((gap) => `${gap.objectiveLabel} (average ${gap.average}%, ${gap.pupilsBelow} below 50%)`).join('; ') || 'none identified'}.`,
    `Strengths: ${intelligence.strengths.map((gap) => gap.objectiveLabel).join('; ') || 'not enough evidence'}.`,
    `Pupils needing attention (count only): ${intelligence.attentionPupils.length}.`,
    `Pupils improving (count only): ${intelligence.improvingPupils.length}.`,
  ].join('\n');
  return {
    prompt,
    evidenceIds: [intelligence.classId, ...intelligence.attentionPupils.map((pupil) => pupil.pupilId)],
    fingerprint: intelligence.evidenceFingerprint,
    summary: `${intelligence.pupilCount} pupils · ${intelligence.markedAttendance} attendance entries · ${intelligence.assessmentCount} assessments`,
  };
}

export function deterministicPupilReview(profile: PupilIntelligence): string {
  const attendance = profile.attendance.marked
    ? `Attendance is ${profile.attendance.rate}% across ${profile.attendance.marked} marked sessions (${profile.attendance.absent} absent, ${profile.attendance.late} late).`
    : 'There is not enough attendance evidence yet.';
  const assessment = profile.assessments.count
    ? `The average assessment result is ${profile.assessments.average}%; the latest is ${profile.assessments.latest}% and the trend is ${profile.assessments.trend > 0 ? '+' : ''}${profile.assessments.trend} points.`
    : 'No assessment evidence has been recorded.';
  const observation = profile.observations.latest
    ? `The latest observation is "${profile.observations.latest.teacherNote ?? ''}" with an indicator of ${profile.observations.latest.indicator.replaceAll('_', ' ')}.`
    : 'No teacher observation has been recorded.';
  return `${attendance} ${assessment} ${observation}\n\nSuggested next step: ${profile.nextActions[0].replaceAll('_', ' ')}. This is a deterministic summary of recorded evidence, not a model response.`;
}

export function deterministicParentDraft(profile: PupilIntelligence, subjectLabel: string): string {
  const lines: string[] = [];
  if (profile.attendance.marked) {
    lines.push(`Your child attended ${profile.attendance.attended} of ${profile.attendance.marked} recorded school days this period.`);
  }
  if (profile.assessments.count) {
    lines.push(`In ${subjectLabel}, the recent assessment average is ${profile.assessments.average}%.`);
    if (profile.assessments.trend >= 8) lines.push('Recent results show improvement.');
    else if (profile.assessments.average < 50) lines.push('We will give additional practice in the next lessons.');
  }
  if (profile.observations.latest?.teacherNote) {
    lines.push(`Teacher observation: ${profile.observations.latest.teacherNote}`);
  }
  if (profile.observations.latest?.homeActivity) {
    lines.push(`At home, you can help with: ${profile.observations.latest.homeActivity}`);
  }
  if (lines.length === 0) {
    lines.push('There is not enough recorded evidence for a detailed update yet. We will contact you after the next classroom check.');
  }
  lines.push('Please reply if you would like to discuss this update with the teacher.');
  return lines.join('\n\n');
}

export function deterministicClassReview(intelligence: ClassIntelligence): string {
  const gaps = intelligence.commonGaps.length
    ? `The clearest shared gaps are ${intelligence.commonGaps.map((gap) => `${gap.objectiveLabel} (average ${gap.average}%)`).join(', ')}.`
    : 'No shared learning gap is yet supported by enough evidence.';
  return `Attendance is ${intelligence.attendanceRate}% across ${intelligence.markedAttendance} marked entries. The assessment average is ${intelligence.assessmentAverage}% from ${intelligence.assessmentCount} records. ${gaps} ${intelligence.attentionPupils.length} pupil(s) have evidence needing attention and ${intelligence.improvingPupils.length} show improvement. This is a deterministic class summary, not a model response.`;
}

export function deterministicLessonPlan(intelligence: ClassIntelligence): string {
  const gap = intelligence.commonGaps[0];
  const objective = gap ? `Re-teach ${gap.objectiveLabel} with concrete examples and check understanding.` : 'Consolidate the current learning objective and check understanding.';
  return [
    `Objective: ${objective}`,
    'Prior knowledge: Use the pupils’ recorded examples and the previous lesson’s exit ticket.',
    'Engage: Start with a local object, picture or short story connected to the gap.',
    'Explore: Pairs sort or match examples before the formal explanation.',
    'Explain: Model the key vocabulary and connect it to what pupils noticed.',
    'Elaborate: Apply the idea in a new everyday context.',
    'Evaluate: A short oral or written check with three questions.',
    `Support: Give the pupils with the lowest recorded scores a concrete prompt and one extra guided example.`,
    'Follow-up: Re-check the objective in the next lesson and record a short observation.',
  ].join('\n');
}
