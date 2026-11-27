import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, Field, PageHeader, Pill, SelectInput, TextInput, maskPhone } from '../components/ui';
import { useStore } from '../data/store';
import { languageNames, useI18n } from '../i18n';
import { normalizeNigerianPhone } from '../domain';

export function GuardiansPage() {
  const { state, addGuardian, linkGuardian } = useStore();
  const { t } = useI18n();
  const [showGuardian, setShowGuardian] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [locale, setLocale] = useState<'en' | 'ha' | 'yo' | 'ig'>('en');
  const [pupilId, setPupilId] = useState(state.pupils[0]?.id ?? '');
  const [guardianId, setGuardianId] = useState(state.guardians[0]?.id ?? '');
  const [relationship, setRelationship] = useState(t('parent_relationship'));
  const [error, setError] = useState<string | null>(null);

  function saveGuardian(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeNigerianPhone(phone);
    if (!name.trim() || !normalized) {
      setError(t('invalid_phone'));
      return;
    }
    addGuardian(name.trim(), normalized, locale);
    setName('');
    setPhone('');
    setError(null);
    setShowGuardian(false);
  }

  function saveLink(event: React.FormEvent) {
    event.preventDefault();
    try {
      linkGuardian(pupilId, guardianId, relationship);
      setShowLink(false);
    } catch {
      setError(t('guardian_not_found'));
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('brand_guardian_sms')}
        title={t('guardians_title')}
        subtitle={t('guardians_subtitle')}
        actions={
          <div className="button-row">
            <Button onClick={() => setShowGuardian((value) => !value)}><Icon name="plus" size={16} /> {t('guardian')}</Button>
            <Button variant="secondary" onClick={() => setShowLink((value) => !value)}>{t('link_pupil')}</Button>
          </div>
        }
      />

      {showGuardian && (
        <Card className="form-card">
          <div className="card-heading"><div><div className="eyebrow">{t('guardian_endpoint')}</div><h3>{t('add_guardian_title')}</h3></div></div>
          <form className="form-grid" onSubmit={saveGuardian}>
            <Field label={t('guardian_name')}><TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder={t('guardian')} /></Field>
            <Field label={t('guardian_phone_synthetic')} hint={t('guardian_phone_hint')}><TextInput value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+2348000000015" /></Field>
            <Field label={t('sms_language')}><SelectInput value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)}>{(['en', 'ha', 'yo', 'ig'] as const).map((value) => <option key={value} value={value}>{languageNames[value]}</option>)}</SelectInput></Field>
            <div className="form-actions"><Button type="submit">{t('save_guardian')}</Button><Button type="button" variant="ghost" onClick={() => setShowGuardian(false)}>{t('cancel')}</Button></div>
            {error && <div className="inline-error" role="alert">{error}</div>}
          </form>
        </Card>
      )}

      {showLink && (
        <Card className="form-card">
          <div className="card-heading"><div><div className="eyebrow">{t('consent')}</div><h3>{t('link_guardian')}</h3></div></div>
          <form className="form-grid" onSubmit={saveLink}>
            <Field label={t('pupil')}><SelectInput value={pupilId} onChange={(event) => setPupilId(event.target.value)}>{state.pupils.map((pupil) => <option key={pupil.id} value={pupil.id}>{pupil.displayName}</option>)}</SelectInput></Field>
            <Field label={t('guardian')}><SelectInput value={guardianId} onChange={(event) => setGuardianId(event.target.value)}>{state.guardians.map((guardian) => <option key={guardian.id} value={guardian.id}>{guardian.displayName} · {maskPhone(guardian.phoneE164)}</option>)}</SelectInput></Field>
            <Field label={t('relationship')}><TextInput value={relationship} onChange={(event) => setRelationship(event.target.value)} /></Field>
            <div className="form-actions"><Button type="submit">{t('link_locally')}</Button><Button type="button" variant="ghost" onClick={() => setShowLink(false)}>{t('cancel')}</Button></div>
          </form>
        </Card>
      )}

      {state.guardians.length === 0 ? (
        <EmptyState icon="people" title={t('no_guardians')} body={t('no_guardians_body')} action={<Button onClick={() => setShowGuardian(true)}>{t('add_guardian')}</Button>} />
      ) : (
        <div className="card-grid">
          {state.guardians.map((guardian) => {
            const links = state.links.filter((link) => link.guardianId === guardian.id);
            return (
              <Card key={guardian.id} className="guardian-card">
                <div className="class-card-top"><span className="avatar">{guardian.displayName.slice(0, 1)}</span><Pill tone={guardian.consentStatus === 'opted_in' ? 'forest' : 'butter'}>{guardian.consentStatus === 'opted_in' ? t('opted_in') : guardian.consentStatus === 'opted_out' ? t('opted_out') : t('consent_pending')}</Pill></div>
                <h3>{guardian.displayName}</h3>
                <p>{maskPhone(guardian.phoneE164)} · {languageNames[guardian.preferredLocale as 'en' | 'ha' | 'yo' | 'ig'] ?? guardian.preferredLocale}</p>
                <div className="detail-list compact-list">
                  <div><span>{t('verification')}</span><strong>{guardian.verificationStatus === 'verified' ? t('verified') : t('pending')}</strong></div>
                  <div><span>{t('pupils_linked')}</span><strong>{links.map((link) => state.pupils.find((pupil) => pupil.id === link.pupilId)?.displayName ?? t('error_not_found')).join(', ') || t('not_linked')}</strong></div>
                </div>
                {links.length === 0 && <p className="fine-print">{t('link_hint')}</p>}
              </Card>
            );
          })}
        </div>
      )}
      <Card className="soft-card">
        <div className="card-heading"><div><div className="eyebrow">{t('privacy')}</div><h3>{t('synthetic_numbers_only')}</h3></div><Icon name="shield" /></div>
        <p className="muted">{t('guardians_privacy_body')}</p>
      </Card>
    </div>
  );
}
