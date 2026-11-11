import { useEffect } from 'react';

let openModalsCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  openModalsCount++;
  if (openModalsCount === 1) {
    originalOverflow = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width to prevent layout shift
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
  }
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  openModalsCount = Math.max(0, openModalsCount - 1);
  if (openModalsCount === 0) {
    document.body.style.overflow = originalOverflow || '';
    document.body.style.paddingRight = originalPaddingRight || '';
    document.body.classList.remove('modal-open');
  }
}

/**
 * React hook to freeze background body scrolling when a modal or popup is open
 */
export function useModalScrollLock(isOpen: boolean | any) {
  useEffect(() => {
    if (Boolean(isOpen)) {
      lockBodyScroll();
      return () => {
        unlockBodyScroll();
      };
    }
  }, [Boolean(isOpen)]);
}
