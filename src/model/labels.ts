// Where a path scene's text goes (#90, #72): device names, link names, owner signs and technical tags stay inside their
// world, a rim in from its edge (a nested scene's panel draws its frame over the outer 24 or so; the root's is the
// screen), and off each other. Labels grow as the camera zooms out (they never render under the theme's labelMinPx), so
// a spot that fits at the authored size can run off the panel, or onto a badge, on a small screen:
// - a link's name and its door badge go as one: the name keeps its authored side of the badge, moved out as both grow;
// - names and signs are pushed in;
// - a tag takes the first of its spots that fits and covers nothing; failing that, its first fact alone ("XGS-PON"
//   for "XGS-PON · 10 Gbit/s") at the first spot where that does; failing that, it is left out until there is room
//   (zoomed in closer).
import type { Pt, Rect } from '../engine/geometry';
import { bezier } from '../engine/geometry';
import { labelY, type SLink, type SNode } from './layout';

export type Anchor = 'start' | 'middle' | 'end';
/** How far a box reaches from its anchor point: left, right, up, down. */
export interface Reach { l: number; r: number; t: number; b: number }
export interface Spot extends Pt { anchor: Anchor }
/** A placed tag and the text it shows (the whole tag, or its first fact). */
export interface TagSpot extends Spot { text: string }

/** How far in from the world's edge text keeps. */
export const RIM = 30;

/** Drawn sizes in scene units (already clamped to readable): device names, link names, tags and owner signs. */
export interface Sizes { name: number; link: number; tag: number; sign: number }
/** A text's width per unit of font size, in the label or the tag font. */
export type Per = (text: string, font: 'label' | 'tag') => number;
export interface World { w: number; h: number }

const lead = (w: number, a: Anchor) => (a === 'start' ? 0 : a === 'middle' ? w / 2 : w);
/** A label (a baseline, its halo): about 0.8 of the size above it, 0.3 below. */
export const labelReach = (w: number, px: number, a: Anchor): Reach => ({ l: lead(w, a) + px * 0.12, r: w - lead(w, a) + px * 0.12, t: px * 0.85, b: px * 0.3 });
/** A tag (centred on y): its box, and the string hanging off its left. The engine's contract with the theme's Tag. */
export const tagReach = (w: number, px: number, a: Anchor): Reach => ({ l: lead(w, a) + px * 1.75, r: w - lead(w, a) + px * 0.68, t: px * 1.08, b: px * 0.58 });
/** An owner sign (centred on its spot): the pill and the colour dot on its left. The contract with the theme's Region. */
export const signReach = (w: number, px: number): Reach => ({ l: w / 2 + px * 1.5, r: w / 2 + px * 0.6, t: px * 0.84, b: px * 0.84 });

/** Whether a box reaching `e` around `p` lies inside the world. */
export const fits = (p: Pt, e: Reach, W: World, rim = RIM) =>
  p.x - e.l >= rim - 0.01 && p.x + e.r <= W.w - rim + 0.01 && p.y - e.t >= rim - 0.01 && p.y + e.b <= W.h - rim + 0.01;

/** `p` moved the least so its box is inside the world (centred on an axis it is too big for). */
export function keepIn(p: Pt, e: Reach, W: World, rim = RIM): Pt {
  const axis = (v: number, lo: number, hi: number, max: number) =>
    lo + hi > max - 2 * rim ? (max + lo - hi) / 2 : Math.min(max - rim - hi, Math.max(rim + lo, v));
  return { x: axis(p.x, e.l, e.r, W.w), y: axis(p.y, e.t, e.b, W.h) };
}

