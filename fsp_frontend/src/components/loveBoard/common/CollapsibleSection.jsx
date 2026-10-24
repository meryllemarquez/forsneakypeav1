import { useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function CollapsibleSection({ title, icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-solid border-(--ink) bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="lb-focus flex min-h-11 w-full cursor-pointer appearance-none items-center gap-2.5 border-0 bg-transparent px-3.5 py-1.5 text-left text-(--ink) transition hover:bg-(--sea-tint)"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--gelato-tint)">{icon}</span>
        <span className="flex-1 text-sm font-extrabold">{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} strokeWidth={2.6} aria-hidden="true" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-0 border-t-2 border-solid border-(--ink) px-3.5 py-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
