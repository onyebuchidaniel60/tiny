import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, Card, PageHeader, Pill } from '../components/ui';
import { generateTeachingStrategy, onDeviceBrowserStatus, type AiResult } from '../ai/service';

export function AiPage() {
  const [result, setResult] = useState<AiResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const next = await generateTeachingStrategy(generation);
      setResult(next);
      setGeneration((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI request failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Optional support"
        title="Teaching helper"
        subtitle="On-device first when Chrome supports it; cloud fallback when it does not. The source is read from the SDK response."
        actions={<Button onClick={() => void generate()} disabled={busy}><Icon name="spark" size={17} /> {busy ? 'Thinking…' : 'Generate a strategy'}</Button>}
      />

      <div className="two-column wide-left">
        <Card className="ai-card">
          <div className="card-heading"><div><div className="eyebrow">Primary 4 · basic science</div><h3>Sources and uses of water</h3></div><Pill tone="cobalt">De-identified prompt</Pill></div>
          <p className="muted">The prompt contains no pupil name, phone number, school record or diagnosis. A teacher must review any suggestion before using it.</p>
          <div className="ai-result" aria-live="polite">
            {result ? (
              <>
                <div className="source-row">
                  <Pill tone={result.source === 'On-device Gemini Nano' ? 'forest' : result.source === 'Cloud Gemini' ? 'cobalt' : 'butter'}>{result.source}</Pill>
                  {result.title && <strong>{result.title}</strong>}
                </div>
                <p>{result.text}</p>
                {result.detail && <small>{result.detail}</small>}
              </>
            ) : (
              <div className="ai-placeholder">
                <Icon name="spark" size={28} />
                <strong>Generate a reviewed teaching strategy</strong>
                <p>If a model is unavailable, the curated offline strategy is shown and labelled honestly.</p>
                <Button onClick={() => void generate()} disabled={busy}>Generate a strategy</Button>
              </div>
            )}
          </div>
          {error && <div className="inline-error">{error}</div>}
          <div className="button-row">
            <Button variant="secondary" onClick={() => void generate()} disabled={busy}>Try another</Button>
            <Button variant="ghost" onClick={() => setResult({ title: 'Curated offline library', text: 'Think, pair, share: 30 seconds to think, 60 seconds to explain to a partner, then choose two pairs to share.', source: 'Curated offline library', detail: 'This is a bundled strategy, not a model response.' })}>Show offline strategy</Button>
          </div>
        </Card>

        <div className="page-stack">
          <Card>
            <div className="eyebrow">Browser capability</div>
            <h3>{onDeviceBrowserStatus()}</h3>
            <div className="detail-list">
              <div><span>Mode</span><strong>Prefer on-device</strong></div>
              <div><span>Cloud model</span><strong>gemini-3.5-flash-lite</strong></div>
              <div><span>Source</span><strong>SDK-reported only</strong></div>
            </div>
            <p className="fine-print">Chrome built-in AI requires a supported Chrome version, the Prompt API / Gemini Nano model, sufficient hardware and model download. This preview does not claim on-device execution unless the SDK reports it.</p>
          </Card>
          <Card className="soft-card">
            <div className="eyebrow">Core work is never blocked</div>
            <p className="muted">If both on-device and cloud are unavailable, Tiny shows reviewed offline strategies. Attendance, lessons and local records continue to work.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
