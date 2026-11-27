import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, Field, PageHeader, Pill, SelectInput, TextArea, formatDate } from '../components/ui';
import { useStore } from '../data/store';
import type { ProgressIndicator } from '../types';

export function ProgressPage() {
  const { pupilId } = useParams();
  const { state, saveProgress, approveProgress } = useStore();
  const pupil = state.pupils.find((item) => item.id === pupilId);
  const classroom = state.classes.find((item) => item.id === pupil?.classId);
  const [indicator, setIndicator] = useState<ProgressIndicator>('developing');
  const [note, setNote] = useState('');
  const [homeActivity, setHomeActivity] = useState('');
  const [subject, setSubject] = useState('basic_science');
  const [periodStart, setPeriodStart] = useState('2026-11-23');
  const [periodEnd, setPeriodEnd] = useState('2026-11-27');
  const [saved, setSaved] = useState<string | null>(null);

  if (!pupil) return <EmptyState title="Pupil not found" body="Open a pupil from a class roster." action={<Link to="/classes"><Button>Classes</Button></Link>} />;

  const entries = state.progress.filter((entry) => entry.pupilId === pupil.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  function save(approve: boolean) {
    if (!note.trim()) {
      setSaved('Add a short factual observation before saving.');
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
    setSaved(approve ? 'Progress approved locally. It can be shared only after server acceptance.' : 'Draft observation saved on this device.');
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`${classroom?.gradeLevel ?? 'Class'} ${classroom?.sectionLabel ?? ''}`}
        title={pupil.displayName}
        subtitle={`${pupil.localPupilCode || 'No local code'} · Teacher-authored progress, never AI grading or diagnosis.`}
        actions={<Link to={`/classes/${pupil.classId}`}><Button variant="secondary">Roster</Button></Link>}
      />

      <div className="two-column wide-left">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">New observation</div><h3>Record progress</h3></div><Pill tone="tomato">Teacher review</Pill></div>
          <div className="form-grid">
            <Field label="Subject"><SelectInput value={subject} onChange={(event) => setSubject(event.target.value)}><option value="basic_science">Basic science</option><option value="mathematics">Mathematics</option><option value="english">English</option><option value="social_studies">Social studies</option></SelectInput></Field>
            <Field label="Indicator">
              <SelectInput value={indicator} onChange={(event) => setIndicator(event.target.value as ProgressIndicator)}>
                <option value="doing_well">Doing well</option>
                <option value="developing">Developing</option>
                <option value="needs_support">Needs support</option>
                <option value="not_assessed">Not assessed</option>
              </SelectInput>
            </Field>
            <Field label="Period start"><input className="input" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /></Field>
            <Field label="Period end"><input className="input" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></Field>
            <Field label="Factual observation" hint="No diagnosis, labels or comparisons with other pupils."><TextArea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What did this pupil do or say?" /></Field>
            <Field label="Practical home activity" hint="Optional and non-punitive."><TextArea rows={2} value={homeActivity} onChange={(event) => setHomeActivity(event.target.value)} placeholder="One short activity a family can try." /></Field>
            <div className="form-actions">
              <Button onClick={() => save(false)} type="button">Save draft</Button>
              <Button onClick={() => save(true)} type="button" variant="secondary"><Icon name="check" size={16} /> Approve locally</Button>
            </div>
            {saved && <div className="inline-info">{saved}</div>}
          </div>
        </Card>

        <Card>
          <div className="card-heading"><div><div className="eyebrow">History</div><h3>Observations</h3></div><Pill tone="muted">{entries.length}</Pill></div>
          {entries.length === 0 ? <p className="muted">No observations recorded for this pupil.</p> : (
            <div className="list">
              {entries.map((entry) => (
                <div className="progress-row" key={entry.id}>
                  <div className="list-main">
                    <strong>{entry.indicator.replace('_', ' ')} · {entry.subjectId.replace('_', ' ')}</strong>
                    <small>{formatDate(entry.periodStart)}–{formatDate(entry.periodEnd)} · revision {entry.revision}</small>
                    <p>{entry.teacherNote}</p>
                    {entry.homeActivity && <small>Home: {entry.homeActivity}</small>}
                  </div>
                  <div className="progress-actions">
                    <Pill tone={entry.approvalStatus === 'approved' ? 'forest' : 'butter'}>{entry.approvalStatus}</Pill>
                    {entry.approvalStatus === 'draft' && <Button variant="ghost" onClick={() => approveProgress(entry.id)}>Approve</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Card className="soft-card"><p className="muted">Approved progress is eligible for a weekly digest, but no parent content is sent while the SMS adapter is mocked and Cloud Functions remain emulator-only.</p></Card>
    </div>
  );
}
