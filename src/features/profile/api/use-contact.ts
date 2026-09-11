import { useQueryClient } from '@tanstack/react-query';

import { api } from '@/core/api/rift-api';
import type { Contact, Envelope } from '@/core/api/types';
import { queryKeys } from '@/core/query-keys/keys';

/**
 * GET /api/users already returns every field the profile screen shows, so the detail query is
 * seeded from the list cache and refetched in the background — the screen never spins for
 * data the app already has.
 *
 * `initialDataUpdatedAt` matters: without it the seed counts as fresh and the background
 * refetch never runs.
 */
export function useContact(contactId: number) {
  const queryClient = useQueryClient();

  return api.getContact.useQuery(
    { id: contactId },
    {
      queryKey: queryKeys.contacts.detail(contactId),
      enabled: Number.isInteger(contactId) && contactId > 0,
      initialData: () => findInListCache(queryClient, contactId),
      initialDataUpdatedAt: () =>
        queryClient.getQueryState(queryKeys.contacts.list())?.dataUpdatedAt,
    },
  );
}

function findInListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  contactId: number,
): Contact | undefined {
  const cached = queryClient.getQueryData<{ pages: Envelope<Contact>[] }>(
    queryKeys.contacts.list(),
  );
  return cached?.pages.flatMap((page) => page.results).find((c) => c.id === contactId);
}
