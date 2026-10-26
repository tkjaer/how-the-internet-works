// WCAG AA for the chrome in every theme and mode: captions, chips, doors, the peek/stack view, dive labels,
// learn-more links and the keyboard focus ring. Each pair is the tokens ui.css draws text (or the ring) with; a
// theme's night overrides its day.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolve, themeTokens } from '../test/tokens';
import { labelInk } from '../render/colour';

type RGBA = [number, number, number, number];

function parse(value: string): RGBA {
  const v = value.trim();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1) as RGBA;
  }
  const rgb = v.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const [r, g, b, a = 1] = rgb[1].split(/[\s,/]+/).map(Number);
    return [r, g, b, a];
  }
  // color-mix(in srgb, <colour> p%, transparent): the colour at p% opacity; with another colour: p% of the first
  const mix = v.match(/^color-mix\(in srgb, (.+) ([\d.]+)%, (.+)\)$/);
  if (mix) {
    const [r, g, b, a] = parse(mix[1]), p = Number(mix[2]) / 100;
    if (mix[3] === 'transparent') return [r, g, b, a * p];
    const [R, G, B] = parse(mix[3]);
    return [r * p + R * (1 - p), g * p + G * (1 - p), b * p + B * (1 - p), 1];
  }
  throw new Error(`can't read colour ${v}`);
}

const over = ([r, g, b, a]: RGBA, [R, G, B]: RGBA): RGBA => [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a), 1];
const luminance = (c: RGBA) =>
  c.slice(0, 3).reduce((sum, x, i) => {
    const s = x / 255;
    return sum + [0.2126, 0.7152, 0.0722][i] * (s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4);
  }, 0);
const ratio = (a: RGBA, b: RGBA) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [text, background layers from the top down to the page]. Named by token; `a|b` is var(--a, var(--b)).
const TEXT = 4.5, ICON = 3;
const PAIRS: [string, string[], number][] = [
  ['ink', ['card'], TEXT],
  ['muted', ['card'], TEXT],
  ['heading', ['card'], TEXT],
  ['link', ['card'], TEXT],
  ['link', ['btn', 'card'], TEXT],
  ['ink', ['btn', 'card'], TEXT],
  ['btn-on-ink', ['btn-on'], TEXT],
  ['door-dive|accent', ['card'], TEXT],
  ['door-open|accent', ['card'], TEXT],
  ['door-catch|accent', ['card'], TEXT],
  ['btn-on-ink', ['door-dive|accent'], TEXT],
  ['btn-on-ink', ['door-open|accent'], TEXT],
  ['btn-on-ink', ['door-catch|accent'], TEXT],
  ['env-change', ['card'], TEXT],
  ['ink', ['env-bg', 'card'], TEXT],
  ['muted', ['env-bg', 'card'], TEXT],
  ['env-name', ['env-bg', 'card'], TEXT],
  ['env-change', ['env-bg', 'card'], TEXT],
  ['env-change', ['env-used', 'env-bg', 'card'], TEXT],
  ['ink', ['env-used', 'env-bg', 'card'], TEXT],
  ['muted', ['env-used', 'env-bg', 'card'], TEXT],
  ['env-name', ['env-sealed', 'card'], TEXT],
  ['muted', ['env-sealed', 'card'], TEXT],
  ['tag-ink', ['tag-bg'], TEXT],
  ['ink', ['lbl-halo'], TEXT],
  // a label in one of the palette's colours takes its ink tone (a theme without one falls back to ink)
  ...['leaf-ink|ink', 'teal-ink|ink', 'berry-ink|ink'].map((c): [string, string[], number] => [c, ['lbl-halo'], TEXT]),
  ['ink', ['panel-bg'], TEXT],
  ['hint', ['hint-bg'], TEXT],
  ['accent-ink', ['env-dive|accent'], ICON],
  // non-text (WCAG 1.4.11, #45). The ☀️/🌙, ⏸ and other toggles' icons are text-coloured (ink on btn, or btn-on-ink
  // on btn-on when pressed), so the text pairs above cover them.
  // a card's edge on the page, and a button's or chip's edge (the theme's line, else the card's edge) inside a card
  ['card-edge', [], ICON],
  ['line|card-edge', ['card'], ICON],
  // what is on (simple/technical, a pressed toggle, the ladder's rung): filled with btn-on in the card
  ['btn-on', ['card'], ICON],
  // the caption's door chips are outlined in their verb's colour; the peek's chips and envelopes in env-edge
  ['door-dive|accent', ['btn', 'card'], ICON],
  ['door-open|accent', ['btn', 'card'], ICON],
  ['door-catch|accent', ['btn', 'card'], ICON],
  ['env-edge', ['card'], ICON],
  // the scene's doors: a badge in its verb's colour on the sky or a dive's panel (its mark and label are btn-on-ink,
  // as on a lit chip, above)
  ...['door-dive|accent', 'door-open|accent', 'door-catch|accent'].flatMap((door): [string, string[], number][] => [
    [door, ['scene-bg'], ICON],
    [door, ['panel-bg'], ICON],
  ]),
  // marks on bright bodies (a courier's face, a booster's plus, a lit badge): face, which stays dark by night
  ['face|ink', ['sun|accent'], ICON],
  ['face|ink', ['lamp|accent'], ICON],
  // the focus ring: its two tones apart, and against the cards and the page it sits on
  ['focus-ink|ink', ['focus-gap|bg'], ICON],
  ['focus-ink|ink', ['card'], ICON],
  ['focus-ink|ink', [], ICON],
  // and in the scene (the keyboard's ring round a stop, or round a whole scene on the sky or a dive's panel)
  ['focus-ink|ink', ['scene-bg'], ICON],
  ['focus-ink|ink', ['panel-bg'], ICON],
];

