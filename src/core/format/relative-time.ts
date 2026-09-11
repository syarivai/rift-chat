import type { TFunction } from 'i18next';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Compact relative time, translated through the app's own catalogs.
 *
 * ponytail: no `Intl.RelativeTimeFormat` and no date library. Hermes does NOT implement
 * RelativeTimeFormat — it is `undefined` on device, which crashed the chat screen even though
 * every unit test passed (Node has full Intl). We already own three translation catalogs, so
 * the unit strings live there.
 *
 * Ceiling: the format is compact ("3m", "2h") rather than prose ("3 minutes ago"), and dates
 * older than a week fall back to a numeric date. Upgrade path: @formatjs/intl-relativetimeformat
 * with locale data, if prose is ever wanted.
 */
export function relativeTime(iso: string, t: TFunction, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const elapsed = Math.max(0, now - then);

  if (elapsed < MINUTE) return t('time.now');
  if (elapsed < HOUR) return t('time.minutes', { count: Math.floor(elapsed / MINUTE) });
  if (elapsed < DAY) return t('time.hours', { count: Math.floor(elapsed / HOUR) });
  if (elapsed < WEEK) return t('time.days', { count: Math.floor(elapsed / DAY) });

  return shortDate(then);
}

/** Hermes does implement DateTimeFormat, but guard anyway — a crash here is not worth a date. */
function shortDate(timestamp: number): string {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
