import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, PageHeader, Pill, StatusDot, formatDate } from '../components/ui';
import { useStore } from '../data/store';
import { isEmulatorMode } from '../firebase/config';

export function SyncPage() {
  const { state, syncing, syncNow, refreshRemote } = useStore();
  const pending = state.outbox.filter((item) => item.state === 'pending' || item.state === 'retryable');
  const online = navigator.onLine;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Connectivity"
        title="Sync centre"
        subtitle="What is saved on this device, what is queued, and what has genuinely been acknowledged."
        actions={<div className="button-row"><Button variant="secondary" onClick={() => void refreshRemote()} disabled={!state.mode.includes('firebase')}><Icon name="download" size={16} /> Refresh Firebase</Button><Button onClick={() => void syncNow()} disabled={syncing}>{syncing ? 'Trying…' : 'Try sync'}</Button></div>}
      />

      <div className="metric-card-row">
        <div className="card mini-metric"><span className="status-dot status-ok" /><div><strong>{online ? 'Online' : 'Offline'}</strong><small>Browser connection</small></div></div>
        <div className="card mini-metric"><span className="status-dot status-wait" /><div><strong>{pending.length} queued</strong><small>Saved locally</small></div></div>
        <div className="card mini-metric"><span className="status-dot status-ok" /><div><strong>{state.mode === 'firebase' ? 'Firestore reads' : 'Local demo'}</strong><small>{state.lastRemoteSyncAt ? `Last read ${formatDate(state.lastRemoteSyncAt)}` : 'No remote read yet'}</small></div></div>
      </div>

      <Card>
        <div className="card-heading"><div><div className="eyebrow">Outbox</div><h3>Durable local commands</h3></div><Pill tone="muted">{state.outbox.length}</Pill></div>
        {state.outbox.length === 0 ? <EmptyState icon="sync" title="Nothing queued" body="Local edits appear here. A green synced state appears only after a real acknowledgement." /> : (
          <div className="outbox-list">
            {state.outbox.map((command) => (
              <div className="outbox-row" key={command.id}>
                <StatusDot status={command.state} />
                <div className="list-main">
                  <strong>{command.commandType}</strong>
                  <small>{command.idempotencyKey} · attempt {command.attempts} · {formatDate(command.createdAt)}</small>
                  {command.lastError && <p className="error-text">{command.lastError}</p>}
                </div>
                <Pill tone={command.state === 'synced' ? 'forest' : command.state === 'conflict' || command.state === 'failed' ? 'tomato' : 'butter'}>{command.state}</Pill>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="two-column">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">Reality check</div><h3>Server sync availability</h3></div></div>
          <p className="muted">
            {isEmulatorMode
              ? 'This build is configured for the local Firebase Emulator Suite. The Try sync button sends queued commands to the Functions emulator on this machine.'
              : 'Cloud Functions are emulator-only on the Spark plan. This hosted preview cannot send queued commands to a deployed server; it shows them as pending rather than pretending they synced.'}
          </p>
          <div className="detail-list">
            <div><span>Firestore</span><strong>{state.mode === 'firebase' ? 'Read-only bootstrap' : 'Not connected'}</strong></div>
            <div><span>Functions</span><strong>{isEmulatorMode ? 'Local emulator' : 'Not deployed'}</strong></div>
            <div><span>Cross-device</span><strong>Not claimed</strong></div>
          </div>
        </Card>
        <Card className="soft-card">
          <div className="card-heading"><div><div className="eyebrow">Offline behaviour</div><h3>What survives a refresh</h3></div></div>
          <ul className="simple-list">
            <li>All state is written to IndexedDB and a synchronous local backup.</li>
            <li>Attendance and message drafts are saved while typing.</li>
            <li>Queued commands survive refresh and retry with an honest state.</li>
            <li>Conflict/rejected states are never silently overwritten.</li>
          </ul>
          <Link to="/settings" className="text-link">Reset local data in Settings</Link>
        </Card>
      </div>
    </div>
  );
}
