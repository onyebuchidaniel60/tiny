import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, Field, PageHeader, Pill, SelectInput, TextArea } from '../components/ui';
import { useStore } from '../data/store';
import { subjectLabel, useI18n } from '../i18n';
import type { ProgressIndicator } from '../types';

const subjects = ['basic_science', 'mathematics', 'english', 'social_studies'];
const indicators: ProgressIndicator[] = ['doing_well', 'developing', 'needs_support', 'not_assessed'];

export function ProgressPage() {
  const { pupilId } = useParams();
  const { state, saveProgress, approveProgress } = useStore();
  const { t, formatDate } = useI18n();
  const pupil = state.pupils.find((item) => item.id === pupilId);
  const classroom = state.classes.find((item) => item.id === pupil?.classId);
  const [indicator, setIndicator] = useState<ProgressIndicator>('developing');
  const [note, setNote] = useState('');
  const [homeActivity, setHomeActivity] = useState('');
  const [subject, setSubject] = useState('basic_science');
  const [periodStart, setPeriodStart] = useState('2026-11-23');
  const [periodEnd, setPeriodEnd] = useState('2026-11-27');
  const [saved, setSaved] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);

  if (!pupil) return <EmptyState title={t('error_not_found')} body={t('help_pupils_body')} action={<Link to="/classes"><Button>{t('classes_title')}</Button></Link>} />;

  const entries = state.progress.filter((entry) => entry.pupilId === pupil.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  function save(approve: boolean) {
    if (!note.trim()) {
      setSaved({ tone: 'error', text: t('note_required') });
      return;
    }
    saveProgress({
      pupilId: pupil!.id,
      classId: pupil!.classId,
      periodStart,
      periodEnd,
      subjectId: subject,
      indicator,
      teacherNote: note.trim(),
      homeActivity: homeActivity.trim(),
      approvalStatus: approve ? 'approved' : 'draft',
    }, approve);
    setNote('');
    setHomeActivity('');
    setSaved({ tone: 'info', text: approve ? t('progress_approved') : t('progress_saved') });
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`${classroom?.gradeLevel ?? t('class')} ${classroom?.sectionLabel ?? ''}`}
        title={pupil.displayName}
        subtitle={`${pupil.localPupilCode || t('no_local_code')} · ${t('progress_subtitle')}`}
        actions={<Link to={`/classes/${pupil.classId}`}><Button variant="secondary">{t('roster')}</Button></Link>}
      />

      <div className="two-column wide-left">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('new_observation')}</div><h3>{t('record_progress')}</h3></div><Pill tone="tomato">{t('honest_scope')}</Pill></div>
          <div className="form-grid">
            <Field label={t('subject')}>
              <SelectInput value={subject} onChange={(event) => setSubject(event.target.value)}>
                {subjects.map((value) => <option key={value} value={value}>{subjectLabel(t, value)}</option>)}
              </SelectInput>
            </Field>
            <Field label={t('indicator')}>
              <SelectInput value={indicator} onChange={(event) => setIndicator(event.target.value as ProgressIndicator)}>
                {indicators.map((value) => <option key={value} value={value}>{t(value)}</option>)}
              </SelectInput>
            </Field>
            <Field label={t('period')}><div className="date-pair"><input className="input" type="date" aria-label={`${t('period')} — ${t('previous')}`} value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /><input className="input" type="date" aria-label={`${t('period')} — ${t('next')}`} value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></div></Field>
            <Field label={t('factual_observation')} hint={t('factual_hint')}><TextArea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('factual_placeholder')} /></Field>
            <Field label={t('home_activity')} hint={t('home_hint')}><TextArea rows={2} value={homeActivity} onChange={(event) => setHomeActivity(event.target.value)} placeholder={t('home_placeholder')} /></Field>
            <div className="form-actions">
              <Button onClick={() => save(false)} type="button">{t('save_progress_draft')}</Button>
              <Button onClick={() => save(true)} type="button" variant="secondary"><Icon name="check" size={16} /> {t('approve_locally')}</Button>
            </div>
            {saved && <div className={saved.tone === 'error' ? 'inline-error' : 'inline-info'} role={saved.tone === 'error' ? 'alert' : 'status'}>{saved.text}</div>}
          </div>
        </Card>

        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('history')}</div><h3>{t('observations')}</h3></div><Pill tone="muted">{entries.length}</Pill></div>
          {entries.length === 0 ? <p className="muted">{t('no_observations')}</p> : (
            <div className="list">
              {entries.map((entry) => (
                <div className="progress-row" key={entry.id}>
                  <div className="list-main">
                    <strong>{t(entry.indicator)} · {subjectLabel(t, entry.subjectId)}</strong>
                    <small>{formatDate(entry.periodStart)}–{formatDate(entry.periodEnd)} · {t('revision_label', { count: entry.revision })}</small>
                    <p>{entry.teacherNote}</p>
                    {entry.homeActivity && <small>{t('home_prefix', { text: entry.homeActivity })}</small>}
                  </div>
                  <div className="progress-actions">
                    <Pill tone={entry.approvalStatus === 'approved' ? 'forest' : 'butter'}>{entry.approvalStatus === 'approved' ? t('approved') : t('pending_approval')}</Pill>
                    {entry.approvalStatus === 'draft' && <Button variant="ghost" onClick={() => approveProgress(entry.id)}>{t('approve_progress')}</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Card className="soft-card"><p className="muted">{t('digest_note')} {t('settings_server_note')}</p></Card>
    </div>
  );
}
