import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, EmptyState, Field, PageHeader, Pill, SelectInput, TextArea, TextInput } from '../components/ui';
import { useStore } from '../data/store';
import { subjectLabel, useI18n } from '../i18n';
import type { LessonPlan } from '../types';

export function LessonDetailPage() {
  const { lessonId } = useParams();
  const { state, saveLesson } = useStore();
  const { t, formatDate } = useI18n();
  const lesson = state.lessons.find((item) => item.id === lessonId);
  const [draft, setDraft] = useState(lesson);
  const [saved, setSaved] = useState(false);

  if (!lesson || !draft) return <EmptyState title={t('lesson_not_found')} body={t('lesson_not_found_body')} action={<Link to="/lessons"><Button>{t('back_to_lessons')}</Button></Link>} />;

  function update<K extends keyof LessonPlan>(key: K, value: LessonPlan[K]) {
    setDraft({ ...draft!, [key]: value });
    setSaved(false);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    saveLesson({ ...draft!, id: lesson!.id });
    setSaved(true);
  }

  const classroom = state.classes.find((item) => item.id === draft.classId);
  const sections: Array<[keyof typeof draft, string, string]> = [
    ['engage', t('engage'), t('engage_hint')],
    ['explore', t('explore'), t('explore_hint')],
    ['explain', t('explain'), t('explain_hint')],
    ['elaborate', t('elaborate'), t('elaborate_hint')],
    ['evaluate', t('evaluate'), t('evaluate_hint')],
  ];

  return (
    <form className="page-stack" onSubmit={submit}>
      <PageHeader
        eyebrow={`${classroom?.gradeLevel ?? draft.gradeLevel} ${classroom?.sectionLabel ?? ''} · ${subjectLabel(t, draft.subjectId)}`}
        title={draft.title}
        subtitle={`${t('last_saved', { date: formatDate(draft.updatedAt) })} · ${draft.status === 'ready' ? t('ready_for_class') : t('status_draft')}`}
        actions={<Link to="/lessons"><Button variant="secondary" type="button">{t('all_lessons')}</Button></Link>}
      />
      {saved && <div className="inline-success" role="status">{t('lesson_saved')}</div>}
      <div className="two-column wide-left">
        <Card>
          <div className="form-grid single">
            <Field label={t('lesson_title')}><TextInput value={draft.title} onChange={(event) => update('title', event.target.value)} /></Field>
            <Field label={t('lesson_objective')}><TextArea rows={3} value={draft.objective} onChange={(event) => update('objective', event.target.value)} /></Field>
            {sections.map(([key, label, hint]) => (
              <Field key={key} label={label} hint={hint}>
                <TextArea rows={4} value={String(draft[key] ?? '')} onChange={(event) => update(key, event.target.value)} />
              </Field>
            ))}
            <Field label={t('materials')}><TextArea rows={2} value={draft.materials} onChange={(event) => update('materials', event.target.value)} /></Field>
          </div>
        </Card>
        <div className="page-stack">
          <Card>
            <div className="eyebrow">{t('plan_details')}</div>
            <div className="detail-list">
              <div><span>{t('class')}</span><strong>{classroom ? `${classroom.gradeLevel} ${classroom.sectionLabel}` : draft.classId}</strong></div>
              <div><span>{t('subject')}</span><strong>{subjectLabel(t, draft.subjectId)}</strong></div>
              <div><span>{t('status')}</span><Pill tone={draft.status === 'ready' ? 'forest' : 'muted'}>{draft.status === 'ready' ? t('status_ready') : t('status_draft')}</Pill></div>
            </div>
            <Field label={t('status')}>
              <SelectInput value={draft.status} onChange={(event) => update('status', event.target.value as 'draft' | 'ready')}>
                <option value="draft">{t('status_draft')}</option>
                <option value="ready">{t('ready_for_class')}</option>
              </SelectInput>
            </Field>
            <Button type="submit">{t('save_lesson')}</Button>
          </Card>
          <Card className="soft-card">
            <div className="eyebrow">{t('honest_scope')}</div>
            <p className="muted">{t('honest_scope_body')}</p>
          </Card>
        </div>
      </div>
    </form>
  );
}
