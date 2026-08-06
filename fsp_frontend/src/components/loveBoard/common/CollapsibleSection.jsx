import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function CollapsibleSection({ title, icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-[#e7d8c2] bg-white/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full appearance-none items-center gap-2 border-0 bg-transparent px-3.5 py-2.5 text-left transition hover:bg-black/[0.02]"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#f3e3cf] text-[#a8391f]">{icon}</span>
        <span className="flex-1 text-xs font-semibold tracking-wide text-[#3a2b1e] uppercase">{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-[#8a7360]">
          <ChevronDown size={15} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#e7d8c2] px-3.5 py-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
