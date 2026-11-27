import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, Card, Field, PageHeader, Pill, SelectInput, TextInput, maskPhone } from '../components/ui';
import { useStore } from '../data/store';
import { normalizeNigerianPhone } from '../domain';

export function GuardiansPage() {
  const { state, addGuardian, linkGuardian } = useStore();
  const [showGuardian, setShowGuardian] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [locale, setLocale] = useState<'en' | 'ha' | 'yo' | 'ig'>('en');
  const [pupilId, setPupilId] = useState(state.pupils[0]?.id ?? '');
  const [guardianId, setGuardianId] = useState(state.guardians[0]?.id ?? '');
  const [relationship, setRelationship] = useState('Parent');
  const [error, setError] = useState<string | null>(null);

  function saveGuardian(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeNigerianPhone(phone);
    if (!name.trim() || !normalized) {
      setError('Add a name and a valid Nigerian synthetic phone number.');
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not link guardian.');
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Family contact"
        title="Guardians"
        subtitle="One pupil may have several guardians; one guardian endpoint may serve several pupils."
        actions={
          <div className="button-row">
            <Button onClick={() => setShowGuardian((value) => !value)}><Icon name="plus" size={16} /> Guardian</Button>
            <Button variant="secondary" onClick={() => setShowLink((value) => !value)}>Link pupil</Button>
          </div>
        }
      />

      {showGuardian && (
        <Card className="form-card">
          <div className="card-heading"><div><div className="eyebrow">New endpoint</div><h3>Add guardian</h3></div></div>
          <form className="form-grid" onSubmit={saveGuardian}>
            <Field label="Name"><TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Synthetic guardian" /></Field>
            <Field label="Phone (synthetic)" hint="Never add a real parent or guardian number."><TextInput value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+2348000000015" /></Field>
            <Field label="SMS language"><SelectInput value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)}><option value="en">English</option><option value="ha">Hausa</option><option value="yo">Yoruba</option><option value="ig">Igbo</option></SelectInput></Field>
            <div className="form-actions"><Button type="submit">Save locally</Button><Button type="button" variant="ghost" onClick={() => setShowGuardian(false)}>Cancel</Button></div>
            {error && <div className="inline-error">{error}</div>}
          </form>
        </Card>
      )}

      {showLink && (
        <Card className="form-card">
          <div className="card-heading"><div><div className="eyebrow">Relationship</div><h3>Link guardian to pupil</h3></div></div>
          <form className="form-grid" onSubmit={saveLink}>
            <Field label="Pupil"><SelectInput value={pupilId} onChange={(event) => setPupilId(event.target.value)}>{state.pupils.map((pupil) => <option key={pupil.id} value={pupil.id}>{pupil.displayName}</option>)}</SelectInput></Field>
            <Field label="Guardian"><SelectInput value={guardianId} onChange={(event) => setGuardianId(event.target.value)}>{state.guardians.map((guardian) => <option key={guardian.id} value={guardian.id}>{guardian.displayName} · {maskPhone(guardian.phoneE164)}</option>)}</SelectInput></Field>
            <Field label="Relationship"><TextInput value={relationship} onChange={(event) => setRelationship(event.target.value)} /></Field>
            <div className="form-actions"><Button type="submit">Link locally</Button><Button type="button" variant="ghost" onClick={() => setShowLink(false)}>Cancel</Button></div>
          </form>
        </Card>
      )}

      <div className="card-grid">
        {state.guardians.map((guardian) => {
          const links = state.links.filter((link) => link.guardianId === guardian.id);
          return (
            <Card key={guardian.id} className="guardian-card">
              <div className="class-card-top"><span className="avatar">{guardian.displayName.slice(0, 1)}</span><Pill tone={guardian.consentStatus === 'opted_in' ? 'forest' : 'butter'}>{guardian.consentStatus.replace('_', ' ')}</Pill></div>
              <h3>{guardian.displayName}</h3>
              <p>{maskPhone(guardian.phoneE164)} · {guardian.preferredLocale.toUpperCase()}</p>
              <div className="detail-list compact-list">
                <div><span>Verification</span><strong>{guardian.verificationStatus}</strong></div>
                <div><span>Pupils</span><strong>{links.map((link) => state.pupils.find((pupil) => pupil.id === link.pupilId)?.displayName ?? 'Unknown').join(', ') || 'Not linked'}</strong></div>
              </div>
              {links.length === 0 && <p className="fine-print">Link this endpoint to a pupil before composing a conversation.</p>}
            </Card>
          );
        })}
      </div>
      <Card className="soft-card">
        <div className="card-heading"><div><div className="eyebrow">Privacy</div><h3>Synthetic numbers only</h3></div><Icon name="shield" /></div>
        <p className="muted">The preview never sends SMS. Verification and consent are records, not a substitute for in-person verification or legal consent. Do not enter real child or guardian data.</p>
      </Card>
    </div>
  );
}
