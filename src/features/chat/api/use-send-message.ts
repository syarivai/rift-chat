import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import { api } from '@/core/api/rift-api';
import type { Post, SendMessageInput } from '@/core/api/types';
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
 * Uses `useMutation` directly rather than `api.sendMessage.useMutation` because the variables
 * carry the outbox `localId` alongside the request body, which the generic wrapper cannot
 * model. The request still goes through the API class.
 */
export function useSendMessage(contactId: number) {
  const mutation = useMutation<Post, Error, SendVariables>({
    mutationKey: ['send-message', contactId],
    mutationFn: ({ input }) => api.sendMessage(input),

    onSuccess: (post, variables) => {
      // Only `createdAt` is read: the response `id` is always 101 and identifies nothing.
      useAppStore.getState().markSent(variables.localId, post.createdAt);
    },

    onError: (error, variables) => {
      useAppStore.getState().markFailed(variables.localId, error.message);
    },

    // Deliberately no onSettled and no invalidateQueries.
  });

  const { mutate } = mutation;

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

  return { send, retry };
}

function toInput(contactId: number, body: string): SendMessageInput {
  // The endpoint expects a title; derive it rather than asking the user for one.
  return { userId: contactId, title: body.slice(0, 40), body };
}
