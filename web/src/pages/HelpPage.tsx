import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, PageHeader } from '../components/ui';
import { TourDialog } from '../components/Tour';
import { useGuardianTour, useTeacherTour } from '../tours';
import { useI18n, type TranslationKey } from '../i18n';

const articles: Array<{ title: TranslationKey; body: TranslationKey; icon: Parameters<typeof Icon>[0]['name'] }> = [
  { title: 'help_getting_started', body: 'help_getting_started_body', icon: 'home' },
  { title: 'help_classes', body: 'help_classes_body', icon: 'classes' },
  { title: 'help_pupils', body: 'help_pupils_body', icon: 'people' },
  { title: 'help_guardians', body: 'help_guardians_body', icon: 'people' },
  { title: 'help_attendance', body: 'help_attendance_body', icon: 'attendance' },
  { title: 'help_lessons', body: 'help_lessons_body', icon: 'book' },
  { title: 'help_progress', body: 'help_progress_body', icon: 'check' },
  { title: 'help_messages', body: 'help_messages_body', icon: 'message' },
  { title: 'help_ai', body: 'help_ai_body', icon: 'spark' },
  { title: 'help_offline', body: 'help_offline_body', icon: 'offline' },
  { title: 'help_sync', body: 'help_sync_body', icon: 'sync' },
  { title: 'help_troubleshooting', body: 'help_troubleshooting_body', icon: 'shield' },
  { title: 'help_privacy', body: 'help_privacy_body', icon: 'shield' },
];

export function HelpPage() {
  const { t } = useI18n();
  const teacherTour = useTeacherTour();
  const guardianTour = useGuardianTour();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return articles;
    return articles.filter((article) => `${t(article.title)} ${t(article.body)}`.toLocaleLowerCase().includes(term));
  }, [query, t]);

  const guardianSteps = [1, 2, 3, 4].map((index) => ({
    title: t(`tour_guardian_step_${index}_title` as TranslationKey),
    body: t(`tour_guardian_step_${index}_body` as TranslationKey),
  }));

  return (
    <div className="page-stack help-page">
      <PageHeader
        eyebrow={t('help_centre')}
        title={t('help_title')}
        subtitle={t('help_subtitle')}
        actions={<Link to="/settings"><Button variant="secondary"><Icon name="settings" size={16} /> {t('nav_settings')}</Button></Link>}
      />

      <div className="help-layout">
        <div className="page-stack">
          <Card className="help-search-card">
            <label className="field">
              <span className="field-label">{t('help_search')}</span>
              <span className="search-box">
                <Icon name="search" size={18} />
                <input
                  type="search"
                  className="input"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('help_search_placeholder')}
                />
              </span>
            </label>
            <span className="help-count">{t('help_article_count', { count: filtered.length })}</span>
          </Card>

          {filtered.length === 0 ? (
            <Card><p className="muted">{t('help_no_results')}</p></Card>
          ) : (
            <div className="help-articles">
              {filtered.map((article) => (
                <Card key={article.title} className="help-article">
                  <span className="help-article-icon"><Icon name={article.icon} size={20} /></span>
                  <div>
                    <h3>{t(article.title)}</h3>
                    <p>{t(article.body)}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <aside className="page-stack help-aside">
          <Card className="help-tour-card">
            <div className="eyebrow">{t('help_tours')}</div>
            <h3>{t('help_tour_teacher')}</h3>
            <p className="muted">{t('help_tour_teacher_body')}</p>
            <Button onClick={teacherTour.replay}><Icon name="arrow" size={16} /> {t('teacher_tour_button')}</Button>
          </Card>

          <Card className="help-tour-card">
            <div className="eyebrow">{t('brand_guardian_sms')}</div>
            <h3>{t('help_tour_guardian')}</h3>
            <p className="muted">{t('help_tour_guardian_body')}</p>
            <Button variant="secondary" onClick={guardianTour.replay}><Icon name="message" size={16} /> {t('guardian_tour_button')}</Button>
            <div className="help-guide-steps">
              {guardianSteps.map((step, index) => (
                <details key={step.title} open={index === 0}>
                  <summary>{step.title}</summary>
                  <p>{step.body}</p>
                </details>
              ))}
            </div>
          </Card>

          <Card className="soft-card">
            <div className="eyebrow">{t('help_limitations')}</div>
            <p className="muted">{t('help_limitations_body')}</p>
          </Card>

          <Card className="soft-card">
            <div className="eyebrow">{t('help_contact')}</div>
            <p className="muted">{t('help_contact_body')}</p>
            <Link to="/settings" className="text-link">{t('privacy_setting')}</Link>
          </Card>
        </aside>
      </div>

      <TourDialog
        open={teacherTour.open}
        title={teacherTour.title}
        intro={teacherTour.intro}
        steps={teacherTour.steps}
        onClose={teacherTour.close}
        onFinish={teacherTour.finish}
      />
      <TourDialog
        open={guardianTour.open}
        title={guardianTour.title}
        intro={guardianTour.intro}
        steps={guardianTour.steps}
        onClose={guardianTour.close}
        onFinish={guardianTour.finish}
      />
    </div>
  );
}
