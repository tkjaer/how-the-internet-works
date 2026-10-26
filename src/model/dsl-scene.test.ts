import { describe, expect, it } from 'vitest';
import { content } from './registry';
import { LINE, MAX_KM, PLAN_998, bandSpans, bitsAt, lineTones, pitchX, speedAt, toneBars } from '../../content/scenes/dsl-tones/tones';

describe('the phone line (dsl-tones)', () => {
  it('lays the bands out low to high without overlap, the voice band first', () => {
    for (const technical of [false, true]) {
      const spans = bandSpans(technical);
      expect(spans[0]).toMatchObject({ band: 'voice', x0: 0 });
      expect(spans.at(-1)!.x1).toBeCloseTo(1);
      for (let i = 1; i < spans.length; i++) expect(spans[i].x0).toBeGreaterThanOrEqual(spans[i - 1].x1);
    }
    expect(bandSpans(true)).toHaveLength(PLAN_998.length);
    // a power scale: the narrow upstream band at the bottom still gets a visible slice
    expect(pitchX(138e3) - pitchX(25e3)).toBeGreaterThan(0.05);
  });

  it('gives high tones and long lines fewer bits, and never more than 15', () => {
    expect(bitsAt(0, 0)).toBe(15);
    expect(bitsAt(0.9, 0.4)).toBeLessThan(bitsAt(0.2, 0.4));
    expect(bitsAt(0.9, 2)).toBeLessThan(bitsAt(0.9, 0.4));
    expect(bitsAt(1, 5)).toBe(0);
    const bars = toneBars(bandSpans(true), 0.4, 3.7, false);
    expect(bars.every((b) => b.bits >= 0 && b.bits <= 15 && b.band !== 'voice')).toBe(true);
  });

  it('slows down as the line gets longer', () => {
    const ks = [0, 0.3, 0.4, 1, 2, MAX_KM, 9];
    const rates = ks.map(speedAt);
    for (let i = 1; i < rates.length; i++) expect(rates[i]).toBeLessThanOrEqual(rates[i - 1]);
    // 2010's VDSL2 without vectoring (#59): this home's 400 m line could carry about 55 Mbit/s, more than its 20 Mbit/s plan
    expect(speedAt(0.4)).toBeGreaterThan(45);
    expect(speedAt(0.4)).toBeLessThan(65);
    expect(speedAt(0.4)).toBeGreaterThan(content.technologies.vdsl.rate.down / 1e6);
  });

  it('sends more, quicker tones down than up, and keeps a still frame still', () => {
    const tones = lineTones(1.3, false);
    expect(tones.filter((t) => t.band === 'voice')).toHaveLength(1);
    expect(tones.filter((t) => t.band === 'down').length).toBeGreaterThan(tones.filter((t) => t.band === 'up').length);
    expect(lineTones(0, true)).toEqual(lineTones(99, true));
    for (const t of tones) for (const [, x] of t.d.matchAll(/(-?[\d.]+),/g)) {
      expect(+x).toBeGreaterThanOrEqual(LINE.x0);
      expect(+x).toBeLessThanOrEqual(LINE.x1);
    }
  });
});
