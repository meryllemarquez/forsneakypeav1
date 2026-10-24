import { BringToFront, SendToBack, Lock } from 'lucide-react';
import Icon from '../../Icon';
import { DrawerPanel, RoundButton } from '../common/lbUi';
import { LbPaperThumb } from '../common/lbGraphics';

export default function LayerPanel({ open, items = [], onClose, onSelect, onBringToFront, onSendBackward }) {
  return (
    <DrawerPanel open={open} onClose={onClose} eyebrow="stacking order" title="Layers">
      <p className="m-0 px-5 pb-1 text-sm text-(--ink-soft)">
        Front-most first. Select an item to jump to it, or reorder it in the stack.
      </p>

      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-8 text-center text-(--ink-soft)">
            <Icon name="envelope" size={56} sticker tilt={-6} />
            <p className="m-0 text-sm font-bold">Nothing on the board yet.</p>
          </div>
        )}

        <ul className="m-0 space-y-2.5 p-0 list-none">
          {items.map((item) => (
            <li
              key={`${item.type}-${item.id}`}
              className="flex items-center gap-2 rounded-2xl border-2 border-solid border-(--ink) bg-(--paper) p-2"
            >
              <button
                type="button"
                onClick={() => onSelect?.(item)}
                className="lb-focus flex min-h-11 min-w-0 flex-1 cursor-pointer appearance-none items-center gap-2.5 rounded-xl border-0 bg-transparent p-0 text-left text-(--ink)"
              >
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-solid border-(--ink) bg-white">
                  {item.icon ? <Icon name={item.icon} size={30} /> : <LbPaperThumb value={item.paper} size={40} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 truncate text-sm font-extrabold capitalize">
                    {item.label}
                    {item.locked && <Lock size={14} className="shrink-0" aria-label="Locked" />}
                  </span>
                  <span className="block text-xs font-bold text-(--ink-muted) uppercase">
                    {item.type} · z{item.zIndex}
                  </span>
                </span>
              </button>

              <div className="flex shrink-0 gap-1">
                <RoundButton label={`Bring ${item.label} to front`} onClick={() => onBringToFront?.(item)}>
                  <BringToFront size={18} strokeWidth={2.4} aria-hidden="true" />
                </RoundButton>
                <RoundButton label={`Send ${item.label} backward`} onClick={() => onSendBackward?.(item)}>
                  <SendToBack size={18} strokeWidth={2.4} aria-hidden="true" />
                </RoundButton>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DrawerPanel>
  );
}
