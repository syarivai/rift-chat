import { queryKeys } from './keys';

describe('queryKeys', () => {
  it('nests list and detail under contacts so the prefix invalidates both', () => {
    expect(queryKeys.contacts.list()).toEqual(['contacts', 'list']);
    expect(queryKeys.contacts.detail(3)).toEqual(['contacts', 'detail', 3]);
    expect(queryKeys.contacts.list().slice(0, 1)).toEqual([...queryKeys.contacts.all]);
  });

  it('scopes messages to one contact', () => {
    expect(queryKeys.messages.byContact(5)).toEqual(['messages', 'byContact', 5]);
    expect(queryKeys.messages.byContact(5)).not.toEqual(queryKeys.messages.byContact(6));
  });

  it('returns a stable key for the same input', () => {
    expect(queryKeys.messages.byContact(5)).toEqual(queryKeys.messages.byContact(5));
  });
});
