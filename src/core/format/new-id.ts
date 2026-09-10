let counter = 0;

/**
 * Client-side id for an outbox message. The server's `id` is always 101 and therefore cannot
 * identify anything — see docs/reference/api-contract.md.
 *
 * ponytail: timestamp + counter + a short random suffix rather than a UUID dependency.
 * Ceiling: ids are unique per device, not globally. Nothing here needs global uniqueness —
 * the outbox is local-only. Upgrade path: expo-crypto's randomUUID() if messages ever sync.
 */
export function newId(): string {
  counter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}-${counter.toString(36)}-${random}`;
}
