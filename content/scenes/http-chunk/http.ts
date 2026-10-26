import type { Orient, Pt } from '$core/api';

/** One loop: ask for chunk 42 (medium), the cache has it; the connection gets slower; ask for 43 (low), the cache
 *  fetches it from the main copy; the video keeps playing. */
export const LOOP = 18;

type Spot = Pt & { size: number };
export type Box = Pt & { w: number; h: number };
export interface Layout {
  road: { y: number; x0: number; x1: number };
  ends: [Spot, Spot];
  hop: Spot;
  home: [Spot, Spot];
  cards: [Box, Box];
  /** the space under a card's title */
  head: number;
  names: number;
  walk: number;
  parcel: number;
  /** where the technical tags hang, clear of the focused node */
  tags: Record<Where, Pt[]>;
  endNames: boolean;
  compact: boolean;
  /** `status` is a card's bottom line and a sealed hop's size words */
  size: { text: number; big: number; tag: number; mono: number; status: number };
}

const LAYOUT: Record<Orient | 'compact', Layout> = {
  landscape: {
    road: { y: 730, x0: 70, x1: 1530 },
    ends: [{ x: 215, y: 640, size: 150 }, { x: 1385, y: 640, size: 150 }],
    hop: { x: 800, y: 590, size: 240 },
    home: [{ x: 330, y: 590, size: 250 }, { x: 1270, y: 590, size: 250 }],
    cards: [{ x: 130, y: 130, w: 620, h: 340 }, { x: 850, y: 130, w: 620, h: 340 }],
    head: 92,
    names: 830,
    walk: 700,
    parcel: 1.2,
    tags: {
      client: [{ x: 700, y: 515 }, { x: 1200, y: 515 }],
      server: [{ x: 400, y: 515 }, { x: 900, y: 515 }],
      middle: [{ x: 440, y: 515 }, { x: 1160, y: 515 }],
    },
    endNames: true,
    compact: false,
    size: { text: 34, big: 40, tag: 28, mono: 24, status: 34 },
  },
  compact: {
    road: { y: 770, x0: 70, x1: 1530 },
    ends: [{ x: 200, y: 690, size: 140 }, { x: 1400, y: 690, size: 140 }],
    hop: { x: 800, y: 650, size: 220 },
    home: [{ x: 330, y: 640, size: 230 }, { x: 1270, y: 640, size: 230 }],
    cards: [{ x: 60, y: 130, w: 700, h: 400 }, { x: 840, y: 130, w: 700, h: 400 }],
    head: 100,
    names: 860,
    walk: 740,
    parcel: 1.15,
    tags: { client: [], server: [], middle: [] },
    endNames: false,
    compact: true,
    size: { text: 54, big: 58, tag: 40, mono: 42, status: 44 },
  },
  portrait: {
    road: { y: 1360, x0: 30, x1: 870 },
    ends: [{ x: 90, y: 1290, size: 120 }, { x: 820, y: 1290, size: 120 }],
    hop: { x: 450, y: 1250, size: 210 },
    home: [{ x: 230, y: 1230, size: 250 }, { x: 670, y: 1230, size: 250 }],
    cards: [{ x: 60, y: 170, w: 780, h: 400 }, { x: 60, y: 630, w: 780, h: 430 }],
    head: 104,
    names: 1465,
    walk: 1330,
    parcel: 1.15,
    tags: { client: [{ x: 450, y: 1530 }], server: [{ x: 450, y: 1530 }], middle: [{ x: 450, y: 1530 }] },
    endNames: false,
    compact: false,
    size: { text: 50, big: 58, tag: 40, mono: 38, status: 50 },
  },
};

export function layoutFor(orient: Orient, vp: { h: number; top: number; bottom: number }): Layout {
  return orient === 'landscape' && vp.h - vp.top - vp.bottom < 420 ? LAYOUT.compact : LAYOUT[orient];
}

