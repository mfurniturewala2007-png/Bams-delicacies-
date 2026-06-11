import { useEffect } from 'react';

// ── Global scroll-lock reference counter ───────────────────────────────────
// Using a module-level counter means multiple components can call useScrollLock
// simultaneously without clobbering each other's cleanup.
let lockCount = 0;
let savedScrollY = 0;

function applyLock() {
  if (lockCount === 0) {
    // Save position and lock body before incrementing
    savedScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = '100%';
  }
  lockCount++;
}

function releaseLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    // Restore body and scroll position
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
  }
}

export const useScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;
    applyLock();
    return () => {
      releaseLock();
    };
  }, [locked]);
};

export default useScrollLock;
