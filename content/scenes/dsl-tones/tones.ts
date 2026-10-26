// The phone line's maths, kept free of Svelte so it can be tested: the twisted pair, the tones riding it, the band
// plan and bits per tone on the chart, and the rough speed a line of a given length gets.
export interface Pt { x: number; y: number }
export type Band = 'voice' | 'up' | 'down';

/** The track, drawn in landscape space (portrait turns it with copper-pulses' trackMatrix / toScene). */
export const LINE = { fromX: 150, toX: 1450, nodeY: 220, x0: 300, x1: 1300, amp: 9, twist: 110, speed: 150 };

const fixed = (n: number) => n.toFixed(1);
const smooth = (t: number) => t * t * (3 - 2 * t);

/** One of the pair's two wires, twisting round the other. */
export function wirePath(wire: 0 | 1): string {
  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const x = LINE.x0 + ((LINE.x1 - LINE.x0) * i) / 80;
    pts.push(`${fixed(x)},${fixed(LINE.nodeY + Math.sin(((x - LINE.x0) / LINE.twist) * Math.PI * 2 + (wire ? Math.PI : 0)) * LINE.amp)}`);
  }
  return 'M' + pts.join(' ');
}

/** A burst of wave between x0 and x1 on the line: `len` is the wavelength, so higher pitch = shorter `len`. */
function burst(x0: number, x1: number, len: number, amp: number, phase: number, envelope: boolean): string {
  const pts: string[] = [];
  const n = Math.max(8, Math.ceil((x1 - x0) / 4));
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = x0 + (x1 - x0) * u;
    const env = envelope ? Math.sin(u * Math.PI) ** 2 : 1;
    pts.push(`${fixed(x)},${fixed(LINE.nodeY + Math.sin(((x - phase) / len) * Math.PI * 2) * amp * env)}`);
  }
  return 'M' + pts.join(' ');
}

export interface Tone { key: string; band: Band; d: string; alpha: number }

/** What rides the wire at time t: a slow phone-call wave the whole way, short tones going up (to the cabinet, right)
 *  and more, quicker tones coming down (to the home, left). Still motion freezes one readable moment. */
export function lineTones(t: number, still: boolean): Tone[] {
  const tt = still ? 2.4 : t;
  const span = LINE.x1 - LINE.x0, w = 170;
  const out: Tone[] = [{ key: 'voice', band: 'voice', d: burst(LINE.x0, LINE.x1, 320, 18, tt * 40, false), alpha: 1 }];
  const bursts = [
    { band: 'up' as const, n: 2, len: 44, amp: 17, dir: 1 },
    { band: 'down' as const, n: 3, len: 20, amp: 15, dir: -1 },
  ];
  for (const b of bursts) for (let i = 0; i < b.n; i++) {
    const f = ((tt * LINE.speed + (i * span) / b.n + (b.dir < 0 ? span * 0.21 : 0)) % span) / span;
    const c = b.dir > 0 ? LINE.x0 + f * span : LINE.x1 - f * span;
    const edge = Math.min((c - LINE.x0) / 120, (LINE.x1 - c) / 120, 1);
    const x0 = Math.max(LINE.x0, c - w / 2), x1 = Math.min(LINE.x1, c + w / 2);
    out.push({ key: `${b.band}-${i}`, band: b.band, d: burst(x0, x1, b.len, b.amp, c, true), alpha: smooth(Math.max(0, edge)) });
  }
  return out;
}

/** Top of VDSL2 profile 17a. */
export const TOP_HZ = 17.664e6;
/** Where a pitch sits across the chart (0..1): a power scale, so the narrow low bands still show next to the wide high ones. */
export const pitchX = (hz: number) => Math.pow(Math.min(Math.max(hz, 0), TOP_HZ) / TOP_HZ, 0.35);

/** VDSL2 band plan 998 (Europe) up to 17a, above the telephone's voice band, in Hz. */
export const PLAN_998: { band: Band; from: number; to: number }[] = [
  { band: 'voice', from: 0, to: 4e3 },
  { band: 'up', from: 25e3, to: 138e3 },
  { band: 'down', from: 138e3, to: 3.75e6 },
  { band: 'up', from: 3.75e6, to: 5.2e6 },
  { band: 'down', from: 5.2e6, to: 8.5e6 },
  { band: 'up', from: 8.5e6, to: 12e6 },
  { band: 'down', from: 12e6, to: TOP_HZ },
];

export interface Span { band: Band; x0: number; x1: number }
/** The lanes on the chart: Simple gets three (talk, up, down), Technical the real 998 plan. */
export function bandSpans(technical: boolean): Span[] {
  if (!technical) return [{ band: 'voice', x0: 0, x1: 0.12 }, { band: 'up', x0: 0.16, x1: 0.36 }, { band: 'down', x0: 0.4, x1: 1 }];
  return PLAN_998.map((b) => ({ band: b.band, x0: pitchX(b.from), x1: pitchX(b.to) }));
}

/** Bits a tone carries (0–15): high tones fade more on the wire, the more so the longer it is. */
export function bitsAt(x: number, km: number): number {
  return Math.max(0, Math.min(15, Math.round(15 - x * (5 + 9 * km))));
}

export interface Bar { key: string; band: Band; x: number; bits: number }
/** The tone bars in the data lanes, gently twinkling as the modems keep checking each tone. */
export function toneBars(spans: Span[], km: number, t: number, still: boolean, step = 0.02): Bar[] {
  const out: Bar[] = [];
  for (const [j, s] of spans.entries()) {
    if (s.band === 'voice') continue;
    for (let x = s.x0 + step / 2, i = 0; x < s.x1; x += step, i++) {
      const wobble = still ? 0 : Math.round(Math.sin(t * 1.3 + i * 1.7 + j) * 0.6);
      out.push({ key: `${j}-${i}`, band: s.band, x, bits: Math.max(0, Math.min(15, bitsAt(x, km) + wobble)) });
    }
  }
  return out;
}

/** Rough VDSL2 17a download speed against line length in a full cable in 2010 (crosstalk, no vectoring yet), in Mbit/s:
 *  what the line could carry; this home's plan is less (its technology's rate). */
const RATE: [number, number][] = [[0, 100], [0.3, 65], [0.5, 48], [1, 25], [1.5, 13], [2, 7], [2.5, 4]];
export const MAX_KM = RATE[RATE.length - 1][0];
export const MAX_MBIT = RATE[0][1];
export function speedAt(km: number): number {
  const k = Math.min(Math.max(km, 0), MAX_KM);
  for (let i = 1; i < RATE.length; i++) {
    const [k0, r0] = RATE[i - 1], [k1, r1] = RATE[i];
    if (k <= k1) return r0 + ((r1 - r0) * (k - k0)) / (k1 - k0);
  }
  return RATE[RATE.length - 1][1];
}

/** The speed curve in a w × h box (0 km at the left, MAX_MBIT at the top). */
export function speedPath(x: number, y: number, w: number, h: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= 50; i++) {
    const k = (MAX_KM * i) / 50;
    pts.push(`${fixed(x + (w * k) / MAX_KM)},${fixed(y + h - (h * speedAt(k)) / MAX_MBIT)}`);
  }
  return 'M' + pts.join(' ');
}