export type Beat = 'ask' | 'hit' | 'slower' | 'ask2' | 'miss' | 'play';
export type Quality = 'med' | 'low';
/** What walks on the road: the request slip up to the server, or the chunk of video back down. */
export interface Walker { kind: 'ask' | 'chunk'; quality: Quality; p: number }

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => n * n * (3 - 2 * n);
export const ramp = (u: number, a: number, b: number) => clamp01((u - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * ease(t);
export const clock = (t: number) => ((t % LOOP) + LOOP) % LOOP;

const BEATS: [Beat, number][] = [['ask', 0], ['hit', 3.6], ['slower', 7.4], ['ask2', 9.4], ['miss', 12.6], ['play', 16.8]];

export function beatAt(t: number): Beat {
  const u = clock(t);
  let beat: Beat = 'ask';
  for (const [b, at] of BEATS) if (u >= at) beat = b;
  return beat;
}

export function httpMoment(t: number) {
  const u = clock(t);
  const beat = beatAt(u);
  const second = u >= 9.4;
  return {
    u,
    beat,
    /** the chunk being asked for, and in which quality */
    chunk: second ? 43 : 42,
    quality: (second ? 'low' : 'med') as Quality,
    /** signal bars, 3 (fast) down to 1 (slow), and back up when the loop starts again */
    bars: 3 - 2 * ramp(u, 7.6, 8.4),
    /** the slip being written (0 → 1) */
    write: second ? ramp(u, 9.4, 9.9) : ramp(u, 0, 0.5),
    /** the shelf looked at: 42 found, then 43 not there */
    look: ramp(u, 3.6, 4.2) * (1 - ramp(u, 7.2, 7.4)) + ramp(u, 12.6, 13.1),
    /** the copy coming from the main copy far away (0 → 1), and whether the shelf holds 43 now */
    fetch: ramp(u, 13.2, 14.4),
    stored: u >= 14.4,
    /** the status stamp: 200 OK */
    ok: u < 9.4 ? ramp(u, 4.2, 4.5) : ramp(u, 14.5, 14.8),
    walker: walkerAt(u),
  };
}

/** The walks of one loop, in order: [kind, quality, start, arrive, gone]. */
const WALKS: [Walker['kind'], Quality, number, number, number][] = [
  ['ask', 'med', 0.4, 3.2, 3.4],
  ['chunk', 'med', 4.6, 7.2, 7.4],
  ['ask', 'low', 9.8, 12.4, 12.6],
  ['chunk', 'low', 14.8, 16.7, 16.9],
];

function walkerAt(u: number): Walker | null {
  const w = WALKS.find(([, , a, , gone]) => u >= a && u < gone);
  return w ? { kind: w[0], quality: w[1], p: ramp(u, w[2], w[3]) } : null;
}

/** How big a parcel walks: a medium chunk is the biggest, a low one smaller, the request slip tiny. Sealed hops see
 *  only this. A web page (1995, `page`) is the other way round: the page (the first answer) is smaller than its
 *  picture. */
export function bulk(w: Pick<Walker, 'kind' | 'quality'>, page = false): number {
  return w.kind === 'ask' ? 0.55 : (w.quality === 'med') !== page ? 1.15 : 0.78;
}

export type Where = 'client' | 'server' | 'middle';

/** Where the walker is: from one end's doorstep to the other's (beside the nodes, never on them). */
export function walkerX(w: Walker, L: Layout, where: Where, page = false): number {
  const half = 72 * L.parcel * bulk(w, page) + 10;
  const c = where === 'client' ? L.home[0] : L.ends[0];
  const s = where === 'server' ? L.home[1] : L.ends[1];
  const clientDoor = c.x + c.size / 2 + half;
  const serverDoor = s.x - s.size / 2 - half;
  return w.kind === 'ask' ? lerp(clientDoor, serverDoor, w.p) : lerp(serverDoor, clientDoor, w.p);
}

/** What a sealed hop sees go by in one loop, in order: only each parcel's direction and size. */
export const SEEN: Pick<Walker, 'kind' | 'quality'>[] = WALKS.map(([kind, quality]) => ({ kind, quality }));

/** How many of SEEN have passed the middle of the road (the hop) so far this loop. */
export function seenSoFar(t: number): number {
  const u = clock(t);
  return WALKS.filter(([, , a, b]) => u >= (a + b) / 2).length;
}
