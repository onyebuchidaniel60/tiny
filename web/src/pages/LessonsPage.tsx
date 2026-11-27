import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, Field, PageHeader, Pill, SelectInput, TextInput } from '../components/ui';
import { useStore } from '../data/store';

export function LessonsPage() {
  const { state, saveLesson } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState(state.classes[0]?.id ?? '');
  const [subject, setSubject] = useState('basic_science');
  const [objective, setObjective] = useState('');
  const navigate = useNavigate();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const classroom = state.classes.find((item) => item.id === classId);
    const lesson = saveLesson({
      classId,
      title: title.trim(),
      gradeLevel: classroom?.gradeLevel ?? 'P4',
      subjectId: subject,
      objective: objective.trim(),
      engage: '',
      explore: '',
      explain: '',
      elaborate: '',
      evaluate: '',
      materials: '',
      status: 'draft',
    });
    setOpen(false);
    navigate(`/lessons/${lesson.id}`);
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="5E planning"
        title="Lessons"
        subtitle="Teacher-authored scaffolds that open without signal. No claim of full NERDC coverage."
        actions={<Button onClick={() => setOpen((value) => !value)}><Icon name="plus" size={17} /> New lesson</Button>}
      />
      {open && (
        <Card className="form-card">
          <form className="form-grid" onSubmit={submit}>
            <Field label="Lesson title"><TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sources and uses of water" /></Field>
            <Field label="Class">
              <SelectInput value={classId} onChange={(event) => setClassId(event.target.value)}>
                {state.classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.gradeLevel} {classroom.sectionLabel}</option>)}
              </SelectInput>
            </Field>
            <Field label="Subject"><TextInput value={subject} onChange={(event) => setSubject(event.target.value)} /></Field>
            <Field label="Objective"><TextInput value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="What pupils should be able to do" /></Field>
            <div className="form-actions"><Button type="submit">Create local draft</Button><Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button></div>
          </form>
        </Card>
      )}
      <div className="card-grid">
        {state.lessons.map((lesson) => {
          const classroom = state.classes.find((item) => item.id === lesson.classId);
          return (
            <Card key={lesson.id} className="lesson-card">
              <div className="class-card-top"><Pill tone="butter">{lesson.subjectId.replace('_', ' ')}</Pill><Pill tone={lesson.status === 'ready' ? 'forest' : 'muted'}>{lesson.status}</Pill></div>
              <h3>{lesson.title}</h3>
              <p>{lesson.objective || 'No objective yet. Open the plan to add one.'}</p>
              <div className="lesson-meta"><span>{lesson.gradeLevel}</span><span>{classroom?.sectionLabel ?? 'Class'}</span><span>5E</span></div>
              <Link to={`/lessons/${lesson.id}`}><Button variant="secondary">Open lesson <Icon name="arrow" size={15} /></Button></Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
