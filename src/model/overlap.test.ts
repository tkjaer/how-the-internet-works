// Issue #64: nothing a reader reads or taps in a path scene lands on something else. For every place × activity, every
// path scene (the root and each group, all the way down), both orientations and every language and level, at the
// authored size (a big screen) and at the biggest the labels and badges are drawn at rest on a small screen: door
// badges, device names, link names, owner signs and technical tags (#72), where `placeTexts` puts them, keep apart from each
// other and from the devices' art, and every link keeps a stretch of itself clear for its packets. The era's props
// (#59) keep to their spots, and the spots keep off all of those. Labels win (#137): while "What can I explore?" lights
// every door, no door's label covers any of that text or another door's label.
import { describe, expect, it } from 'vitest';
import type { Level } from '../define';
import { bezier, WORLD_SIZE, type Orient, type Pt, type Rect } from '../engine/geometry';
import { badgeBox, badgeSize, doorsOf, GROW, layoutDoors } from './doors';
import { boxAt, labelReach, placeTexts, signReach, tagReach, type Per, type Sizes } from './labels';
import { pathScene, propSpots, type PathScene, type SNode } from './layout';
import { regionsOf } from './regions';
import { activityIds, content, nowEra } from './registry';
import { resolveRoute, stringSources, type Route } from './resolve';
import { firstOf, loadAllPacks, packs, withEra } from './strings';
import { childrenOf, diveRuns, sceneRef } from './tree';

/** A font's width per character and px, generously (the storybook's Baloo 2 is about 0.47, JetBrains Mono 0.6). */
const per: Per = (text, font) => text.length * (font === 'tag' ? 0.62 : 0.52);
/** A device's art, as a circle: links start at 0.45 of its size from its centre. */
const ART = 0.42;
const LEVELS: Level[] = ['simple', 'technical'];

/** What a path scene draws at `g` times the authored size (1: a big screen), as PathScene clamps it: labels and signs
 *  to `m`, the smallest legible size in scene units, tags to 0.85 of it, badges to 0.8. */
function sizesAt(g: number): Sizes & { badge: number } {
  const m = g > 1 ? 28 * g : 0;
  return { name: Math.max(28, m), link: Math.max(24, m), tag: Math.max(20, m * 0.85), sign: Math.max(24, m), badge: badgeSize(m * 0.8 || 22, 1) };
}

type Shape = { what: string; kind: 'badge' | 'art' | 'label' | 'prop'; owner: string } & ({ c: Pt; r: number } | { box: Rect });

const dist = (p: Pt, b: Rect) => Math.hypot(Math.max(0, b.x - p.x, p.x - b.x - b.w), Math.max(0, b.y - p.y, p.y - b.y - b.h));
function overlap(a: Shape, b: Shape): boolean {
  if ('c' in a && 'c' in b) return Math.hypot(a.c.x - b.c.x, a.c.y - b.c.y) < a.r + b.r;
  if ('box' in a && 'box' in b) return a.box.x < b.box.x + b.box.w && b.box.x < a.box.x + a.box.w && a.box.y < b.box.y + b.box.h && b.box.y < a.box.y + a.box.h;
  const [c, r] = 'c' in a ? [a, b as Extract<Shape, { box: Rect }>] : [b as Extract<Shape, { c: Pt }>, a as Extract<Shape, { box: Rect }>];
  return dist(c.c, r.box) < c.r;
}

/** Everything drawn in a path scene that must keep apart, at `g` times the authored size; and the doors' labelled
 *  pills while "What can I explore?" lights them all (#137), as `layoutDoors` lays them out. */
