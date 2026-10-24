import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useIsMobile } from '../../../hooks/useIsMobile';

// Small building blocks shared by the Love Board panels (Tailwind, on the shared design tokens).

export const inputClass =
  'lb-focus min-h-11 w-full rounded-2xl border-2 border-solid border-(--ink) bg-white px-4 text-base text-(--ink) placeholder:text-(--ink-muted)';

export const labelClass = 'mb-1.5 block text-sm font-extrabold text-(--ink)';

export function Chip({ active, onClick, children, className = '', ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={`lb-focus inline-flex min-h-11 cursor-pointer appearance-none items-center gap-1.5 rounded-full border-2 border-solid border-(--ink) px-4 text-sm font-extrabold text-(--ink) transition ${
        active ? 'bg-(--citrus)' : 'bg-white hover:bg-(--sea-tint)'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// variant: primary (tomato, the one "do it" action) | secondary (white)
export function PillButton({ variant = 'secondary', className = '', children, ...rest }) {
  const look =
    variant === 'primary'
      ? 'bg-(--tomato) text-white shadow-[4px_4px_0_var(--ink)] hover:not-disabled:-translate-x-px hover:not-disabled:-translate-y-px'
      : 'bg-white text-(--ink) hover:not-disabled:bg-(--sea-tint)';
  return (
    <button
      type="button"
      className={`lb-focus inline-flex min-h-11 cursor-pointer appearance-none items-center justify-center gap-2 rounded-full border-2 border-solid border-(--ink) px-5 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${look} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// Round 44px icon button. `label` is required: it is the accessible name.
export function RoundButton({ label, children, className = '', ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`lb-focus inline-flex size-11 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-full border-2 border-solid border-(--ink) bg-white p-0 text-(--ink) transition hover:bg-(--sea-tint) disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Side drawer (bottom sheet on phones) used by the sticker library, layers and archive.
 * Not modal: the board stays usable behind it (decorate mode needs that). Escape closes it.
 */
export function DrawerPanel({ open, onClose, side = 'right', eyebrow, title, children }) {
  const isMobile = useIsMobile();
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented) onCloseRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous instanceof HTMLElement && document.contains(previous)) previous.focus();
    };
  }, [open]);

  const sideClass =
    side === 'left'
      ? 'top-0 left-0 h-full max-w-sm border-r-2 shadow-[6px_0_0_var(--sea)]'
      : 'top-0 right-0 h-full max-w-sm border-l-2 shadow-[-6px_0_0_var(--sea)]';
  const hidden = side === 'left' ? '-100%' : '100%';

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="dialog"
          aria-label={title}
          className={`fixed z-[120] flex w-full flex-col border-solid border-(--ink) bg-white text-(--ink) ${
            isMobile ? 'inset-x-0 bottom-0 max-h-[75vh] rounded-t-[28px] border-t-2 shadow-[0_-6px_0_var(--sea)]' : sideClass
          }`}
          initial={isMobile ? { y: '100%' } : { x: hidden }}
          animate={isMobile ? { y: 0 } : { x: 0 }}
          exit={isMobile ? { y: '100%' } : { x: hidden }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
            <div>
              {eyebrow && <p className="m-0 font-caveat text-2xl leading-none font-bold text-(--tomato)">{eyebrow}</p>}
              <h2 className="m-0 font-serif text-2xl leading-tight font-extrabold">{title}</h2>
            </div>
            <RoundButton ref={closeRef} label={`Close ${title.toLowerCase()}`} onClick={onClose}>
              <X size={20} strokeWidth={2.8} aria-hidden="true" />
            </RoundButton>
          </div>
          {children}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
