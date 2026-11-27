import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, PageHeader, Pill } from '../components/ui';
import { TourDialog } from '../components/Tour';
import { useStore } from '../data/store';
import { useI18n } from '../i18n';
import { useTeacherTour } from '../tours';

export function DashboardPage() {
  const { state } = useStore();
  const { t, formatDate, formatTime, tn } = useI18n();
  const tour = useTeacherTour();
  const today = new Date().toISOString().slice(0, 10);
  const pending = state.outbox.filter((item) => item.state === 'pending' || item.state === 'retryable').length;
  const unread = state.conversations.reduce((sum, item) => sum + item.unread, 0);
  const todaySessions = state.attendance.filter((item) => item.schoolDate === today);
  const recentMessages = [...state.messages]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((message) => message.direction === 'inbound')
    .slice(0, 3);
  const firstClass = state.classes[0];

  useEffect(() => {
    if (!tour.done) tour.start();
    // The tour opens once per device; skip marks it complete.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour.done]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('today')}
        title={t('home_greeting', { name: t('demo_teacher_name') })}
        subtitle={`${formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })} · ${state.workspace.name}`}
        actions={firstClass && <Link to={`/attendance/${firstClass.id}`}><Button><Icon name="attendance" size={17} /> {t('home_start_attendance')}</Button></Link>}
      />

      <div className="summary-strip" role="group" aria-label={t('home_today')}>
        <div className="summary-item">
          <strong>{state.classes.length}</strong>
          <span>{t('home_classes')}</span>
        </div>
        <div className="summary-item">
          <strong>{state.pupils.length}</strong>
          <span>{t('home_pupils')}</span>
        </div>
        <div className="summary-item">
          <strong>{pending}</strong>
          <span>{t('home_pending')}</span>
        </div>
        <div className="summary-item">
          <strong>{unread}</strong>
          <span>{t('home_unread')}</span>
        </div>
        <Link to="/sync" className="summary-link">
          <Icon name={pending ? 'sync' : 'wifi'} size={16} />
          {pending ? t('sync_pending') : t('saved_on_device')} <Icon name="arrow" size={14} />
        </Link>
      </div>

      <div className="two-column">
        <Card>
          <div className="card-heading">
            <div><div className="eyebrow">{t('today')}</div><h3>{t('home_classes')}</h3></div>
            <Link to="/classes" className="text-link">{t('view_all')}</Link>
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
                    <small>{tn('classes_pupil_count', pupils.length)} · {pupils.length ? t('home_register_ready') : t('home_add_pupils')}</small>
                  </span>
                  <Pill tone={session?.status === 'submitted' ? 'forest' : 'butter'}>
                    {session?.status === 'submitted' ? t('home_submitted') : t('home_not_started')}
                  </Pill>
                  <Icon name="arrow" size={16} />
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="card-heading">
            <div><div className="eyebrow">{t('home_parent_messages')}</div><h3>{t('home_recent_messages')}</h3></div>
            <Link to="/messages" className="text-link">{t('home_view_messages')}</Link>
          </div>
          {recentMessages.length === 0 ? (
            <p className="muted">{t('home_no_messages')}</p>
          ) : (
            <div className="message-preview-list">
              {recentMessages.map((message) => {
                const conversation = state.conversations.find((item) => item.id === message.conversationId);
                const guardian = state.guardians.find((item) => item.id === conversation?.guardianId);
                return (
                  <Link to={`/messages/${message.conversationId}`} className="message-preview" key={message.id}>
                    <span className="avatar">{guardian?.displayName.slice(0, 1) ?? 'G'}</span>
                    <span>
                      <strong>{guardian?.displayName ?? t('guardian')}</strong>
                      <span>{message.body}</span>
                    </span>
                    <small>{formatTime(message.createdAt)}</small>
                  </Link>
                );
              })}
            </div>
          )}
          <div className="mock-note"><Icon name="message" size={15} /> {t('home_message_simulated')}</div>
        </Card>
      </div>

      <div className="quick-grid">
        <Link to="/lessons" className="quick-card"><span className="quick-icon"><Icon name="book" /></span><strong>{t('home_lesson_plans')}</strong><span>{t('home_lesson_plans_body')}</span></Link>
        <Link to={`/progress/${state.pupils[0]?.id ?? 'pupil_amina'}`} className="quick-card"><span className="quick-icon"><Icon name="check" /></span><strong>{t('home_record_progress')}</strong><span>{t('home_record_progress_body')}</span></Link>
        <Link to="/guardians" className="quick-card"><span className="quick-icon"><Icon name="people" /></span><strong>{t('home_guardians')}</strong><span>{t('home_guardians_body')}</span></Link>
        <Link to="/ai" className="quick-card"><span className="quick-icon"><Icon name="spark" /></span><strong>{t('home_teaching_helper')}</strong><span>{t('ai_subtitle')}</span></Link>
      </div>

      <Card className="soft-card home-note">
        <Icon name="shield" size={18} />
        <p>{t('home_absence_note')}</p>
      </Card>

      <TourDialog
        open={tour.open}
        title={tour.title}
        intro={tour.intro}
        steps={tour.steps}
        onClose={tour.close}
        onFinish={tour.finish}
      />
    </div>
  );
}