function shapes(r: Route, ps: PathScene, root: boolean, o: Orient, lang: string, level: Level, g: number): { ss: Shape[]; cut: string[]; lit: Shape[]; waiting: string[] } {
  const s = sizesAt(g), str = (k: string) => firstOf(lang, withEra([k], r.era === nowEra() ? undefined : r.era), level) ?? '', technical = level === 'technical';
  const name = (n: SNode) => str(`node.${n.node.id}.name`);
  const doors = doorsOf(ps, root, diveRuns(r, ps.group, o).byLink, o, (n) => per(name(n), 'label') * 28);
  const regions = regionsOf(r, ps).filter((x) => !x.aside);
  const tag = (keys: string[]) => (technical ? keys.map(str).find(Boolean) ?? '' : '');
  const routeTag = (id: string) => stringSources(r).map((x) => `${x}.tag.${id}`);
  const nodes = ps.nodes.map((n) => ({ n, name: name(n), tag: tag([...routeTag(n.id), `node.${n.node.id}.tag`]) }));
  // link names are drawn at the root only
  const badges = doors.map((d) => badgeBox(d.at, s.badge));
  const links = root ? ps.links.map((l) => ({ l, name: str(`tech.${l.link.tech.id}.name`), tag: tag([...routeTag(l.id), `tech.${l.link.tech.id}.tag`]), badge: badges[doors.findIndex((d) => d.links.includes(l.id))] })) : [];
  const signs = regions.map((x) => ({ at: x.sign, name: str(`owner.${x.owner}.name`) }));
  const p = placeTexts({ nodes, links, signs, badges }, s, per, WORLD_SIZE[o], o === 'portrait');
  const out: Shape[] = [];
  const text = (what: string, owner: string, at: Pt, e: ReturnType<typeof labelReach>) => out.push({ what, kind: 'label', owner, box: boxAt(at, e) });
  nodes.forEach(({ n, name: k }, i) => {
    out.push({ what: `${n.id} art`, kind: 'art', owner: n.id, c: { x: n.x, y: n.y }, r: n.size * ART });
    text(`${n.id} name`, n.id, p.nodes[i].name, labelReach(per(k, 'label') * s.name, s.name, 'middle'));
  });
  links.forEach(({ l, name: k }, i) => text(`${l.id} name`, l.id, p.links[i].name, labelReach(per(k, 'label') * s.link, s.link, p.links[i].name.anchor)));
  regions.forEach((x, i) => text(`${x.owner} sign`, x.owner, p.signs[i], signReach(per(signs[i].name, 'label') * s.sign, s.sign)));
  const cut: string[] = [];
  [...p.nodes.map((q, i) => ({ q, id: nodes[i].n.id, tag: nodes[i].tag })), ...p.links.map((q, i) => ({ q, id: links[i].l.id, tag: links[i].tag }))].forEach(({ q, id, tag }) => {
    if (tag && q.tag?.text !== tag) cut.push(`${id} tag`);
    if (q.tag) text(`${id} tag`, id, q.tag, tagReach(per(q.tag.text, 'tag') * s.tag, s.tag, q.tag.anchor));
  });
  for (const d of doors) out.push({ what: `${d.kind} badge ${d.id}`, kind: 'badge', owner: d.links.length ? d.links[0] : d.id, c: d.at, r: s.badge * 1.3 });
  if (root) for (const slot of r.slots) for (const [spot, [x, y, w, h]] of Object.entries(propSpots(r.content.places[slot.place], o)))
    out.push({ what: `${spot} prop`, kind: 'prop', owner: spot, box: { x: x - w / 2, y: y - h / 2, w, h } });
  const pills = layoutDoors(doors, s.badge, true, null, (d) => per(str(`door.${d.kind}`), 'label') * s.badge, { texts: p.texts, arts: p.arts, W: WORLD_SIZE[o] });
  // a lit door whose label fits nowhere shows its mark alone, as at rest (kept off the text above)
  const lit = pills.flatMap((b, i): Shape[] => (b.labelled ? [{ what: `${doors[i].kind} pill ${doors[i].id}`, kind: 'badge', owner: doors[i].id, box: { x: b.x - b.w / 2, y: b.y - b.h / 2, w: b.w, h: b.h } }] : []));
  const waiting = doors.filter((_, i) => !pills[i].labelled).map((d) => `${d.kind} label ${d.id}`);
  return { ss: out, cut, lit, waiting };
}


/** What may touch: a device's own badges (swap, look inside) sit on the corner of its art, by design. */
const allowed = (a: Shape, b: Shape) => a.owner === b.owner && (a.kind === 'art' || b.kind === 'art');

