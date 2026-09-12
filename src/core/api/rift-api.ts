import { BaseHttpClient, assertEnvelope } from './base-http-client';
import type { Contact, Envelope, PageParams, Post, SendMessageInput } from './types';

// EXPO_PUBLIC_* is inlined into the bundle at build time, so this is configuration, not a
// secret — the API is public and unauthenticated. Anything genuinely secret must never live
// here; see the app-security skill.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://responserift.dev';

/**
 * Every endpoint the app uses, declared once. No feature file imports axios or builds a URL.
 * Shapes are documented in docs/reference/api-contract.md and re-verified by the
 * api-contract-verifier agent.
 */
class RiftApi extends BaseHttpClient {
  getContacts = this.withQuery('contacts', async (params: PageParams) => {
    const data = await this.get<unknown>('/api/users', { params });
    assertEnvelope<Contact>(data, '/api/users');
    return data as Envelope<Contact>;
  });

  getContact = this.withQuery('contact', async ({ id }: { id: number }) => {
    const data = await this.get<unknown>(`/api/users/${id}`);
    if (!data || typeof (data as Contact).id !== 'number') {
      throw new Error(`Malformed contact from /api/users/${id}`);
    }
    return data as Contact;
  });

  getMessages = this.withQuery('messages', async (params: PageParams & { userId: number }) => {
    const data = await this.get<unknown>('/api/posts', { params });
    assertEnvelope<Post>(data, '/api/posts');
    return data as Envelope<Post>;
  });

  /**
   * The write is accepted (201) but NOT persisted, and `id` is always 101. Only `createdAt`
   * is worth reading. Never invalidate a thread after this — see
   * docs/explanation/message-model.md.
   */
  sendMessage = this.withQuery('send-message', async (input: SendMessageInput) => {
    const data = await this.post<unknown>('/api/posts', input);
    if (!data || typeof (data as Post).createdAt !== 'string') {
      throw new Error('Malformed response from POST /api/posts');
    }
    return data as Post;
  });
}

export const api = new RiftApi(API_BASE_URL);
