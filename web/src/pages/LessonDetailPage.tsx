import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, EmptyState, Field, PageHeader, Pill, SelectInput, TextArea, TextInput, formatDate } from '../components/ui';
import { useStore } from '../data/store';
import type { LessonPlan } from '../types';

export function LessonDetailPage() {
  const { lessonId } = useParams();
  const { state, saveLesson } = useStore();
  const lesson = state.lessons.find((item) => item.id === lessonId);
  const [draft, setDraft] = useState(lesson);
  const [saved, setSaved] = useState(false);

  if (!lesson || !draft) return <EmptyState title="Lesson not found" body="This lesson is not saved on this device." action={<Link to="/lessons"><Button>Back to lessons</Button></Link>} />;

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
    ['engage', 'Engage', 'Start with a local object, picture, question or short story.'],
    ['explore', 'Explore', 'Pupils investigate, sort, measure or discuss before definitions.'],
    ['explain', 'Explain', 'Model vocabulary and connect it to pupil observations.'],
    ['elaborate', 'Elaborate', 'Apply the idea in a new or everyday context.'],
    ['evaluate', 'Evaluate', 'A short check for understanding.'],
  ];

  return (
    <form className="page-stack" onSubmit={submit}>
      <PageHeader
        eyebrow={`${classroom?.gradeLevel ?? draft.gradeLevel} ${classroom?.sectionLabel ?? ''} · ${draft.subjectId.replace('_', ' ')}`}
        title={draft.title}
        subtitle={`Last saved ${formatDate(draft.updatedAt)} · ${draft.status === 'ready' ? 'Ready for class' : 'Draft'}`}
        actions={<Link to="/lessons"><Button variant="secondary" type="button">All lessons</Button></Link>}
      />
      {saved && <div className="inline-success">Lesson saved locally. It remains available without a network.</div>}
      <div className="two-column wide-left">
        <Card>
          <div className="form-grid single">
            <Field label="Title"><TextInput value={draft.title} onChange={(event) => update('title', event.target.value)} /></Field>
            <Field label="Objective"><TextArea rows={3} value={draft.objective} onChange={(event) => update('objective', event.target.value)} /></Field>
            {sections.map(([key, label, hint]) => (
              <Field key={key} label={label} hint={hint}>
                <TextArea rows={4} value={String(draft[key] ?? '')} onChange={(event) => update(key, event.target.value)} />
              </Field>
            ))}
            <Field label="Materials"><TextArea rows={2} value={draft.materials} onChange={(event) => update('materials', event.target.value)} /></Field>
          </div>
        </Card>
        <div className="page-stack">
          <Card>
            <div className="eyebrow">Plan details</div>
            <div className="detail-list">
              <div><span>Class</span><strong>{classroom ? `${classroom.gradeLevel} ${classroom.sectionLabel}` : draft.classId}</strong></div>
              <div><span>Subject</span><strong>{draft.subjectId.replace('_', ' ')}</strong></div>
              <div><span>Status</span><Pill tone={draft.status === 'ready' ? 'forest' : 'muted'}>{draft.status}</Pill></div>
            </div>
            <Field label="Status">
              <SelectInput value={draft.status} onChange={(event) => update('status', event.target.value as 'draft' | 'ready')}>
                <option value="draft">Draft</option>
                <option value="ready">Ready for class</option>
              </SelectInput>
            </Field>
            <Button type="submit">Save lesson</Button>
          </Card>
          <Card className="soft-card">
            <div className="eyebrow">Honest scope</div>
            <p className="muted">This is a teacher-authored scaffold, not generated grading and not a claim of complete NERDC coverage. Review before classroom use.</p>
          </Card>
        </div>
      </div>
    </form>
  );
}
