// The undersea cable's maths (#39), style-agnostic: a side view of the sea, drawn upright in both orientations (a sea
// has a top and a bottom, so it doesn't turn with the phone like the fibre track does). A landing station on each
// shore, the cable down the slope and along the sea floor, repeaters powered through the cable from the shore, and
// light crossing in a few colours.
import type { Orient, Pt } from '$core/api';
import { FIBRE, haulOf, pointAt, polyLength, pulseAt, wrap, type Haul, type LightPulse } from './light';

/** One orientation's sea: the land's top (`land`), the water's surface, the floor the cable lies on (from `a` to `b`
 *  across), where each landing station stands and where the cut-open slice of cable is shown. */
export interface Sea {
  w: number; h: number;
  land: number; surface: number; floor: number;
  /** The shore: where the land meets the water on the left and the right, and where the slopes reach the floor. */
  shore: [number, number]; a: number; b: number;
  stations: [Pt, Pt]; stationSize: number;
  slice: Pt & { r: number };
}
export const SEA: Record<Orient, Sea> = {
  landscape: { w: 1600, h: 900, land: 240, surface: 262, floor: 720, shore: [180, 1420], a: 360, b: 1240, stations: [{ x: 95, y: 240 }, { x: 1505, y: 240 }], stationSize: 1, slice: { x: 800, y: 450, r: 105 } },
  portrait: { w: 900, h: 1600, land: 480, surface: 502, floor: 1180, shore: [150, 750], a: 240, b: 660, stations: [{ x: 84, y: 480 }, { x: 816, y: 480 }], stationSize: 0.7, slice: { x: 450, y: 850, r: 120 } },
};

/** The sea bed and the land either side, as one outline (land top, down the slope, the floor, up the other slope). */
export const ground = (s: Sea): Pt[] => [
  { x: 0, y: s.land }, { x: s.shore[0], y: s.land }, { x: s.a, y: s.floor }, { x: s.b, y: s.floor },
  { x: s.shore[1], y: s.land }, { x: s.w, y: s.land }, { x: s.w, y: s.h }, { x: 0, y: s.h },
];
/** Where a slope from the shore down to the floor is at height y. */
const slopeX = (s: Sea, side: 0 | 1, y: number) => {
  const [top, bottom] = side ? [s.shore[1], s.b] : [s.shore[0], s.a];
  return top + ((bottom - top) * (y - s.land)) / (s.floor - s.land);
};
/** The water: from the surface down to the slopes and the floor. */
export const water = (s: Sea): Pt[] => [
  { x: slopeX(s, 0, s.surface), y: s.surface }, { x: slopeX(s, 1, s.surface), y: s.surface }, { x: s.b, y: s.floor }, { x: s.a, y: s.floor },
];

/** How thick the cable is drawn: it lies on the floor, its middle half this above. */
export const CABLE_W = 22;
/** The cable: out of one landing station, buried down the slope, along the floor, up the other slope and in. */
export function cable(s: Sea): Pt[] {
  const k = s.stationSize, lift = CABLE_W / 2, dx = (p: number) => (p * (s.a - s.shore[0])) / (s.floor - s.land);
  return [
    { x: s.stations[0].x + 40 * k, y: s.land + 6 }, { x: s.shore[0], y: s.land + 14 },
    { x: s.a + dx(lift) * 0.5, y: s.floor - lift }, { x: s.b - dx(lift) * 0.5, y: s.floor - lift },
    { x: s.shore[1], y: s.land + 14 }, { x: s.stations[1].x - 40 * k, y: s.land + 6 },
  ];
}

/** The crossing as a haul (light.ts): `km` long across the floor, a repeater about every `spanKm`. */
export const SPAN_KM = 60;
export const seaHaul = (s: Sea, km: number): Haul => haulOf(km, SPAN_KM, s.a, s.b);

/** The light: `n` colours, two flashes each, along the cable from left to right. */
export function cablePulses(t: number, route: Pt[], n: number): LightPulse[] {
  const L = polyLength(route), out: LightPulse[] = [];
  for (let i = 0; i < n; i++) for (let p = 0; p < 2; p++) out.push(pulseAt(route, wrap(t * FIBRE.speed + (p * L) / 2 + (i * L) / (2 * n), L), i, 50, 4));
  return out;
}
/** The power from the shore: `n` sparks drifting slowly along the copper inside the cable. */
export function sparks(t: number, route: Pt[], n = 7, speed = 70): Pt[] {
  const L = polyLength(route);
  return Array.from({ length: n }, (_, i) => pointAt(route, wrap(t * speed + (i * L) / n, L)));
}

/** A shark (Simple only) cruising to and fro above the cable: where it is and which way it faces. */
export function shark(t: number, x0: number, x1: number, y: number): Pt & { left: boolean } {
  const span = x1 - x0, u = wrap(t * 55, 2 * span);
  return { x: u < span ? x0 + u : x1 - (u - span), y: y + 10 * Math.sin(t * 1.3), left: u >= span };
}
