import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { deleteDraft, loadDraft, saveDraft } from '../data/db';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, PageHeader, Pill } from '../components/ui';
import { useStore } from '../data/store';
import { attendanceCounts } from '../domain';
import { useI18n } from '../i18n';
import type { AttendanceStatus } from '../types';

const statuses: AttendanceStatus[] = ['present', 'absent', 'late'];

export function AttendancePage() {
  const { classId } = useParams();
  const { state, saveAttendance } = useStore();
  const { t, tn, formatDate } = useI18n();
  const classroom = state.classes.find((item) => item.id === classId);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const pupils = useMemo(
    () => state.pupils.filter((pupil) => pupil.classId === classId && pupil.enrollmentStatus === 'active'),
    [state.pupils, classId],
  );
  const existing = state.attendance.find((session) => session.classId === classId && session.schoolDate === date);
  const draftKey = `attendance:${classId}:${date}`;

  useEffect(() => {
    let active = true;
    const fromSession = existing?.entries.reduce<Record<string, AttendanceStatus>>((result, entry) => {
      result[entry.pupilId] = entry.status;
      return result;
    }, {}) ?? {};
    loadDraft<Record<string, AttendanceStatus>>(draftKey).then((draft) => {
      if (!active) return;
      setMarks(draft && existing?.status !== 'submitted' ? draft : fromSession);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, existing?.status]);

  function mark(pupilId: string, status: AttendanceStatus) {
    setMarks((current) => {
      const next = { ...current, [pupilId]: status };
      void saveDraft(draftKey, next);
      return next;
    });
    setSaved(null);
  }

  function submit() {
    setError(null);
    try {
      const entries = pupils.filter((pupil) => marks[pupil.id]).map((pupil) => ({ pupilId: pupil.id, status: marks[pupil.id] }));
      saveAttendance(classId!, date, entries, true);
      void deleteDraft(draftKey);
      setSaved(t('attendance_submitted_body'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('error_generic'));
    }
  }

  function saveDraftOnly() {
    const entries = pupils.filter((pupil) => marks[pupil.id]).map((pupil) => ({ pupilId: pupil.id, status: marks[pupil.id] }));
    saveAttendance(classId!, date, entries, false);
    setSaved(t('attendance_saved'));
  }

  if (!classroom) return <EmptyState title={t('class_not_found')} body={t('class_not_found_body')} action={<Link to="/classes"><Button>{t('classes_title')}</Button></Link>} />;

  const counts = attendanceCounts(pupils.map((pupil) => pupil.id), Object.entries(marks).map(([pupilId, status]) => ({ pupilId, status })));

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`${classroom.gradeLevel} ${classroom.sectionLabel}`}
        title={t('attendance_title')}
        subtitle={t('attendance_subtitle')}
        actions={<Link to={`/classes/${classroom.id}`}><Button variant="secondary">{t('attendance_class_overview')}</Button></Link>}
      />

      <Card>
        <div className="attendance-toolbar">
          <label className="field inline-field">
            <span className="field-label">{t('school_date')}</span>
            <input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} max={new Date().toISOString().slice(0, 10)} />
          </label>
          <div className="attendance-summary">
            <span className="summary-pill present">{counts.present} {t('present')}</span>
            <span className="summary-pill absent">{counts.absent} {t('absent')}</span>
            <span className="summary-pill late">{counts.late} {t('late')}</span>
            <span className="summary-pill unmarked">{counts.unmarked} {t('unmarked')}</span>
          </div>
          <div className="button-row">
            <Button variant="secondary" onClick={saveDraftOnly}>{t('save_draft')}</Button>
            <Button onClick={submit}>{t('submit_register')} <Icon name="arrow" size={16} /></Button>
          </div>
        </div>
        {existing?.status === 'submitted' && <div className="inline-info">{t('attendance_already_submitted')}</div>}
        {error && <div className="inline-error" role="alert">{error}</div>}
        {saved && <div className="inline-success" role="status">{saved}</div>}
      </Card>

      <Card>
        <div className="card-heading"><div><div className="eyebrow">{t('roster')}</div><h3>{tn('classes_pupil_count', pupils.length)}</h3></div><Pill tone="muted">{t('required')}</Pill></div>
        {pupils.length === 0 ? <EmptyState icon="people" title={t('no_active_pupils')} body={t('add_pupils_first')} /> : (
          <div className="attendance-list">
            {pupils.map((pupil) => (
              <div className="attendance-row" key={pupil.id}>
                <span className="avatar">{pupil.displayName.slice(0, 1)}</span>
                <div className="list-main"><strong>{pupil.displayName}</strong><small>{pupil.localPupilCode || t('no_local_code')}</small></div>
                <div className="status-buttons" role="group" aria-label={t('attendance_for', { name: pupil.displayName })}>
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`status-button ${status} ${marks[pupil.id] === status ? 'selected' : ''}`}
                      aria-pressed={marks[pupil.id] === status}
                      onClick={() => mark(pupil.id, status)}
                    >
                      {t(status)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="card-heading"><div><div className="eyebrow">{t('history')}</div><h3>{t('recent_registers')}</h3></div></div>
        <div className="list">
          {state.attendance.filter((session) => session.classId === classroom.id).sort((a, b) => b.schoolDate.localeCompare(a.schoolDate)).map((session) => (
            <div className="list-row" key={session.id}>
              <span className="date-square">{formatDate(session.schoolDate, { day: '2-digit', month: 'short' })}</span>
              <div className="list-main"><strong>{session.status === 'submitted' ? t('submitted_register') : t('saved_draft')}</strong><small>{tn('absent_count', session.entries.filter((entry) => entry.status === 'absent').length)} · {tn('entries_count', session.entries.length)}</small></div>
              <Pill tone={session.status === 'submitted' ? 'forest' : 'butter'}>{session.status === 'submitted' ? t('status_submitted') : t('status_draft')}</Pill>
            </div>
          ))}
        </div>
      </Card>
      <Card className="soft-card"><p className="muted">{t('attendance_local_note')}</p></Card>
    </div>
  );
}