/** How much of a link shows clear of the devices' art and every badge: where its packets can be seen. */
function clearLength(l: PathScene['links'][number], ss: Shape[]): number {
  const N = 200, blockers = ss.filter((s): s is Extract<Shape, { c: Pt }> => 'c' in s);
  let len = 0, prev = bezier(l, 0);
  for (let i = 1; i <= N; i++) {
    const p = bezier(l, i / N), q = { x: (p.x + prev.x) / 2, y: (p.y + prev.y) / 2 };
    if (!blockers.some((b) => Math.hypot(q.x - b.c.x, q.y - b.c.y) < b.r)) len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return len;
}

/** A link shows at least two packets' worth of itself (a packet is about 60 long). */
const MIN_CLEAR = 120;

// Known crowding, still to be laid out better: an entry here that no longer happens fails too, so the lists only shrink.
const KNOWN_OVERLAPS: string[] = [];
const KNOWN_SHORT = [
  'desk × watch-video landscape /internet border-ixp',
  'desk × watch-video landscape /internet cabinet-olt',
  'desk × watch-video portrait /internet border-transit',
  'desk-2010 × watch-video landscape /internet backhaul-bng',
  'desk-2010 × watch-video landscape /internet border-ixp',
  'desk-2010 × watch-video landscape /internet home-cabinet',
  'desk-2010 × watch-video portrait /internet border-transit',
  'home × watch-video landscape /internet border-ixp',
  'home × watch-video landscape /internet cabinet-olt',
  'home × watch-video portrait / ap-router',
  'home × watch-video portrait /internet border-transit',
  'home-dialup × watch-video landscape /internet home-exchange',
  'home-dsl × watch-video landscape /internet backhaul-bng',
  'home-dsl × watch-video landscape /internet border-ixp',
  'home-dsl × watch-video landscape /internet home-cabinet',
  'home-dsl × watch-video portrait / ap-router',
  'home-dsl × watch-video portrait /internet border-transit',
  'home-fttb × watch-video landscape /internet backhaul-bng',
  'home-fttb × watch-video landscape /internet basement-backhaul',
  'home-fttb × watch-video landscape /internet border-ixp',
  'home-fttb × watch-video landscape /internet flats-basement',
  'home-fttb × watch-video portrait / ap-router',
  'home-fttb × watch-video portrait /internet border-transit',
  'on-the-go × watch-video landscape /internet border-ixp',
  'on-the-go × watch-video portrait /internet border-transit',
  'on-the-go-2010 × watch-video landscape /internet border-ixp',
  'on-the-go-2010 × watch-video portrait /internet border-transit',
];

// Lit doors whose label finds no room on a big screen (#137): just clear of the backbone's name, in English only
const KNOWN_WAITING = [
  'en desk × watch-video portrait /internet: dive label core-border',
  'en desk-2010 × watch-video portrait /internet: dive label core-border',
  'en home × watch-video portrait /internet: dive label core-border',
  'en home-dsl × watch-video portrait /internet: dive label core-border',
  'en home-fttb × watch-video portrait /internet: dive label core-border',
  'en on-the-go × watch-video portrait /internet: dive label core-border',
  'en on-the-go-2010 × watch-video portrait /internet: dive label core-border',
];

describe('path scenes (issues #64, #72, #137)', () => {
  // generic: holds for whatever content exists, in every language and level
  it('keep badges, names, link names, signs, tags and devices apart, links clear for their packets, and text clear of lit doors', async () => {
    await loadAllPacks();
    const overlaps = new Set<string>(), short = new Set<string>(), whole = new Set<string>(), covered = new Set<string>(), wait = new Set<string>();
    for (const lang of Object.keys(packs)) for (const level of LEVELS) for (const activity of activityIds()) for (const place of Object.keys(content.places)) {
      const r = resolveRoute({ activity, places: [place] });
      for (const o of ['landscape', 'portrait'] as const) {
        const walk = (path: string[]): void => {
          const ref = sceneRef(r, path, o)!;
          if (ref.kind !== 'path') return;
          const ps = pathScene(r, ref.group, o);
          for (const g of [1, GROW[o]]) {
            const { ss, cut, lit, waiting } = shapes(r, ps, path.length === 0, o, lang, level, g);
            const at = `${place} × ${activity} ${o}${g > 1 ? ' small' : ''} /${path.join('/')}`;
            // on a big screen every tag shows whole (on a small one it may shrink to its first fact, or wait for a zoom)
            if (g === 1) for (const k of cut) whole.add(`${lang} ${at}: ${k}`);
            // and every lit door shows its label (on a small one a label may wait for a zoom)
            if (g === 1) for (const k of waiting) wait.add(`${lang} ${at}: ${k}`);
            ss.forEach((a, i) => ss.slice(i + 1).forEach((b) => {
              if (a.kind === b.kind && (a.kind === 'art' || a.kind === 'prop')) return;
              if (!allowed(a, b) && overlap(a, b)) overlaps.add(`${at}: ${a.what} × ${b.what}`);
            }));
            if (g > 1) for (const l of ps.links) if (clearLength(l, ss) < MIN_CLEAR) short.add(`${place} × ${activity} ${o} /${path.join('/')} ${l.id}`);
            // labels win (#137): a lit door's pill covers no text and no other pill
            lit.forEach((a, i) => [...ss.filter((b) => b.kind === 'label'), ...lit.slice(i + 1)].forEach((b) => {
              if (overlap(a, b)) covered.add(`${at}: ${a.what} × ${b.what}`);
            }));
          }
          for (const c of childrenOf(r, ref, o)) if (c.kind === 'expand') walk([...path, c.step]);
        };
        walk([]);
      }
    }
    expect([...overlaps].filter((k) => !KNOWN_OVERLAPS.includes(k)), 'new overlaps').toEqual([]);
    expect(KNOWN_OVERLAPS.filter((k) => !overlaps.has(k)), 'fixed: drop them from KNOWN_OVERLAPS').toEqual([]);
    expect([...short].filter((k) => !KNOWN_SHORT.includes(k)), 'links too hidden for their packets').toEqual([]);
    expect(KNOWN_SHORT.filter((k) => !short.has(k)), 'fixed: drop them from KNOWN_SHORT').toEqual([]);
    expect([...whole], 'tags cut short on a big screen').toEqual([]);
    expect([...covered], 'text covered by a lit door').toEqual([]);
    expect([...wait].filter((k) => !KNOWN_WAITING.includes(k)), 'lit labels with no room on a big screen').toEqual([]);
    expect(KNOWN_WAITING.filter((k) => !wait.has(k)), 'fixed: drop them from KNOWN_WAITING').toEqual([]);
  });
});
