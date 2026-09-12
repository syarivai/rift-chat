#!/usr/bin/env node
/**
 * Fails if any translation key is missing from, or extra in, a non-English catalog.
 *
 * A missing key does not crash — i18next falls back to printing the key itself, so the bug
 * ships as `chat.blocked` rendered on screen in Malay. That is exactly the kind of thing a
 * reviewer finds and a test suite does not, which is why this is a gate rather than a habit.
 *
 *   node scripts/check-i18n-parity.js
 */
const fs = require('node:fs');
const path = require('node:path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'core', 'i18n', 'locales');
const REFERENCE = 'en';

/** Flattens { chat: { send: 'Send' } } to ['chat.send'], so nesting differences show up too. */
function flatten(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => {
    const id = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object' ? flatten(child, id) : [id];
  });
}

const read = (locale) =>
  JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${locale}.json`), 'utf8'));

const locales = fs
  .readdirSync(LOCALES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => path.basename(file, '.json'));

const reference = new Set(flatten(read(REFERENCE)));
let failed = false;

for (const locale of locales.filter((l) => l !== REFERENCE)) {
  const keys = new Set(flatten(read(locale)));
  const missing = [...reference].filter((key) => !keys.has(key));
  const extra = [...keys].filter((key) => !reference.has(key));

  if (missing.length || extra.length) {
    failed = true;
    console.error(`✗ ${locale}`);
    missing.forEach((key) => console.error(`    missing: ${key}`));
    extra.forEach((key) => console.error(`    extra:   ${key}`));
  } else {
    console.log(`✓ ${locale} — ${keys.size} keys, matching ${REFERENCE}`);
  }
}

if (failed) {
  console.error(`\nCatalogs are out of sync with ${REFERENCE}.json.`);
  process.exit(1);
}
console.log(`\nAll ${locales.length} catalogs agree.`);
