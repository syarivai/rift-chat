import { mmkvStorage } from './storage';

// Each test uses its own key, so the suite needs no shared reset between cases.
describe('mmkvStorage', () => {
  it('round-trips a value', () => {
    mmkvStorage.setItem('round-trip', 'v');
    expect(mmkvStorage.getItem('round-trip')).toBe('v');
  });

  it('returns null for a missing key, which is what Zustand expects', () => {
    // undefined would make persist treat the store as corrupt rather than empty.
    expect(mmkvStorage.getItem('never-written')).toBeNull();
  });

  it('removes a value', () => {
    mmkvStorage.setItem('to-remove', 'v');
    mmkvStorage.removeItem('to-remove');
    expect(mmkvStorage.getItem('to-remove')).toBeNull();
  });

  it('removes only the named key', () => {
    mmkvStorage.setItem('keep', 'kept');
    mmkvStorage.setItem('drop', 'dropped');

    mmkvStorage.removeItem('drop');

    expect(mmkvStorage.getItem('drop')).toBeNull();
    expect(mmkvStorage.getItem('keep')).toBe('kept');
  });
});
