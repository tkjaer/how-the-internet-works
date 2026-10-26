// The IP dive's maths (style-agnostic): where things sit per orientation, the looping trip of the parcels past this
// hop, and the little bits of routing/NAT logic the pictures need (a routing table built from the route itself).
import type { Orient, Pt } from '$core/api';

export type Mode = 'router' | 'nat' | 'bridge' | 'endpoint';

/** Seconds per loop: one parcel out towards the server, one back. */
export const LOOP = 14;
const LEG = LOOP / 2;
/** Within a leg: walk in, do this hop's job, walk out, rest. */
const IN = 2.4, ACT = 2, OUT = 2.2;

type Spot = Pt & { size: number };
type Box = { x: number; y: number; w: number; h: number };

export interface Layout {
  road: { y: number; x0: number; x1: number };
  /** The client's end (left) and the server's end (right). */
  ends: [Spot, Spot];
  /** This hop when it sits on the road between them. */
  hop: Spot;
  /** This hop when it is an endpoint (it takes its end of the road). */
  home: [Spot, Spot];
  /** Where the parcel walks (y) and stops (x) in front of the hop. */
  walk: number;
  stop: number;
  /** Where an endpoint's parcel stops, beside it: client end, server end. */
  doorstep: [number, number];
  /** Other devices behind the client (a NAT's inside). */
  extras: Spot[];
  /** The address label close-up, and the card for this hop's job. */
  label: Box;
  card: Box;
  names: number;
  /** Parcel scale, and how far an endpoint's contents rise towards the next layer. */
  parcel: number;
  rise: number;
  tags: Pt[];
  /** Name the two ends too, not just this hop. */
  endNames: boolean;
  size: { text: number; big: number };
}

const LAYOUT: Record<Orient | 'compact', Layout> = {
  landscape: {
    road: { y: 730, x0: 70, x1: 1530 },
    ends: [{ x: 215, y: 640, size: 150 }, { x: 1385, y: 640, size: 150 }],
    hop: { x: 800, y: 590, size: 240 },
    home: [{ x: 330, y: 590, size: 250 }, { x: 1270, y: 590, size: 250 }],
    walk: 700,
    stop: 800,
    doorstep: [540, 1060],
    extras: [{ x: 95, y: 655, size: 100 }, { x: 330, y: 660, size: 95 }, { x: 125, y: 575, size: 80 }],
    label: { x: 150, y: 150, w: 580, h: 300 },
    card: { x: 870, y: 150, w: 580, h: 300 },
    names: 830,
    parcel: 1.3,
    rise: 200,
    tags: [{ x: 450, y: 495 }, { x: 1160, y: 495 }],
    endNames: true,
    size: { text: 36, big: 40 },
  },
  /** A short landscape screen (a phone on its side): fewer, bigger things. */
  compact: {
    road: { y: 770, x0: 70, x1: 1530 },
    ends: [{ x: 200, y: 690, size: 140 }, { x: 1400, y: 690, size: 140 }],
    hop: { x: 800, y: 650, size: 220 },
    home: [{ x: 330, y: 640, size: 230 }, { x: 1270, y: 640, size: 230 }],
    walk: 740,
    stop: 800,
    doorstep: [530, 1070],
    extras: [{ x: 85, y: 700, size: 95 }, { x: 320, y: 705, size: 90 }, { x: 110, y: 625, size: 75 }],
    label: { x: 60, y: 130, w: 710, h: 410 },
    card: { x: 830, y: 130, w: 710, h: 410 },
    names: 860,
    parcel: 1.2,
    rise: 160,
    tags: [],
    endNames: false,
    size: { text: 54, big: 58 },
  },
  portrait: {
    road: { y: 1330, x0: 30, x1: 870 },
    ends: [{ x: 130, y: 1250, size: 120 }, { x: 770, y: 1250, size: 120 }],
    hop: { x: 450, y: 1195, size: 230 },
    home: [{ x: 250, y: 1195, size: 240 }, { x: 650, y: 1195, size: 240 }],
    walk: 1300,
    stop: 450,
    doorstep: [430, 470],
    extras: [{ x: 60, y: 1260, size: 85 }, { x: 205, y: 1175, size: 80 }, { x: 70, y: 1150, size: 75 }],
    label: { x: 60, y: 170, w: 780, h: 390 },
    card: { x: 60, y: 600, w: 780, h: 420 },
    names: 1450,
    parcel: 1.4,
    rise: 320,
    tags: [{ x: 450, y: 1530 }],
    endNames: false,
    size: { text: 54, big: 58 },
  },
};

/** The layout for this screen: a landscape panel shorter than this (in CSS px) gets the compact one. */
export function layoutFor(orient: Orient, vp: { h: number; top: number; bottom: number }): Layout {
  return orient === 'landscape' && vp.h - vp.top - vp.bottom < 420 ? LAYOUT.compact : LAYOUT[orient];
}

