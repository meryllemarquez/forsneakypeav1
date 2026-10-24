import { useEffect } from 'react';

// Shared by every overlay (Modal, Lightbox...): the page stays locked until the last one closes.
let lockCount = 0;

export function lockScroll() {
  if (lockCount++ === 0) document.body.style.overflow = 'hidden';
}

export function unlockScroll() {
  if (--lockCount === 0) document.body.style.overflow = '';
}

export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    lockScroll();
    return unlockScroll;
  }, [active]);
}
