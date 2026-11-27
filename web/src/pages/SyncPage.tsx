import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, PageHeader, Pill, StatusDot } from '../components/ui';
import { useStore } from '../data/store';
import { isEmulatorMode } from '../firebase/config';
import { commandLabel, statusLabel, useI18n } from '../i18n';

export function SyncPage() {
  const { state, syncing, syncNow, refreshRemote } = useStore();
  const { t, formatDate } = useI18n();
  const pending = state.outbox.filter((item) => item.state === 'pending' || item.state === 'retryable');
  const online = navigator.onLine;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('connectivity')}
        title={t('sync_center_title')}
        subtitle={t('sync_subtitle')}
        actions={<div className="button-row"><Button variant="secondary" onClick={() => void refreshRemote()} disabled={!state.mode.includes('firebase')}><Icon name="download" size={16} /> {t('refresh_firebase')}</Button><Button onClick={() => void syncNow()} disabled={syncing}>{syncing ? t('syncing') : t('try_sync')}</Button></div>}
      />

      <div className="metric-card-row">
        <div className="card mini-metric"><span className="status-dot status-ok" /><div><strong>{online ? t('online') : t('offline')}</strong><small>{t('browser_connection')}</small></div></div>
        <div className="card mini-metric"><span className="status-dot status-wait" /><div><strong>{pending.length} {t('queued')}</strong><small>{t('saved_on_device')}</small></div></div>
        <div className="card mini-metric"><span className="status-dot status-ok" /><div><strong>{state.mode === 'firebase' ? t('firestore_reads') : t('local_workspace')}</strong><small>{state.lastRemoteSyncAt ? t('last_read', { date: formatDate(state.lastRemoteSyncAt) }) : t('no_remote_read')}</small></div></div>
      </div>

      <Card>
        <div className="card-heading"><div><div className="eyebrow">{t('outbox')}</div><h3>{t('durable_commands')}</h3></div><Pill tone="muted">{state.outbox.length}</Pill></div>
        {state.outbox.length === 0 ? <EmptyState icon="sync" title={t('sync_center_empty')} body={t('nothing_queued_body')} /> : (
          <div className="outbox-list">
            {state.outbox.map((command) => (
              <div className="outbox-row" key={command.id}>
                <StatusDot status={command.state} />
                <div className="list-main">
                  <strong>{commandLabel(t, command.commandType)}</strong>
                  <small>{command.idempotencyKey} · {t('attempt', { count: command.attempts })} · {formatDate(command.createdAt)}</small>
                  {command.lastError && <p className="error-text">{command.lastError}</p>}
                </div>
                <Pill tone={command.state === 'synced' ? 'forest' : command.state === 'conflict' || command.state === 'failed' ? 'tomato' : 'butter'}>{statusLabel(t, command.state)}</Pill>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="two-column">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('status')}</div><h3>{t('server_sync')}</h3></div></div>
          <p className="muted">{isEmulatorMode ? t('sync_complete') : t('server_sync_body')}</p>
          <div className="detail-list">
            <div><span>{t('firestore')}</span><strong>{state.mode === 'firebase' ? t('read_only_bootstrap') : t('not_connected')}</strong></div>
            <div><span>{t('functions')}</span><strong>{isEmulatorMode ? t('emulator') : t('not_deployed')}</strong></div>
            <div><span>{t('cross_device')}</span><strong>{t('not_claimed')}</strong></div>
          </div>
        </Card>
        <Card className="soft-card">
          <div className="card-heading"><div><div className="eyebrow">{t('offline_behaviour')}</div><h3>{t('offline_survives')}</h3></div></div>
          <ul className="simple-list">
            <li>{t('offline_point_1')}</li>
            <li>{t('offline_point_2')}</li>
            <li>{t('offline_point_3')}</li>
            <li>{t('offline_point_4')}</li>
          </ul>
          <Link to="/settings" className="text-link">{t('reset_link')}</Link>
        </Card>
      </div>
    </div>
  );
}