/** `p` moved on along `u` (a unit vector) the least so a box reaching `e` around it is `gap` clear of `b`. */
export function clearOf(p: Pt, u: Pt, e: Reach, b: Rect, gap: number): Pt {
  // how far along u until the box is past b on one axis: lo/hi are b's near and far edges, a/z the box's reach
  const axis = (v: number, du: number, lo: number, hi: number, a: number, z: number) =>
    v - a >= hi + gap || v + z <= lo - gap ? 0 : du > 1e-9 ? (hi + gap + a - v) / du : du < -1e-9 ? (lo - gap - z - v) / du : Infinity;
  const t = Math.min(axis(p.x, u.x, b.x, b.x + b.w, e.l, e.r), axis(p.y, u.y, b.y, b.y + b.h, e.t, e.b));
  return Number.isFinite(t) ? { x: p.x + u.x * t, y: p.y + u.y * t } : p;
}

/** The box a reach puts around `p`. */
export const boxAt = (p: Pt, e: Reach): Rect => ({ x: p.x - e.l, y: p.y - e.t, w: e.l + e.r, h: e.t + e.b });
const hits = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** A tag's first fact: the text before its first " · ". */
export const firstFact = (tag: string) => tag.split(' · ')[0];

export interface Texts {
  nodes: { n: SNode; name: string; tag: string }[];
  /** Drawn at the root only. `badge`: its own door's badge, which its name keeps clear of. */
  links: { l: SLink; name: string; tag: string; badge?: Rect }[];
  signs: { at: Pt; name: string }[];
  /** What else a tag keeps clear of: the door badges. */
  badges: Rect[];
}
export interface Placed { name: Spot; tag: TagSpot | null }

/** Where a path scene's text goes: the signs and names pushed inside the world (a link's name clear of its badge
 *  first), then each tag at its first spot that fits and covers nothing (names, signs, devices, badges, the tags placed
 *  before it), whole or as its first fact, or nowhere. With them, the boxes of all that text (`texts`) and of the
 *  devices' art (`arts`), which a lit door's label keeps off (`layoutDoors`). */
