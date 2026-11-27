import { useEffect, useState } from 'react';
import { NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Icon } from './components/Icon';
import { LanguageSelect } from './components/LanguageSelect';
import { TinyMark } from './components/TinyMark';
import { useAuth } from './firebase/auth';
import { isFirebaseConfigured } from './firebase/config';
import { useStore } from './data/store';
import { useI18n } from './i18n';
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
import { HelpPage } from './pages/HelpPage';

type NavItem = {
  to: string;
  label: string;
  icon: Parameters<typeof Icon>[0]['name'];
  end?: boolean;
  mobile?: boolean;
};

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
  const { t } = useI18n();
  const online = useOnline();
  const pending = state.outbox.filter((item) => item.state === 'pending' || item.state === 'retryable').length;
  const label = !online ? t('offline') : pending > 0 ? `${pending} ${t('pending')}` : t('local_only');
  return (
    <NavLink to="/sync" className={`sync-pill ${!online ? 'offline' : pending ? 'pending' : 'ok'}`} aria-label={t('sync_title')}>
      <Icon name={online ? (pending ? 'sync' : 'wifi') : 'offline'} size={16} />
      <span>{label}</span>
    </NavLink>
  );
}

function TeacherLayout() {
  const { state, message, clearMessage } = useStore();
  const { signOut, user } = useAuth();
  const { t, formatDate } = useI18n();
  const location = useLocation();
  const online = useOnline();
  const navItems: NavItem[] = [
    { to: '/', label: t('nav_home'), icon: 'home', end: true, mobile: true },
    { to: '/classes', label: t('nav_classes'), icon: 'classes', mobile: true },
    { to: '/lessons', label: t('nav_lessons'), icon: 'book', mobile: true },
    { to: '/messages', label: t('nav_messages'), icon: 'message', mobile: true },
    { to: '/guardians', label: t('nav_guardians'), icon: 'people', mobile: true },
    { to: '/sync', label: t('nav_sync'), icon: 'sync' },
    { to: '/help', label: t('nav_help'), icon: 'search' },
    { to: '/settings', label: t('nav_settings'), icon: 'settings' },
  ];
  const mobileItems = navItems.filter((item) => item.mobile);
  const isMain = mobileItems.some((item) => (item.end ? location.pathname === '/' : location.pathname.startsWith(item.to)));

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', state.settings.largeText);
    document.documentElement.classList.toggle('reduced-motion', state.settings.reducedMotion);
  }, [state.settings.largeText, state.settings.reducedMotion]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{t('cd_skip_to_content')}</a>
      <aside className="sidebar">
        <NavLink to="/" className="sidebar-brand" aria-label={`Tiny — ${t('nav_home')}`}>
          <TinyMark size={44} />
          <span>
            <strong>Tiny</strong>
            <small>{t('brand_teacher_workspace')}</small>
          </span>
        </NavLink>
        <nav className="side-nav" aria-label={t('cd_main_nav')}>
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
            {user ? t('sign_out') : t('leave_evaluation')}
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-title">
            <span className="topbar-kicker">{state.mode === 'firebase' ? t('firebase') : t('evaluation_workspace')}</span>
            <strong>{state.workspace.name}</strong>
          </div>
          <div className="topbar-actions">
            <span className={`connectivity ${online ? 'on' : 'off'}`}>
              <Icon name={online ? 'wifi' : 'offline'} size={15} />
              {online ? t('online') : t('offline')}
            </span>
            <LanguageSelect compact />
            <SyncPill />
            <NavLink to="/help" className="topbar-icon" aria-label={t('cd_help')}><Icon name="search" size={19} /></NavLink>
            <NavLink to="/settings" className="topbar-icon" aria-label={t('cd_settings')}><Icon name="settings" size={19} /></NavLink>
          </div>
        </header>

        {state.mode === 'demo' && (
          <div className="mode-banner">
            <Icon name="shield" size={16} />
            <span>{t('evaluation_mode')} · {t('saved_on_device')}</span>
          </div>
        )}
        {!online && (
          <div className="mode-banner offline-banner">
            <Icon name="offline" size={16} />
            <span>{t('help_offline_body')}</span>
          </div>
        )}

        <main id="main-content" className={`content ${isMain ? '' : 'content-detail'}`}>
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label={t('cd_mobile_nav')}>
        {mobileItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `bottom-link ${isActive ? 'active' : ''}`}>
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          <button onClick={clearMessage} aria-label={t('dismiss')}><Icon name="close" size={16} /></button>
        </div>
      )}
      <footer className="app-footer">
        <span className="footer-brand"><TinyMark size={18} /> Tiny · {formatDate(new Date())} · {t('evaluation_workspace')}</span>
        <span>{isFirebaseConfigured ? t('firebase_configured') : t('local_workspace')}</span>
      </footer>
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  const { t } = useI18n();
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
        <TinyMark size={72} />
        <h1>Tiny</h1>
        <p>{t('loading_workspace')}</p>
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
        <Route path="help" element={<HelpPage />} />
        <Route path="ai" element={<AiPage />} />
      </Route>
    </Routes>
  );
}
