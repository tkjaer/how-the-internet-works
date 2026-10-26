import type { Orient, Pt } from '$core/api';

export const LOOP = 16;

type Spot = Pt & { size: number };
type Box = Pt & { w: number; h: number };
export interface Layout {
  road: { y: number; x0: number; x1: number };
  ends: [Spot, Spot];
  hop: Spot;
  home: [Spot, Spot];
  cards: [Box, Box];
  names: number;
  walk: number;
  parcel: number;
  crow: Pt;
  wire: { x1: number; x2: number; y: number };
  tags: Pt[];
  endNames: boolean;
  compact: boolean;
  size: { text: number; big: number; tag: number };
}

const LAYOUT: Record<Orient | 'compact', Layout> = {
  landscape: {
    road: { y: 730, x0: 70, x1: 1530 },
    ends: [{ x: 215, y: 640, size: 150 }, { x: 1385, y: 640, size: 150 }],
    hop: { x: 800, y: 590, size: 240 },
    home: [{ x: 330, y: 590, size: 250 }, { x: 1270, y: 590, size: 250 }],
    cards: [{ x: 130, y: 130, w: 620, h: 330 }, { x: 850, y: 130, w: 620, h: 330 }],
    names: 830,
    walk: 700,
    parcel: 1.3,
    crow: { x: 595, y: 600 },
    wire: { x1: 505, x2: 695, y: 600 },
    tags: [{ x: 440, y: 505 }, { x: 1160, y: 505 }],
    endNames: true,
    compact: false,
    size: { text: 36, big: 40, tag: 28 },
  },
  compact: {
    road: { y: 770, x0: 70, x1: 1530 },
    ends: [{ x: 200, y: 690, size: 140 }, { x: 1400, y: 690, size: 140 }],
    hop: { x: 800, y: 650, size: 220 },
    home: [{ x: 330, y: 640, size: 230 }, { x: 1270, y: 640, size: 230 }],
    cards: [{ x: 60, y: 130, w: 700, h: 385 }, { x: 840, y: 130, w: 700, h: 385 }],
    names: 860,
    walk: 740,
    parcel: 1.2,
    crow: { x: 590, y: 650 },
    wire: { x1: 500, x2: 690, y: 650 },
    tags: [],
    endNames: false,
    compact: true,
    size: { text: 54, big: 58, tag: 40 },
  },
  portrait: {
    road: { y: 1380, x0: 30, x1: 870 },
    ends: [{ x: 90, y: 1310, size: 120 }, { x: 820, y: 1310, size: 120 }],
    hop: { x: 450, y: 1270, size: 210 },
    home: [{ x: 230, y: 1250, size: 250 }, { x: 670, y: 1250, size: 250 }],
    cards: [{ x: 60, y: 170, w: 780, h: 395 }, { x: 60, y: 625, w: 780, h: 395 }],
    names: 1490,
    walk: 1350,
    parcel: 1.2,
    crow: { x: 655, y: 1165 },
    wire: { x1: 585, x2: 725, y: 1165 },
    tags: [{ x: 450, y: 1545 }],
    endNames: false,
    compact: false,
    size: { text: 54, big: 58, tag: 40 },
  },
};

export function layoutFor(orient: Orient, vp: { h: number; top: number; bottom: number }): Layout {
  return orient === 'landscape' && vp.h - vp.top - vp.bottom < 420 ? LAYOUT.compact : LAYOUT[orient];
}

/** Half a paint pot's width at scale 1, rim and outline included (art/Pot.svelte). */
export const POT_HALF = 52;

/** The paint card's two rows, "who: pot + pot = pot": where the words, pots and signs go so the three pots are one
 *  size and the signs sit in clear gaps between them (#90), for row words up to `chars` long. The paint goes in card
 *  `c`: the second at Simple, the first at Technical, which shows the keys mixed first (TLS 1.3). */
export function paintRows(L: Layout, c: Box, o: Orient, chars: number) {
  const portrait = o === 'portrait';
  const words = portrait ? L.size.text * 0.92 : L.compact ? L.size.text * 0.78 : L.size.text;
  const scale = portrait ? 1.1 : L.compact ? 1.02 : 0.92, half = POT_HALF * scale;
  const label = c.x + (L.compact ? 34 : 42);
  const first = label + chars * 0.6 * words + 24 + half;
  const step = Math.min(portrait ? 175 : L.compact ? 165 : 150, (c.x + c.w - 30 - half - first) / 2);
  return {
    label, words, scale, half,
    rows: (portrait ? [168, 320] : L.compact ? [160, 285] : [152, 266]).map((dy) => c.y + dy) as [number, number],
    pots: [first, first + step, first + 2 * step] as [number, number, number],
    signs: [first + step / 2, first + 1.5 * step] as [number, number],
    baseline: portrait ? 18 : 13,
  };
}

export type Beat = 'id' | 'mix' | 'swap' | 'brown' | 'locked';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => n * n * (3 - 2 * n);
export const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * ease(t);

/** The loop's beats. Simple shows the ID checked first; TLS 1.3 really mixes the keys first and only then sends the
 *  certificate, already encrypted (RFC 8446 §2), so `keysFirst` (Technical) plays the paint before the ID. Both lock at
 *  10.8 s. `idT` is the time into the ID beat (negative before it). */
export function tlsMoment(t: number, keysFirst = false) {
  const u = ((t % LOOP) + LOOP) % LOOP;
  const id = keysFirst ? 7.6 : 0, paint = keysFirst ? 0 : 3.2, k = u - paint;
  const beat: Beat = u >= 10.8 ? 'locked' : u >= id && u < id + 3.2 ? 'id' : k < 3.8 ? 'mix' : k < 6.8 ? 'swap' : 'brown';
  return { u, beat, idT: u - id, swap: ramp(k, 3.8, 6.5), brown: ramp(k, 6.2, 7.5) };
}

/** Where the parcel stands: on a doorstep beside a node, never on it. Sealed hops receive it on their left in portrait. */
export function parcelX(u: number, L: Layout, endpoint: 'client' | 'server' | 'middle') {
  const half = 72 * L.parcel + 10;
  const c = endpoint === 'client' ? L.home[0] : L.ends[0];
  const s = endpoint === 'server' ? L.home[1] : L.ends[1];
  const clientDoor = c.x + c.size / 2 + half;
  const serverDoor = s.x - s.size / 2 - half;
  const hopDoor = L.crow.x < L.hop.x ? L.hop.x + L.hop.size / 2 + half : L.hop.x - L.hop.size / 2 - half;
  const wait = endpoint === 'client' ? clientDoor : endpoint === 'server' ? serverDoor : hopDoor;
  if (u < 10.8) return wait;
  return lerp(endpoint === 'server' ? clientDoor : wait, serverDoor, ramp(u, 10.8, 15.4));
}
