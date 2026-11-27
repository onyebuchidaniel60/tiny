import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, Field, PageHeader, Pill, TextInput, formatDate } from '../components/ui';
import { useStore } from '../data/store';

export function ClassDetailPage() {
  const { classId } = useParams();
  const { state, addPupil } = useStore();
  const classroom = state.classes.find((item) => item.id === classId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!classroom) {
    return <EmptyState title="Class not found" body="The class may have been removed from this device." action={<Link to="/classes"><Button>Back to classes</Button></Link>} />;
  }

  const pupils = state.pupils.filter((pupil) => pupil.classId === classroom.id);
  const sessions = state.attendance.filter((session) => session.classId === classroom.id).sort((a, b) => b.schoolDate.localeCompare(a.schoolDate));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Add a pupil name.');
      return;
    }
    addPupil(classroom!.id, name.trim(), code.trim());
    setName('');
    setCode('');
    setError(null);
    setOpen(false);
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`${classroom.academicYear} · ${classroom.teacherName}`}
        title={`${classroom.gradeLevel} ${classroom.sectionLabel}`}
        subtitle={`${pupils.filter((pupil) => pupil.enrollmentStatus === 'active').length} active pupils · ${classroom.subjectIds.length} subjects`}
        actions={
          <div className="button-row">
            <Link to={`/attendance/${classroom.id}`}><Button><Icon name="attendance" size={17} /> Register</Button></Link>
            <Button variant="secondary" onClick={() => setOpen((value) => !value)}><Icon name="plus" size={16} /> Pupil</Button>
          </div>
        }
      />

      {open && (
        <Card className="form-card">
          <div className="card-heading"><div><div className="eyebrow">Roster</div><h3>Register a pupil</h3></div></div>
          <form className="form-grid" onSubmit={submit}>
            <Field label="Display name">
              <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Synthetic pupil name" />
            </Field>
            <Field label="Local code" hint="Optional short code for this device">
              <TextInput value={code} onChange={(event) => setCode(event.target.value)} placeholder="KOF009" />
            </Field>
            <div className="form-actions">
              <Button type="submit">Save pupil locally</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
            {error && <div className="inline-error">{error}</div>}
          </form>
        </Card>
      )}

      <div className="two-column wide-left">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">Roster</div><h3>Pupils</h3></div><Pill tone="muted">{pupils.length}</Pill></div>
          {pupils.length === 0 ? (
            <EmptyState icon="people" title="No pupils yet" body="Add a synthetic pupil to begin a register." action={<Button onClick={() => setOpen(true)}>Add pupil</Button>} />
          ) : (
            <div className="list">
              {pupils.map((pupil) => {
                const links = state.links.filter((link) => link.pupilId === pupil.id);
                return (
                  <div className="list-row" key={pupil.id}>
                    <span className="avatar">{pupil.displayName.slice(0, 1)}</span>
                    <div className="list-main"><strong>{pupil.displayName}</strong><small>{pupil.localPupilCode || 'No local code'} · {links.length} guardian link{links.length === 1 ? '' : 's'}</small></div>
                    <Link to={`/progress/${pupil.id}`} className="text-link">Progress</Link>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="card-heading"><div><div className="eyebrow">History</div><h3>Registers</h3></div><Link to={`/attendance/${classroom.id}`} className="text-link">Open register</Link></div>
          {sessions.length === 0 ? <p className="muted">No register saved for this class yet.</p> : (
            <div className="list">
              {sessions.slice(0, 6).map((session) => {
                const absent = session.entries.filter((entry) => entry.status === 'absent').length;
                return (
                  <div className="list-row" key={session.id}>
                    <span className="date-square">{formatDate(session.schoolDate, { day: '2-digit', month: 'short' })}</span>
                    <div className="list-main"><strong>{session.status === 'submitted' ? 'Submitted' : 'Draft'}</strong><small>{absent} absent · {session.entries.length} marked</small></div>
                    <Pill tone={session.status === 'submitted' ? 'forest' : 'butter'}>{session.status}</Pill>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="card-heading"><div><div className="eyebrow">Class plan</div><h3>Lessons for this class</h3></div><Link to="/lessons" className="text-link">All lessons</Link></div>
        <div className="mini-card-grid">
          {state.lessons.filter((lesson) => lesson.classId === classroom.id).slice(0, 4).map((lesson) => (
            <Link to={`/lessons/${lesson.id}`} key={lesson.id} className="mini-card">
              <span className="eyebrow">{lesson.subjectId.replace('_', ' ')}</span>
              <strong>{lesson.title}</strong>
              <small>{lesson.gradeLevel} · {lesson.status}</small>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
