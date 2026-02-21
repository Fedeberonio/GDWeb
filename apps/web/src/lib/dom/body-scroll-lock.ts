"use client";

type ScrollLockWindow = Window & {
  __gdBodyScrollLocks?: Set<string>;
  __gdBodyOverflowBeforeLock?: string;
};

function getScrollLockWindow(): ScrollLockWindow | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  return window as ScrollLockWindow;
}

export function acquireBodyScrollLock(lockId: string): void {
  const w = getScrollLockWindow();
  if (!w) return;

  if (!w.__gdBodyScrollLocks) {
    w.__gdBodyScrollLocks = new Set<string>();
  }

  if (w.__gdBodyScrollLocks.size === 0) {
    w.__gdBodyOverflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  w.__gdBodyScrollLocks.add(lockId);
}

export function releaseBodyScrollLock(lockId: string): void {
  const w = getScrollLockWindow();
  if (!w?.__gdBodyScrollLocks) return;

  w.__gdBodyScrollLocks.delete(lockId);

  if (w.__gdBodyScrollLocks.size === 0) {
    document.body.style.overflow = w.__gdBodyOverflowBeforeLock ?? "";
    delete w.__gdBodyOverflowBeforeLock;
    delete w.__gdBodyScrollLocks;
  }
}

