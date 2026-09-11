import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { newId } from '../format/new-id';
import type { Language, OutboxMessage, ThemeChoice } from './types';

// MMKV v4 is a factory (`createMMKV()`), not `new MMKV()`, and its delete method is
// `remove()`. Reads are synchronous, which is the whole point: the store is hydrated on the
// first render, so there is no flash of an empty thread or the wrong theme.
const mmkv = createMMKV();

const mmkvStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => mmkv.remove(name),
};

export type AppState = {
  /** Messages the user sent, keyed by contact. The server does not keep these. */
  outbox: Record<number, OutboxMessage[]>;
  blockedIds: number[];
  language: Language;
  theme: ThemeChoice;

  enqueue: (contactId: number, body: string) => string;
  markSent: (localId: string, deliveredAt: string) => void;
  markFailed: (localId: string, error: string) => void;
  retry: (localId: string) => void;

  toggleBlocked: (contactId: number) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeChoice) => void;
};

/** Applies `update` to whichever message carries `localId`, leaving every other entry alone. */
function mapMessage(
  outbox: Record<number, OutboxMessage[]>,
  localId: string,
  update: (message: OutboxMessage) => OutboxMessage,
): Record<number, OutboxMessage[]> {
  const next: Record<number, OutboxMessage[]> = {};
  let changed = false;

  for (const [contactId, messages] of Object.entries(outbox)) {
    const contactIdNum = Number(contactId);
    if (!messages.some((message) => message.localId === localId)) {
      next[contactIdNum] = messages;
      continue;
    }
    changed = true;
    next[contactIdNum] = messages.map((message) =>
      message.localId === localId ? update(message) : message,
    );
  }

  return changed ? next : outbox;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      outbox: {},
      blockedIds: [],
      language: 'system',
      theme: 'system',

      enqueue: (contactId, body) => {
        const message: OutboxMessage = {
          localId: newId(),
          contactId,
          body,
          createdAt: new Date().toISOString(),
          status: 'sending',
        };
        const existing = get().outbox[contactId] ?? [];
        set({ outbox: { ...get().outbox, [contactId]: [...existing, message] } });
        return message.localId;
      },

      // A settled message never moves again. Guarding here rather than in the UI means an
      // out-of-order response cannot resurrect a delivered message as pending.
      markSent: (localId, deliveredAt) =>
        set({
          outbox: mapMessage(get().outbox, localId, (message) =>
            message.status === 'sending' ? { ...message, status: 'sent', deliveredAt } : message,
          ),
        }),

      markFailed: (localId, error) =>
        set({
          outbox: mapMessage(get().outbox, localId, (message) =>
            message.status === 'sending' ? { ...message, status: 'failed', error } : message,
          ),
        }),

      retry: (localId) =>
        set({
          outbox: mapMessage(get().outbox, localId, (message) =>
            message.status === 'failed' ? { ...message, status: 'sending' } : message,
          ),
        }),

      toggleBlocked: (contactId) => {
        const blocked = get().blockedIds;
        set({
          blockedIds: blocked.includes(contactId)
            ? blocked.filter((id) => id !== contactId)
            : [...blocked, contactId],
        });
      },

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'rift-chat',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        outbox: state.outbox,
        blockedIds: state.blockedIds,
        language: state.language,
        theme: state.theme,
      }),
    },
  ),
);
