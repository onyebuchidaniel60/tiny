import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, Field, PageHeader, Pill, SelectInput, TextInput } from '../components/ui';
import { useStore } from '../data/store';

export function ClassesPage() {
  const { state, addClass } = useStore();
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState('P4');
  const [section, setSection] = useState('');
  const [year, setYear] = useState('2026/2027');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!section.trim()) {
      setError('Add a section label such as Blue or Gold.');
      return;
    }
    const classroom = addClass(grade, section.trim(), year.trim(), ['basic_science', 'mathematics']);
    setOpen(false);
    setSection('');
    setError(null);
    navigate(`/classes/${classroom.id}`);
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="School"
        title="Classes"
        subtitle="Manage more than one class, keep rosters local and open a register without signal."
        actions={<Button onClick={() => setOpen((value) => !value)}><Icon name="plus" size={17} /> New class</Button>}
      />
      {open && (
        <Card className="form-card">
          <div className="card-heading"><div><div className="eyebrow">New class</div><h3>Add a class</h3></div></div>
          <form className="form-grid" onSubmit={submit}>
            <Field label="Grade">
              <SelectInput value={grade} onChange={(event) => setGrade(event.target.value)}>
                {['P1', 'P2', 'P3', 'P4', 'P5', 'P6'].map((value) => <option key={value}>{value}</option>)}
              </SelectInput>
            </Field>
            <Field label="Section label" hint="For example Blue or Gold">
              <TextInput value={section} onChange={(event) => setSection(event.target.value)} placeholder="Blue" />
            </Field>
            <Field label="Academic year">
              <TextInput value={year} onChange={(event) => setYear(event.target.value)} />
            </Field>
            <div className="form-actions">
              <Button type="submit">Save class locally</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
            {error && <div className="inline-error">{error}</div>}
          </form>
        </Card>
      )}

      <div className="card-grid">
        {state.classes.map((classroom) => {
          const pupils = state.pupils.filter((pupil) => pupil.classId === classroom.id);
          const active = pupils.filter((pupil) => pupil.enrollmentStatus === 'active');
          return (
            <Card key={classroom.id} className="class-card">
              <div className="class-card-top">
                <span className="class-avatar large">{classroom.gradeLevel}{classroom.sectionLabel.slice(0, 1)}</span>
                <Pill tone="cobalt">{classroom.academicYear}</Pill>
              </div>
              <h3>{classroom.gradeLevel} {classroom.sectionLabel}</h3>
              <p>{active.length} active pupils · {classroom.subjectIds.length} subjects</p>
              <div className="subject-pills">
                {classroom.subjectIds.slice(0, 3).map((subject) => <span key={subject}>{subject.replace('_', ' ')}</span>)}
              </div>
              <div className="card-actions">
                <Link to={`/classes/${classroom.id}`}><Button variant="secondary">Open class</Button></Link>
                <Link to={`/attendance/${classroom.id}`}><Button variant="ghost">Register <Icon name="arrow" size={15} /></Button></Link>
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="soft-card">
        <div className="card-heading"><div><div className="eyebrow">Low requirements</div><h3>Local by default</h3></div></div>
        <p className="muted">
          Classes and pupils are stored in this browser. A queued server command is recorded for each change,
          but Cloud Functions are emulator-only on Spark; the interface never shows a queued write as synced.
        </p>
      </Card>
    </div>
  );
}
