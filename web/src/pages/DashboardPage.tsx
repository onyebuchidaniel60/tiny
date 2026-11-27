import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, PageHeader, Pill, formatDate, formatTime } from '../components/ui';
import { useStore } from '../data/store';

export function DashboardPage() {
  const { state } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const pending = state.outbox.filter((item) => item.state === 'pending' || item.state === 'retryable').length;
  const unread = state.conversations.reduce((sum, item) => sum + item.unread, 0);
  const todaySessions = state.attendance.filter((item) => item.schoolDate === today);
  const recentMessages = [...state.messages]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((message) => message.direction === 'inbound')
    .slice(0, 3);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Teacher workspace"
        title="Good morning, Ms. Bello"
        subtitle={`${formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })} · ${state.workspace.name}`}
        actions={<Link to="/attendance/class_p4_blue"><Button><Icon name="attendance" size={17} /> Start attendance</Button></Link>}
      />

      <div className="hero-grid">
        <Card className="hero-card">
          <div className="hero-top">
            <Pill tone="cobalt">Offline-first</Pill>
            <span className="hero-code">School code {state.workspace.schoolCode}</span>
          </div>
          <h2>Teach the lesson.<br />Keep the record.</h2>
          <p>
            Classes, attendance, lessons and family messages stay usable when the network drops.
            No pupil account. No parent app.
          </p>
          <div className="hero-actions">
            <Link to="/classes"><Button variant="secondary">Open classes <Icon name="arrow" size={16} /></Button></Link>
            <Link to="/ai"><Button variant="ghost">Teaching helper <Icon name="spark" size={16} /></Button></Link>
          </div>
        </Card>
        <Card className="metric-card">
          <div className="metric-grid">
            <div><strong>{state.classes.length}</strong><span>Classes</span></div>
            <div><strong>{state.pupils.length}</strong><span>Pupils</span></div>
            <div><strong>{pending}</strong><span>Queued</span></div>
            <div><strong>{unread}</strong><span>Unread</span></div>
          </div>
          <div className="metric-foot">
            <span><Icon name="wifi" size={15} /> {pending ? 'Local edits waiting for a server path' : 'No server writes pending'}</span>
            <Link to="/sync">Sync centre</Link>
          </div>
        </Card>
      </div>

      <div className="two-column">
        <Card>
          <div className="card-heading">
            <div><div className="eyebrow">Today</div><h3>Classes and attendance</h3></div>
            <Link to="/classes" className="text-link">All classes</Link>
          </div>
          <div className="class-list compact">
            {state.classes.map((classroom) => {
              const pupils = state.pupils.filter((pupil) => pupil.classId === classroom.id && pupil.enrollmentStatus === 'active');
              const session = todaySessions.find((item) => item.classId === classroom.id);
              return (
                <Link key={classroom.id} to={`/attendance/${classroom.id}`} className="class-row">
                  <span className="class-avatar">{classroom.gradeLevel}{classroom.sectionLabel.slice(0, 1)}</span>
                  <span className="class-row-main">
                    <strong>{classroom.gradeLevel} {classroom.sectionLabel}</strong>
                    <small>{pupils.length} pupils · {pupils.length ? 'register ready' : 'add pupils'}</small>
                  </span>
                  <Pill tone={session?.status === 'submitted' ? 'forest' : 'butter'}>
                    {session?.status === 'submitted' ? 'Submitted' : 'Not started'}
                  </Pill>
                  <Icon name="arrow" size={16} />
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="card-heading">
            <div><div className="eyebrow">Family contact</div><h3>Recent messages</h3></div>
            <Link to="/messages" className="text-link">Inbox</Link>
          </div>
          {recentMessages.length === 0 ? (
            <p className="muted">No inbound messages yet. The SMS adapter is mocked in this preview.</p>
          ) : (
            <div className="message-preview-list">
              {recentMessages.map((message) => {
                const conversation = state.conversations.find((item) => item.id === message.conversationId);
                const guardian = state.guardians.find((item) => item.id === conversation?.guardianId);
                return (
                  <Link to={`/messages/${message.conversationId}`} className="message-preview" key={message.id}>
                    <span className="avatar">{guardian?.displayName.slice(0, 1) ?? 'G'}</span>
                    <span>
                      <strong>{guardian?.displayName ?? 'Guardian'}</strong>
                      <span>{message.body}</span>
                    </span>
                    <small>{formatTime(message.createdAt)}</small>
                  </Link>
                );
              })}
            </div>
          )}
          <div className="mock-note"><Icon name="message" size={15} /> SMS is mocked. Nothing is sent to a real phone.</div>
        </Card>
      </div>

      <div className="quick-grid">
        <Link to="/lessons" className="quick-card"><span className="quick-icon"><Icon name="book" /></span><strong>Lesson plans</strong><span>Open a 5E plan offline</span></Link>
        <Link to="/progress/pupil_amina" className="quick-card"><span className="quick-icon"><Icon name="check" /></span><strong>Record progress</strong><span>Teacher-authored observations</span></Link>
        <Link to="/guardians" className="quick-card"><span className="quick-icon"><Icon name="people" /></span><strong>Guardians</strong><span>Endpoints, links and consent</span></Link>
        <Link to="/ai" className="quick-card"><span className="quick-icon"><Icon name="spark" /></span><strong>Teaching helper</strong><span>On-device first, cloud fallback</span></Link>
      </div>
    </div>
  );
}
