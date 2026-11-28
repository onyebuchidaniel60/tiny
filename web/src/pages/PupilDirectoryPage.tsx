import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, PageHeader, Pill } from '../components/ui';
import { useStore } from '../data/store';
import { useI18n } from '../i18n';
import { buildPupilIntelligence, type PupilStatus } from '../intelligence';

const statusKeys = {
  insufficient: 'status_insufficient',
  needs_attention: 'status_needs_attention',
  improving: 'status_improving',
  strong: 'status_strong',
  making_progress: 'status_making_progress',
} as const;

const tones: Record<PupilStatus, 'forest' | 'tomato' | 'cobalt' | 'butter' | 'muted'> = {
  insufficient: 'muted',
  needs_attention: 'tomato',
  improving: 'cobalt',
  strong: 'forest',
  making_progress: 'butter',
};

export function PupilDirectoryPage() {
  const { state } = useStore();
  const { t, tn } = useI18n();
  const [query, setQuery] = useState('');
  const [classId, setClassId] = useState('all');
  const pupils = useMemo(() => state.pupils
    .filter((pupil) => classId === 'all' || pupil.classId === classId)
    .filter((pupil) => pupil.displayName.toLowerCase().includes(query.trim().toLowerCase()))
    .map((pupil) => ({ pupil, profile: buildPupilIntelligence(state, pupil.id) }))
    .filter((row) => row.profile), [state, query, classId]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('pupil_directory')}
        title={t('pupil_directory')}
        subtitle={t('pupil_directory_subtitle')}
        actions={<Link to="/followups"><Button variant="secondary"><Icon name="check" size={16} /> {t('open_followups')}</Button></Link>}
      />
      <Card>
        <div className="directory-toolbar">
          <label className="field"><span className="field-label">{t('search')}</span><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('pupil_name_placeholder')} /></label>
          <label className="field"><span className="field-label">{t('class_label')}</span><select className="input" value={classId} onChange={(event) => setClassId(event.target.value)}><option value="all">{t('view_all')}</option>{state.classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.gradeLevel} {classroom.sectionLabel}</option>)}</select></label>
        </div>
      </Card>
      <div className="pupil-grid">
        {pupils.map(({ pupil, profile }) => {
          const classroom = state.classes.find((item) => item.id === pupil.classId);
          return (
            <Link to={`/pupils/${pupil.id}`} className="pupil-card" key={pupil.id}>
              <span className="avatar avatar-lg">{pupil.displayName.slice(0, 1)}</span>
              <span className="pupil-card-main">
                <strong>{pupil.displayName}</strong>
                <small>{classroom?.gradeLevel} {classroom?.sectionLabel} · {pupil.localPupilCode}</small>
                <span className="pupil-facts">
                  <span>{profile!.attendance.rate}% {t('attendance_rate').toLowerCase()}</span>
                  <span>{tn('assessment_count', profile!.assessments.count)}</span>
                </span>
              </span>
              <span className="pupil-card-status">
                <Pill tone={tones[profile!.status]}>{t(statusKeys[profile!.status])}</Pill>
                <small>{t(`confidence_${profile!.confidence}` as never)}</small>
              </span>
              <Icon name="arrow" size={16} />
            </Link>
          );
        })}
      </div>
      {pupils.length === 0 && <Card><p className="muted">{t('empty_generic')}</p></Card>}
    </div>
  );
}
