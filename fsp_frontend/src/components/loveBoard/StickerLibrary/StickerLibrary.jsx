import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../Icon';
import { DrawerPanel, Chip } from '../common/lbUi';
import { STICKER_GROUPS, stickerValue } from '../../../constants/loveBoardCatalog';

const ALL = 'all';

export default function StickerLibrary({ open, onAdd, onClose }) {
  const [activeGroup, setActiveGroup] = useState(ALL);

  const visibleIcons =
    activeGroup === ALL ? STICKER_GROUPS.flatMap((g) => g.icons) : STICKER_GROUPS.find((g) => g.id === activeGroup)?.icons || [];

  return (
    <DrawerPanel open={open} onClose={onClose} eyebrow="decorate mode" title="Sticker Library">
      <p className="m-0 px-5 pb-1 text-sm text-(--ink-soft)">
        Tap a sticker to drop it onto the board, then drag, rotate, resize or lock it in place.
      </p>

      <div className="flex gap-2 overflow-x-auto px-5 py-2" role="group" aria-label="Sticker groups">
        <Chip active={activeGroup === ALL} onClick={() => setActiveGroup(ALL)} className="shrink-0">
          All
        </Chip>
        {STICKER_GROUPS.map((group) => (
          <Chip key={group.id} active={activeGroup === group.id} onClick={() => setActiveGroup(group.id)} className="shrink-0">
            {group.label}
          </Chip>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-3 content-start gap-3 overflow-y-auto p-5">
        {visibleIcons.map((name) => {
          const label = name.charAt(0).toUpperCase() + name.slice(1);
          return (
            <motion.button
              key={name}
              type="button"
              onClick={() => onAdd(stickerValue(name))}
              whileHover={{ y: -3, rotate: 3 }}
              whileTap={{ scale: 0.92 }}
              className="lb-focus flex h-[84px] shrink-0 cursor-pointer appearance-none items-center justify-center rounded-2xl border-2 border-solid border-(--outline) bg-(--paper) p-2 transition-colors hover:bg-(--gelato-tint)"
              aria-label={`Add sticker: ${label}`}
              title={label}
            >
              <span data-theme="light" className="contents"><Icon name={name} size={60} sticker /></span>
            </motion.button>
          );
        })}
      </div>
    </DrawerPanel>
  );
}
