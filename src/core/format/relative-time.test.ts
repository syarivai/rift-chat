import { relativeTime } from './relative-time';

const NOW = new Date('2026-09-10T12:00:00.000Z').getTime();

// A stand-in for i18next's `t`: returns the key plus the count, so assertions stay readable
// and no i18n instance is needed.
const t = ((key: string, options?: { count?: number }) =>
  options?.count === undefined ? key : `${key}:${options.count}`) as never;

const at = (iso: string) => relativeTime(iso, t, NOW);

describe('relativeTime', () => {
  it('says "now" for something within the last minute', () => {
    expect(at('2026-09-10T11:59:50.000Z')).toBe('time.now');
  });

  it('counts whole minutes within the hour', () => {
    expect(at('2026-09-10T11:57:00.000Z')).toBe('time.minutes:3');
  });

  it('counts whole hours within the day', () => {
    expect(at('2026-09-10T09:00:00.000Z')).toBe('time.hours:3');
  });

  it('counts whole days within the week', () => {
    expect(at('2026-09-08T12:00:00.000Z')).toBe('time.days:2');
  });

  it('falls back to a numeric date beyond a week', () => {
    expect(at('2026-08-01T12:00:00.000Z')).toBe('01/08/2026');
  });

  it('treats a future timestamp as now rather than showing a negative age', () => {
    expect(at('2026-09-10T12:05:00.000Z')).toBe('time.now');
  });

  it('returns an empty string for an unparseable date rather than NaN', () => {
    expect(at('not a date')).toBe('');
  });

  it('uses no Intl API — Hermes does not implement RelativeTimeFormat', () => {
    const spy = jest.spyOn(Intl, 'DateTimeFormat');
    at('2026-08-01T12:00:00.000Z');
    at('2026-09-10T11:57:00.000Z');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
