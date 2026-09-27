// The mini-scene as plain data, independent of the renderer and of the art style.
// Every "path scene" (the overview and the expanded internet) is a small graph of nodes + links, authored twice:
// once for landscape (1600×900) and once for portrait (900×1600, the path runs bottom → top).
// Child scenes ("look inside" dives and "expand" sub-paths) are authored in their own space and nested at
// DETAIL_SCALE inside the thing they explain (semantic zoom).

export const SCENES = ['overview', 'wifi', 'fibre', 'internet'] as const;
export type SceneId = (typeof SCENES)[number];
export type ChildId = Exclude<SceneId, 'overview'>;
export const CHILDREN: ChildId[] = ['wifi', 'fibre', 'internet'];
/** How a child scene is entered: "dive" = look inside (layers / physical), "expand" = more hops along the path. */
export const CHILD_KIND: Record<ChildId, 'dive' | 'expand'> = { wifi: 'dive', fibre: 'dive', internet: 'expand' };
export type PathSceneId = 'overview' | 'internet';
export const isPathScene = (s: SceneId): s is PathSceneId => s === 'overview' || s === 'internet';

export type Orient = 'landscape' | 'portrait';
export const WORLD_SIZE: Record<Orient, { w: number; h: number }> = {
  landscape: { w: 1600, h: 900 },
  portrait: { w: 900, h: 1600 },
};
export const DETAIL_SCALE = 0.1;

export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

/** Art ids a theme must be able to draw (Device slot). */
export type DeviceId =
  | 'phone' | 'ap' | 'router' | 'internet'
  | 'home' | 'cabinet' | 'backhaul' | 'bng' | 'core' | 'transit' | 'ixp' | 'cdn';
export const DEVICE_IDS: DeviceId[] = ['phone', 'ap', 'router', 'internet', 'home', 'cabinet', 'backhaul', 'bng', 'core', 'transit', 'ixp', 'cdn'];

/** Link technologies. A new access technology (xDSL, PON, …) is a new entry here plus optional art. */
export type Tech = 'wifi' | 'ethernet' | 'fibre' | 'backbone';
export type PacketKind = 'request' | 'video';

export interface SceneNode {
  id: DeviceId; x: number; y: number; size: number;
  label: string; labelAbove?: boolean;
  /** Tapping expands into this child scene. */
  expand?: ChildId;
  /** Nerd-mode in-scene tag (locale key). */
  tag?: string;
}
export interface SceneLink {
  id: string; from: DeviceId; to: DeviceId; tech: Tech; label?: string;
  /** Tapping "looks inside" this child scene. */
  dive?: ChildId;
  tag?: string;
  /** Quadratic Bézier: start, control, end. */
  p0: Pt; c: Pt; p1: Pt;
  /** Label offset from the link midpoint. */
  lo?: [number, number];
  dashed?: boolean;
}
export interface PacketSpec { kind: PacketKind; route: string[]; duration: number; every: number; offset: number }
export interface PathSceneData { nodes: SceneNode[]; links: SceneLink[]; packets: PacketSpec[]; stops: string[] }

type NodeDef = Omit<SceneNode, 'x' | 'y' | 'size'>;
/** Position per orientation; the optional 4th entry overrides `labelAbove` for that orientation. */
type Placement = Record<Orient, [x: number, y: number, size: number, labelAbove?: boolean]>;

function place(defs: (NodeDef & { at: Placement })[], o: Orient): SceneNode[] {
  return defs.map(({ at, ...d }) => ({ ...d, x: at[o][0], y: at[o][1], size: at[o][2], labelAbove: at[o][3] ?? d.labelAbove }));
}

/** Auto-route a gently curved link between two node edges. */
function autoLink(nodes: SceneNode[], id: string, from: DeviceId, to: DeviceId, tech: Tech, bend = 0.12, extra: Partial<SceneLink> = {}): SceneLink {
  const a = nodes.find((n) => n.id === from)!, b = nodes.find((n) => n.id === to)!;
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  const p0 = { x: a.x + ux * a.size * 0.45, y: a.y + uy * a.size * 0.45 };
  const p1 = { x: b.x - ux * b.size * 0.45, y: b.y - uy * b.size * 0.45 };
  const m = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
  const c = { x: m.x - uy * L * bend, y: m.y + ux * L * bend };
  return { id, from, to, tech, p0, c, p1, ...extra };
}

