import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, EmptyState, PageHeader, Pill, formatDate, formatTime, maskPhone } from '../components/ui';
import { loadDraft, saveDraft } from '../data/db';
import { useStore } from '../data/store';

export function ConversationPage() {
  const { conversationId } = useParams();
  const { state, sendMessage } = useStore();
  const conversation = state.conversations.find((item) => item.id === conversationId);
  const guardian = state.guardians.find((item) => item.id === conversation?.guardianId);
  const pupil = state.pupils.find((item) => item.id === conversation?.pupilId);
  const messages = state.messages.filter((message) => message.conversationId === conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const [body, setBody] = useState('');
  const draftKey = `message:${conversationId}`;

  useEffect(() => {
    loadDraft<string>(draftKey).then((draft) => { if (draft) setBody(draft); });
  }, [draftKey]);

  if (!conversation) return <EmptyState title="Conversation not found" body="Open the inbox to choose a conversation." action={<Link to="/messages"><Button>Inbox</Button></Link>} />;

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
        eyebrow={`${pupil?.displayName ?? 'Pupil'} · ${maskPhone(guardian?.phoneE164 ?? '')}`}
        title={guardian?.displayName ?? 'Guardian'}
        subtitle="Reply from Tiny without exposing a personal phone number. SMS is mocked in this preview."
        actions={<Link to="/messages"><Button variant="secondary">Inbox</Button></Link>}
      />
      <div className="conversation-layout">
        <div className="thread card">
          {messages.length === 0 && <p className="muted">No messages yet.</p>}
          {messages.map((message) => (
            <article key={message.id} className={`bubble-row ${message.direction}`}>
              <div className={`bubble ${message.direction}`}>
                <p>{message.body}</p>
                <span>{formatTime(message.createdAt)} · {message.direction === 'outbound' ? (message.status === 'mock_sent' ? 'Mock sent' : message.status) : 'Received'}</span>
              </div>
            </article>
          ))}
        </div>
        <aside className="page-stack">
          <div className="card">
            <div className="eyebrow">Reply</div>
            <textarea
              className="input textarea"
              rows={5}
              value={body}
              onChange={(event) => update(event.target.value)}
              placeholder="Write a short, factual reply…"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            <div className="button-row">
              <Button onClick={send} disabled={!body.trim()}>Queue reply</Button>
              <span className="muted small">Ctrl/⌘ + Enter</span>
            </div>
            <p className="fine-print">A queued reply is not a delivery confirmation. The mock provider records acceptance only.</p>
          </div>
          <div className="card soft-card">
            <div className="eyebrow">Guardian SMS preview</div>
            <p className="muted">Open a synthetic phone view to test two-way messaging. This is a web simulator, not a parent account.</p>
            <Link to={`/guardian/${conversation.id}`}><Button variant="secondary"><Icon name="phone" size={16} /> Open guardian view</Button></Link>
          </div>
          <div className="card">
            <div className="eyebrow">Conversation</div>
            <div className="detail-list">
              <div><span>Pupil</span><strong>{pupil?.displayName ?? '—'}</strong></div>
              <div><span>Guardian</span><strong>{guardian?.displayName ?? '—'}</strong></div>
              <div><span>Consent</span><Pill tone={guardian?.consentStatus === 'opted_in' ? 'forest' : 'butter'}>{guardian?.consentStatus ?? 'unknown'}</Pill></div>
              <div><span>Last activity</span><strong>{formatDate(conversation.lastMessageAt)}</strong></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