// a label in a technology's colour (a link's name in the scene) is mixed into the ink (render/colour.ts)
const TECH = readdirSync('content/technologies').map((id) => readFileSync(`content/technologies/${id}/technology.ts`, 'utf8').match(/colour: '(#[0-9a-f]{6})'/i)?.[1]);

describe('contrast', () => {
  for (const theme of themeTokens())
    for (const [mode, tokens] of [['day', theme.day], ['night', theme.night && { ...theme.day, ...theme.night }]] as const) {
      if (!tokens) continue;
      it(`${theme.id} ${mode} meets WCAG AA`, () => {
        const colour = (names: string) => {
          const name = names.split('|').find((n) => n in tokens);
          if (!name) throw new Error(`--${names} is not defined`);
          return parse(resolve(tokens, `var(--${name})`));
        };
        const page = colour('bg');
        const bad = PAIRS.flatMap(([fg, layers, min]) => {
          const bg = layers.reduceRight((under, layer) => over(colour(layer), under), page);
          const r = ratio(over(colour(fg), bg), bg);
          return r < min ? [`${fg} on ${layers.join(' over ')}: ${r.toFixed(2)} < ${min}`] : [];
        });
        const halo = over(colour('lbl-halo'), page);
        for (const c of TECH) {
          const r = ratio(parse(resolve(tokens, labelInk(c!))), halo);
          if (r < TEXT) bad.push(`a label in ${c} on lbl-halo: ${r.toFixed(2)} < ${TEXT}`);
        }
        expect(TECH.length).toBeGreaterThan(0);
        expect(bad).toEqual([]);
      });
    }

  it('reads the colours tokens.css uses', () => {
    expect(parse('#fff')).toEqual([255, 255, 255, 1]);
    expect(parse('rgba(255, 207, 93, 0.55)')).toEqual([255, 207, 93, 0.55]);
    expect(parse('color-mix(in srgb, #ffcf5d 55%, transparent)')).toEqual([255, 207, 93, 0.55]);
    expect(parse('color-mix(in srgb, #ffffff 40%, #000000)')).toEqual([102, 102, 102, 1]);
    expect(ratio(parse('#000'), parse('#fff'))).toBeCloseTo(21);
  });
});
