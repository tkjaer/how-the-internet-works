// A translated string that is still word for word the English one is usually a line someone missed, not a choice.
// Text that stays English on purpose (header field names as the RFCs write them, router output, jargon with no
// usual local word, sounds) is listed in KEEP_ENGLISH, for every language at once.
import { describe, expect, it } from 'vitest';

type Json = { [k: string]: string | Json };
const locales = import.meta.glob<Json>(['/content/*/*/locales/*.json', '/content/locales/*/ui.json'], { eager: true, import: 'default' });

const KEEP_ENGLISH = new Set([
  // header field names, as the standards name them
  'Frame check sequence',
  'Frame control',
  'Header error control',
  'PDU session container',
  'Type of service',
  // what a device prints, and jargon an engineer would say in English
  'Line protocol is up',
  'Load balancer',
  'Route server',
  'CPU · bare metal',
  'Tier-1 · paid transit',
  'equalisation delay',
  'pop label',
  'via transit',
  '16 HARQ · soft combining · ~1 ms',
  // sounds
  'Krrrshhh! Bong bong!',
  'Ring ring',
]);

/** Prose, not a code, an address or a run of acronyms: two words in lower case. */
const prose = /[a-z]{3,}\s+[a-z]{2,}/;

function* strings(o: string | Json, at: string): Generator<[string, string]> {
  if (typeof o === 'string') yield [at, o];
  else for (const [k, v] of Object.entries(o)) yield* strings(v, at ? `${at}.${k}` : k);
}
const flat = (o: Json) => new Map(strings(o, ''));

const english = (file: string) =>
  file.startsWith('/content/locales/') ? file.replace(/\/[^/]+\/ui\.json$/, '/en/ui.json') : file.replace(/[^/]+\.json$/, 'en.json');
const translations = Object.keys(locales).filter((f) => english(f) !== f && locales[english(f)]);

/** Every translated string that is the English one, with where it is. */
const same = translations.flatMap((file) => {
  const en = flat(locales[english(file)]);
  return [...strings(locales[file], '')].filter(([key, s]) => en.get(key) === s && prose.test(s)).map(([key, s]) => ({ file, key, s }));
});

describe('translations', () => {
  it('has translations to check', () => {
    expect(translations.length).toBeGreaterThan(50);
  });

  it('leaves no English sentence or label untranslated, unless it is kept on purpose', () => {
    const missed = same.filter(({ s }) => !KEEP_ENGLISH.has(s)).map(({ file, key, s }) => `${file} › ${key}: ${JSON.stringify(s)}`);
    if (missed.length)
      throw new Error(`\nThese are still the English text. Translate them, or, if a term stays English on purpose, add it to KEEP_ENGLISH in src/translations.test.ts:\n  ${missed.join('\n  ')}\n`);
  });

  it('keeps English only what some language still keeps', () => {
    const kept = new Set(same.map(({ s }) => s));
    expect([...KEEP_ENGLISH].filter((s) => !kept.has(s))).toEqual([]);
  });
});
