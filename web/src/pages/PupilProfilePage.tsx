import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, EmptyState, Field, PageHeader, Pill, SelectInput, TextArea, TextInput } from '../components/ui';
import { Icon } from '../components/Icon';
import { useStore } from '../data/store';
import { subjectLabel, useI18n, type TranslationKey } from '../i18n';
import {
  buildAssessmentStats,
  buildPupilIntelligence,
  buildPupilEvidenceContext,
  deterministicParentDraft,
  deterministicPupilReview,
  type PupilStatus,
} from '../intelligence';
import { generateEvidenceText } from '../ai/service';
import type { AiAnalysis, Assessment } from '../types';

const statusKeys: Record<PupilStatus, TranslationKey> = {
  insufficient: 'status_insufficient',
  needs_attention: 'status_needs_attention',
  improving: 'status_improving',
  strong: 'status_strong',
  making_progress: 'status_making_progress',
};

const statusTones: Record<PupilStatus, 'forest' | 'tomato' | 'cobalt' | 'butter' | 'muted'> = {
  insufficient: 'muted',
  needs_attention: 'tomato',
  improving: 'cobalt',
  strong: 'forest',
  making_progress: 'butter',
};

function formatScore(value: number | null): string {
  return value === null ? '—' : `${Math.round(value)}%`;
}

