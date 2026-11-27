import { Link } from 'react-router-dom';
import { Button, Card, Field, PageHeader, Pill, SelectInput } from '../components/ui';
import { useAuth } from '../firebase/auth';
import { isEmulatorMode, isFirebaseConfigured } from '../firebase/config';
import { useStore } from '../data/store';
import { languageNames, supportedLanguages, useI18n, type Language } from '../i18n';
import { useTeacherTour } from '../tours';
import { TourDialog } from '../components/Tour';

export function SettingsPage() {
  const { state, updateSettings, resetDemo } = useStore();
  const { t, language, setLanguage } = useI18n();
  const auth = useAuth();
  const teacherTour = useTeacherTour();

  return (
    <div className="page-stack">
      <PageHeader eyebrow={t('workspace')} title={t('settings_heading')} subtitle={t('settings_subtitle')} />
      <div className="two-column">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('account')}</div><h3>{auth.user?.email ?? t('local_workspace')}</h3></div><Pill tone={auth.user ? 'forest' : 'butter'}>{auth.user ? t('firebase_signed_in') : t('evaluation_workspace')}</Pill></div>
          <div className="detail-list">
            <div><span>{t('workspace')}</span><strong>{state.workspace.name}</strong></div>
            <div><span>{t('school_code')}</span><strong>{state.workspace.schoolCode}</strong></div>
            <div><span>{t('firebase')}</span><strong>{isFirebaseConfigured ? t('firebase_configured') : t('firebase_not_configured')}</strong></div>
            <div><span>{t('functions')}</span><strong>{isEmulatorMode ? t('emulator') : t('not_deployed')}</strong></div>
          </div>
          <Button variant="secondary" onClick={() => void auth.signOut()}>{auth.user ? t('sign_out') : t('leave_evaluation')}</Button>
        </Card>
        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('accessibility')}</div><h3>{t('reading_comfort')}</h3></div></div>
          <div className="settings-list">
            <label className="toggle-row"><span><strong>{t('large_text')}</strong><small>{t('large_text_desc')}</small></span><input type="checkbox" checked={state.settings.largeText} onChange={(event) => updateSettings({ largeText: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>{t('reduce_motion')}</strong><small>{t('reduce_motion_desc')}</small></span><input type="checkbox" checked={state.settings.reducedMotion} onChange={(event) => updateSettings({ reducedMotion: event.target.checked })} /></label>
            <Field label={t('teacher_language')} hint={t('language_draft_disclosure')}>
              <SelectInput
                value={language}
                onChange={(event) => {
                  const next = event.target.value as Language;
                  setLanguage(next);
                  updateSettings({ language: next });
                }}
              >
                {supportedLanguages.map((value) => <option key={value} value={value}>{languageNames[value]}</option>)}
              </SelectInput>
            </Field>
          </div>
        </Card>
      </div>

      <div className="two-column">
        <Card>
          <div className="card-heading"><div><div className="eyebrow">{t('help_about')}</div><h3>{t('help_centre')}</h3></div></div>
          <p className="muted">{t('help_subtitle')}</p>
          <div className="button-row">
            <Link to="/help"><Button variant="secondary">{t('open_help')}</Button></Link>
            <Button variant="ghost" onClick={teacherTour.replay}>{t('replay_teacher_tour')}</Button>
            <Link to="/help"><Button variant="ghost">{t('replay_guardian_tour')}</Button></Link>
          </div>
        </Card>
        <Card className="soft-card">
          <div className="card-heading"><div><div className="eyebrow">{t('about_tiny')}</div><h3>{t('app_tagline')}</h3></div></div>
          <p className="muted">{t('about_body')}</p>
          <p className="fine-print">{t('version_label', { name: '0.1.0' })}</p>
        </Card>
      </div>

      <Card>
        <div className="card-heading"><div><div className="eyebrow">{t('privacy')}</div><h3>{t('local_first')}</h3></div><Pill tone="tomato">{t('sample_data_badge')}</Pill></div>
        <p className="muted">{t('evaluation_disclosure')}</p>
        <div className="two-column">
          <div className="detail-list">
            <div><span>{t('storage')}</span><strong>{t('saved_on_device')}</strong></div>
            <div><span>{t('remote_writes')}</span><strong>{t('not_connected')}</strong></div>
            <div><span>{t('ai_mode')}</span><strong>{t('on_device_pref')}</strong></div>
          </div>
          <div className="button-row">
            <Link to="/sync"><Button variant="secondary">{t('sync_center_title')}</Button></Link>
            <Button variant="danger" onClick={() => { if (confirm(t('reset_confirm'))) void resetDemo(); }}>{t('reset_local')}</Button>
          </div>
        </div>
        <p className="fine-print">{t('settings_local_note')} {t('settings_server_note')}</p>
      </Card>

      <TourDialog
        open={teacherTour.open}
        title={teacherTour.title}
        intro={teacherTour.intro}
        steps={teacherTour.steps}
        onClose={teacherTour.close}
        onFinish={teacherTour.finish}
      />
    </div>
  );
}
