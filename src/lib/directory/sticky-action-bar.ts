"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether a listing's sticky mobile action bar is on screen (V2 Phase 6.1).
 * The site-wide WhatsApp floater reads this and steps aside, so the two never
 * overlap (spec §4.1).
 */
let visible = false;
const listeners = new Set<() => void>();

export function setStickyActionBarVisible(next: boolean): void {
  if (visible === next) return;
  visible = next;
  listeners.forEach((listener) => listener());
}

export function useStickyActionBarVisible(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => visible,
    () => false,
  );
}
