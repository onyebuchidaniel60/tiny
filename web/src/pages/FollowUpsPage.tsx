import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Field, PageHeader, Pill, SelectInput, TextArea, TextInput } from '../components/ui';
import { Icon } from '../components/Icon';
import { useStore } from '../data/store';
import { useI18n } from '../i18n';
import { buildSuggestedFollowUps } from '../intelligence';

export function FollowUpsPage() {
  const { state, addFollowUp, updateFollowUpStatus } = useStore();
  const { t, formatDate } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [classId, setClassId] = useState(state.classes[0]?.id ?? '');
  const [pupilId, setPupilId] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10));
  const open = state.followUps.filter((item) => item.status === 'open').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const done = state.followUps.filter((item) => item.status === 'done').slice(0, 8);
  const suggestions = buildSuggestedFollowUps(state).filter((suggestion) => !state.followUps.some((item) => item.pupilId === suggestion.pupilId && item.source === suggestion.source && item.status === 'open'));

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    addFollowUp({
      classId,
      pupilId: pupilId || undefined,
      title: title.trim(),
      detail: detail.trim(),
      dueDate,
      source: 'manual',
    });
    setTitle('');
    setDetail('');
    setPupilId('');
    setShowForm(false);
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('followups')}
        title={t('open_followups')}
        subtitle={t('override_note')}
        actions={<Button onClick={() => setShowForm((value) => !value)}><Icon name="plus" size={16} /> {t('new_followup')}</Button>}
      />
      {showForm && (
        <Card className="form-card">
          <form className="form-grid" onSubmit={save}>
            <Field label={t('followup_title')}><TextInput value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
            <Field label={t('class_label')}><SelectInput value={classId} onChange={(event) => setClassId(event.target.value)}>{state.classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.gradeLevel} {classroom.sectionLabel}</option>)}</SelectInput></Field>
            <Field label={t('pupil')}><SelectInput value={pupilId} onChange={(event) => setPupilId(event.target.value)}><option value="">{t('optional')}</option>{state.pupils.filter((pupil) => pupil.classId === classId).map((pupil) => <option key={pupil.id} value={pupil.id}>{pupil.displayName}</option>)}</SelectInput></Field>
            <Field label={t('due_date')}><TextInput type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field>
            <Field label={t('followup_detail')}><TextArea rows={3} value={detail} onChange={(event) => setDetail(event.target.value)} /></Field>
            <div className="form-actions"><Button type="submit">{t('save_followup')}</Button><Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t('cancel')}</Button></div>
          </form>
        </Card>
      )}

      <div className="two-column">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('followups')}</div><h3>{t('open_followups')}</h3></div><Pill tone="butter">{open.length}</Pill></div>
          {open.length === 0 ? <p className="muted">{t('no_open_followups')}</p> : open.map((item) => {
            const pupil = state.pupils.find((candidate) => candidate.id === item.pupilId);
            return (
              <div className="followup-row" key={item.id}>
                <div><strong>{item.title}</strong><small>{pupil?.displayName ?? t('class_label')} · {formatDate(item.dueDate)}</small><small>{item.detail}</small></div>
                <div className="button-row"><Button variant="ghost" onClick={() => updateFollowUpStatus(item.id, 'done')}>{t('mark_done')}</Button><Button variant="ghost" onClick={() => updateFollowUpStatus(item.id, 'dismissed')}>{t('dismiss')}</Button></div>
              </div>
            );
          })}
        </Card>

        <div className="page-stack">
          <Card>
            <div className="card-heading"><div><div className="eyebrow">{t('suggested_followups')}</div><h3>{t('next_actions')}</h3></div><Pill tone="cobalt">{suggestions.length}</Pill></div>
            {suggestions.length === 0 ? <p className="muted">{t('no_open_followups')}</p> : suggestions.slice(0, 8).map((suggestion) => {
              const pupil = state.pupils.find((candidate) => candidate.id === suggestion.pupilId);
              return (
                <div className="followup-row" key={suggestion.key}>
                  <div><strong>{t(suggestion.titleKey as never)}</strong><small>{pupil?.displayName} · {t(suggestion.detailKey as never)}</small></div>
                  <Button variant="ghost" onClick={() => addFollowUp({ classId: suggestion.classId, pupilId: suggestion.pupilId, title: t(suggestion.titleKey as never), detail: t(suggestion.detailKey as never), dueDate: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10), source: suggestion.source, sourceId: suggestion.sourceId })}>{t('add')}</Button>
                </div>
              );
            })}
          </Card>
          <Card className="soft-card">
            <div className="eyebrow">{t('completed_followups')}</div>
            {done.length === 0 ? <p className="muted">{t('empty_generic')}</p> : done.map((item) => <div className="analysis-history" key={item.id}><strong>{item.title}</strong><small>{formatDate(item.completedAt ?? item.createdAt)}</small></div>)}
          </Card>
          <Card className="soft-card">
            <div className="eyebrow">{t('pupil_directory')}</div>
            <Link to="/pupils" className="text-link">{t('pupil_directory')}</Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
