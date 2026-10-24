import { motion } from 'framer-motion';
import { Archive, Layers, Scissors, Search } from 'lucide-react';
import Icon from '../../Icon';

// One action in the ink pill: a white disc holding the icon, plus a label (hidden on phones).
function ToolbarButton({ label, active, disabled, onClick, children }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      title={disabled ? `${label} (coming soon)` : label}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      className="lb-focus flex min-h-12 shrink-0 cursor-pointer appearance-none items-center gap-2 rounded-full border-0 bg-transparent py-0 pr-2 pl-1.5 text-[15px] font-extrabold text-white transition-colors hover:not-disabled:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 sm:pr-4"
    >
      <span
        className={`flex size-[34px] shrink-0 items-center justify-center rounded-full text-(--ink) ${
          active ? 'bg-(--citrus)' : 'bg-white'
        }`}
      >
        {children}
      </span>
      <span className="hidden sm:block">{label}</span>
    </motion.button>
  );
}

export default function BoardToolbar({
  onWriteLetter,
  stickerLibraryOpen,
  onToggleStickerLibrary,
  searchOpen,
  onToggleSearch,
  favoritesOnly,
  onToggleFavorites,
  onOpenArchive,
  layersOpen,
  onToggleLayers,
  decorateMode,
  onToggleDecorateMode,
}) {
  return (
    <motion.div
      role="toolbar"
      aria-label="Board actions"
      className="fixed bottom-4 left-1/2 z-[110] grid w-max max-w-[calc(100vw-1rem)] -translate-x-1/2 grid-cols-4 justify-items-center gap-1 rounded-[28px] bg-(--ink) p-2 shadow-[4px_4px_0_var(--sea)] sm:bottom-6 sm:flex sm:items-center sm:justify-center sm:gap-1.5 sm:rounded-full"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 24 }}
    >
      <button
        type="button"
        onClick={onWriteLetter}
        aria-label="Write a letter"
        className="lb-focus flex min-h-12 shrink-0 cursor-pointer appearance-none items-center gap-2 rounded-full border-2 border-solid border-white bg-(--tomato) py-0 pr-3 pl-2.5 text-base font-extrabold text-white sm:pr-5"
      >
        <Icon name="envelope" size={30} />
        <span className="hidden sm:block">Write a letter</span>
      </button>

      <ToolbarButton label="Add Sticker" active={stickerLibraryOpen} onClick={onToggleStickerLibrary}>
        <Icon name="sparkle" size={26} />
      </ToolbarButton>
      <ToolbarButton label="Upload Photo" disabled>
        <Icon name="camera" size={26} />
      </ToolbarButton>
      <ToolbarButton label="Search" active={searchOpen} onClick={onToggleSearch}>
        <Search size={18} strokeWidth={2.8} aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton label="Favorites" active={favoritesOnly} onClick={onToggleFavorites}>
        <Icon name="heart" size={26} />
      </ToolbarButton>
      <ToolbarButton label="Archived" onClick={onOpenArchive}>
        <Archive size={18} strokeWidth={2.8} aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton label="Layers" active={layersOpen} onClick={onToggleLayers}>
        <Layers size={18} strokeWidth={2.8} aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton label="Decorate" active={decorateMode} onClick={onToggleDecorateMode}>
        <Scissors size={18} strokeWidth={2.8} aria-hidden="true" />
      </ToolbarButton>
    </motion.div>
  );
}
