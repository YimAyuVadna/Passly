import { useEffect } from 'react';

// Reference counter to handle multiple or sequential modals without scroll flicker
let activeModalsCount = 0;

export function lockBodyScroll(): void {
  activeModalsCount++;
  if (activeModalsCount === 1) {
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
  }
}

export function unlockBodyScroll(): void {
  activeModalsCount = Math.max(0, activeModalsCount - 1);
  if (activeModalsCount === 0) {
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }
}

export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}