// ---------------------------------------------------------------- overview
const overviewNodes: (NodeDef & { at: Placement })[] = [
  { id: 'phone', label: 'node.phone', tag: 'tag.phone', at: { landscape: [230, 560, 210], portrait: [250, 1330, 250] } },
  { id: 'ap', label: 'node.ap', labelAbove: true, tag: 'tag.ap', at: { landscape: [640, 380, 190], portrait: [650, 1030, 220, false] } },
  { id: 'router', label: 'node.router', tag: 'tag.router', at: { landscape: [1010, 580, 200], portrait: [260, 720, 230] } },
  { id: 'internet', label: 'node.internet', expand: 'internet', tag: 'tag.internet', at: { landscape: [1380, 360, 250], portrait: [610, 330, 300] } },
];

const overviewLinks: Record<Orient, SceneLink[]> = {
  landscape: [
    { id: 'phone-ap', from: 'phone', to: 'ap', tech: 'wifi', label: 'link.wifi', dive: 'wifi', tag: 'tag.wifi', lo: [-10, -58],
      p0: { x: 300, y: 500 }, c: { x: 420, y: 360 }, p1: { x: 580, y: 400 } },
    { id: 'ap-router', from: 'ap', to: 'router', tech: 'ethernet', label: 'link.ethernet', tag: 'tag.ethernet', lo: [0, 62],
      p0: { x: 690, y: 450 }, c: { x: 790, y: 640 }, p1: { x: 920, y: 590 } },
    { id: 'router-internet', from: 'router', to: 'internet', tech: 'fibre', label: 'link.fibre', dive: 'fibre', tag: 'tag.fibre', lo: [40, 70],
      p0: { x: 1100, y: 570 }, c: { x: 1250, y: 580 }, p1: { x: 1290, y: 430 } },
  ],
  portrait: [], // auto-routed from the node positions in build()
};

// ---------------------------------------------------------------- the internet, expanded
const internetNodes: (NodeDef & { at: Placement })[] = [
  { id: 'home', label: 'node.home', at: { landscape: [110, 640, 130], portrait: [220, 1450, 140] } },
  { id: 'cabinet', label: 'node.cabinet', labelAbove: true, tag: 'tag.cabinet', at: { landscape: [320, 450, 160], portrait: [670, 1290, 170] } },
  { id: 'backhaul', label: 'node.backhaul', tag: 'tag.backhaul', at: { landscape: [540, 640, 160], portrait: [230, 1100, 170] } },
  { id: 'bng', label: 'node.bng', labelAbove: true, tag: 'tag.bng', at: { landscape: [760, 450, 160], portrait: [670, 910, 170] } },
  { id: 'core', label: 'node.core', tag: 'tag.core', at: { landscape: [990, 640, 170], portrait: [260, 720, 180] } },
  { id: 'transit', label: 'node.transit', labelAbove: true, tag: 'tag.transit', at: { landscape: [1000, 200, 140], portrait: [150, 480, 140, false] } },
  { id: 'ixp', label: 'node.ixp', labelAbove: true, tag: 'tag.ixp', at: { landscape: [1230, 450, 170], portrait: [670, 520, 180] } },
  { id: 'cdn', label: 'node.cdn', tag: 'tag.cdn', at: { landscape: [1470, 640, 160], portrait: [330, 270, 180] } },
];

function internetLinks(nodes: SceneNode[]): SceneLink[] {
  return [
    autoLink(nodes, 'home-cabinet', 'home', 'cabinet', 'fibre', 0.1),
    autoLink(nodes, 'cabinet-backhaul', 'cabinet', 'backhaul', 'fibre', -0.1),
    autoLink(nodes, 'backhaul-bng', 'backhaul', 'bng', 'fibre', 0.1),
    autoLink(nodes, 'bng-core', 'bng', 'core', 'backbone', -0.1),
    autoLink(nodes, 'core-transit', 'core', 'transit', 'backbone', 0.08, { dashed: true }),
    autoLink(nodes, 'core-ixp', 'core', 'ixp', 'backbone', 0.1),
    autoLink(nodes, 'ixp-cdn', 'ixp', 'cdn', 'backbone', -0.1),
  ];
}
const internetRoute = ['home-cabinet', 'cabinet-backhaul', 'backhaul-bng', 'bng-core', 'core-ixp', 'ixp-cdn'];

