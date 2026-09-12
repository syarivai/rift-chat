import { clearStorage, mmkvStorage } from './storage';

beforeEach(() => clearStorage());

describe('mmkvStorage', () => {
  it('round-trips a value', () => {
    mmkvStorage.setItem('k', 'v');
    expect(mmkvStorage.getItem('k')).toBe('v');
  });

  it('returns null for a missing key, which is what Zustand expects', () => {
    // undefined would make persist treat the store as corrupt rather than empty.
    expect(mmkvStorage.getItem('nope')).toBeNull();
  });

  it('removes a value', () => {
    mmkvStorage.setItem('k', 'v');
    mmkvStorage.removeItem('k');
    expect(mmkvStorage.getItem('k')).toBeNull();
  });

  it('clearStorage empties everything', () => {
    mmkvStorage.setItem('a', '1');
    mmkvStorage.setItem('b', '2');

    clearStorage();

    expect(mmkvStorage.getItem('a')).toBeNull();
    expect(mmkvStorage.getItem('b')).toBeNull();
  });
});
