import { Link } from 'react-router-dom';
import { Button, Card, Field, PageHeader, Pill, SelectInput } from '../components/ui';
import { useAuth } from '../firebase/auth';
import { isEmulatorMode, isFirebaseConfigured } from '../firebase/config';
import { useStore } from '../data/store';

export function SettingsPage() {
  const { state, updateSettings, resetDemo } = useStore();
  const auth = useAuth();

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Workspace" title="Settings" subtitle="Account, accessibility, privacy and the limits of this preview." />
      <div className="two-column">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">Account</div><h3>{auth.user?.email ?? 'Offline demo teacher'}</h3></div><Pill tone={auth.user ? 'forest' : 'butter'}>{auth.user ? 'Firebase signed in' : 'Local demo'}</Pill></div>
          <div className="detail-list">
            <div><span>Workspace</span><strong>{state.workspace.name}</strong></div>
            <div><span>School code</span><strong>{state.workspace.schoolCode}</strong></div>
            <div><span>Firebase</span><strong>{isFirebaseConfigured ? 'Configured' : 'Not configured'}</strong></div>
            <div><span>Functions</span><strong>{isEmulatorMode ? 'Emulator' : 'Not deployed (Spark)'}</strong></div>
          </div>
          <Button variant="secondary" onClick={() => void auth.signOut()}>{auth.user ? 'Sign out' : 'Leave demo'}</Button>
        </Card>
        <Card>
          <div className="card-heading"><div><div className="eyebrow">Accessibility</div><h3>Reading comfort</h3></div></div>
          <div className="settings-list">
            <label className="toggle-row"><span><strong>Large text</strong><small>Increase the base text size</small></span><input type="checkbox" checked={state.settings.largeText} onChange={(event) => updateSettings({ largeText: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Reduce motion</strong><small>Disable non-essential transitions</small></span><input type="checkbox" checked={state.settings.reducedMotion} onChange={(event) => updateSettings({ reducedMotion: event.target.checked })} /></label>
            <Field label="Teacher language" hint="Only English is reviewed for the web preview. Other Tiny languages remain Android drafts.">
              <SelectInput value={state.settings.language} onChange={(event) => updateSettings({ language: event.target.value as typeof state.settings.language })}>
                <option value="en">English</option>
                <option value="ha">Hausa (draft)</option>
                <option value="yo">Yoruba (draft)</option>
                <option value="ig">Igbo (draft)</option>
              </SelectInput>
            </Field>
          </div>
        </Card>
      </div>
      <Card>
        <div className="card-heading"><div><div className="eyebrow">Privacy</div><h3>Local-first data</h3></div><Pill tone="tomato">Synthetic only</Pill></div>
        <p className="muted">This workspace contains synthetic names and numbers. It is not connected to real children, guardians or SMS. Do not enter real personal data.</p>
        <div className="two-column">
          <div className="detail-list">
            <div><span>Storage</span><strong>IndexedDB + local backup</strong></div>
            <div><span>Remote writes</span><strong>Not available (Spark)</strong></div>
            <div><span>AI</span><strong>On-device preferred; cloud fallback</strong></div>
          </div>
          <div className="button-row">
            <Link to="/sync"><Button variant="secondary">Sync centre</Button></Link>
            <Button variant="danger" onClick={() => { if (confirm('Reset local demo data? This does not delete Firebase data.')) void resetDemo(); }}>Reset local data</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
