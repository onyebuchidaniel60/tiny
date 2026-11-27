import { useState } from 'react';
import { Button, Field, TextInput } from '../components/ui';
import { useAuth } from '../firebase/auth';

export function SignInPage() {
  const auth = useAuth();
  const [email, setEmail] = useState(auth.demoEmail);
  const [password, setPassword] = useState(auth.demoPassword);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await auth.signIn(email, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="signin-page">
      <section className="signin-brand">
        <div className="brand-mark" aria-hidden="true"><span>T</span><i /></div>
        <div className="eyebrow">Tiny teacher workspace</div>
        <h1>Big impact.<br />Small requirements.</h1>
        <p>
          A calm, offline-first workspace for teachers. Parents stay on ordinary SMS.
          No pupil account. No parent app. No student interface.
        </p>
        <div className="signin-notes">
          <span>Saved on this device</span>
          <span>Works without signal</span>
          <span>Synthetic demo data</span>
        </div>
      </section>
      <section className="signin-panel">
        <div className="card signin-card">
          <div className="eyebrow">Sign in</div>
          <h2>Open your workspace</h2>
          <p className="muted">
            Web preview uses a synthetic Firebase account. The Android teacher app remains phone-first.
          </p>
          <form onSubmit={submit} className="stack">
            <Field label="Email" htmlFor="email">
              <TextInput id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Field label="Password" htmlFor="password">
              <TextInput id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </Field>
            {error && <div className="inline-error" role="alert">{error}</div>}
            <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
          </form>
          <div className="signin-demo">
            <strong>Synthetic demo account</strong>
            <code>{auth.demoEmail}</code>
            <code>{auth.demoPassword}</code>
            <span>Prefilled for evaluation. Do not use for real data.</span>
          </div>
          <Button variant="secondary" onClick={auth.enterDemo} type="button">Continue in offline demo</Button>
          <p className="fine-print">
            Offline demo uses IndexedDB and synthetic data only. It never claims to sync to a server.
          </p>
        </div>
      </section>
    </main>
  );
}
