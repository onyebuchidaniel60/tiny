import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, PageHeader, Pill, formatTime } from '../components/ui';
import { useStore } from '../data/store';

export function MessagesPage() {
  const { state } = useStore();
  const sorted = [...state.conversations].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Family contact"
        title="Messages"
        subtitle="Parent-initiated SMS appears here. Replies are queued through the mock adapter; no live SMS is sent."
        actions={<Link to="/guardians"><Button variant="secondary">Guardian contacts</Button></Link>}
      />
      {sorted.length === 0 ? <EmptyState icon="message" title="No conversations" body="Add a guardian and link a pupil to begin a synthetic conversation." action={<Link to="/guardians"><Button>Guardians</Button></Link>} /> : (
        <Card>
          <div className="list">
            {sorted.map((conversation) => {
              const guardian = state.guardians.find((item) => item.id === conversation.guardianId);
              const pupil = state.pupils.find((item) => item.id === conversation.pupilId);
              const messages = state.messages.filter((message) => message.conversationId === conversation.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
              const last = messages[messages.length - 1];
              return (
                <Link to={`/messages/${conversation.id}`} className="conversation-row" key={conversation.id}>
                  <span className="avatar">{guardian?.displayName.slice(0, 1) ?? 'G'}</span>
                  <span className="list-main">
                    <strong>{guardian?.displayName ?? 'Guardian'} <small>· {pupil?.displayName ?? 'Pupil'}</small></strong>
                    <span>{last?.direction === 'outbound' ? 'You: ' : ''}{last?.body ?? 'No messages yet'}</span>
                  </span>
                  <span className="conversation-meta">
                    <small>{last ? formatTime(last.createdAt) : ''}</small>
                    {conversation.unread > 0 && <b className="unread-dot">{conversation.unread}</b>}
                    <Pill tone={conversation.status === 'waiting_teacher' ? 'tomato' : 'muted'}>{conversation.status === 'waiting_teacher' ? 'Needs reply' : 'Waiting'}</Pill>
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="mock-note"><Icon name="message" size={15} /> The SMS provider is a deterministic mock. Provider acceptance is never shown as delivery.</div>
        </Card>
      )}
    </div>
  );
}