export type Phase = 'in' | 'act' | 'out' | 'rest';

export interface Moment {
  /** 0 = the first parcel (client → server), 1 = the one coming back. */
  leg: 0 | 1;
  phase: Phase;
  /** 0..1 within the phase. */
  p: number;
  /** The first leg's job is done (a NAT row written, a label swapped…). */
  done: [boolean, boolean];
}

export function moment(t: number): Moment {
  const u = ((t % LOOP) + LOOP) % LOOP;
  const leg = u < LEG ? 0 : 1, s = u - leg * LEG;
  const [phase, p]: [Phase, number] = s < IN ? ['in', s / IN] : s < IN + ACT ? ['act', (s - IN) / ACT]
    : s < IN + ACT + OUT ? ['out', (s - IN - ACT) / OUT] : ['rest', 1];
  const past = phase === 'out' || phase === 'rest';
  return { leg, phase, p, done: [leg === 1 || past, leg === 1 && past] };
}

const ease = (x: number) => x * x * (3 - 2 * x);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** 0 → 1 between a and b. */
export const ramp = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));

/** Where the parcel is along the road, or null when it's off stage. Passing hops: in from one end, pause, out the
 *  other. An endpoint: the first parcel arrives and is opened; the second is written and leaves. */
export function parcelX(m: Moment, L: Layout, mode: Mode, atServer: boolean): number | null {
  const far = L.ends[atServer ? 0 : 1].x;
  const [a, b] = m.leg === 0 ? [L.ends[0].x, L.ends[1].x] : [L.ends[1].x, L.ends[0].x];
  if (mode === 'endpoint') {
    const door = L.doorstep[atServer ? 1 : 0];
    const arriving = m.leg === 0;
    if (arriving) return m.phase === 'in' ? lerp(far, door, ease(m.p)) : m.phase === 'act' && m.p < 0.55 ? door : null;
    return m.phase === 'in' || m.phase === 'rest' ? null : m.phase === 'act' ? (m.p > 0.25 ? door : null) : lerp(door, far, ease(m.p));
  }
  if (m.phase === 'rest') return null;
  return m.phase === 'in' ? lerp(a, L.stop, ease(m.p)) : m.phase === 'act' ? L.stop : lerp(L.stop, b, ease(m.p));
}

/** A little bob while walking. */
export const bob = (t: number, walking: boolean) => (walking ? -Math.abs(Math.sin(t * 7)) * 12 : 0);

/** An address inside the 100.64.0.0/10 shared space (2012), or in 10.0.0.0/8 as carriers used before it, means the
 *  NAT is a carrier's (CGNAT), not a home router: homes here sit on 192.168.x.x. */
export function carrierNat(inside: string): boolean {
  const [a, b] = inside.split('.').map(Number);
  return a === 10 || (a === 100 && b >= 64 && b < 128);
}

/** A neighbour's address near `addr` (same network, a different host). */
export function near(addr: string, i: number): string {
  const o = addr.split('.').map(Number);
  o[3] = (o[3] + 2 + i * 7) % 250 + 2;
  if (i > 0) o[2] = (o[2] + i * 3) % 250;
  return o.join('.');
}

/** The /24 around an address (enough for a picture of a routing table). */
export const prefix24 = (addr: string) => `${addr.split('.').slice(0, 3).join('.')}.0/24`;

export interface Road {
  /** Where the sign points: back towards the client, on towards the server, or off the side. */
  to: 'back' | 'on' | 'side';
  prefix: string;
  /** A Simple-level name for what's down that road (the next NAT/server, or "everywhere else"). */
  name: string | null;
}

/** This router's signposts, built from the route: the client's side (its outside address), the server's side, and
 *  the default route (off the side when the router has a side branch, e.g. to a transit provider; else onwards). The
 *  server's network gets a sign of its own only when the default goes elsewhere. */
export function roads(clientAddr: string, serverAddr: string, clientSide: string, server: string, side: boolean): Road[] {
  const back: Road = { to: 'back', prefix: prefix24(clientAddr), name: clientSide };
  return side
    ? [back, { to: 'on', prefix: prefix24(serverAddr), name: server }, { to: 'side', prefix: '0.0.0.0/0', name: null }]
    : [back, { to: 'on', prefix: '0.0.0.0/0', name: null }];
}

/** Longest-prefix match: the sign a parcel to `addr` follows. */
export function match(rs: Road[], addr: string): number {
  let best = -1, len = -1;
  rs.forEach((r, i) => {
    const [net, bits] = r.prefix.split('/'), n = +bits;
    const a = addr.split('.'), b = net.split('.');
    // our prefixes are whole octets
    if (a.slice(0, n / 8).every((x, k) => x === b[k]) && n > len) { best = i; len = n; }
  });
  return best;
}
