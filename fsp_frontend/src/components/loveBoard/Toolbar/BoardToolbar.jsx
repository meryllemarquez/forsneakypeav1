import { motion } from 'framer-motion';
import { Mail, Sparkles, ImagePlus, Search, Heart, Archive, Scissors, Layers } from 'lucide-react';

function ToolbarButton({ label, Icon, active, disabled, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `${label} (coming soon)` : label}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      className={`flex shrink-0 appearance-none flex-col items-center gap-1 rounded-xl border-0 px-3 py-2 text-[10.5px] font-medium tracking-wide transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-30 ${
        active ? 'bg-[#a8391f] text-white shadow-inner' : 'bg-transparent text-[#f4ece0]/85 hover:bg-white/10 hover:text-[#f4ece0] disabled:hover:bg-transparent'
      }`}
    >
      <Icon size={18} strokeWidth={1.9} className={active && label === 'Favorites' ? 'fill-white/20' : ''} />
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
      className="fixed bottom-5 left-1/2 z-[110] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#2c2016]/85 px-2 py-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 24 }}
    >
      <ToolbarButton label="Add Letter" Icon={Mail} onClick={onWriteLetter} />
      <ToolbarButton label="Add Sticker" Icon={Sparkles} active={stickerLibraryOpen} onClick={onToggleStickerLibrary} />
      <ToolbarButton label="Upload Photo" Icon={ImagePlus} disabled />
      <div className="mx-1 h-8 w-px shrink-0 bg-white/15" />
      <ToolbarButton label="Search" Icon={Search} active={searchOpen} onClick={onToggleSearch} />
      <ToolbarButton label="Favorites" Icon={Heart} active={favoritesOnly} onClick={onToggleFavorites} />
      <ToolbarButton label="Archived" Icon={Archive} onClick={onOpenArchive} />
      <ToolbarButton label="Layers" Icon={Layers} active={layersOpen} onClick={onToggleLayers} />
      <div className="mx-1 h-8 w-px shrink-0 bg-white/15" />
      <ToolbarButton label="Decorate" Icon={Scissors} active={decorateMode} onClick={onToggleDecorateMode} />
    </motion.div>
  );
}
