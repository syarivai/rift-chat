import { useCallback, useEffect, useRef } from 'react';

import { useIsOnline } from '@/core/network/network-info';

import { api } from '@/core/api/rift-api';
import type { SendMessageInput } from '@/core/api/types';
import { useAppStore } from '@/core/store/store';

export const MAX_MESSAGE_LENGTH = 1000;

type SendVariables = {
  localId: string;
  input: SendMessageInput;
};

/**
 * Sending a message.
 *
 * THE RULE: this never invalidates the thread query. `POST /api/posts` returns 201 but does
 * not persist, so a refetch would return the contact's original posts and delete every
 * message the user has ever sent. See docs/explanation/message-model.md.
 *
 * The message is enqueued BEFORE the request leaves, not in `onMutate` — it is durable from
 * the moment the user hits send. The optimism here is about delivery, not existence.
 *
 * A failure is NOT rolled back. It is marked `failed` and stays visible with a retry
 * affordance: deleting content the user typed is the wrong answer to a network error.
 *
 * Goes through `api.sendMessage.useMutation` like every other call in the app, so the axios
 * instance, the URL, the error mapping and the response shape all stay in one place. The
 * variables are wider than the request body — they carry the outbox `localId` — so `toRequest`
 * narrows them at the seam.
 */
export function useSendMessage(contactId: number) {
  const { mutate } = api.sendMessage.useMutation<SendVariables>({
    mutationKey: ['send-message', contactId],
    toRequest: ({ input }) => input,
    onSuccess: (post, variables) => {
      // Only `createdAt` is read: the response `id` is always 101 and identifies nothing.
      useAppStore.getState().markSent(variables.localId, post.createdAt);
    },
    onError: (error, variables) => {
      useAppStore.getState().markFailed(variables.localId, error.message);
    },
  });

  const send = useCallback(
    (rawBody: string) => {
      const body = rawBody.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!body) return;

      const localId = useAppStore.getState().enqueue(contactId, body);
      mutate({ localId, input: toInput(contactId, body) });
    },
    [contactId, mutate],
  );

  const retry = useCallback(
    (localId: string) => {
      const message = (useAppStore.getState().outbox[contactId] ?? []).find(
        (candidate) => candidate.localId === localId,
      );
      if (!message || message.status !== 'failed') return;

      useAppStore.getState().retry(localId);
      mutate({ localId, input: toInput(contactId, message.body) });
    },
    [contactId, mutate],
  );

  // T-7.3: flush this contact's failed messages when connectivity returns, oldest first.
  //
  // ponytail: scoped to the open conversation rather than a global queue processor.
  // Ceiling: messages that failed in other threads stay failed until you open them.
  // Upgrade path: a store-level flush driven by the same online signal, if it matters.
  const isOnline = useIsOnline();
  const wasOnline = useRef(isOnline);

  useEffect(() => {
    const reconnected = isOnline && !wasOnline.current;
    wasOnline.current = isOnline;
    if (!reconnected) return;

    for (const message of useAppStore.getState().outbox[contactId] ?? []) {
      if (message.status === 'failed') retry(message.localId);
    }
  }, [isOnline, contactId, retry]);

  return { send, retry };
}

function toInput(contactId: number, body: string): SendMessageInput {
  // The endpoint expects a title; derive it rather than asking the user for one.
  return { userId: contactId, title: body.slice(0, 40), body };
}
