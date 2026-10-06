import { describe, expect, it } from 'vitest';
import { layoutFor, paintRows, tlsMoment } from '../../content/scenes/tls-lock/tls';

// every language pack the scene ships, so a new one is laid out too
const scene = import.meta.glob<{ label: { server: string } }>('../../content/scenes/tls-lock/locales/*.json', { eager: true, import: 'default' });
const langs = Object.keys(scene).map((p) => p.slice(p.lastIndexOf('/') + 1, -'.json'.length));

// the client, named on the paint row (#132): any device that starts a trip
const clients = ['phone', 'phone-3g', 'laptop', 'pc'];
const nodes = import.meta.glob<{ name: string }>('../../content/nodes/{phone,phone-3g,laptop,pc}/locales/*.json', { eager: true, import: 'default' });
const longest = (server: string) => Math.max(server.length, ...Object.values(nodes).map((n) => n.name.length));

const views = [
  ['landscape', { h: 900, top: 0, bottom: 0 }],
  ['landscape', { h: 390, top: 0, bottom: 0 }],
  ['portrait', { h: 1600, top: 0, bottom: 0 }],
] as const;

describe('the TLS dive (tls-lock)', () => {
  it('lays the paint rows with three pots of one size, signs in clear gaps, inside either card (#90, #132)', () => {
    for (const [o, vp] of views)
      for (const { label } of Object.values(scene))
        for (const card of layoutFor(o, vp).cards) {
          const L = layoutFor(o, vp), chars = longest(label.server), P = paintRows(L, card, o, chars);
          const sign = 0.3 * L.size.big;
          expect(P.label + chars * 0.6 * P.words).toBeLessThan(P.pots[0] - P.half);
          P.signs.forEach((s, i) => {
            expect(s - sign).toBeGreaterThan(P.pots[i] + P.half + 4);
            expect(s + sign).toBeLessThan(P.pots[i + 1] - P.half - 4);
          });
          expect(P.pots[2] + P.half).toBeLessThanOrEqual(card.x + card.w - 24);
          for (const y of P.rows) expect(y > card.y && y + 48 * P.scale < card.y + card.h).toBe(true);
        }
    expect(langs).toEqual(expect.arrayContaining(['en', 'da', 'de']));
    expect(Object.keys(nodes)).toEqual(expect.arrayContaining(clients.flatMap((c) => langs.map((l) => `../../content/nodes/${c}/locales/${l}.json`))));
  });

  it('plays the ID first for kids, and the TLS 1.3 order for nerds: keys, then the encrypted certificate (#132)', () => {
    const beats = (nerd: boolean) => [0.5, 4, 7.2, 8, 10.2, 12].map((t) => tlsMoment(t, nerd).beat);
    expect(beats(false)).toEqual(['id', 'mix', 'swap', 'swap', 'brown', 'locked']);
    expect(beats(true)).toEqual(['mix', 'swap', 'brown', 'id', 'id', 'locked']);
    expect(tlsMoment(3, true).idT).toBeLessThan(0);
    expect(tlsMoment(9, true).idT).toBeCloseTo(1.4);
    expect(tlsMoment(7.5, true).brown).toBeGreaterThan(0.75);
    expect(tlsMoment(2, true).swap).toBe(0);
  });
});
