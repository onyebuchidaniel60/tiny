import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, Field, PageHeader, Pill, SelectInput, TextInput } from '../components/ui';
import { useStore } from '../data/store';
import { subjectLabel, useI18n } from '../i18n';
import { buildClassIntelligence, deterministicLessonPlan } from '../intelligence';

const subjects = ['basic_science', 'mathematics', 'english', 'social_studies'];

export function LessonsPage() {
  const { state, saveLesson } = useStore();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState(state.classes[0]?.id ?? '');
  const [subject, setSubject] = useState('basic_science');
  const [objective, setObjective] = useState('');
  const [planClassId, setPlanClassId] = useState(state.classes[0]?.id ?? '');
  const navigate = useNavigate();

  function planFromEvidence() {
    const classroom = state.classes.find((item) => item.id === planClassId);
    const intelligence = buildClassIntelligence(state, planClassId);
    if (!classroom || !intelligence) return;
    const plan = deterministicLessonPlan(intelligence);
    const gap = intelligence.commonGaps[0];
    const lesson = saveLesson({
      classId: classroom.id,
      title: gap ? `Evidence-informed: ${gap.objectiveLabel}` : 'Evidence-informed lesson',
      gradeLevel: classroom.gradeLevel,
      subjectId: classroom.subjectIds[0] ?? 'basic_science',
      objective: plan.split('\n')[0].replace('Objective: ', ''),
      engage: 'Use a local object or short story linked to the recorded gap.',
      explore: 'Pairs sort or match examples before the formal explanation.',
      explain: 'Model the key vocabulary and connect it to pupil observations.',
      elaborate: 'Apply the idea in a new everyday context.',
      evaluate: 'Short three-question check for understanding.',
      materials: 'Locally available objects, chalkboard, pupil exercise books',
      status: 'draft',
    });
    navigate(`/lessons/${lesson.id}`);
  }

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
      <Card className="evidence-plan-card">
        <div className="card-heading"><div><div className="eyebrow">{t('plan_from_evidence')}</div><h3>{t('class_intelligence')}</h3></div><span className="pill pill-cobalt">{t('honest_scope')}</span></div>
        <p className="muted">{t('lesson_evidence_note')}</p>
        <div className="evidence-plan-actions">
          <SelectInput value={planClassId} onChange={(event) => setPlanClassId(event.target.value)}>{state.classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.gradeLevel} {classroom.sectionLabel}</option>)}</SelectInput>
          <Button onClick={planFromEvidence}>{t('plan_from_evidence')}</Button>
          <Link to={`/classes/${planClassId}/intelligence`}><Button variant="ghost">{t('class_intelligence')}</Button></Link>
        </div>
      </Card>
      {open && (
        <Card className="form-card">
          <form className="form-grid" onSubmit={submit}>
            <Field label={t('lesson_title')}><TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('lesson_title_placeholder')} /></Field>
            <Field label={t('class_label')}>
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
              <div className="lesson-meta"><span>{lesson.gradeLevel}</span><span>{classroom?.sectionLabel ?? t('class_label')}</span><span>5E</span></div>
              <Link to={`/lessons/${lesson.id}`}><Button variant="secondary">{t('open_lesson')} <Icon name="arrow" size={15} /></Button></Link>
            </Card>
          );
        })}
      </div>
      {state.lessons.length === 0 && <Card><p className="muted">{t('no_lessons')}</p></Card>}
    </div>
  );
}
