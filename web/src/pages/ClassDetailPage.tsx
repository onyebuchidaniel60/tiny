import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, Field, PageHeader, Pill, TextInput } from '../components/ui';
import { useStore } from '../data/store';
import { subjectLabel, useI18n } from '../i18n';

export function ClassDetailPage() {
  const { classId } = useParams();
  const { state, addPupil } = useStore();
  const { t, tn, formatDate } = useI18n();
  const classroom = state.classes.find((item) => item.id === classId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!classroom) {
    return <EmptyState title={t('class_not_found')} body={t('class_not_found_body')} action={<Link to="/classes"><Button>{t('back_to_classes')}</Button></Link>} />;
  }

  const pupils = state.pupils.filter((pupil) => pupil.classId === classroom.id);
  const sessions = state.attendance.filter((session) => session.classId === classroom.id).sort((a, b) => b.schoolDate.localeCompare(a.schoolDate));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError(t('required_field'));
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
        subtitle={`${tn('classes_pupil_count', pupils.filter((pupil) => pupil.enrollmentStatus === 'active').length)} · ${tn('classes_subject_count', classroom.subjectIds.length)}`}
        actions={
          <div className="button-row">
            <Link to={`/attendance/${classroom.id}`}><Button><Icon name="attendance" size={17} /> {t('register')}</Button></Link>
            <Link to={`/classes/${classroom.id}/intelligence`}><Button variant="secondary"><Icon name="spark" size={16} /> {t('class_intelligence')}</Button></Link>
            <Button variant="secondary" onClick={() => setOpen((value) => !value)}><Icon name="plus" size={16} /> {t('pupil')}</Button>
          </div>
        }
      />

      {open && (
        <Card className="form-card">
          <div className="card-heading"><div><div className="eyebrow">{t('roster')}</div><h3>{t('register_pupil')}</h3></div></div>
          <form className="form-grid" onSubmit={submit}>
            <Field label={t('pupil_name')}>
              <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder={t('pupil_name_placeholder')} />
            </Field>
            <Field label={t('local_code')} hint={t('local_code_hint')}>
              <TextInput value={code} onChange={(event) => setCode(event.target.value)} placeholder="KOF009" />
            </Field>
            <div className="form-actions">
              <Button type="submit">{t('save_pupil')}</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t('cancel')}</Button>
            </div>
            {error && <div className="inline-error" role="alert">{error}</div>}
          </form>
        </Card>
      )}

      <div className="two-column wide-left">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('roster')}</div><h3>{t('pupils')}</h3></div><Pill tone="muted">{pupils.length}</Pill></div>
          {pupils.length === 0 ? (
            <EmptyState icon="people" title={t('no_pupils')} body={t('no_pupils_body')} action={<Button onClick={() => setOpen(true)}>{t('add_pupil')}</Button>} />
          ) : (
            <div className="list">
              {pupils.map((pupil) => {
                const links = state.links.filter((link) => link.pupilId === pupil.id);
                return (
                  <div className="list-row" key={pupil.id}>
                    <span className="avatar">{pupil.displayName.slice(0, 1)}</span>
                    <div className="list-main"><strong>{pupil.displayName}</strong><small>{pupil.localPupilCode || t('no_local_code')} · {tn('classes_guardian_links', links.length)}</small></div>
                    <Link to={`/pupils/${pupil.id}`} className="text-link">{t('pupil_profile')}</Link>
                    <Link to={`/progress/${pupil.id}`} className="text-link">{t('progress')}</Link>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('history')}</div><h3>{t('registers')}</h3></div><Link to={`/attendance/${classroom.id}`} className="text-link">{t('open_register')}</Link></div>
          {sessions.length === 0 ? <p className="muted">{t('no_registers')}</p> : (
            <div className="list">
              {sessions.slice(0, 6).map((session) => {
                const absent = session.entries.filter((entry) => entry.status === 'absent').length;
                return (
                  <div className="list-row" key={session.id}>
                    <span className="date-square">{formatDate(session.schoolDate, { day: '2-digit', month: 'short' })}</span>
                    <div className="list-main"><strong>{session.status === 'submitted' ? t('submitted_register') : t('saved_draft')}</strong><small>{tn('absent_count', absent)} · {tn('marked_count', session.entries.length)}</small></div>
                    <Pill tone={session.status === 'submitted' ? 'forest' : 'butter'}>{session.status === 'submitted' ? t('status_submitted') : t('status_draft')}</Pill>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="card-heading"><div><div className="eyebrow">{t('lessons_title')}</div><h3>{t('lessons_for_class')}</h3></div><div className="button-row"><Link to={`/classes/${classroom.id}/intelligence`} className="text-link">{t('class_intelligence')}</Link><Link to="/lessons" className="text-link">{t('all_lessons')}</Link></div></div>
        <div className="mini-card-grid">
          {state.lessons.filter((lesson) => lesson.classId === classroom.id).slice(0, 4).map((lesson) => (
            <Link to={`/lessons/${lesson.id}`} key={lesson.id} className="mini-card">
              <span className="eyebrow">{subjectLabel(t, lesson.subjectId)}</span>
              <strong>{lesson.title}</strong>
              <small>{lesson.gradeLevel} · {lesson.status === 'ready' ? t('status_ready') : t('status_draft')}</small>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
