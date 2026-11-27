import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './components/Icon';
import { formatDate, Pill } from './components/ui';
import { useAuth } from './firebase/auth';
import { isFirebaseConfigured } from './firebase/config';
import { useStore } from './data/store';
import { SignInPage } from './pages/SignInPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClassesPage } from './pages/ClassesPage';
import { ClassDetailPage } from './pages/ClassDetailPage';
import { AttendancePage } from './pages/AttendancePage';
import { LessonsPage } from './pages/LessonsPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import { ProgressPage } from './pages/ProgressPage';
import { MessagesPage } from './pages/MessagesPage';
import { ConversationPage } from './pages/ConversationPage';
import { GuardiansPage } from './pages/GuardiansPage';
import { SyncPage } from './pages/SyncPage';
import { SettingsPage } from './pages/SettingsPage';
import { AiPage } from './pages/AiPage';
import { GuardianSimulatorPage } from './pages/GuardianSimulatorPage';

const navItems = [
  { to: '/', label: 'Home', icon: 'home' as const, end: true },
  { to: '/classes', label: 'Classes', icon: 'classes' as const },
  { to: '/lessons', label: 'Lessons', icon: 'book' as const },
  { to: '/messages', label: 'Messages', icon: 'message' as const },
  { to: '/guardians', label: 'Guardians', icon: 'people' as const },
  { to: '/sync', label: 'Sync', icon: 'sync' as const },
  { to: '/settings', label: 'Settings', icon: 'settings' as const },
];

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

function SyncPill() {
  const { state } = useStore();
  const online = useOnline();
  const pending = state.outbox.filter((item) => item.state === 'pending' || item.state === 'retryable').length;
  const label = !online ? 'Offline' : pending > 0 ? `${pending} pending` : state.mode === 'firebase' ? 'Firebase read' : 'Local demo';
  return (
    <NavLink to="/sync" className={`sync-pill ${!online ? 'offline' : pending ? 'pending' : 'ok'}`}>
      <Icon name={online ? (pending ? 'sync' : 'wifi') : 'offline'} size={16} />
      <span>{label}</span>
    </NavLink>
  );
}

function TeacherLayout() {
  const { state, message, clearMessage } = useStore();
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const online = useOnline();
  const isMain = navItems.some((item) => (item.end ? location.pathname === '/' : location.pathname.startsWith(item.to)));
  const pending = state.outbox.filter((item) => item.state === 'pending' || item.state === 'retryable').length;

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', state.settings.largeText);
    document.documentElement.classList.toggle('reduced-motion', state.settings.reducedMotion);
  }, [state.settings.largeText, state.settings.reducedMotion]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small" aria-hidden="true"><span>T</span><i /></div>
          <div>
            <strong>Tiny</strong>
            <small>Teacher workspace</small>
          </div>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.to === '/messages' && state.conversations.some((conversation) => conversation.unread > 0) && <b className="nav-badge">!</b>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="workspace-chip">
            <span className="workspace-initial">{state.workspace.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{state.workspace.name}</strong>
              <small>{state.workspace.schoolCode}</small>
            </div>
          </div>
          <button className="text-button" onClick={() => void signOut()}>
            {user ? 'Sign out' : 'Leave demo'}
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-title">
            <span className="topbar-kicker">{state.mode === 'firebase' ? 'Firebase workspace' : 'Offline demo workspace'}</span>
            <strong>{state.workspace.name}</strong>
          </div>
          <div className="topbar-actions">
            <span className={`connectivity ${online ? 'on' : 'off'}`}>
              <Icon name={online ? 'wifi' : 'offline'} size={15} />
              {online ? 'Online' : 'Offline'}
            </span>
            <SyncPill />
            <NavLink to="/settings" className="topbar-icon" aria-label="Settings"><Icon name="settings" size={19} /></NavLink>
          </div>
        </header>

        {state.mode === 'demo' && (
          <div className="mode-banner">
            <Icon name="shield" size={16} />
            <span>Synthetic demo data. Saved on this device. Server sync is not available on Spark.</span>
          </div>
        )}
        {!online && (
          <div className="mode-banner offline-banner">
            <Icon name="offline" size={16} />
            <span>You are offline. Edits still save locally and will be reviewed when connectivity returns.</span>
          </div>
        )}

        <main className={`content ${isMain ? '' : 'content-detail'}`}>
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 5).map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `bottom-link ${isActive ? 'active' : ''}`}>
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          <button onClick={clearMessage} aria-label="Dismiss"><Icon name="close" size={16} /></button>
        </div>
      )}
      {pending > 0 && location.pathname !== '/sync' && (
        <button className="pending-fab" onClick={() => navigate('/sync')}>
          <Icon name="sync" size={16} /> {pending} queued
        </button>
      )}
      <footer className="app-footer">
        <span>Tiny · {formatDate(new Date().toISOString())} · synthetic data</span>
        <span>{isFirebaseConfigured ? 'Firebase configured' : 'Local preview'}</span>
      </footer>
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  const { ready, receiveGuardianMessage, receiveTeacherMessage } = useStore();

  useEffect(() => {
    const channel = new BroadcastChannel('tiny-web-messages');
    channel.onmessage = (event: MessageEvent<{ kind?: string; conversationId: string; body: string }>) => {
      if (!event.data?.conversationId || !event.data.body) return;
      if (event.data.kind === 'outbound') {
        receiveTeacherMessage(event.data.conversationId, event.data.body, false);
      } else {
        receiveGuardianMessage(event.data.conversationId, event.data.body, false);
      }
    };
    return () => channel.close();
  }, [receiveGuardianMessage, receiveTeacherMessage]);

  if (auth.loading || !ready) {
    return (
      <div className="splash">
        <div className="brand-mark" aria-hidden="true"><span>T</span><i /></div>
        <h1>Tiny</h1>
        <p>Opening your local workspace…</p>
      </div>
    );
  }

  if (auth.firebaseConfigured && auth.mode === 'firebase' && !auth.user) {
    return <SignInPage />;
  }

  return (
    <Routes>
      <Route path="/guardian/:conversationId" element={<GuardianSimulatorPage />} />
      <Route element={<TeacherLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="classes/:classId" element={<ClassDetailPage />} />
        <Route path="attendance/:classId" element={<AttendancePage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="lessons/:lessonId" element={<LessonDetailPage />} />
        <Route path="progress/:pupilId" element={<ProgressPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="messages/:conversationId" element={<ConversationPage />} />
        <Route path="guardians" element={<GuardiansPage />} />
        <Route path="sync" element={<SyncPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="ai" element={<AiPage />} />
      </Route>
    </Routes>
  );
}
