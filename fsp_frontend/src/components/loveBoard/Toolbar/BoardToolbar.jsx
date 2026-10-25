import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Icon from '../../Icon';

// One action in the ink pill: a white disc holding the icon, plus a label.
function ToolbarButton({ label, active, onClick, children }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      whileTap={{ scale: 0.94 }}
      className="lb-focus flex min-h-12 shrink-0 cursor-pointer appearance-none items-center gap-2 rounded-full border-0 bg-transparent py-0 pr-3 pl-1.5 text-[15px] font-extrabold text-(--white) transition-colors hover:bg-(--white)/10 sm:pr-4"
    >
      <span
        className={`flex size-[34px] shrink-0 items-center justify-center rounded-full text-(--ink) ${
          active ? 'bg-(--citrus) text-(--on-bright) [--icon-ink:var(--on-bright)]' : 'bg-(--white)'
        }`}
      >
        {children}
      </span>
      <span>{label}</span>
    </motion.button>
  );
}

// The three main actions only. Everything else (layers, archive, favorites, zoom, undo...) is in
// the "More" menu in the header.
export default function BoardToolbar({ onWriteLetter, stickerLibraryOpen, onToggleStickerLibrary, searchOpen, onToggleSearch }) {
  return (
    <motion.div
      role="toolbar"
      aria-label="Board actions"
      className="fixed bottom-4 left-1/2 z-[110] flex w-max max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center justify-center gap-1 rounded-full bg-(--ink) p-2 shadow-[4px_4px_0_var(--sea)] sm:bottom-6 sm:gap-1.5"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 24 }}
    >
      <button
        type="button"
        onClick={onWriteLetter}
        aria-label="Write a letter"
        className="lb-focus flex min-h-12 shrink-0 cursor-pointer appearance-none items-center gap-2 rounded-full border-2 border-solid border-(--white) bg-(--tomato) py-0 pr-4 pl-2.5 text-base font-extrabold text-(--on-tomato) sm:pr-5"
      >
        <Icon name="envelope" size={30} />
        <span className="hidden min-[420px]:inline">Write a letter</span>
        <span className="min-[420px]:hidden">Write</span>
      </button>

      <ToolbarButton label="Stickers" active={stickerLibraryOpen} onClick={onToggleStickerLibrary}>
        <Icon name="sparkle" size={26} />
      </ToolbarButton>
      <ToolbarButton label="Search" active={searchOpen} onClick={onToggleSearch}>
        <Search size={18} strokeWidth={2.8} aria-hidden="true" />
      </ToolbarButton>
    </motion.div>
  );
}
