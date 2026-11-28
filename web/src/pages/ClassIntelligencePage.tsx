import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, EmptyState, PageHeader, Pill } from '../components/ui';
import { useStore } from '../data/store';
import { useI18n } from '../i18n';
import {
  buildClassIntelligence,
  buildClassEvidenceContext,
  buildSuggestedFollowUps,
  deterministicClassReview,
  deterministicLessonPlan,
  type PupilStatus,
} from '../intelligence';
import { generateEvidenceText } from '../ai/service';
import type { AiAnalysis } from '../types';

const statusKeys = {
  insufficient: 'status_insufficient',
  needs_attention: 'status_needs_attention',
  improving: 'status_improving',
  strong: 'status_strong',
  making_progress: 'status_making_progress',
} as const;

export function ClassIntelligencePage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { state, addFollowUp, saveAiAnalysis, saveLesson } = useStore();
  const { t } = useI18n();
  const classroom = state.classes.find((item) => item.id === classId);
  const intelligence = classId ? buildClassIntelligence(state, classId) : null;
  const [review, setReview] = useState<AiAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!classroom || !intelligence) {
    return <EmptyState title={t('class_not_found')} body={t('class_not_found_body')} action={<Link to="/classes"><Button>{t('back_to_classes')}</Button></Link>} />;
  }

  const suggestions = buildSuggestedFollowUps(state, classroom.id);
  const pupils = state.pupils.filter((pupil) => pupil.classId === classroom.id);

  async function analyseClass() {
    setBusy(true);
    setError(null);
    const context = buildClassEvidenceContext(state, intelligence!, 'Analyse this class evidence and suggest the most useful teaching and follow-up actions.');
    const result = await generateEvidenceText(context.prompt, deterministicClassReview(intelligence!), 'prefer_on_device');
    const analysis: AiAnalysis = {
      id: `analysis_${crypto.randomUUID()}`,
      workspaceId: state.workspace.id,
      scope: 'class',
      task: 'class_review',
      classId: classroom!.id,
      evidenceFingerprint: context.fingerprint,
      evidenceIds: context.evidenceIds,
      evidenceSummary: context.summary,
      output: result.text,
      requestedMode: result.requestedMode ?? 'prefer_on_device',
      source: result.source,
      durationMs: result.durationMs ?? 0,
      fallback: Boolean(result.fallback),
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    saveAiAnalysis(analysis);
    setReview(analysis);
    if (result.error) setError(result.error);
    setBusy(false);
  }

  function planFromEvidence() {
    const gap = intelligence!.commonGaps[0];
    const plan = deterministicLessonPlan(intelligence!);
    const lesson = saveLesson({
      classId: classroom!.id,
      title: gap ? `Evidence-informed: ${gap.objectiveLabel}` : 'Evidence-informed lesson',
      gradeLevel: classroom!.gradeLevel,
      subjectId: classroom!.subjectIds[0] ?? 'basic_science',
      objective: plan.split('\n')[0].replace('Objective: ', ''),
      engage: 'Use a local example linked to the recorded gap.',
      explore: 'Pairs sort or match examples before definitions.',
      explain: 'Model the key vocabulary and connect it to pupil observations.',
      elaborate: 'Apply the idea in a new everyday context.',
      evaluate: 'Short three-question check for understanding.',
      materials: 'Locally available objects, chalkboard, pupil exercise books',
      status: 'draft',
    });
    navigate(`/lessons/${lesson.id}`);
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('class_intelligence')}
        title={`${classroom.gradeLevel} ${classroom.sectionLabel}`}
        subtitle={t('class_intelligence_subtitle')}
        actions={<div className="button-row"><Link to={`/classes/${classroom.id}`}><Button variant="secondary">{t('class_label')}</Button></Link><Button onClick={planFromEvidence}>{t('plan_from_evidence')}</Button></div>}
      />

      <div className="metric-card-row">
        <div className="card mini-metric"><span className="status-dot status-ok" /><div><strong>{intelligence.attendanceRate}%</strong><small>{t('class_attendance')}</small></div></div>
        <div className="card mini-metric"><span className="status-dot status-warn" /><div><strong>{Math.round(intelligence.assessmentAverage)}%</strong><small>{t('class_assessment')} · {intelligence.assessmentCount}</small></div></div>
        <div className="card mini-metric"><span className="status-dot status-wait" /><div><strong>{intelligence.observationCount}</strong><small>{t('observations')}</small></div></div>
        <div className="card mini-metric"><span className="status-dot status-wait" /><div><strong>{intelligence.pupilCount}</strong><small>{t('pupils')}</small></div></div>
      </div>

      <div className="two-column wide-left">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('common_gaps')}</div><h3>{t('class_assessment')}</h3></div><Pill tone="tomato">{intelligence.commonGaps.length}</Pill></div>
          {intelligence.commonGaps.length === 0 ? <p className="muted">{t('insufficient_evidence')}</p> : intelligence.commonGaps.map((gap) => (
            <div className="gap-row" key={gap.objectiveId}>
              <div><strong>{gap.objectiveLabel}</strong><small>{gap.pupilsBelow} {t('pupils').toLowerCase()} below 50% · {gap.supportObservations} {t('observations').toLowerCase()}</small></div>
              <Pill tone="tomato">{Math.round(gap.average)}%</Pill>
            </div>
          ))}
          <Button variant="secondary" onClick={planFromEvidence}>{t('plan_from_evidence')}</Button>
        </Card>
        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('class_strengths')}</div><h3>{t('pupils_improving')}</h3></div><Pill tone="forest">{intelligence.strengths.length}</Pill></div>
          {intelligence.strengths.length === 0 ? <p className="muted">{t('insufficient_evidence')}</p> : intelligence.strengths.map((gap) => <div className="gap-row" key={gap.objectiveId}><div><strong>{gap.objectiveLabel}</strong><small>{Math.round(gap.average)}% · {gap.pupilsBelow} {t('profile_needs_attention').toLowerCase()}</small></div><Pill tone="forest">{Math.round(gap.average)}%</Pill></div>)}
          <div className="chip-list">{intelligence.improvingPupils.map((pupil) => <Link key={pupil.pupilId} to={`/pupils/${pupil.pupilId}`}><Pill tone="cobalt">{pupil.pupilName}</Pill></Link>)}</div>
        </Card>
      </div>

      <div className="two-column">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('pupils_attention')}</div><h3>{t('profile_needs_attention')}</h3></div></div>
          {intelligence.attentionPupils.length === 0 ? <p className="muted">{t('empty_generic')}</p> : intelligence.attentionPupils.map((pupil) => (
            <Link key={pupil.pupilId} to={`/pupils/${pupil.pupilId}`} className="attention-row">
              <span className="avatar">{pupil.pupilName.slice(0, 1)}</span>
              <span className="list-main"><strong>{pupil.pupilName}</strong><small>{t(statusKeys[pupil.status as PupilStatus])} · {pupil.attendance.rate}% {t('attendance_rate').toLowerCase()}</small></span>
              <Pill tone="tomato">{pupil.attendance.rate}%</Pill>
            </Link>
          ))}
        </Card>
        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('suggested_followups')}</div><h3>{t('followups')}</h3></div></div>
          {suggestions.length === 0 ? <p className="muted">{t('no_open_followups')}</p> : suggestions.slice(0, 4).map((suggestion) => (
            <div className="followup-row" key={suggestion.key}>
              <div><strong>{t(suggestion.titleKey as never)}</strong><small>{t(suggestion.detailKey as never)}</small></div>
              <Button variant="ghost" onClick={() => addFollowUp({ classId: classroom.id, pupilId: suggestion.pupilId, title: t(suggestion.titleKey as never), detail: t(suggestion.detailKey as never), dueDate: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10), source: suggestion.source, sourceId: suggestion.sourceId })}>{t('add')}</Button>
            </div>
          ))}
        </Card>
      </div>

      <Card className="ai-evidence-card">
        <div className="card-heading"><div><div className="eyebrow">{t('intelligence_title')}</div><h3>{t('class_intelligence')}</h3></div><Button onClick={() => void analyseClass()} disabled={busy}>{busy ? t('ai_thinking') : t('generate_evidence_review')}</Button></div>
        <p className="muted">{intelligence.pupilCount} {t('pupils').toLowerCase()} · {intelligence.markedAttendance} {t('attendance_title').toLowerCase()} · {intelligence.assessmentCount} {t('assessment_title').toLowerCase()}</p>
        {review && (
          <div className="ai-result">
            <div className="source-row"><Pill tone={review.fallback ? 'butter' : review.source === 'On-device Gemini Nano' ? 'forest' : 'cobalt'}>{review.source}</Pill><small>{review.durationMs} ms</small></div>
            <p>{review.output}</p>
            <small>{review.fallback ? t('analysis_fallback') : t('ai_review_note')}</small>
            <small>{t('evidence_used')}: {review.evidenceSummary}</small>
          </div>
        )}
        {error && <div className="inline-error" role="alert">{error}</div>}
      </Card>

      <Card>
        <div className="card-heading"><div><div className="eyebrow">{t('pupil_directory')}</div><h3>{t('pupils')}</h3></div><Link to="/pupils" className="text-link">{t('view_all')}</Link></div>
        <div className="list">{pupils.map((pupil) => <Link to={`/pupils/${pupil.id}`} key={pupil.id} className="list-row"><span className="avatar">{pupil.displayName.slice(0, 1)}</span><span className="list-main"><strong>{pupil.displayName}</strong><small>{pupil.localPupilCode}</small></span><span className="text-link">{t('pupil_profile')}</span></Link>)}</div>
      </Card>
    </div>
  );
}
