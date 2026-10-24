import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Icon from '../../Icon';
import Note from '../Note/Note';
import Sticker from '../Sticker/Sticker';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../../../constants/loveBoardConstants';

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.15;

function byFilename(list = []) {
  return Object.fromEntries(list.map((item) => [item.filename, item.url]));
}

const CorkBoard = forwardRef(function CorkBoard(
  {
    notes,
    stickers,
    assets,
    decorateMode,
    activeTool = 'select',
    selectedStickerId,
    onSelectSticker,
    onOpenNote,
    onNoteDragEnd,
    onBringNoteToFront,
    onStickerDragEnd,
    onBringStickerToFront,
    onSendStickerBackward,
    onStickerChange,
    onStickerTransformStart,
    onStickerTransformEnd,
    onDuplicateSticker,
    onToggleStickerLock,
    onDeleteSticker,
    onZoomChange,
    topNoteId,
    noteExitReasons,
  },
  ref
) {
  const scrollRef = useRef(null);
  const innerRef = useRef(null);
  const panStateRef = useRef(null);
  const pendingScrollRef = useRef(null);
  const [autoFitScale, setAutoFitScale] = useState(1);
  const [zoomOverride, setZoomOverride] = useState(null);
  const [smoothZoom, setSmoothZoom] = useState(true);

  const panMode = activeTool === 'hand';
  const scale = zoomOverride ?? autoFitScale;

  // Kept fresh in refs so the native (non-React) pinch listeners below —
  // attached once — always see current values without stale closures.
  const scaleStateRef = useRef({ zoomOverride, autoFitScale });
  useEffect(() => {
    scaleStateRef.current = { zoomOverride, autoFitScale };
  });

  // Zoom-to-fit by default: the board is a fixed logical BOARD_WIDTH x
  // BOARD_HEIGHT canvas that scales down (never up, to keep the background
  // crisp) to always fit inside its container, centered by the flex
  // wrapper below. A manual zoomOverride (set via wheel/pinch/toolbar) opts
  // out of auto-fit and switches the container to a scrollable/pannable view.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return undefined;

    const updateScale = () => {
      const { clientWidth, clientHeight } = container;
      if (!clientWidth || !clientHeight) return;
      const nextScale = Math.min(clientWidth / BOARD_WIDTH, clientHeight / BOARD_HEIGHT, 1);
      setAutoFitScale(Math.max(nextScale, 0.1));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    onZoomChange?.(Math.round(scale * 100));
  }, [scale, onZoomChange]);

  // Applies any scroll position queued by zoomTo synchronously after the
  // DOM reflects the new scale/overflow mode but before paint, so there's
  // no visible flash at the wrong scroll offset.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    const pending = pendingScrollRef.current;
    if (!container || !pending) return;
    pendingScrollRef.current = null;
    const maxLeft = Math.max(0, BOARD_WIDTH * scale - container.clientWidth);
    const maxTop = Math.max(0, BOARD_HEIGHT * scale - container.clientHeight);
    container.scrollLeft = Math.min(Math.max(0, pending.left), maxLeft);
    container.scrollTop = Math.min(Math.max(0, pending.top), maxTop);
  }, [scale]);

  // Anchor-preserving zoom: whatever board point sits under (anchorClientX,
  // anchorClientY) stays under that same screen point after the scale
  // change, instead of always recentering on the board's middle.
  const zoomTo = useCallback((nextScale, anchorClientX, anchorClientY, { animate = false } = {}) => {
    const container = scrollRef.current;
    if (!container) return;
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextScale));
    const { zoomOverride: currentOverride, autoFitScale: currentAutoFit } = scaleStateRef.current;
    const currentScale = currentOverride ?? currentAutoFit;
    if (Math.abs(clamped - currentScale) < 0.001) return;

    const rect = container.getBoundingClientRect();
    const vx = (anchorClientX ?? rect.left + rect.width / 2) - rect.left;
    const vy = (anchorClientY ?? rect.top + rect.height / 2) - rect.top;

    // Auto-fit mode has no real scroll offset (it's centered via flexbox) —
    // compute the equivalent offset so the anchor math has a valid starting
    // point when a gesture first switches into manual zoom.
    const currentScrollLeft =
      currentOverride == null ? Math.max(0, (BOARD_WIDTH * currentScale - container.clientWidth) / 2) : container.scrollLeft;
    const currentScrollTop =
      currentOverride == null ? Math.max(0, (BOARD_HEIGHT * currentScale - container.clientHeight) / 2) : container.scrollTop;

    pendingScrollRef.current = {
      left: (currentScrollLeft + vx) * (clamped / currentScale) - vx,
      top: (currentScrollTop + vy) * (clamped / currentScale) - vy,
    };
    setSmoothZoom(animate);
    setZoomOverride(clamped);
  }, []);
  const zoomToRef = useRef(zoomTo);
  useEffect(() => {
    zoomToRef.current = zoomTo;
  });

  useImperativeHandle(ref, () => ({
    resetView: () => {
      pendingScrollRef.current = null;
      setSmoothZoom(true);
      setZoomOverride(null);
    },
    zoomIn: () => zoomTo((scaleStateRef.current.zoomOverride ?? scaleStateRef.current.autoFitScale) + ZOOM_STEP, undefined, undefined, { animate: true }),
    zoomOut: () => zoomTo((scaleStateRef.current.zoomOverride ?? scaleStateRef.current.autoFitScale) - ZOOM_STEP, undefined, undefined, { animate: true }),
  }));

  // Ctrl/Cmd+wheel (and trackpad pinch, which browsers report as ctrl+wheel)
  // zooms anchored at the cursor. Plain wheel is left alone so native
  // scrolling still works once the board is in scrollable manual-zoom mode.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return undefined;

    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const currentScale = scaleStateRef.current.zoomOverride ?? scaleStateRef.current.autoFitScale;
      const factor = Math.exp(-e.deltaY * 0.0025);
      zoomToRef.current(currentScale * factor, e.clientX, e.clientY, { animate: false });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  // Two-finger pinch zoom, anchored at the gesture midpoint. Tracked with
  // native listeners (not React's synthetic drag) so it can coexist cleanly
  // with per-object drag gestures, which stop propagation before reaching
  // the board container.
  const cancelPanRef = useRef(() => {});
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return undefined;
    const pointers = new Map();
    let pinch = null;

    const onPointerDown = (e) => {
      if (e.pointerType !== 'touch') return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        cancelPanRef.current();
        const [a, b] = Array.from(pointers.values());
        pinch = {
          startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          startScale: scaleStateRef.current.zoomOverride ?? scaleStateRef.current.autoFitScale,
          midClientX: (a.x + b.x) / 2,
          midClientY: (a.y + b.y) / 2,
        };
      }
    };
    const onPointerMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && pinch) {
        e.preventDefault();
        const [a, b] = Array.from(pointers.values());
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        zoomToRef.current(pinch.startScale * (dist / pinch.startDist), pinch.midClientX, pinch.midClientY, { animate: false });
      }
    };
    const onPointerEnd = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove, { passive: false });
    container.addEventListener('pointerup', onPointerEnd);
    container.addEventListener('pointercancel', onPointerEnd);
    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerEnd);
      container.removeEventListener('pointercancel', onPointerEnd);
    };
  }, []);

  const handlePanPointerMove = useCallback((e) => {
    const pan = panStateRef.current;
    const container = scrollRef.current;
    if (!pan || !container) return;
    const maxLeft = Math.max(0, BOARD_WIDTH * (zoomOverride ?? autoFitScale) - container.clientWidth);
    const maxTop = Math.max(0, BOARD_HEIGHT * (zoomOverride ?? autoFitScale) - container.clientHeight);
    container.scrollLeft = Math.min(maxLeft, Math.max(0, pan.startScrollLeft - (e.clientX - pan.startX)));
    container.scrollTop = Math.min(maxTop, Math.max(0, pan.startScrollTop - (e.clientY - pan.startY)));
  }, [zoomOverride, autoFitScale]);

  const handlePanPointerUp = useCallback(() => {
    panStateRef.current = null;
    window.removeEventListener('pointermove', handlePanPointerMove);
    window.removeEventListener('pointerup', handlePanPointerUp);
  }, [handlePanPointerMove]);

  useEffect(() => {
    cancelPanRef.current = handlePanPointerUp;
  }, [handlePanPointerUp]);

  const handlePanPointerDown = (e) => {
    // Desktop: only the explicit Hand tool pans by dragging empty board
    // space. Touch: one-finger drag on empty space always pans (there's no
    // separate "tool" concept on touch, and objects stop propagation
    // before this fires, so it never fights per-object dragging).
    if (!panMode && e.pointerType !== 'touch') return;
    const container = scrollRef.current;
    if (!container) return;
    panStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: container.scrollLeft,
      startScrollTop: container.scrollTop,
    };
    window.addEventListener('pointermove', handlePanPointerMove);
    window.addEventListener('pointerup', handlePanPointerUp);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePanPointerMove);
      window.removeEventListener('pointerup', handlePanPointerUp);
    };
  }, [handlePanPointerMove, handlePanPointerUp]);

  const papers = useMemo(() => byFilename(assets?.papers), [assets]);
  const pins = useMemo(() => byFilename(assets?.pins), [assets]);
  const tapes = useMemo(() => byFilename(assets?.tapes), [assets]);
  const stickerImages = useMemo(() => byFilename(assets?.stickers), [assets]);

  return (
    <div
      ref={scrollRef}
      className={`relative flex h-full w-full items-center justify-center ${zoomOverride == null ? 'overflow-hidden' : 'overflow-auto'}`}
      style={{ cursor: panMode ? 'grab' : 'default', touchAction: 'none', overscrollBehavior: 'contain' }}
      onPointerDown={handlePanPointerDown}
      onClick={() => decorateMode && onSelectSticker?.(null)}
    >
      <div
        ref={innerRef}
        className="lb-board relative shrink-0"
        style={{
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: zoomOverride == null ? 'center' : 'top left',
          transition: smoothZoom ? 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        }}
      >
        <AnimatePresence>
          {stickers.map((sticker) => (
            <Sticker
              key={sticker.id}
              sticker={sticker}
              imageUrl={stickerImages[sticker.image]}
              decorateMode={decorateMode}
              panMode={panMode}
              isSelected={selectedStickerId === sticker.id}
              boardScale={scale}
              onSelect={onSelectSticker}
              onDragEnd={onStickerDragEnd}
              onBringToFront={onBringStickerToFront}
              onSendBackward={onSendStickerBackward}
              onChange={onStickerChange}
              onTransformStart={onStickerTransformStart}
              onTransformEnd={onStickerTransformEnd}
              onDuplicate={onDuplicateSticker}
              onToggleLock={onToggleStickerLock}
              onDelete={onDeleteSticker}
            />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {notes.map((note) => (
            <Note
              key={note.id}
              note={note}
              paperUrl={papers[note.paperImage]}
              pins={pins}
              tapes={tapes}
              boardScale={scale}
              panMode={panMode}
              isTop={topNoteId === note.id}
              exitReason={noteExitReasons?.[note.id]}
              onOpen={onOpenNote}
              onDragEnd={onNoteDragEnd}
              onBringToFront={onBringNoteToFront}
            />
          ))}
        </AnimatePresence>

        {notes.length === 0 && stickers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 rounded-[48px] border-4 border-solid border-(--ink) bg-white px-16 py-12 text-center shadow-[10px_10px_0_var(--citrus)]">
              <Icon name="envelope" size={160} sticker tilt={-6} />
              <p className="m-0 font-caveat text-6xl leading-none font-bold text-(--tomato)">Pin your first letter to the board</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default CorkBoard;
