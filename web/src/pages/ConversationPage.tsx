import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, PageHeader, Pill } from '../components/ui';
import { loadDraft, saveDraft } from '../data/db';
import { useStore } from '../data/store';
import { guardianStatusLabel, useI18n } from '../i18n';

export function ConversationPage() {
  const { conversationId } = useParams();
  const { state, sendMessage } = useStore();
  const { t, formatDate, formatTime } = useI18n();
  const conversation = state.conversations.find((item) => item.id === conversationId);
  const guardian = state.guardians.find((item) => item.id === conversation?.guardianId);
  const pupil = state.pupils.find((item) => item.id === conversation?.pupilId);
  const messages = state.messages.filter((message) => message.conversationId === conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const [body, setBody] = useState('');
  const draftKey = `message:${conversationId}`;

  useEffect(() => {
    loadDraft<string>(draftKey).then((draft) => { if (draft) setBody(draft); });
  }, [draftKey]);

  if (!conversation) return <EmptyState title={t('conversation_not_found')} body={t('conversation_not_found_body')} action={<Link to="/messages"><Button>{t('inbox')}</Button></Link>} />;

  function update(value: string) {
    setBody(value);
    void saveDraft(draftKey, value);
  }

  function send() {
    if (!body.trim()) return;
    sendMessage(conversation!.id, body);
    setBody('');
    void saveDraft(draftKey, '');
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`${pupil?.displayName ?? t('pupil')} · ${guardian?.phoneE164 ? `${guardian.phoneE164.slice(0, 5)}•••${guardian.phoneE164.slice(-4)}` : ''}`}
        title={guardian?.displayName ?? t('guardian')}
        subtitle={t('messages_subtitle')}
        actions={<Link to="/messages"><Button variant="secondary">{t('inbox')}</Button></Link>}
      />
      <div className="conversation-layout">
        <div className="thread card">
          {messages.length === 0 && <p className="muted">{t('no_messages_yet')}</p>}
          {messages.map((message) => (
            <article key={message.id} className={`bubble-row ${message.direction}`}>
              <div className={`bubble ${message.direction}`}>
                <p>{message.body}</p>
                <span>{formatTime(message.createdAt)} · {message.direction === 'outbound' ? (message.status === 'mock_sent' ? t('mock_sent') : message.status === 'queued' ? t('queued_status') : message.status === 'failed' ? t('failed') : t('received')) : t('received')}</span>
              </div>
            </article>
          ))}
        </div>
        <aside className="page-stack">
          <div className="card">
            <div className="eyebrow">{t('reply')}</div>
            <textarea
              className="input textarea"
              rows={5}
              value={body}
              onChange={(event) => update(event.target.value)}
              placeholder={t('write_reply')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            <div className="button-row">
              <Button onClick={send} disabled={!body.trim()}>{t('queue_reply')}</Button>
              <span className="muted small">{t('teacher_reply_hint')}</span>
            </div>
            <p className="fine-print">{t('queued_reply_note')}</p>
          </div>
          <div className="card soft-card">
            <div className="eyebrow">{t('guardian_view')}</div>
            <p className="muted">{t('guardian_view_body')}</p>
            <Link to={`/guardian/${conversation.id}`}><Button variant="secondary"><Icon name="phone" size={16} /> {t('open_guardian_view')}</Button></Link>
          </div>
          <div className="card">
            <div className="eyebrow">{t('conversation')}</div>
            <div className="detail-list">
              <div><span>{t('pupil')}</span><strong>{pupil?.displayName ?? '—'}</strong></div>
              <div><span>{t('guardian')}</span><strong>{guardian?.displayName ?? '—'}</strong></div>
              <div><span>{t('consent')}</span><Pill tone={guardian?.consentStatus === 'opted_in' ? 'forest' : 'butter'}>{guardianStatusLabel(t, guardian?.consentStatus ?? 'pending')}</Pill></div>
              <div><span>{t('last_activity')}</span><strong>{formatDate(conversation.lastMessageAt)}</strong></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
