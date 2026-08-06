import { useCallback, useEffect, useRef } from 'react';
import { useMotionValue } from 'framer-motion';

const TAP_THRESHOLD_PX = 4;

// Pointer-capture-based drag: the element stays pinned exactly under the
// cursor every frame (no Framer dragElastic rubber-banding, no momentum),
// and pointer capture means movement/up events keep arriving even if the
// pointer leaves the element mid-gesture — critical for fast mouse drags
// and for touch. `getScale` is read on every move so accuracy holds at any
// board zoom level.
//
// Tap-vs-drag is resolved here (by raw screen-pixel movement, not by
// listening for a separate browser `click`) because gating a click handler
// on React state set during pointerup is racy: the click event can fire
// before the state update the click handler reads has actually re-rendered.
export function useCanvasDrag({ getScale = () => 1, onDragStart, onDragEnd, onTap, disabled = false } = {}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const gestureRef = useRef(null);

  const endGesture = useCallback(() => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    gestureRef.current = null;
    const { target, pointerId, moveHandler, upHandler, cancelHandler } = gesture;
    target.removeEventListener('pointermove', moveHandler);
    target.removeEventListener('pointerup', upHandler);
    target.removeEventListener('pointercancel', cancelHandler);
    if (target.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId);
  }, []);

  useEffect(() => () => endGesture(), [endGesture]);

  const onPointerDown = useCallback(
    (e) => {
      if (disabled || (e.button != null && e.button !== 0)) return;
      e.stopPropagation();
      const target = e.currentTarget;
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      let started = false;

      const moveHandler = (moveEvent) => {
        if (!started && Math.hypot(moveEvent.clientX - startClientX, moveEvent.clientY - startClientY) >= TAP_THRESHOLD_PX) {
          started = true;
          onDragStart?.();
        }
        const scale = getScale();
        x.set((moveEvent.clientX - startClientX) / scale);
        y.set((moveEvent.clientY - startClientY) / scale);
      };

      const finish = (finalEvent) => {
        const scale = getScale();
        const dx = (finalEvent.clientX - startClientX) / scale;
        const dy = (finalEvent.clientY - startClientY) / scale;
        endGesture();
        x.set(0);
        y.set(0);
        if (started) {
          onDragEnd?.(dx, dy);
        } else {
          onTap?.();
        }
      };

      gestureRef.current = { target, pointerId: e.pointerId, moveHandler, upHandler: (ev) => finish(ev), cancelHandler: (ev) => finish(ev) };
      target.setPointerCapture?.(e.pointerId);
      target.addEventListener('pointermove', moveHandler);
      target.addEventListener('pointerup', gestureRef.current.upHandler);
      target.addEventListener('pointercancel', gestureRef.current.cancelHandler);
    },
    [disabled, getScale, onDragStart, onDragEnd, onTap, endGesture, x, y]
  );

  return { x, y, onPointerDown };
}
