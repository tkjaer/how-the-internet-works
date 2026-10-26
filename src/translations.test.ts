// A translated string that is still word for word the English one is usually a line someone missed, not a choice.
// Text a language keeps English on purpose (header field names as the RFCs write them, router output, jargon with no
// usual local word, sounds) is listed in that language's content/locales/<lang>/keep-english.json, per string: one
// language's choice doesn't let another's missed line through.
import { describe, expect, it } from 'vitest';

type Json = { [k: string]: string | Json };
const locales = import.meta.glob<Json>(['/content/*/*/locales/*.json', '/content/locales/*/ui.json'], { eager: true, import: 'default' });

/** Per language, the strings it keeps English, from content/locales/<lang>/keep-english.json:
 *  `"<kind>/<id> <key>": "<the text>"` (the folder under content/, then the key in its locale file), or
 *  `"ui <key>": "<the text>"` for content/locales/<lang>/ui.json. Only the tests read it; the app never loads it. */
const KEEP_ENGLISH: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(import.meta.glob<Record<string, string>>('/content/locales/*/keep-english.json', { eager: true, import: 'default' }))
    .map(([file, kept]) => [/^\/content\/locales\/([^/]+)\//.exec(file)![1], kept]),
);
const keepFile = (lang: string) => `content/locales/${lang}/keep-english.json`;
const entry = (id: string, s: string) => `${JSON.stringify(id)}: ${JSON.stringify(s)}`;

/** Prose, not a code, an address or a run of acronyms: two words in lower case. */
const prose = /[a-z]{3,}\s+[a-z]{2,}/;

function* strings(o: string | Json, at: string): Generator<[string, string]> {
  if (typeof o === 'string') yield [at, o];
  else for (const [k, v] of Object.entries(o)) yield* strings(v, at ? `${at}.${k}` : k);
}
const flat = (o: Json) => new Map(strings(o, ''));

/** content/locales/<lang>/ui.json → ui, <lang>; content/<kind>/<id>/locales/<lang>.json → <kind>/<id>, <lang>. */
function where(file: string): { folder: string; lang: string } {
  const ui = /^\/content\/locales\/([^/]+)\/ui\.json$/.exec(file);
  if (ui) return { folder: 'ui', lang: ui[1] };
  const [, folder, lang] = /^\/content\/(.+)\/locales\/([^/]+)\.json$/.exec(file)!;
  return { folder, lang };
}
const english = (file: string) => {
  const { folder } = where(file);
  return folder === 'ui' ? '/content/locales/en/ui.json' : `/content/${folder}/locales/en.json`;
};
const translations = Object.keys(locales).filter((f) => where(f).lang !== 'en' && locales[english(f)]);

/** Every translated string that is the English one, with where it is. */
const same = translations.flatMap((file) => {
  const en = flat(locales[english(file)]), { folder, lang } = where(file);
  return [...strings(locales[file], '')].filter(([key, s]) => en.get(key) === s && prose.test(s)).map(([key, s]) => ({ lang, id: `${folder} ${key}`, s }));
});

describe('translations', () => {
  it('has translations to check', () => {
    expect(translations.length).toBeGreaterThan(50);
  });

  it('leaves no English sentence or label untranslated, unless that language keeps it on purpose', () => {
    const missed = same.filter(({ lang, id, s }) => KEEP_ENGLISH[lang]?.[id] !== s);
    if (missed.length) {
      const langs = [...new Set(missed.map(({ lang }) => lang))];
      const list = langs.map((l) => `${keepFile(l)}:\n${missed.filter(({ lang }) => lang === l).map(({ id, s }) => `    ${entry(id, s)},`).join('\n')}`);
      throw new Error(`\nThese are still the English text. Translate them, or, if the language keeps one English on purpose, add it to that language's keep-english.json:\n  ${list.join('\n  ')}\n`);
    }
  });

  it('lists only strings that are still English, as they are written', () => {
    const still = new Set(same.map(({ lang, id, s }) => JSON.stringify([lang, id, s])));
    const stale = Object.entries(KEEP_ENGLISH).flatMap(([lang, kept]) =>
      Object.entries(kept).filter(([id, s]) => !still.has(JSON.stringify([lang, id, s]))).map(([id, s]) => ({ file: keepFile(lang), [id]: s })));
    expect(stale).toEqual([]);
  });
});
