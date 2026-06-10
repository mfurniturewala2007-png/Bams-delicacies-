import { useEffect } from 'react';

export const useScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;

    // Save current scroll position
    const scrollY = window.scrollY;

    // Get original styles to restore them correctly
    const originalStylePosition = document.body.style.position;
    const originalStyleTop = document.body.style.top;
    const originalStyleWidth = document.body.style.width;
    const originalStyleOverflowY = document.body.style.overflowY;

    // Lock scroll
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflowY = 'scroll';

    return () => {
      // Restore styles
      document.body.style.position = originalStylePosition;
      document.body.style.top = originalStyleTop;
      document.body.style.width = originalStyleWidth;
      document.body.style.overflowY = originalStyleOverflowY;

      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
};

export default useScrollLock;