export function placeTexts(t: Texts, s: Sizes, per: Per, W: World, portrait: boolean) {
  const signs = t.signs.map((g) => {
    const e = signReach(per(g.name, 'label') * s.sign, s.sign);
    return { at: keepIn(g.at, e, W), e };
  });
  const names = t.nodes.map(({ n, name }) => {
    const w = per(name, 'label') * s.name, e = labelReach(w, s.name, 'middle');
    return { at: { ...keepIn({ x: n.x, y: labelY(n) }, e, W), anchor: 'middle' as Anchor }, e, w };
  });
  // a device's art, round, fills about 0.84 of its size
  const arts = t.nodes.map(({ n }): Rect => ({ x: n.x - n.size * 0.42, y: n.y - n.size * 0.42, w: n.size * 0.84, h: n.size * 0.84 }));
  // the text placed so far (what a lit door's label keeps clear of, `layoutDoors`), and with it everything a tag keeps
  // clear of
  const texts: Rect[] = [...signs.map((g) => boxAt(g.at, g.e)), ...names.map((k) => boxAt(k.at, k.e))];
  const taken: Rect[] = [...texts, ...arts, ...t.badges];
  const take = (r: Rect) => { texts.push(r); taken.push(r); };
  const free = (at: Pt, e: Reach, own?: Rect) => fits(at, e, W) && !taken.some((r) => r !== own && hits(boxAt(at, e), r));
  const linkNames = t.links.map(({ l, name, badge }) => {
    const m = badge ? { x: badge.x + badge.w / 2, y: badge.y + badge.h / 2 } : bezier(l, 0.5), w = per(name, 'label') * s.link;
    const [dx, dy, a = 'middle'] = l.label, want = { x: m.x + dx, y: m.y + dy }, d = Math.hypot(dx, dy);
    const reach = (k: Anchor) => labelReach(w, s.link, k), gap = s.link * 0.2;
    // its authored spot; if that covers something, the spot round its badge nearest it that doesn't
    const authored: Spot = { ...settle(want, d ? { x: dx / d, y: dy / d } : { x: 0, y: 1 }, reach(a), W, badge, gap), anchor: a };
    const at = free(authored, reach(a)) ? authored : around(m, [d, d + s.link, d + 2 * s.link], reach, W, badge, gap, want, free) ?? authored;
    take(boxAt(at, reach(at.anchor)));
    return { m, at, w };
  });
  // failing its spots, a tag takes the free one round `c` (out of the way of `own`: its device's art, or its link's
  // badge) nearest the first of them, and no further from `c` than the second of `rs`. A device's tag may hang its
  // string over its own art (`art`), not its body (which starts 0.94 of its size in from the end of its string)
  const tagged = (tag: string, spots: () => Spot[], c: Pt, rs: number[], own?: Rect, art?: Rect): TagSpot | null => {
    if (!tag) return null;
    const near = (q: Pt, e: Reach) => {
      const b = boxAt(q, e);
      return Math.hypot(Math.max(b.x - c.x, 0, c.x - b.x - b.w), Math.max(b.y - c.y, 0, c.y - b.y - b.h)) <= rs[1];
    };
    const ok = (q: Pt, e: Reach) => free(q, e, art) && !(art && hits(boxAt(q, { ...e, l: e.l - s.tag * 0.94 }), art));
    for (const text of new Set([tag, firstFact(tag)])) {
      const tw = per(text, 'tag') * s.tag, reach = (a: Anchor) => tagReach(tw, s.tag, a), ss = spots();
      const at = ss.find((q) => ok(q, reach(q.anchor))) ?? around(c, rs, reach, W, own, s.tag * 0.3, ss[0], (q, e) => near(q, e) && ok(q, e));
      if (!at) continue;
      take(boxAt(at, reach(at.anchor)));
      return { ...at, text };
    }
    return null;
  };
  const nodes = t.nodes.map(({ n, tag }, i): Placed => {
    const { at, w: nw } = names[i], r = n.size / 2;
    return { name: at, tag: tagged(tag, () => nodeSpots(n, at, nw, s, W, portrait), n, [r, r + s.tag * 2, r + s.tag * 4], arts[i], arts[i]) };
  });
  const links = t.links.map(({ l, tag, badge }, i): Placed => {
    const { m, at, w } = linkNames[i], r = (badge ? badge.w / 2 : 0) + 12;
    return { name: at, tag: tagged(tag, () => linkSpots(l, m, at, w, badge, s, portrait), m, [r, r + s.tag * 2, r + s.tag * 4], badge) };
  });
  return { nodes, links, signs: signs.map((g) => g.at), texts, arts };
}

/** `p` inside the world, moved on along `u` (a unit vector) until `gap` clear of `own` if there is one, and back in. */
function settle(p: Pt, u: Pt, e: Reach, W: World, own: Rect | undefined, gap: number): Pt {
  const q = keepIn(p, e, W);
  return keepIn(own ? clearOf(q, u, e, own, gap) : q, e, W);
}

/** The spot round `c`, eight ways out at each of the radii `rs` (anchored away from `c`, settled clear of `own`), that
 *  is `free` and nearest `want`; or null. */
function around(c: Pt, rs: number[], reach: (a: Anchor) => Reach, W: World, own: Rect | undefined, gap: number, want: Pt, free: (at: Pt, e: Reach) => boolean): Spot | null {
  let best: Spot | null = null, far = Infinity;
  for (let i = 0; i < 8; i++) for (const r of rs) {
    const u = { x: Math.cos((i * Math.PI) / 4), y: Math.sin((i * Math.PI) / 4) }, a: Anchor = u.x > 0.5 ? 'start' : u.x < -0.5 ? 'end' : 'middle';
    const e = reach(a), at: Spot = { ...settle({ x: c.x + u.x * r, y: c.y + u.y * r }, u, e, W, own, gap), anchor: a };
    const f = Math.hypot(at.x - want.x, at.y - want.y);
    if (f < far && free(at, e)) { best = at; far = f; }
  }
  return best;
}