function build(o: Orient): Record<PathSceneId, PathSceneData> {
  const ovNodes = place(overviewNodes, o);
  const inNodes = place(internetNodes, o);
  return {
    overview: {
      nodes: ovNodes,
      links: o === 'landscape' ? overviewLinks.landscape : [
        autoLink(ovNodes, 'phone-ap', 'phone', 'ap', 'wifi', 0.16, { label: 'link.wifi', dive: 'wifi', tag: 'tag.wifi', lo: [-30, -64] }),
        autoLink(ovNodes, 'ap-router', 'ap', 'router', 'ethernet', 0.16, { label: 'link.ethernet', tag: 'tag.ethernet', lo: [-44, 56] }),
        autoLink(ovNodes, 'router-internet', 'router', 'internet', 'fibre', 0.16, { label: 'link.fibre', dive: 'fibre', tag: 'tag.fibre', lo: [-60, -50] }),
      ],
      packets: [
        { kind: 'request', route: ['phone-ap', 'ap-router', 'router-internet'], duration: 3.6, every: 3.6, offset: 0 },
        { kind: 'video', route: ['router-internet', 'ap-router', 'phone-ap'], duration: 4, every: 1.3, offset: 0.4 },
      ],
      stops: ['phone', 'phone-ap', 'ap', 'ap-router', 'router', 'router-internet', 'internet'],
    },
    internet: {
      nodes: inNodes,
      links: internetLinks(inNodes),
      packets: [
        { kind: 'request', route: internetRoute, duration: 6, every: 6, offset: 0 },
        { kind: 'video', route: [...internetRoute].reverse(), duration: 6.5, every: 1.6, offset: 0.8 },
      ],
      stops: ['cabinet', 'backhaul', 'bng', 'core', 'transit', 'ixp', 'cdn'],
    },
  };
}

const DATA = { landscape: build('landscape'), portrait: build('portrait') };

// ---------------------------------------------------------------- current orientation
let orient: Orient = 'landscape';
export const getOrient = () => orient;
export const setOrient = (o: Orient) => { orient = o; };
export const world = (o = orient) => WORLD_SIZE[o];
export const pathScene = (s: PathSceneId, o = orient) => DATA[o][s];

/** Where each child scene is anchored in the overview. */
export function childAnchor(id: ChildId, o = orient): Pt {
  const ov = DATA[o].overview;
  if (id === 'internet') { const n = ov.nodes.find((k) => k.expand === id)!; return { x: n.x, y: n.y + n.size * 0.06 }; }
  const l = ov.links.find((k) => k.dive === id)!;
  return bezier(l, 0.5);
}
/** The child's own world rect, nested in overview coordinates. */
export function childRect(id: ChildId, o = orient): Rect {
  const m = childAnchor(id, o), W = WORLD_SIZE[o];
  const w = W.w * DETAIL_SCALE, h = W.h * DETAIL_SCALE;
  return { x: m.x - w / 2, y: m.y - h / 2, w, h };
}
export const overviewRect = (o = orient): Rect => ({ x: 0, y: 0, ...WORLD_SIZE[o] });
export const sceneRect = (s: SceneId, o = orient) => (s === 'overview' ? overviewRect(o) : childRect(s, o));
/** What the camera frames: portrait path scenes leave a little empty sky/ground, so trim it to get bigger nodes. */
export const fitRect = (s: SceneId, o = orient): Rect => {
  const r = sceneRect(s, o);
  if (o === 'landscape' || (s !== 'overview' && s !== 'internet')) return r;
  const t = r.h * (130 / 1600), b = r.h * (110 / 1600);
  return { x: r.x, y: r.y + t, w: r.w, h: r.h - t - b };
};

/** Scene-local → overview-world coordinates. */
export function toWorld(s: SceneId, p: Pt): Pt {
  if (s === 'overview') return p;
  const r = childRect(s);
  return { x: r.x + p.x * DETAIL_SCALE, y: r.y + p.y * DETAIL_SCALE };
}
export function toLocal(s: SceneId, p: Pt): Pt {
  if (s === 'overview') return p;
  const r = childRect(s);
  return { x: (p.x - r.x) / DETAIL_SCALE, y: (p.y - r.y) / DETAIL_SCALE };
}
export const sceneScale = (s: SceneId) => (s === 'overview' ? 1 : DETAIL_SCALE);

