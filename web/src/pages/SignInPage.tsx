import { useState } from 'react';
import { TinyMark, TinyWordmark } from '../components/TinyMark';
import { LanguageSelect } from '../components/LanguageSelect';
import { Button, Field, TextInput } from '../components/ui';
import { useAuth } from '../firebase/auth';
import { useI18n } from '../i18n';

export function SignInPage() {
  const auth = useAuth();
  const { t } = useI18n();
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
    } catch {
      setError(t('auth_error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="signin-page">
      <section className="signin-brand">
        <div className="signin-brand-top">
          <TinyWordmark subtitle={t('brand_teacher_workspace')} />
          <LanguageSelect />
        </div>
        <div className="signin-copy">
          <div className="eyebrow">{t('brand_teacher_workspace')}</div>
          <h1>{t('app_tagline')}</h1>
          <p>{t('welcome_body')}</p>
          <div className="signin-notes">
            <span>{t('welcome_offline')}</span>
            <span>{t('welcome_sms')}</span>
            <span>{t('welcome_languages')}</span>
          </div>
        </div>
        <TinyMark size={220} className="signin-watermark" />
      </section>
      <section className="signin-panel">
        <div className="card signin-card">
          <div className="eyebrow">{t('auth_sign_in')}</div>
          <h2>{t('auth_sign_in_title')}</h2>
          <p className="muted">{t('auth_evaluation_body')}</p>
          <form onSubmit={submit} className="stack">
            <Field label={t('auth_email')} htmlFor="email">
              <TextInput id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Field label={t('auth_password')} htmlFor="password">
              <TextInput id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </Field>
            {error && <div className="inline-error" role="alert">{error}</div>}
            <Button type="submit" disabled={busy}>{busy ? t('auth_signing_in') : t('auth_sign_in')}</Button>
          </form>
          <div className="signin-demo">
            <strong>{t('auth_evaluation_title')}</strong>
            <code>{auth.demoEmail}</code>
            <code>{auth.demoPassword}</code>
            <span>{t('auth_evaluation_prefilled')}</span>
          </div>
          <Button variant="secondary" onClick={auth.enterDemo} type="button">{t('auth_offline_entry')}</Button>
          <p className="fine-print">{t('auth_offline_body')}</p>
        </div>
      </section>
    </main>
  );
}