/** Where a device's tag may go, best first. */
function nodeSpots(n: SNode, at: Spot, nw: number, s: Sizes, W: World, portrait: boolean): Spot[] {
  // beside the name, on its line; over the art (under it when the name is over it)
  const mid = at.y - s.name * 0.3, gap = s.name * 0.3, half = n.size / 2 + gap;
  const right: Spot = { x: at.x + nw / 2 + gap + s.tag * 1.75, y: mid, anchor: 'start' };
  const left: Spot = { x: at.x - nw / 2 - gap - s.tag * 0.68, y: mid, anchor: 'end' };
  const art: Spot = n.label === 'above' ? { x: n.x, y: n.y + half + s.tag * 1.08, anchor: 'middle' } : { x: n.x, y: n.y - half - s.tag * 0.58, anchor: 'middle' };
  const sides = n.x < W.w / 2 ? [right, left] : [left, right];
  // beside the art, towards the middle of the world, where there is room for a long callout, or away from it
  const r = n.x < W.w / 2, off = n.size / 2 + 14;
  const towards: Spot = { x: n.x + (r ? off : -off), y: n.y + 8, anchor: r ? 'start' : 'end' };
  const away: Spot = { x: n.x + (r ? -off : off), y: n.y + 8, anchor: r ? 'end' : 'start' };
  if (portrait) {
    const under: Spot = { x: at.x, y: at.y + s.name * 0.3 + gap + s.tag * 1.08, anchor: 'middle' };
    return [towards, away, under, ...sides, art];
  }
  // landscape: stacked just beyond the name; hugging the edge near the sides of the world
  const edge: Anchor = n.x > W.w - 260 ? 'end' : n.x < 260 ? 'start' : 'middle';
  const x = edge === 'end' ? n.x + n.size / 2 : edge === 'start' ? n.x - n.size / 2 : n.x;
  const stacked: Spot = n.label === 'above'
    ? { x, y: at.y - Math.max(44, s.name * 0.85 + 4 + s.tag * 0.58), anchor: edge }
    : { x, y: at.y + Math.max(36, s.name * 0.3 + 4 + s.tag * 1.08), anchor: edge };
  return [stacked, art, ...sides, towards, away];
}

/** Where a link's tag may go, best first. */
function linkSpots(l: SLink, m: Pt, at: Spot, nw: number, badge: Rect | undefined, s: Sizes, portrait: boolean): Spot[] {
  const dx = l.label[0], dy = l.label[1], a = at.anchor;
  // across the link from its name, past its badge; under (or over) the name, the same way out from the link
  const off = (badge ? badge.w / 2 : 0) + 12;
  const beside: Spot = { x: m.x + (dx < 0 ? off + s.tag * 1.75 : -off - s.tag * 0.68), y: m.y + 8, anchor: dx < 0 ? 'start' : 'end' };
  const shift = a === 'start' ? s.tag * 1.75 : a === 'end' ? -s.tag * 0.68 : 0;
  const under: Spot = { x: at.x + shift, y: at.y + s.link * 0.3 + s.tag * 1.3, anchor: a };
  const over: Spot = { x: at.x + shift, y: at.y - s.link * 0.85 - s.tag * 0.78, anchor: a };
  if (portrait) return [beside, under, over];
  // landscape: stacked just beyond the name, centred on it or flush with either end of it
  const y = at.y + (dy < 0 ? -Math.max(40, s.link * 0.85 + s.tag * 0.78) : Math.max(34, s.link * 0.3 + s.tag * 1.3)), left = at.x - (a === 'start' ? 0 : a === 'middle' ? nw / 2 : nw);
  const stacked: Spot[] = [{ x: left + nw / 2, y, anchor: 'middle' }, { x: left, y, anchor: 'start' }, { x: left + nw, y, anchor: 'end' }];
  return [...stacked, dy < 0 ? under : over, beside];
}
