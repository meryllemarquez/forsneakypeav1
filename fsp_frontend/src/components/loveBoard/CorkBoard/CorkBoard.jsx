import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Icon from '../../Icon';
import Note from '../Note/Note';
import Sticker from '../Sticker/Sticker';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../../../constants/loveBoardConstants';

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.15;

const CorkBoard = forwardRef(function CorkBoard(
  {
    notes,
    stickers,
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
  // crisp) to always fit inside its container. A sizing wrapper takes the
  // board's *scaled* size and is centered with auto margins, so it stays
  // centered when it is smaller than the container and scrolls from its top
  // left edge when it is bigger. A manual zoomOverride (wheel/pinch/menu)
  // opts out of auto-fit and makes the container scrollable/pannable.
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

  // Where the (scaled) board's top left sits inside the container when it is smaller than it.
  const centeringOffset = (container, s) => ({
    left: Math.max(0, (container.clientWidth - BOARD_WIDTH * s) / 2),
    top: Math.max(0, (container.clientHeight - BOARD_HEIGHT * s) / 2),
  });

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
  const zoomTo = useCallback((nextScale, anchorClientX, anchorClientY) => {
    const container = scrollRef.current;
    if (!container) return;
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextScale));
    const { zoomOverride: currentOverride, autoFitScale: currentAutoFit } = scaleStateRef.current;
    const currentScale = currentOverride ?? currentAutoFit;
    if (Math.abs(clamped - currentScale) < 0.001) return;

    const rect = container.getBoundingClientRect();
    const vx = (anchorClientX ?? rect.left + rect.width / 2) - rect.left;
    const vy = (anchorClientY ?? rect.top + rect.height / 2) - rect.top;

    // The board point under the anchor, then the scroll that keeps it there at the new scale.
    const before = centeringOffset(container, currentScale);
    const after = centeringOffset(container, clamped);
    const boardX = (container.scrollLeft + vx - before.left) / currentScale;
    const boardY = (container.scrollTop + vy - before.top) / currentScale;

    pendingScrollRef.current = {
      left: boardX * clamped + after.left - vx,
      top: boardY * clamped + after.top - vy,
    };
    setZoomOverride(clamped);
  }, []);
  const zoomToRef = useRef(zoomTo);
  useEffect(() => {
    zoomToRef.current = zoomTo;
  });

  useImperativeHandle(ref, () => ({
    resetView: () => {
      pendingScrollRef.current = null;
      setZoomOverride(null);
    },
    zoomIn: () => zoomTo((scaleStateRef.current.zoomOverride ?? scaleStateRef.current.autoFitScale) + ZOOM_STEP),
    zoomOut: () => zoomTo((scaleStateRef.current.zoomOverride ?? scaleStateRef.current.autoFitScale) - ZOOM_STEP),
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
      zoomToRef.current(currentScale * factor, e.clientX, e.clientY);
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
        zoomToRef.current(pinch.startScale * (dist / pinch.startDist), pinch.midClientX, pinch.midClientY);
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


  return (
    <div
      ref={scrollRef}
      className={`relative flex h-full w-full ${zoomOverride == null ? 'overflow-hidden' : 'overflow-auto'}`}
      style={{ cursor: panMode ? 'grab' : 'default', touchAction: 'none', overscrollBehavior: 'contain' }}
      onPointerDown={handlePanPointerDown}
      onClick={() => decorateMode && onSelectSticker?.(null)}
    >
      <div className="relative m-auto shrink-0" style={{ width: BOARD_WIDTH * scale, height: BOARD_HEIGHT * scale }}>
      <div
        ref={innerRef}
        className="lb-board absolute top-0 left-0"
        style={{
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <AnimatePresence>
          {stickers.map((sticker) => (
            <Sticker
              key={sticker.id}
              sticker={sticker}
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
    </div>
  );
});

export default CorkBoard;
