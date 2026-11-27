import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, Field, PageHeader, Pill, SelectInput, TextInput } from '../components/ui';
import { useStore } from '../data/store';
import { subjectLabel, useI18n } from '../i18n';

export function ClassesPage() {
  const { state, addClass } = useStore();
  const { t, tn } = useI18n();
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState('P4');
  const [section, setSection] = useState('');
  const [year, setYear] = useState('2026/2027');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!section.trim()) {
      setError(t('required_field'));
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
        eyebrow={t('classes_title')}
        title={t('classes_heading')}
        subtitle={t('classes_subtitle')}
        actions={<Button onClick={() => setOpen((value) => !value)}><Icon name="plus" size={17} /> {t('new_class')}</Button>}
      />
      {open && (
        <Card className="form-card">
          <div className="card-heading"><div><div className="eyebrow">{t('new_class')}</div><h3>{t('add_class')}</h3></div></div>
          <form className="form-grid" onSubmit={submit}>
            <Field label={t('grade_level')}>
              <SelectInput value={grade} onChange={(event) => setGrade(event.target.value)}>
                {['P1', 'P2', 'P3', 'P4', 'P5', 'P6'].map((value) => <option key={value}>{value}</option>)}
              </SelectInput>
            </Field>
            <Field label={t('section_label')} hint={t('section_hint')}>
              <TextInput value={section} onChange={(event) => setSection(event.target.value)} placeholder={t('section_placeholder')} />
            </Field>
            <Field label={t('academic_year')}>
              <TextInput value={year} onChange={(event) => setYear(event.target.value)} />
            </Field>
            <div className="form-actions">
              <Button type="submit">{t('save_class')}</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t('cancel')}</Button>
            </div>
            {error && <div className="inline-error" role="alert">{error}</div>}
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
              <p>{tn('classes_pupil_count', active.length)} · {tn('classes_subject_count', classroom.subjectIds.length)}</p>
              <div className="subject-pills">
                {classroom.subjectIds.slice(0, 3).map((subject) => <span key={subject}>{subjectLabel(t, subject)}</span>)}
              </div>
              <div className="card-actions">
                <Link to={`/classes/${classroom.id}`}><Button variant="secondary">{t('open_class')}</Button></Link>
                <Link to={`/attendance/${classroom.id}`}><Button variant="ghost">{t('register')} <Icon name="arrow" size={15} /></Button></Link>
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="soft-card">
        <div className="card-heading"><div><div className="eyebrow">{t('local_by_default')}</div><h3>{t('saved_on_device')}</h3></div></div>
        <p className="muted">{t('class_local_note')}</p>
      </Card>
    </div>
  );
}
