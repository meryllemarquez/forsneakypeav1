import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { lockScroll, unlockScroll } from '../../../hooks/useScrollLock';
import styles from './Modal.module.css';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Open modals, top of the stack last: only the top one reacts to Escape / Tab.
const stack = [];

/**
 * The one dialog shell for the whole app: backdrop, Escape, focus trap + restore,
 * scroll lock, aria wiring and the bubbly card look.
 *
 * size       sm | md | lg | xl
 * placement  'center' (default) or 'right' (a slide-over drawer)
 * locked  blocks Escape / backdrop / close button (for example while a request is running)
 * role    'dialog' (default) or 'alertdialog'
 * title   renders a heading and labels the dialog; omit it and pass `ariaLabel` instead
 */
export default function Modal({
  open,
  onClose,
  title,
  ariaLabel,
  size = 'md',
  placement = 'center',
  locked = false,
  role = 'dialog',
  hideClose = false,
  footer,
  className = '',
  bodyClassName = '',
  children,
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const live = useRef({ onClose, locked });
  useEffect(() => {
    live.current = { onClose, locked };
  });

  useEffect(() => {
    if (!open) return undefined;
    const token = {};
    stack.push(token);
    lockScroll();
    const previous = document.activeElement;

    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel || panel.contains(document.activeElement)) return;
      const first = panel.querySelector('[data-autofocus]') || panel.querySelector(FOCUSABLE);
      (first || panel).focus();
    });

    const onKey = (e) => {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === 'Escape') {
        if (!live.current.locked) {
          e.preventDefault();
          live.current.onClose?.();
        }
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll(FOCUSABLE)];
        if (items.length === 0) {
          e.preventDefault();
          panelRef.current.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(token), 1);
      unlockScroll();
      if (previous instanceof HTMLElement && document.contains(previous)) previous.focus();
    };
  }, [open]);

  const isDrawer = placement === 'right';

  const tryClose = () => {
    if (!locked) onClose?.();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`${styles.backdrop} ${isDrawer ? styles.backdropRight : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) tryClose();
          }}
        >
          <motion.div
            ref={panelRef}
            className={`${styles.panel} ${styles[size]} ${isDrawer ? styles.drawer : ''} ${className}`}
            role={role}
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : ariaLabel}
            tabIndex={-1}
            initial={isDrawer ? { x: '100%' } : { opacity: 0, y: 22, scale: 0.96 }}
            animate={isDrawer ? { x: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isDrawer ? { x: '100%' } : { opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: isDrawer ? 0.34 : 0.26, ease: [0.16, 1, 0.3, 1] }}
          >
            {(title || !hideClose) && (
              <div className={styles.header}>
                {title ? (
                  <h2 id={titleId} className={styles.title}>
                    {title}
                  </h2>
                ) : (
                  <span />
                )}
                {!hideClose && (
                  <button type="button" className={styles.close} onClick={tryClose} disabled={locked} aria-label="Close">
                    <X size={20} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
            <div className={`${styles.body} ${bodyClassName}`}>{children}</div>
            {footer && <div className={styles.footer}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
