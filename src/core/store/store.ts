import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './storage';

import type { Language, OutboxMessage, ThemeChoice } from './types';

/**
 * Client-side id for an outbox message. The server's `id` is always 101 and identifies
 * nothing — see docs/reference/api-contract.md.
 *
 * ponytail: timestamp + counter + a short random suffix rather than a UUID dependency.
 * Ceiling: unique per device, not globally. The outbox is local-only, so that is enough.
 * Upgrade path: expo-crypto's randomUUID() if messages ever sync.
 */
let idCounter = 0;

function newId(): string {
  idCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}-${idCounter.toString(36)}-${random}`;
}

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
