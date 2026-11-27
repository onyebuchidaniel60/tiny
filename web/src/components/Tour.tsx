import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { useI18n } from '../i18n';

export interface TourStep {
  title: string;
  body: string;
}

export function useTourFlag(storageKey: string) {
  const [done, setDone] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });
  const complete = useCallback(() => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // Completion still updates in memory.
    }
    setDone(true);
  }, [storageKey]);
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore restricted storage.
    }
    setDone(false);
  }, [storageKey]);
  return { done, complete, reset };
}

interface TourDialogProps {
  open: boolean;
  title: string;
  intro: string;
  steps: TourStep[];
  onClose: () => void;
  onFinish: () => void;
  icon?: ReactNode;
}

export function TourDialog({ open, title, intro, steps, onClose, onFinish, icon }: TourDialogProps) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) {
      setIndex(0);
      return;
    }
    previousFocus.current = document.activeElement;
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    first?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setIndex((value) => Math.min(value + 1, steps.length - 1));
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIndex((value) => Math.max(value - 1, 0));
      }
      if (event.key === 'Tab' && dialog) {
        const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
        if (focusable.length === 0) return;
        const firstItem = focusable[0];
        const lastItem = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === firstItem) {
          event.preventDefault();
          lastItem.focus();
        } else if (!event.shiftKey && document.activeElement === lastItem) {
          event.preventDefault();
          firstItem.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus();
    };
  }, [onClose, open, steps.length]);

  if (!open) return null;
  const step = steps[index];
  const last = index === steps.length - 1;

  return (
    <div className="tour-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="tour-dialog" role="dialog" aria-modal="true" aria-labelledby="tour-title" ref={dialogRef}>
        <header className="tour-head">
          <div className="tour-icon" aria-hidden="true">{icon ?? <Icon name="spark" size={22} />}</div>
          <div>
            <div className="eyebrow">{t('help_tours')}</div>
            <h2 id="tour-title">{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t('tour_close')}>
            <Icon name="close" size={18} />
          </button>
        </header>
        {index === 0 && intro && <p className="tour-intro">{intro}</p>}
        <div className="tour-body" aria-live="polite">
          <div className="tour-step-label">{t('tour_step_of', { current: index + 1, total: steps.length })}</div>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </div>
        <div className="tour-progress" aria-hidden="true">
          {steps.map((_, position) => <span key={position} className={position === index ? 'on' : position < index ? 'past' : ''} />)}
        </div>
        <footer className="tour-foot">
          <button type="button" className="button button-ghost" onClick={onClose}>{t('tour_skip')}</button>
          <div className="tour-nav">
            <button type="button" className="button button-secondary" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
              {t('tour_previous')}
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                if (last) {
                  onFinish();
                } else {
                  setIndex((value) => value + 1);
                }
              }}
            >
              {last ? t('tour_finish') : t('tour_next')} <Icon name="arrow" size={16} />
            </button>
          </div>
        </footer>
        <p className="tour-hint">{t('tour_keyboard_hint')}</p>
      </div>
    </div>
  );
}