// ---------------------------------------------------------------- geometry helpers
type Curve = Pick<SceneLink, 'p0' | 'c' | 'p1'>;
export function bezier(l: Curve, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * l.p0.x + 2 * u * t * l.c.x + t * t * l.p1.x,
    y: u * u * l.p0.y + 2 * u * t * l.c.y + t * t * l.p1.y,
  };
}
export function bezierAngle(l: Curve, t: number): number {
  const dx = 2 * (1 - t) * (l.c.x - l.p0.x) + 2 * t * (l.p1.x - l.c.x);
  const dy = 2 * (1 - t) * (l.c.y - l.p0.y) + 2 * t * (l.p1.y - l.c.y);
  return Math.atan2(dy, dx);
}
export const linkPath = (l: Curve) => `M${l.p0.x} ${l.p0.y} Q${l.c.x} ${l.c.y} ${l.p1.x} ${l.p1.y}`;
/** Approximate length of a link curve. */
export function linkLength(l: Curve, n = 16) {
  let L = 0, a = l.p0;
  for (let i = 1; i <= n; i++) { const b = bezier(l, i / n); L += Math.hypot(b.x - a.x, b.y - a.y); a = b; }
  return L;
}
/** World y of a node's label baseline. */
export const labelY = (n: SceneNode) => (n.labelAbove ? n.y - n.size / 2 - 4 : n.y + n.size / 2 + 30);

// ---------------------------------------------------------------- stops (sideways navigation)
export interface Stop { id: string; scene: SceneId; kind: 'node' | 'link' | 'scene'; rect: Rect; title: string }

/** Ordered stops at the level of `scene`. The dives form their own "physical" level. */
export function stopsFor(scene: SceneId): Stop[] {
  if (!isPathScene(scene)) {
    return (['wifi', 'fibre'] as const).map((s) => ({ id: s, scene: s, kind: 'scene', rect: sceneRect(s), title: `${s}.title` }));
  }
  const d = pathScene(scene);
  return d.stops.map((id) => {
    const n = d.nodes.find((k) => k.id === id);
    if (n) {
      const s = n.size * 2;
      return { id, scene, kind: 'node', title: n.label, rect: { x: n.x - s / 2, y: n.y - s / 2 + n.size * (n.labelAbove ? -0.12 : 0.14), w: s, h: s } };
    }
    const l = d.links.find((k) => k.id === id)!;
    const xs = [l.p0.x, l.c.x, l.p1.x], ys = [l.p0.y, l.c.y, l.p1.y];
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 120;
    return { id, scene, kind: 'link', title: l.label ?? `stop.${id}.title`, rect: { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 } };
  });
}
export function stopRectWorld(st: Stop): Rect {
  if (st.kind === 'scene') return st.rect;
  const a = toWorld(st.scene, { x: st.rect.x, y: st.rect.y }), k = sceneScale(st.scene);
  return { x: a.x, y: a.y, w: st.rect.w * k, h: st.rect.h * k };
}

// ---------------------------------------------------------------- learn more (issue #4)
export interface LearnMore { url: string; title: string; level: 'kid' | 'nerd' | 'both'; lang?: string }
/** Curated onward links per scene. `title` is a locale key; `lang` restricts a link to one language pack. */
export const LEARN_MORE: Record<SceneId, LearnMore[]> = {
  overview: [
    { url: 'https://en.wikipedia.org/wiki/Internet', title: 'more.wikipedia', level: 'both' },
    { url: 'https://da.wikipedia.org/wiki/Internettet', title: 'more.wikipedia', level: 'both', lang: 'da' },
  ],
  wifi: [
    { url: 'https://en.wikipedia.org/wiki/Wi-Fi', title: 'more.wikipedia', level: 'both' },
    { url: 'https://da.wikipedia.org/wiki/Wi-Fi', title: 'more.wikipedia', level: 'both', lang: 'da' },
    { url: 'https://en.wikipedia.org/wiki/Orthogonal_frequency-division_multiplexing', title: 'more.ofdm', level: 'nerd' },
  ],
  fibre: [
    { url: 'https://en.wikipedia.org/wiki/Optical_fiber', title: 'more.wikipedia', level: 'both' },
    { url: 'https://da.wikipedia.org/wiki/Optisk_fiber', title: 'more.wikipedia', level: 'both', lang: 'da' },
    { url: 'https://en.wikipedia.org/wiki/Wavelength-division_multiplexing', title: 'more.dwdm', level: 'nerd' },
  ],
  internet: [
    { url: 'https://en.wikipedia.org/wiki/Internet_exchange_point', title: 'more.ixp', level: 'both' },
    { url: 'https://en.wikipedia.org/wiki/Peering', title: 'more.peering', level: 'nerd' },
  ],
};
