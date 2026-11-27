import { useMemo, useState } from 'react';
import { useI18n } from './i18n';
import { useTourFlag, type TourStep } from './components/Tour';

export const TEACHER_TOUR_KEY = 'tiny-tour-teacher-v1';
export const GUARDIAN_TOUR_KEY = 'tiny-tour-guardian-v1';

export function useTeacherTour() {
  const { t } = useI18n();
  const flag = useTourFlag(TEACHER_TOUR_KEY);
  const [open, setOpen] = useState(false);
  const steps = useMemo<TourStep[]>(() => Array.from({ length: 10 }, (_, index) => ({
    title: t(`tour_step_${index + 1}_title` as never),
    body: t(`tour_step_${index + 1}_body` as never),
  })), [t]);
  return {
    ...flag,
    open,
    steps,
    title: t('tour_teacher_title'),
    intro: t('tour_teacher_intro'),
    start: () => setOpen(true),
    close: () => { flag.complete(); setOpen(false); },
    finish: () => { flag.complete(); setOpen(false); },
    replay: () => setOpen(true),
  };
}

export function useGuardianTour() {
  const { t } = useI18n();
  const flag = useTourFlag(GUARDIAN_TOUR_KEY);
  const [open, setOpen] = useState(false);
  const steps = useMemo<TourStep[]>(() => Array.from({ length: 4 }, (_, index) => ({
    title: t(`tour_guardian_step_${index + 1}_title` as never),
    body: t(`tour_guardian_step_${index + 1}_body` as never),
  })), [t]);
  return {
    ...flag,
    open,
    steps,
    title: t('tour_guardian_title'),
    intro: t('tour_guardian_intro'),
    start: () => setOpen(true),
    close: () => { flag.complete(); setOpen(false); },
    finish: () => { flag.complete(); setOpen(false); },
    replay: () => setOpen(true),
  };
}
