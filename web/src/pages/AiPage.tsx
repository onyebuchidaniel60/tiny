import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, Card, PageHeader, Pill } from '../components/ui';
import { aiModes, browserAiAvailability, generateTeachingStrategy, type AiMode, type AiResult } from '../ai/service';
import { useI18n } from '../i18n';

export function AiPage() {
  const { t } = useI18n();
  const [mode, setMode] = useState<AiMode>('lesson_plan');
  const [result, setResult] = useState<AiResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const browserState = browserAiAvailability();
  const browserLabel = browserState === 'detected' ? t('ai_browser_detected') : browserState === 'unavailable' ? t('ai_browser_unavailable') : t('ai_browser_server');
  const fallbackIndex = generation % 3;

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const next = await generateTeachingStrategy(generation, mode);
      setResult(next);
      setGeneration((value) => value + 1);
    } catch {
      setError(t('ai_error'));
    } finally {
      setBusy(false);
    }
  }

  const fallbackTitle = t(`ai_strategy_${fallbackIndex + 1}_title` as never);
  const fallbackBody = t(`ai_strategy_${fallbackIndex + 1}_body` as never);
  const shownText = result?.fallback ? fallbackBody : result?.text;
  const shownTitle = result?.fallback ? fallbackTitle : result?.title;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('ai_optional')}
        title={t('ai_title')}
        subtitle={t('ai_subtitle')}
        actions={<Button onClick={() => void generate()} disabled={busy}><Icon name="spark" size={17} /> {busy ? t('ai_thinking') : t('ai_generate')}</Button>}
      />

      <div className="two-column wide-left">
        <Card className="ai-card">
          <div className="card-heading"><div><div className="eyebrow">{t('ai_context_title')}</div><h3>{t('ai_context_body')}</h3></div><Pill tone="cobalt">{t('ai_prompt_used')}</Pill></div>
          <p className="muted">{t('ai_ask_body')}</p>

          <div className="mode-tabs" role="group" aria-label={t('ai_mode_label')}>
            {aiModes.map((value) => (
              <button
                key={value}
                type="button"
                className={`mode-tab ${mode === value ? 'active' : ''}`}
                aria-pressed={mode === value}
                onClick={() => { setMode(value); setResult(null); }}
              >
                {t(`ai_mode_${value}` as never)}
              </button>
            ))}
          </div>

          <div className="ai-result" aria-live="polite" aria-label={t('ai_result_label')}>
            {result ? (
              <>
                <div className="source-row">
                  <Pill tone={result.source === 'On-device Gemini Nano' ? 'forest' : result.source === 'Cloud Gemini' ? 'cobalt' : 'butter'}>{result.source}</Pill>
                  {shownTitle && <strong>{shownTitle}</strong>}
                </div>
                <p>{shownText}</p>
                <small>{result.fallback ? t('ai_curated_used') : result.source === 'On-device Gemini Nano' ? t('ai_device_available') : t('ai_cloud_fallback_note')}</small>
              </>
            ) : (
              <div className="ai-placeholder">
                <Icon name="spark" size={28} />
                <strong>{t('ai_generate')}</strong>
                <p>{t('ai_offline_body')}</p>
                <Button onClick={() => void generate()} disabled={busy}>{t('ai_generate')}</Button>
              </div>
            )}
          </div>
          {error && <div className="inline-error" role="alert">{error}</div>}
          <div className="button-row">
            <Button variant="secondary" onClick={() => void generate()} disabled={busy}>{t('ai_try')}</Button>
            <Button variant="ghost" onClick={() => setResult({ title: fallbackTitle, text: fallbackBody, source: 'Curated offline library', fallback: true })}>{t('ai_show_offline')}</Button>
          </div>
          <p className="fine-print">{t('ai_review_note')}</p>
        </Card>

        <div className="page-stack">
          <Card>
            <div className="eyebrow">{t('ai_browser_capability')}</div>
            <h3>{browserLabel}</h3>
            <div className="detail-list">
              <div><span>{t('ai_browser_mode')}</span><strong>{t('on_device_pref')}</strong></div>
              <div><span>{t('ai_cloud_model')}</span><strong>gemini-3.5-flash-lite</strong></div>
              <div><span>{t('source')}</span><strong>{t('ai_source_sdk')}</strong></div>
            </div>
            <p className="fine-print">{t('ai_nano_note')}</p>
          </Card>
          <Card className="soft-card">
            <div className="eyebrow">{t('ai_core_never_blocked')}</div>
            <p className="muted">{t('ai_core_body')}</p>
          </Card>
          <Card className="soft-card">
            <div className="eyebrow">{t('privacy')}</div>
            <p className="muted">{t('ai_privacy_note')}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
