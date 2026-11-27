import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { deleteDraft, loadDraft, saveDraft } from '../data/db';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, PageHeader, Pill, formatDate } from '../components/ui';
import { useStore } from '../data/store';
import { attendanceCounts } from '../domain';
import type { AttendanceStatus } from '../types';

const statuses: AttendanceStatus[] = ['present', 'absent', 'late'];

export function AttendancePage() {
  const { classId } = useParams();
  const { state, saveAttendance } = useStore();
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
      setSaved('Attendance submitted locally.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not submit attendance.');
    }
  }

  function saveDraftOnly() {
    const entries = pupils.filter((pupil) => marks[pupil.id]).map((pupil) => ({ pupilId: pupil.id, status: marks[pupil.id] }));
    saveAttendance(classId!, date, entries, false);
    setSaved('Draft saved on this device.');
  }

  if (!classroom) return <EmptyState title="Class not found" body="Open a class from the classes list." action={<Link to="/classes"><Button>Classes</Button></Link>} />;

  const counts = attendanceCounts(pupils.map((pupil) => pupil.id), Object.entries(marks).map(([pupilId, status]) => ({ pupilId, status })));

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`${classroom.gradeLevel} ${classroom.sectionLabel}`}
        title="Attendance"
        subtitle="Mark every active pupil. The register is saved locally before any notification can be considered."
        actions={<Link to={`/classes/${classroom.id}`}><Button variant="secondary">Class overview</Button></Link>}
      />

      <Card>
        <div className="attendance-toolbar">
          <label className="field inline-field">
            <span className="field-label">School date</span>
            <input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} max={new Date().toISOString().slice(0, 10)} />
          </label>
          <div className="attendance-summary">
            <span className="summary-pill present">{counts.present} present</span>
            <span className="summary-pill absent">{counts.absent} absent</span>
            <span className="summary-pill late">{counts.late} late</span>
            <span className="summary-pill unmarked">{counts.unmarked} unmarked</span>
          </div>
          <div className="button-row">
            <Button variant="secondary" onClick={saveDraftOnly}>Save draft</Button>
            <Button onClick={submit}>Submit register <Icon name="arrow" size={16} /></Button>
          </div>
        </div>
        {existing?.status === 'submitted' && <div className="inline-info">This register is already submitted. Changes create a local draft; corrections need an amendment path.</div>}
        {error && <div className="inline-error" role="alert">{error}</div>}
        {saved && <div className="inline-success" role="status">{saved} Server sync remains queued until a backend path is available.</div>}
      </Card>

      <Card>
        <div className="card-heading"><div><div className="eyebrow">Roster</div><h3>{pupils.length} active pupils</h3></div><Pill tone="muted">All must be marked</Pill></div>
        {pupils.length === 0 ? <EmptyState icon="people" title="No active pupils" body="Add pupils to this class before marking a register." /> : (
          <div className="attendance-list">
            {pupils.map((pupil) => (
              <div className="attendance-row" key={pupil.id}>
                <span className="avatar">{pupil.displayName.slice(0, 1)}</span>
                <div className="list-main"><strong>{pupil.displayName}</strong><small>{pupil.localPupilCode || 'No local code'}</small></div>
                <div className="status-buttons" role="group" aria-label={`Attendance for ${pupil.displayName}`}>
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`status-button ${status} ${marks[pupil.id] === status ? 'selected' : ''}`}
                      aria-pressed={marks[pupil.id] === status}
                      onClick={() => mark(pupil.id, status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="card-heading"><div><div className="eyebrow">History</div><h3>Recent registers</h3></div></div>
        <div className="list">
          {state.attendance.filter((session) => session.classId === classroom.id).sort((a, b) => b.schoolDate.localeCompare(a.schoolDate)).map((session) => (
            <div className="list-row" key={session.id}>
              <span className="date-square">{formatDate(session.schoolDate, { day: '2-digit', month: 'short' })}</span>
              <div className="list-main"><strong>{session.status === 'submitted' ? 'Submitted register' : 'Saved draft'}</strong><small>{session.entries.filter((entry) => entry.status === 'absent').length} absent · {session.entries.length} entries</small></div>
              <Pill tone={session.status === 'submitted' ? 'forest' : 'butter'}>{session.status}</Pill>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
