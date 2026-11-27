import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, EmptyState, formatTime } from '../components/ui';
import { useStore } from '../data/store';

export function GuardianSimulatorPage() {
  const { conversationId } = useParams();
  const { state, receiveGuardianMessage } = useStore();
  const conversation = state.conversations.find((item) => item.id === conversationId);
  const guardian = state.guardians.find((item) => item.id === conversation?.guardianId);
  const pupil = state.pupils.find((item) => item.id === conversation?.pupilId);
  const messages = state.messages.filter((message) => message.conversationId === conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const [body, setBody] = useState('');

  if (!conversation) {
    return <EmptyState title="Guardian view unavailable" body="This synthetic conversation does not exist on this device." action={<Link to="/messages"><Button>Teacher inbox</Button></Link>} />;
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
          <Link to={`/messages/${conversation.id}`} aria-label="Back to teacher view"><Icon name="arrow" size={18} /></Link>
          <div>
            <strong>{guardian?.displayName ?? 'Guardian'}</strong>
            <small>{pupil?.displayName ?? 'Pupil'} · SMS simulator</small>
          </div>
          <span className="sim-pill">DEMO</span>
        </header>
        <div className="guardian-notice">
          Synthetic SMS view. No real phone or parent account. Messages stay in this browser.
        </div>
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
            placeholder="Write a parent message…"
            aria-label="Guardian message"
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); send(); } }}
          />
          <button type="button" onClick={send} disabled={!body.trim()}>Send</button>
        </div>
        <footer className="guardian-footer">
          <Link to="/messages">Teacher inbox</Link>
          <span>Mock SMS · synthetic data</span>
        </footer>
      </div>
    </main>
  );
}
