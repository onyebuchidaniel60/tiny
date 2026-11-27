import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, PageHeader, Pill } from '../components/ui';
import { useStore } from '../data/store';
import { useI18n } from '../i18n';

export function MessagesPage() {
  const { state } = useStore();
  const { t, formatTime } = useI18n();
  const sorted = [...state.conversations].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('home_parent_messages')}
        title={t('messages_heading')}
        subtitle={t('messages_subtitle')}
        actions={<Link to="/guardians"><Button variant="secondary">{t('guardian_contacts')}</Button></Link>}
      />
      {sorted.length === 0 ? <EmptyState icon="message" title={t('no_messages')} body={t('no_conversations_body')} action={<Link to="/guardians"><Button>{t('guardians_title')}</Button></Link>} /> : (
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
                    <strong>{guardian?.displayName ?? t('guardian')} <small>· {pupil?.displayName ?? t('pupil')}</small></strong>
                    <span>{last?.direction === 'outbound' ? `${t('teacher')}: ` : ''}{last?.body ?? t('no_messages_yet')}</span>
                  </span>
                  <span className="conversation-meta">
                    <small>{last ? formatTime(last.createdAt) : ''}</small>
                    {conversation.unread > 0 && <b className="unread-dot" aria-label={t('unread_count', { count: conversation.unread })}>{conversation.unread}</b>}
                    <Pill tone={conversation.status === 'waiting_teacher' ? 'tomato' : 'muted'}>{conversation.status === 'waiting_teacher' ? t('needs_reply') : t('waiting')}</Pill>
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="mock-note"><Icon name="message" size={15} /> {t('mock_sms_note')}</div>
        </Card>
      )}
    </div>
  );
}
