import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, Field, PageHeader, Pill, SelectInput, TextInput } from '../components/ui';
import { useStore } from '../data/store';
import { subjectLabel, useI18n } from '../i18n';

const subjects = ['basic_science', 'mathematics', 'english', 'social_studies'];

export function LessonsPage() {
  const { state, saveLesson } = useStore();
  const { t } = useI18n();
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
        eyebrow={t('lesson_5e')}
        title={t('lessons_heading')}
        subtitle={t('lessons_subtitle')}
        actions={<Button onClick={() => setOpen((value) => !value)}><Icon name="plus" size={17} /> {t('new_lesson')}</Button>}
      />
      {open && (
        <Card className="form-card">
          <form className="form-grid" onSubmit={submit}>
            <Field label={t('lesson_title')}><TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('lesson_title_placeholder')} /></Field>
            <Field label={t('class')}>
              <SelectInput value={classId} onChange={(event) => setClassId(event.target.value)}>
                {state.classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.gradeLevel} {classroom.sectionLabel}</option>)}
              </SelectInput>
            </Field>
            <Field label={t('subject')}>
              <SelectInput value={subject} onChange={(event) => setSubject(event.target.value)}>
                {subjects.map((value) => <option key={value} value={value}>{t(`subject_${value}` as never)}</option>)}
              </SelectInput>
            </Field>
            <Field label={t('lesson_objective')}><TextInput value={objective} onChange={(event) => setObjective(event.target.value)} placeholder={t('lesson_objective_placeholder')} /></Field>
            <div className="form-actions"><Button type="submit">{t('create_draft')}</Button><Button variant="ghost" type="button" onClick={() => setOpen(false)}>{t('cancel')}</Button></div>
          </form>
        </Card>
      )}
      <div className="card-grid">
        {state.lessons.map((lesson) => {
          const classroom = state.classes.find((item) => item.id === lesson.classId);
          return (
            <Card key={lesson.id} className="lesson-card">
              <div className="class-card-top"><Pill tone="butter">{subjectLabel(t, lesson.subjectId)}</Pill><Pill tone={lesson.status === 'ready' ? 'forest' : 'muted'}>{lesson.status === 'ready' ? t('status_ready') : t('status_draft')}</Pill></div>
              <h3>{lesson.title}</h3>
              <p>{lesson.objective || t('no_objective')}</p>
              <div className="lesson-meta"><span>{lesson.gradeLevel}</span><span>{classroom?.sectionLabel ?? t('class')}</span><span>5E</span></div>
              <Link to={`/lessons/${lesson.id}`}><Button variant="secondary">{t('open_lesson')} <Icon name="arrow" size={15} /></Button></Link>
            </Card>
          );
        })}
      </div>
      {state.lessons.length === 0 && <Card><p className="muted">{t('no_lessons')}</p></Card>}
    </div>
  );
}
