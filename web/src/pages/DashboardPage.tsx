import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, PageHeader, Pill } from '../components/ui';
import { TourDialog } from '../components/Tour';
import { useStore } from '../data/store';
import { useI18n } from '../i18n';
import { useTeacherTour } from '../tours';
import { buildClassIntelligence, buildPupilIntelligence, buildSuggestedFollowUps } from '../intelligence';

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
  const profiles = state.pupils
    .map((pupil) => buildPupilIntelligence(state, pupil.id))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));
  const attention = profiles.filter((profile) => profile.status === 'needs_attention').sort((a, b) => a.attendance.rate - b.attendance.rate);
  const openFollowUps = state.followUps.filter((item) => item.status === 'open');
  const suggestions = buildSuggestedFollowUps(state).filter((suggestion) => !openFollowUps.some((item) => item.pupilId === suggestion.pupilId && item.source === suggestion.source));
  const classInsights = state.classes.map((classroom) => ({ classroom, intelligence: buildClassIntelligence(state, classroom.id) }));

  useEffect(() => {
    if (!tour.done) tour.start();
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
        <div className="summary-item"><strong>{state.classes.length}</strong><span>{t('home_classes')}</span></div>
        <div className="summary-item"><strong>{state.pupils.length}</strong><span>{t('home_pupils')}</span></div>
        <div className="summary-item"><strong>{pending}</strong><span>{t('home_pending')}</span></div>
        <div className="summary-item"><strong>{unread}</strong><span>{t('home_unread')}</span></div>
        <Link to="/intelligence" className="summary-link"><Icon name="spark" size={16} /> {attention.length ? `${attention.length} ${t('profile_needs_attention').toLowerCase()}` : t('no_open_followups')} <Icon name="arrow" size={14} /></Link>
      </div>

      <div className="two-column wide-left">
        <Card className="attention-card">
          <div className="card-heading"><div><div className="eyebrow">{t('today')}</div><h3>{t('pupils_attention')}</h3></div><Link to="/pupils" className="text-link">{t('view_all')}</Link></div>
          {attention.length === 0 ? (
            <div className="calm-state"><Icon name="check" size={22} /><p>{t('no_open_followups')}</p></div>
          ) : attention.slice(0, 5).map((profile) => {
            const classroom = state.classes.find((item) => item.id === profile.classId);
            return (
              <Link key={profile.pupilId} to={`/pupils/${profile.pupilId}`} className="attention-row">
                <span className="avatar">{profile.pupilName.slice(0, 1)}</span>
                <span className="list-main"><strong>{profile.pupilName}</strong><small>{classroom?.gradeLevel} {classroom?.sectionLabel} · {t('attendance_rate')} {profile.attendance.rate}% · {profile.assessments.count} {t('assessment_title').toLowerCase()}</small></span>
                <Pill tone="tomato">{t(`status_${profile.status}` as never)}</Pill>
                <Icon name="arrow" size={15} />
              </Link>
            );
          })}
          <div className="button-row attention-actions"><Link to="/followups"><Button variant="secondary"><Icon name="check" size={16} /> {openFollowUps.length} {t('open_followups').toLowerCase()}</Button></Link><Link to="/intelligence"><Button variant="ghost">{t('class_intelligence')}</Button></Link></div>
        </Card>

        <div className="page-stack">
          <Card>
            <div className="card-heading"><div><div className="eyebrow">{t('suggested_followups')}</div><h3>{t('next_actions')}</h3></div><Pill tone="butter">{suggestions.length + openFollowUps.length}</Pill></div>
            {(suggestions.length > 0 ? suggestions.slice(0, 3) : openFollowUps.slice(0, 3)).map((item) => (
              <Link key={'key' in item ? item.key : item.id} to={'key' in item ? `/pupils/${item.pupilId}` : `/followups`} className="mini-followup">
                <span className="status-dot status-warn" />
                <span className="list-main"><strong>{'key' in item ? t(item.titleKey as never) : item.title}</strong><small>{state.pupils.find((pupil) => pupil.id === item.pupilId)?.displayName ?? t('class_label')}</small></span>
                <Icon name="arrow" size={14} />
              </Link>
            ))}
            {suggestions.length === 0 && openFollowUps.length === 0 && <p className="muted">{t('no_open_followups')}</p>}
            <Link to="/followups" className="text-link">{t('open_followups')}</Link>
          </Card>
          <Card className="soft-card">
            <div className="eyebrow">{t('class_intelligence')}</div>
            {classInsights.map(({ classroom, intelligence }) => intelligence && (
              <Link key={classroom.id} to={`/classes/${classroom.id}/intelligence`} className="class-row compact-row">
                <span className="class-avatar">{classroom.gradeLevel}{classroom.sectionLabel.slice(0, 1)}</span>
                <span className="class-row-main"><strong>{classroom.gradeLevel} {classroom.sectionLabel}</strong><small>{intelligence.attendanceRate}% {t('attendance_rate').toLowerCase()} · {tn('common_gap_count', intelligence.commonGaps.length)}</small></span>
                <Icon name="arrow" size={15} />
              </Link>
            ))}
          </Card>
        </div>
      </div>

      <div className="two-column">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('today')}</div><h3>{t('home_classes')}</h3></div><Link to="/classes" className="text-link">{t('view_all')}</Link></div>
          <div className="class-list compact">
            {state.classes.map((classroom) => {
              const pupils = state.pupils.filter((pupil) => pupil.classId === classroom.id && pupil.enrollmentStatus === 'active');
              const session = todaySessions.find((item) => item.classId === classroom.id);
              return (
                <Link key={classroom.id} to={`/attendance/${classroom.id}`} className="class-row">
                  <span className="class-avatar">{classroom.gradeLevel}{classroom.sectionLabel.slice(0, 1)}</span>
                  <span className="class-row-main"><strong>{classroom.gradeLevel} {classroom.sectionLabel}</strong><small>{tn('classes_pupil_count', pupils.length)} · {pupils.length ? t('home_register_ready') : t('home_add_pupils')}</small></span>
                  <Pill tone={session?.status === 'submitted' ? 'forest' : 'butter'}>{session?.status === 'submitted' ? t('home_submitted') : t('home_not_started')}</Pill>
                  <Icon name="arrow" size={16} />
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('home_parent_messages')}</div><h3>{t('home_recent_messages')}</h3></div><Link to="/messages" className="text-link">{t('home_view_messages')}</Link></div>
          {recentMessages.length === 0 ? <p className="muted">{t('home_no_messages')}</p> : (
            <div className="message-preview-list">
              {recentMessages.map((message) => {
                const conversation = state.conversations.find((item) => item.id === message.conversationId);
                const guardian = state.guardians.find((item) => item.id === conversation?.guardianId);
                return (
                  <Link to={`/messages/${message.conversationId}`} className="message-preview" key={message.id}>
                    <span className="avatar">{guardian?.displayName.slice(0, 1) ?? 'G'}</span>
                    <span><strong>{guardian?.displayName ?? t('guardian')}</strong><span>{message.body}</span></span>
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
        <Link to="/pupils" className="quick-card"><span className="quick-icon"><Icon name="people" /></span><strong>{t('pupil_directory')}</strong><span>{t('nav_insights')}</span></Link>
        <Link to="/followups" className="quick-card"><span className="quick-icon"><Icon name="check" /></span><strong>{t('followups')}</strong><span>{t('open_followups')}</span></Link>
        <Link to="/lessons" className="quick-card"><span className="quick-icon"><Icon name="book" /></span><strong>{t('home_lesson_plans')}</strong><span>{t('lessons_subtitle')}</span></Link>
        <Link to="/ai" className="quick-card"><span className="quick-icon"><Icon name="spark" /></span><strong>{t('ai_title')}</strong><span>{t('ai_subtitle')}</span></Link>
      </div>

      <Card className="soft-card home-note">
        <Icon name="shield" size={18} />
        <p>{t('home_absence_note')}</p>
      </Card>

      <TourDialog open={tour.open} title={tour.title} intro={tour.intro} steps={tour.steps} onClose={tour.close} onFinish={tour.finish} />
    </div>
  );
}
