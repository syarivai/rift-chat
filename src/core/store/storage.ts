import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * Persistence, kept separate from state management. The store knows it persists through a
 * StateStorage; it does not know that storage is MMKV. Swapping the backend is this file.
 *
 * MMKV v4 exposes a factory (`createMMKV()`), not a constructor, and its delete method is
 * `remove()`. Reads are synchronous, which is the whole reason it was chosen: the store is
 * hydrated on the first render, so there is no flash of an empty thread or the wrong theme
 * (ADR 0002).
 */
const mmkv = createMMKV();

export const mmkvStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => mmkv.remove(name),
};

/** Used by Settings' "clear local data", and by tests that need a clean slate. */
export function clearStorage(): void {
  mmkv.clearAll();
}
