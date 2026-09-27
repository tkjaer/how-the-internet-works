// The mini-scene as plain data. Every spike renders this same data with its own tech.
// In the real app this would come from content folders (nodes/links/technologies).
import phoneSvg from './art/phone.svg?raw';
import apSvg from './art/ap.svg?raw';
import routerSvg from './art/router.svg?raw';
import cloudSvg from './art/cloud.svg?raw';

export const SCENES = ['overview', 'wifi', 'fibre'] as const;
export type SceneId = (typeof SCENES)[number];
export type DetailId = Exclude<SceneId, 'overview'>;

export const WORLD = { w: 1600, h: 900 };
/** Detail scenes are authored in their own 1600×900 space and nested at this scale. */
export const DETAIL_SCALE = 0.1;

export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export type NodeId = 'phone' | 'ap' | 'router' | 'internet';
export interface SceneNode { id: NodeId; x: number; y: number; size: number; svg: string; label: string; labelAbove?: boolean }
/** World y of a node's label baseline. */
export const labelY = (n: SceneNode) => (n.labelAbove ? n.y - n.size / 2 + 6 : n.y + n.size / 2 + 28);

export const nodes: SceneNode[] = [
  { id: 'phone', x: 230, y: 560, size: 210, svg: phoneSvg, label: 'node.phone' },
  { id: 'ap', x: 640, y: 380, size: 190, svg: apSvg, label: 'node.ap', labelAbove: true },
  { id: 'router', x: 1010, y: 580, size: 200, svg: routerSvg, label: 'node.router' },
  { id: 'internet', x: 1380, y: 360, size: 250, svg: cloudSvg, label: 'node.internet' },
];

export type Tech = 'wifi' | 'ethernet' | 'fibre';
export interface SceneLink {
  id: string;
  from: NodeId;
  to: NodeId;
  tech: Tech;
  label: string;
  detail?: DetailId;
  /** Quadratic Bézier: start, control, end. */
  p0: Pt; c: Pt; p1: Pt;
}

export const links: SceneLink[] = [
  { id: 'phone-ap', from: 'phone', to: 'ap', tech: 'wifi', label: 'link.wifi', detail: 'wifi',
    p0: { x: 300, y: 500 }, c: { x: 420, y: 360 }, p1: { x: 580, y: 400 } },
  { id: 'ap-router', from: 'ap', to: 'router', tech: 'ethernet', label: 'link.ethernet',
    p0: { x: 690, y: 450 }, c: { x: 790, y: 640 }, p1: { x: 920, y: 590 } },
  { id: 'router-internet', from: 'router', to: 'internet', tech: 'fibre', label: 'link.fibre', detail: 'fibre',
    p0: { x: 1100, y: 570 }, c: { x: 1250, y: 580 }, p1: { x: 1290, y: 430 } },
];

export const TECH_COLOUR: Record<Tech, string> = { wifi: '#3ef0ff', ethernet: '#ffb547', fibre: '#ff4fd8' };
export const PACKET_COLOUR = { request: '#ffe066', video: '#ff6b8b' };
export const DWDM = ['#ff4d6d', '#ffd23f', '#3ef0a0', '#4dabff'];
export const BG = { top: '#161c52', bottom: '#070a24', grid: '#26307a' };

export function bezier(l: SceneLink, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * l.p0.x + 2 * u * t * l.c.x + t * t * l.p1.x,
    y: u * u * l.p0.y + 2 * u * t * l.c.y + t * t * l.p1.y,
  };
}
export function bezierAngle(l: SceneLink, t: number): number {
  const dx = 2 * (1 - t) * (l.c.x - l.p0.x) + 2 * t * (l.p1.x - l.c.x);
  const dy = 2 * (1 - t) * (l.c.y - l.p0.y) + 2 * t * (l.p1.y - l.c.y);
  return Math.atan2(dy, dx);
}
export const linkPath = (l: SceneLink) => `M${l.p0.x} ${l.p0.y} Q${l.c.x} ${l.c.y} ${l.p1.x} ${l.p1.y}`;

/** Where each detail scene lives inside the overview (a 160×90 rect centred on the link). */
export function detailRect(id: DetailId): Rect {
  const l = links.find((k) => k.detail === id)!;
  const m = bezier(l, 0.5);
  const w = WORLD.w * DETAIL_SCALE, h = WORLD.h * DETAIL_SCALE;
  return { x: m.x - w / 2, y: m.y - h / 2, w, h };
}
export const OVERVIEW_RECT: Rect = { x: 0, y: 0, w: WORLD.w, h: WORLD.h };
export const sceneRect = (s: SceneId) => (s === 'overview' ? OVERVIEW_RECT : detailRect(s));

/** Tap target: which diveable link (if any) is at this world point. */
export function hitDetail(p: Pt, radius = 90): DetailId | undefined {
  let best: DetailId | undefined, bestD = radius;
  for (const l of links) {
    if (!l.detail) continue;
    for (let i = 0; i <= 20; i++) {
      const q = bezier(l, i / 20);
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < bestD) { bestD = d; best = l.detail; }
    }
  }
  return best;
}

/** Packet schedule shared by all spikes so they animate the same thing. */
export interface PacketSpec { kind: 'request' | 'video'; route: string[]; duration: number; every: number; offset: number }
export const packets: PacketSpec[] = [
  { kind: 'request', route: ['phone-ap', 'ap-router', 'router-internet'], duration: 3.2, every: 3.2, offset: 0 },
  { kind: 'video', route: ['router-internet', 'ap-router', 'phone-ap'], duration: 3.6, every: 1.2, offset: 0.4 },
];
/** Position of a packet that has been travelling for `age` seconds, or null if finished. */
export function packetPos(spec: PacketSpec, age: number): (Pt & { angle: number; link: SceneLink }) | null {
  const f = age / spec.duration;
  if (f < 0 || f >= 1) return null;
  const n = spec.route.length;
  const seg = Math.min(n - 1, Math.floor(f * n));
  const local = f * n - seg;
  const l = links.find((k) => k.id === spec.route[seg])!;
  const forward = spec.kind === 'request';
  const t = forward ? easeInOut(local) : 1 - easeInOut(local);
  return { ...bezier(l, t), angle: bezierAngle(l, t) + (forward ? 0 : Math.PI), link: l };
}
/** All packets alive at time `time` (seconds). */
export function livePackets(time: number) {
  const out: { spec: PacketSpec; id: string; age: number }[] = [];
  for (const [si, spec] of packets.entries()) {
    const k0 = Math.floor((time - spec.offset - spec.duration) / spec.every);
    const k1 = Math.floor((time - spec.offset) / spec.every);
    for (let k = Math.max(0, k0); k <= k1; k++) {
      const age = time - spec.offset - k * spec.every;
      if (age >= 0 && age < spec.duration) out.push({ spec, id: `${si}-${k}`, age });
    }
  }
  return out;
}
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2) * 0.35 + x * 0.65;
