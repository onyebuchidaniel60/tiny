import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, EmptyState } from '../components/ui';
import { useStore } from '../data/store';
import { useI18n } from '../i18n';
import { useGuardianTour } from '../tours';
import { TourDialog } from '../components/Tour';

export function GuardianSimulatorPage() {
  const { conversationId } = useParams();
  const { state, receiveGuardianMessage } = useStore();
  const { t, formatTime } = useI18n();
  const tour = useGuardianTour();
  const conversation = state.conversations.find((item) => item.id === conversationId);
  const guardian = state.guardians.find((item) => item.id === conversation?.guardianId);
  const pupil = state.pupils.find((item) => item.id === conversation?.pupilId);
  const messages = state.messages.filter((message) => message.conversationId === conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!tour.done) tour.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour.done]);

  if (!conversation) {
    return <EmptyState title={t('conversation_not_found')} body={t('conversation_not_found_body')} action={<Link to="/messages"><Button>{t('teacher_inbox')}</Button></Link>} />;
  }

  function send() {
    if (!body.trim()) return;
    receiveGuardianMessage(conversation!.id, body);
    setBody('');
  }

  return (
    <main className="guardian-page">
      <div className="guardian-phone">
        <header className="guardian-header">
          <Link to={`/messages/${conversation.id}`} aria-label={t('back_to_teacher')}><Icon name="arrow" size={18} /></Link>
          <div>
            <strong>{guardian?.displayName ?? t('guardian')}</strong>
            <small>{pupil?.displayName ?? t('pupil')} · {t('brand_guardian_sms')}</small>
          </div>
          <button type="button" className="sim-pill" onClick={tour.replay}>{t('help_tours')}</button>
        </header>
        <div className="guardian-notice">{t('evaluation_sms_notice')}</div>
        <div className="guardian-thread">
          {messages.map((message) => (
            <div key={message.id} className={`guardian-bubble ${message.direction === 'inbound' ? 'from-guardian' : 'from-teacher'}`}>
              <p>{message.body}</p>
              <span>{formatTime(message.createdAt)}</span>
            </div>
          ))}
        </div>
        <div className="guardian-composer">
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t('write_reply')}
            aria-label={t('guardian_message_label')}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); send(); } }}
          />
          <button type="button" onClick={send} disabled={!body.trim()}>{t('send')}</button>
        </div>
        <footer className="guardian-footer">
          <Link to="/messages">{t('teacher_inbox')}</Link>
          <span>{t('evaluation_mode')}</span>
        </footer>
      </div>
      <TourDialog
        open={tour.open}
        title={tour.title}
        intro={tour.intro}
        steps={tour.steps}
        onClose={tour.close}
        onFinish={tour.finish}
      />
    </main>
  );
}
