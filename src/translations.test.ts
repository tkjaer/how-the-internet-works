// A translated string that is still word for word the English one is usually a line someone missed, not a choice.
// Text a language keeps English on purpose (header field names as the RFCs write them, router output, jargon with no
// usual local word, sounds) is listed in KEEP_ENGLISH, per language and per string: one language's choice doesn't
// let another's missed line through.
import { describe, expect, it } from 'vitest';

type Json = { [k: string]: string | Json };
const locales = import.meta.glob<Json>(['/content/*/*/locales/*.json', '/content/locales/*/ui.json'], { eager: true, import: 'default' });

/** Per language, the strings it keeps English: `<kind>/<id> <key>` (the folder under content/, then the key in its
 *  locale file), or `ui <key>` for content/locales/<lang>/ui.json. */
const KEEP_ENGLISH: Record<string, string[]> = {
  da: [
    // header field names, as the standards name them
    'layers/ethernet field.fcs.name', // Frame check sequence
    'layers/wifi field.fcs.name', // Frame check sequence
    'layers/wifi field.fc.name', // Frame control
    'layers/gpon field.hec.name', // Header error control
    'layers/gtp field.pdu.name', // PDU session container
    'layers/ip 1995.field.dscp.name', // Type of service
    // what a device prints, and jargon an engineer would say in English
    'scenes/ppp-hello hdlc.online.nerd', // Line protocol is up
    'nodes/load-balancer name', // Load balancer
    'scenes/ixp-inside routeServer.nerd', // Route server
    'scenes/server-inside 2010.compute.title.nerd', // CPU · bare metal
    'nodes/transit tag', // Tier-1 · paid transit
    'scenes/gpon-slots label.equalDelay', // equalisation delay
    'scenes/border-inside pop.tag.nerd', // pop label
    'scenes/border-inside rib.transit.kid', // via transit
    'scenes/border-inside rib.transit.nerd', // via transit
    'scenes/nr-grant tag.harq', // 16 HARQ · soft combining · ~1 ms
    // sounds
    'scenes/modem-call say.train', // Krrrshhh! Bong bong!
    'scenes/modem-call step.ring.kid', // Ring ring
  ],
  de: [
    // header field names, as the standards name them
    'layers/ethernet field.fcs.name', // Frame check sequence
    'layers/wifi field.fcs.name', // Frame check sequence
    'layers/wifi field.fc.name', // Frame control
    'layers/gpon field.hec.name', // Header error control
    'layers/ip 1995.field.dscp.name', // Type of service
    // what a device prints, and jargon an engineer would say in English
    'scenes/ppp-hello hdlc.online.nerd', // Line protocol is up
    'scenes/ixp-inside routeServer.nerd', // Route server
    'scenes/server-inside 2010.compute.title.nerd', // CPU · bare metal
    'nodes/transit tag', // Tier-1 · paid transit
    'scenes/gpon-slots label.equalDelay', // equalisation delay
    'scenes/border-inside pop.tag.nerd', // pop label
    'scenes/border-inside rib.transit.nerd', // via transit
    'scenes/nr-grant tag.harq', // 16 HARQ · soft combining · ~1 ms
    // sounds
    'scenes/modem-call say.train', // Krrrshhh! Bong bong!
    'scenes/modem-call step.ring.kid', // Ring ring
  ],
};

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
    const missed = same.filter(({ lang, id }) => !KEEP_ENGLISH[lang]?.includes(id)).map(({ lang, id, s }) => `${lang}: '${id}', // ${s}`);
    if (missed.length)
      throw new Error(`\nThese are still the English text. Translate them, or, if the language keeps one English on purpose, add it to KEEP_ENGLISH in src/translations.test.ts:\n  ${missed.join('\n  ')}\n`);
  });

  it('lists only strings that are still English', () => {
    const kept = new Set(same.map(({ lang, id }) => `${lang}: ${id}`));
    expect(Object.entries(KEEP_ENGLISH).flatMap(([lang, ids]) => ids.map((id) => `${lang}: ${id}`)).filter((k) => !kept.has(k))).toEqual([]);
  });
});
