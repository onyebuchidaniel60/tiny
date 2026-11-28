import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, PageHeader, Pill, SelectInput } from '../components/ui';
import { useStore } from '../data/store';
import { useI18n } from '../i18n';
import { buildClassIntelligence, buildPupilIntelligence, buildPupilEvidenceContext } from '../intelligence';
import { generateEvidenceText, inferenceModeOptions, type AiInferenceMode } from '../ai/service';
import type { AiAnalysis } from '../types';

export function IntelligencePage() {
  const { state, saveAiAnalysis } = useStore();
  const { t, formatDate } = useI18n();
  const [mode, setMode] = useState<AiInferenceMode>('prefer_on_device');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pupils = state.pupils.map((pupil) => buildPupilIntelligence(state, pupil.id)).filter(Boolean);
  const attention = pupils.filter((profile) => profile!.status === 'needs_attention');
  const strong = state.classes.map((classroom) => ({ classroom, intelligence: buildClassIntelligence(state, classroom.id) }));

  async function runDiagnostic() {
    setBusy(true);
    setError(null);
    const sample = attention[0] ?? pupils[0];
    if (!sample) {
      setError(t('insufficient_evidence'));
      setBusy(false);
      return;
    }
    const context = buildPupilEvidenceContext(state, sample!, 'Return one short factual sentence confirming that you can analyse the supplied evidence. Do not add facts.');
    const fallback = 'The teaching assistant would summarise only the recorded attendance, assessment and observation evidence. This is a deterministic fallback, not a model response.';
    const generated = await generateEvidenceText(context.prompt, fallback, mode);
    const analysis: AiAnalysis = {
      id: `analysis_${crypto.randomUUID()}`,
      workspaceId: state.workspace.id,
      scope: 'pupil',
      task: 'diagnostic',
      pupilId: sample!.pupilId,
      classId: sample!.classId,
      evidenceFingerprint: context.fingerprint,
      evidenceIds: context.evidenceIds,
      evidenceSummary: context.summary,
      output: generated.text,
      requestedMode: generated.requestedMode ?? mode,
      source: generated.source,
      durationMs: generated.durationMs ?? 0,
      fallback: Boolean(generated.fallback),
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    saveAiAnalysis(analysis);
    setResult(analysis);
    if (generated.error) setError(generated.error);
    else setError(t('diagnostic_success'));
    setBusy(false);
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('nav_insights')}
        title={t('intelligence_title')}
        subtitle={t('intelligence_subtitle')}
        actions={<div className="button-row"><Link to="/pupils"><Button variant="secondary">{t('pupil_directory')}</Button></Link><Link to="/followups"><Button variant="ghost">{t('open_followups')}</Button></Link></div>}
      />

      <div className="metric-card-row">
        <div className="card mini-metric"><span className="status-dot status-bad" /><div><strong>{attention.length}</strong><small>{t('pupils_attention')}</small></div></div>
        <div className="card mini-metric"><span className="status-dot status-warn" /><div><strong>{state.followUps.filter((item) => item.status === 'open').length}</strong><small>{t('open_followups')}</small></div></div>
        <div className="card mini-metric"><span className="status-dot status-ok" /><div><strong>{state.aiAnalyses.length}</strong><small>{t('analysis_saved')}</small></div></div>
      </div>

      <div className="two-column wide-left">
        <Card className="ai-evidence-card">
          <div className="card-heading"><div><div className="eyebrow">{t('analysis_diagnostics')}</div><h3>{t('run_diagnostic')}</h3></div><Pill tone="cobalt">{t('ai_optional')}</Pill></div>
          <p className="muted">{t('ai_privacy_note')}</p>
          <label className="field"><span className="field-label">{t('requested_mode')}</span><SelectInput value={mode} onChange={(event) => setMode(event.target.value as AiInferenceMode)}>{inferenceModeOptions.map((option) => <option key={option.value} value={option.value}>{t(option.labelKey as never)}</option>)}</SelectInput></label>
          <Button onClick={() => void runDiagnostic()} disabled={busy}>{busy ? t('ai_thinking') : t('run_diagnostic')}</Button>
          {result && (
            <div className="ai-result">
              <div className="source-row"><Pill tone={result.fallback ? 'butter' : result.source === 'On-device Gemini Nano' ? 'forest' : 'cobalt'}>{result.source}</Pill><Pill tone="muted">{result.requestedMode}</Pill></div>
              <p>{result.output}</p>
              <div className="detail-list">
                <div><span>{t('actual_source')}</span><strong>{result.source}</strong></div>
                <div><span>{t('analysis_duration')}</span><strong>{result.durationMs} ms</strong></div>
                <div><span>{t('evidence_used')}</span><strong>{result.evidenceSummary}</strong></div>
                <div><span>{t('evidence_fingerprint')}</span><strong>{result.evidenceFingerprint.slice(0, 24)}…</strong></div>
              </div>
              <small>{result.fallback ? t('analysis_fallback') : t('ai_review_note')}</small>
            </div>
          )}
          {error && <div className={result?.fallback ? 'inline-info' : 'inline-error'} role="status">{error}</div>}
        </Card>

        <div className="page-stack">
          <Card>
            <div className="eyebrow">{t('class_intelligence')}</div>
            {strong.map(({ classroom, intelligence }) => intelligence && (
              <Link key={classroom.id} to={`/classes/${classroom.id}/intelligence`} className="class-row">
                <span className="class-avatar">{classroom.gradeLevel}{classroom.sectionLabel.slice(0, 1)}</span>
                <span className="class-row-main"><strong>{classroom.gradeLevel} {classroom.sectionLabel}</strong><small>{intelligence.attendanceRate}% {t('attendance_rate').toLowerCase()} · {intelligence.commonGaps.length} {t('common_gaps').toLowerCase()}</small></span>
                <Pill tone={intelligence.attentionPupils.length ? 'tomato' : 'forest'}>{intelligence.attentionPupils.length} {t('profile_needs_attention').toLowerCase()}</Pill>
              </Link>
            ))}
          </Card>
          <Card className="soft-card">
            <div className="eyebrow">{t('profile_needs_attention')}</div>
            {attention.length === 0 ? <p className="muted">{t('empty_generic')}</p> : attention.slice(0, 6).map((profile) => <Link key={profile!.pupilId} to={`/pupils/${profile!.pupilId}`} className="attention-row"><span className="list-main"><strong>{profile!.pupilName}</strong><small>{t(`status_${profile!.status}` as never)}</small></span><Pill tone="tomato">{profile!.attendance.rate}%</Pill></Link>)}
          </Card>
        </div>
      </div>

      <Card>
        <div className="card-heading"><div><div className="eyebrow">{t('analysis_saved')}</div><h3>{t('recent_evidence')}</h3></div><Pill tone="muted">{state.aiAnalyses.length}</Pill></div>
        {state.aiAnalyses.length === 0 ? <p className="muted">{t('no_analysis_yet')}</p> : state.aiAnalyses.slice(0, 8).map((analysis) => (
          <div className="outbox-row" key={analysis.id}>
            <span className={`status-dot ${analysis.fallback ? 'status-warn' : 'status-ok'}`} />
            <div className="list-main"><strong>{analysis.task} · {analysis.source}</strong><small>{formatDate(analysis.createdAt)} · {analysis.durationMs} ms · {analysis.evidenceSummary}</small></div>
            <Pill tone={analysis.fallback ? 'butter' : 'forest'}>{analysis.fallback ? t('analysis_fallback') : t('ai_optional')}</Pill>
          </div>
        ))}
      </Card>
    </div>
  );
}