export function PupilProfilePage() {
  const { pupilId } = useParams();
  const { state, addAssessment, addFollowUp, updateFollowUpStatus, saveAiAnalysis, queueParentUpdate } = useStore();
  const { t, tn, formatDate } = useI18n();
  const pupil = state.pupils.find((item) => item.id === pupilId);
  const profile = pupilId ? buildPupilIntelligence(state, pupilId) : null;
  const classroom = state.classes.find((item) => item.id === pupil?.classId);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessment, setAssessment] = useState({
    objectiveLabel: '',
    subject: 'basic_science',
    score: '',
    maxScore: '100',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });
  const [review, setReview] = useState<AiAnalysis | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<'review' | 'draft' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!pupil || !profile) {
    return <EmptyState title={t('error_not_found')} body={t('pupil_directory_subtitle')} action={<Link to="/pupils"><Button>{t('pupil_directory')}</Button></Link>} />;
  }

  const pupilFollowUps = state.followUps.filter((item) => item.pupilId === pupil.id && item.status === 'open');
  const pupilAnalyses = state.aiAnalyses.filter((item) => item.pupilId === pupil.id).slice(0, 3);
  const recentAssessments = [...state.assessments].filter((item) => item.pupilId === pupil.id).sort((a, b) => b.schoolDate.localeCompare(a.schoolDate));

  function saveAssessment(event: React.FormEvent) {
    event.preventDefault();
    const score = Number(assessment.score);
    const maxScore = Number(assessment.maxScore);
    if (!assessment.objectiveLabel.trim() || !Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
      setError(t('required_field'));
      return;
    }
    addAssessment({
      classId: pupil!.classId,
      pupilId: pupil!.id,
      subjectId: assessment.subject,
      objectiveId: assessment.objectiveLabel.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, '_'),
      objectiveLabel: assessment.objectiveLabel.trim(),
      score,
      maxScore,
      schoolDate: assessment.date,
      teacherNote: assessment.note.trim(),
    });
    setAssessment({ ...assessment, objectiveLabel: '', score: '', note: '' });
    setError(null);
    setShowAssessment(false);
  }

  async function generateReview() {
    setBusy('review');
    setError(null);
    const context = buildPupilEvidenceContext(state, profile!, 'Review the pupil progress evidence and identify what the teacher should do next.');
    const result = await generateEvidenceText(context.prompt, deterministicPupilReview(profile!), 'prefer_on_device');
    const analysis: AiAnalysis = {
      id: `analysis_${crypto.randomUUID()}`,
      workspaceId: state.workspace.id,
      scope: 'pupil',
      task: 'pupil_review',
      pupilId: pupil!.id,
      classId: pupil!.classId,
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
    setBusy(null);
  }

  async function generateDraft() {
    setBusy('draft');
    setError(null);
    const context = buildPupilEvidenceContext(state, profile!, 'Draft a factual, respectful parent update using only the recorded evidence. Do not name the pupil.');
    const result = await generateEvidenceText(context.prompt, deterministicParentDraft(profile!, subjectLabel(t, recentAssessments[0]?.subjectId ?? 'basic_science')), 'prefer_on_device');
    setDraft(result.text);
    if (result.error) setError(result.error);
    setBusy(null);
  }

  function createFollowUp() {
    addFollowUp({
      classId: pupil!.classId,
      pupilId: pupil!.id,
      title: profile!.nextActions[0]?.replaceAll('_', ' ') ?? t('followup_title'),
      detail: t('override_note'),
      dueDate: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
      source: 'manual',
    });
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`${classroom?.gradeLevel ?? t('class_label')} ${classroom?.sectionLabel ?? ''} · ${t('pupil_profile')}`}
        title={pupil.displayName}
        subtitle={`${pupil.localPupilCode || t('no_local_code')} · ${t('pupil_profile_subtitle')}`}
        actions={<div className="button-row"><Link to="/pupils"><Button variant="secondary">{t('pupil_directory')}</Button></Link><Link to={`/progress/${pupil.id}`}><Button variant="ghost"><Icon name="check" size={16} /> {t('record_progress')}</Button></Link></div>}
      />

      <section className="profile-hero">
        <div className="profile-identity">
          <span className="avatar avatar-xl">{pupil.displayName.slice(0, 1)}</span>
          <div>
            <div className="profile-kicker">{t('evidence_summary')}</div>
            <h2>{t(statusKeys[profile.status])}</h2>
            <p>{profile.statusReasons.map((reason) => t(reason as TranslationKey)).join(' ')}</p>
          </div>
        </div>
        <div className="profile-status">
          <Pill tone={statusTones[profile.status]}>{t(statusKeys[profile.status])}</Pill>
          <Pill tone="muted">{t(`confidence_${profile.confidence}` as TranslationKey)}</Pill>
          <small>{t('based_on_records', { count: profile.evidenceIds.length })}</small>
        </div>
      </section>

      <div className="metric-card-row">
        <div className="card mini-metric"><span className="status-dot status-ok" /><div><strong>{profile.attendance.rate}%</strong><small>{t('attendance_rate')} · {tn('marked_count', profile.attendance.marked)}</small></div></div>
        <div className="card mini-metric"><span className="status-dot status-warn" /><div><strong>{formatScore(profile.assessments.average || null)}</strong><small>{t('assessment_average')} · {tn('assessment_count', profile.assessments.count)}</small></div></div>
        <div className="card mini-metric"><span className="status-dot status-wait" /><div><strong>{profile.observations.count}</strong><small>{t('observations')} · {profile.observations.approved} {t('approved').toLowerCase()}</small></div></div>
      </div>

      <div className="profile-grid">
        <div className="page-stack">
          <Card>
            <div className="card-heading"><div><div className="eyebrow">{t('attendance_rate')}</div><h3>{t('attendance_title')}</h3></div><Pill tone={profile.attendance.rate < 75 ? 'tomato' : 'forest'}>{profile.attendance.rate}%</Pill></div>
            <div className="detail-list">
              <div><span>{t('present')}</span><strong>{profile.attendance.present}</strong></div>
              <div><span>{t('absent')}</span><strong>{profile.attendance.absent}</strong></div>
              <div><span>{t('late')}</span><strong>{profile.attendance.late}</strong></div>
              <div><span>{t('recent_evidence')}</span><strong>{profile.attendance.lastDate ? formatDate(profile.attendance.lastDate) : '—'}</strong></div>
            </div>
            {profile.attendance.consecutiveAbsences >= 2 && <div className="inline-error">{t('suggest_attendance_detail')}</div>}
          </Card>

          <Card>
            <div className="card-heading"><div><div className="eyebrow">{t('assessment_average')}</div><h3>{t('assessment_trend')}</h3></div><Button variant="secondary" onClick={() => setShowAssessment((value) => !value)}><Icon name="plus" size={15} /> {t('record_assessment')}</Button></div>
            <div className="assessment-trend">
              {recentAssessments.length === 0 ? <p className="muted">{t('no_assessments')}</p> : recentAssessments.map((item) => (
                <div className="assessment-row" key={item.id}>
                  <span className="assessment-score">{Math.round((item.score / item.maxScore) * 100)}%</span>
                  <span className="assessment-main"><strong>{item.objectiveLabel}</strong><small>{subjectLabel(t, item.subjectId)} · {formatDate(item.schoolDate)}</small></span>
                </div>
              ))}
            </div>
            {showAssessment && (
              <form className="form-grid assessment-form" onSubmit={saveAssessment}>
                <Field label={t('assessment_objective')}><TextInput value={assessment.objectiveLabel} onChange={(event) => setAssessment({ ...assessment, objectiveLabel: event.target.value })} placeholder={t('lesson_title_placeholder')} /></Field>
                <Field label={t('subject')}><SelectInput value={assessment.subject} onChange={(event) => setAssessment({ ...assessment, subject: event.target.value })}>{['basic_science', 'mathematics', 'english', 'social_studies'].map((value) => <option key={value} value={value}>{subjectLabel(t, value)}</option>)}</SelectInput></Field>
                <Field label={t('assessment_score')}><TextInput inputMode="numeric" value={assessment.score} onChange={(event) => setAssessment({ ...assessment, score: event.target.value })} /></Field>
                <Field label={t('assessment_max')}><TextInput inputMode="numeric" value={assessment.maxScore} onChange={(event) => setAssessment({ ...assessment, maxScore: event.target.value })} /></Field>
                <Field label={t('assessment_date')}><TextInput type="date" value={assessment.date} onChange={(event) => setAssessment({ ...assessment, date: event.target.value })} /></Field>
                <Field label={t('assessment_note')}><TextInput value={assessment.note} onChange={(event) => setAssessment({ ...assessment, note: event.target.value })} /></Field>
                <div className="form-actions"><Button type="submit">{t('save_assessment')}</Button><Button type="button" variant="ghost" onClick={() => setShowAssessment(false)}>{t('cancel')}</Button></div>
                {error && <div className="inline-error" role="alert">{error}</div>}
              </form>
            )}
          </Card>

          <Card>
            <div className="card-heading"><div><div className="eyebrow">{t('recent_evidence')}</div><h3>{t('observations')}</h3></div><Link to={`/progress/${pupil.id}`} className="text-link">{t('record_progress')}</Link></div>
            {profile.observations.recent.length === 0 ? <p className="muted">{t('no_observations')}</p> : (
              <div className="evidence-list">
                {profile.observations.recent.map((entry) => (
                  <article className="evidence-row" key={entry.id}>
                    <div className="list-main"><strong>{t(entry.indicator)} · {subjectLabel(t, entry.subjectId)}</strong><small>{formatDate(entry.periodEnd)} · {entry.approvalStatus === 'approved' ? t('approved') : t('pending_approval')}</small><p>{entry.teacherNote}</p>{entry.homeActivity && <small>{t('home_prefix', { text: entry.homeActivity })}</small>}</div>
                  </article>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="page-stack">
          <Card>
            <div className="eyebrow">{t('profile_strengths')}</div>
            <div className="chip-list">{profile.strengths.length ? profile.strengths.map((item) => <Pill key={item} tone="forest">{t(item as TranslationKey)}</Pill>) : <span className="muted">{t('insufficient_evidence')}</span>}</div>
            <div className="eyebrow section-gap">{t('profile_needs_attention')}</div>
            <div className="chip-list">{profile.needsAttention.length ? profile.needsAttention.map((item) => <Pill key={item} tone="tomato">{t(item as TranslationKey)}</Pill>) : <span className="muted">{t('no_attention_flags')}</span>}</div>
            <div className="eyebrow section-gap">{t('next_actions')}</div>
            <ul className="simple-list">{profile.nextActions.map((item) => <li key={item}>{t(item as TranslationKey)}</li>)}</ul>
            <p className="fine-print">{t('override_note')}</p>
          </Card>

          <Card>
            <div className="card-heading"><div><div className="eyebrow">{t('followups')}</div><h3>{t('open_followups')}</h3></div><Pill tone="butter">{pupilFollowUps.length}</Pill></div>
            {pupilFollowUps.length === 0 ? <p className="muted">{t('no_open_followups')}</p> : pupilFollowUps.map((item) => (
              <div className="followup-row" key={item.id}>
                <div><strong>{item.title}</strong><small>{item.detail}</small><small>{t('due_date')}: {formatDate(item.dueDate)}</small></div>
                <Button variant="ghost" onClick={() => updateFollowUpStatus(item.id, 'done')}>{t('mark_done')}</Button>
              </div>
            ))}
            <Button variant="secondary" onClick={createFollowUp}><Icon name="plus" size={15} /> {t('add_suggested_followup')}</Button>
          </Card>

          <Card className="ai-evidence-card">
            <div className="card-heading"><div><div className="eyebrow">{t('analysis_diagnostics')}</div><h3>{t('generate_evidence_review')}</h3></div><Pill tone="cobalt">{t('ai_optional')}</Pill></div>
            <p className="muted">{t('ai_privacy_note')}</p>
            <Button onClick={() => void generateReview()} disabled={busy !== null}>{busy === 'review' ? t('ai_thinking') : t('generate_evidence_review')}</Button>
            {review && (
              <div className="ai-result">
                <div className="source-row"><Pill tone={review.fallback ? 'butter' : review.source === 'On-device Gemini Nano' ? 'forest' : 'cobalt'}>{review.source}</Pill><small>{t('analysis_duration')}: {review.durationMs} ms</small></div>
                <p>{review.output}</p>
                <small>{review.fallback ? t('analysis_fallback') : t('ai_review_note')}</small>
                <small>{t('evidence_used')}: {review.evidenceSummary}</small>
              </div>
            )}
            {error && <div className="inline-error" role="alert">{error}</div>}
          </Card>

          <Card>
            <div className="card-heading"><div><div className="eyebrow">{t('parent_draft')}</div><h3>{t('generate_parent_draft')}</h3></div><Pill tone="tomato">{t('honest_scope')}</Pill></div>
            <p className="muted">{t('parent_draft_note')}</p>
            <Button variant="secondary" onClick={() => void generateDraft()} disabled={busy !== null}>{busy === 'draft' ? t('ai_thinking') : t('generate_parent_draft')}</Button>
            {draft && (
              <>
                <TextArea rows={8} value={draft} onChange={(event) => setDraft(event.target.value)} />
                <div className="button-row"><Button onClick={() => queueParentUpdate(pupil.id, draft)}>{t('approve_parent_draft')}</Button><Button variant="ghost" onClick={() => setDraft('')}>{t('dismiss')}</Button></div>
              </>
            )}
          </Card>

          <Card className="soft-card">
            <div className="eyebrow">{t('recent_evidence')}</div>
            {pupilAnalyses.length === 0 ? <p className="muted">{t('no_analysis_yet')}</p> : pupilAnalyses.map((analysis) => <div className="analysis-history" key={analysis.id}><strong>{analysis.source}</strong><small>{formatDate(analysis.createdAt)} · {analysis.evidenceIds.length} {t('evidence_used').toLowerCase()}</small></div>)}
          </Card>
        </div>
      </div>
    </div>
  );
}
