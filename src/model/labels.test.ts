// Issue #90: a path scene's text never leaves its world (the panel it is drawn on, or the screen at the root) — device
// names, link names, owner signs and technical tags, in every place, activity, path scene, orientation and language, at the
// authored size and at the biggest the labels grow on a small screen.
import { describe, expect, it } from 'vitest';
import { WORLD_SIZE, type Orient } from '../engine/geometry';
import { badgeBox, doorsOf } from './doors';
import { boxAt, clearOf, firstFact, fits, keepIn, labelReach, placeTexts, RIM, signReach, tagReach, type Per, type Sizes, type Texts } from './labels';
import { labelY, pathScene, type SLink, type SNode } from './layout';
import { regionsOf } from './regions';
import { activityIds, content, nowEra } from './registry';
import { resolveRoute } from './resolve';
import { firstOf, loadAllPacks, packs, withEra } from './strings';
import { childrenOf, diveRuns, sceneRef } from './tree';

const W = WORLD_SIZE.landscape;
// generously: the storybook's label font is about 0.47 of its size per character, its tag font (mono) 0.6
const per: Per = (text, font) => text.length * (font === 'tag' ? 0.62 : 0.52);
const AUTHORED: Sizes = { name: 28, link: 24, tag: 20, sign: 24 };
/** At rest on the smallest screens, where labels clamp to the theme's 14 px minimum (tags to 0.85 of it): a 360-wide
 *  phone shows a 900-wide portrait world in about 280 px, short landscape (844×390) a 1600-wide one in about 445. */
const small = (o: Orient): Sizes => {
  const px = 14 * (o === 'portrait' ? 900 / 280 : 1600 / 445);
  return { name: px, link: px, tag: px * 0.85, sign: px };
};

describe('keeping a box inside the world', () => {
  const e = { l: 50, r: 50, t: 20, b: 10 };
  it('leaves a box that fits where it is, and pushes one that does not the least way in', () => {
    expect(keepIn({ x: 800, y: 450 }, e, W)).toEqual({ x: 800, y: 450 });
    expect(keepIn({ x: 10, y: 890 }, e, W)).toEqual({ x: RIM + 50, y: W.h - RIM - 10 });
    expect(fits(keepIn({ x: 1590, y: 0 }, e, W), e, W)).toBe(true);
  });
  it('centres a box too big for the world on that axis', () => {
    expect(keepIn({ x: 0, y: 450 }, { l: 1000, r: 1000, t: 0, b: 0 }, W).x).toBe(800);
  });
  it('reaches further on the side a tag hangs its string from', () => {
    const r = tagReach(100, 20, 'start');
    expect(r.l).toBeGreaterThan(r.r - 100);
    expect(labelReach(100, 20, 'end').l).toBeGreaterThan(100);
    expect(signReach(100, 20).l).toBeGreaterThan(50);
  });
});

describe('a device near the bottom of a landscape world (#90)', () => {
  const n = { id: 'x', x: 400, y: 760, size: 80, label: 'below' } as SNode;
  const one = (k: SNode, taken: Texts['badges'] = []) =>
    placeTexts({ nodes: [{ n: k, name: 'Internet exchange', tag: 'Peering LAN · BGP' }], links: [], signs: [], badges: taken }, AUTHORED, per, W, false).nodes[0];
  it('keeps its tag under its name where that fits', () => {
    const up = { ...n, y: 400 };
    expect(one(up)).toEqual({ name: { x: 400, y: labelY(up), anchor: 'middle' }, tag: { x: 400, y: labelY(up) + 36, anchor: 'middle', text: 'Peering LAN · BGP' } });
  });
  it('has its tag over its art when it would be cut off under its name', () => {
    const at = one(n);
    expect(at.name).toMatchObject({ x: 400, y: labelY(n) });
    expect(at.tag).toMatchObject({ x: 400, anchor: 'middle' });
    expect(at.tag!.y).toBeLessThan(n.y - n.size / 2);
  });
  it('else beside its name, clear of what is there', () => {
    const at = one(n, [{ x: 300, y: 600, w: 200, h: 100 }]);
    expect(at.tag!.anchor).toBe('start');
    expect(at.tag!.x).toBeGreaterThan(400 + ('Internet exchange'.length * 0.52 * 28) / 2);
  });
});

describe('moving a box clear of another', () => {
  const e = { l: 50, r: 50, t: 10, b: 10 }, b = { x: 0, y: 0, w: 100, h: 100 };
  it('moves it on its way only until it is the gap clear, on whichever axis comes first', () => {
    expect(clearOf({ x: 50, y: 50 }, { x: 0, y: 1 }, e, b, 4)).toEqual({ x: 50, y: 114 });
    const q = clearOf({ x: 50, y: 50 }, { x: Math.SQRT1_2, y: Math.SQRT1_2 }, e, b, 4);
    expect(q.y).toBeCloseTo(114);
    expect(q.x).toBeCloseTo(114);
  });
  it('leaves one already clear where it is', () => {
    expect(clearOf({ x: 300, y: 50 }, { x: 0, y: 1 }, e, b, 4)).toEqual({ x: 300, y: 50 });
  });
});

describe('a technical tag on a crowded screen (#72)', () => {
  const n = { id: 'x', x: 400, y: 450, size: 100, label: 'below' } as SNode;
  const place = (badges: Texts['badges'], tag = 'XGS-PON · 10 Gbit/s · 20 km') =>
    placeTexts({ nodes: [{ n, name: 'Box', tag }], links: [], signs: [], badges }, AUTHORED, per, W, false).nodes[0].tag;
  // everything taken but a slot beside the device, over its art and on `w` past it
  const allBut = (w: number) => [{ x: 0, y: 0, w: 420, h: 900 }, { x: 450 + w, y: 0, w: 1600, h: 900 }, { x: 420, y: 0, w: 30 + w, h: 430 }, { x: 420, y: 476, w: 30 + w, h: 424 }];
  it('shows its first fact alone where the whole tag has no room', () => {
    expect(firstFact('XGS-PON · 10 Gbit/s')).toBe('XGS-PON');
    expect(firstFact('Wi-Fi 6')).toBe('Wi-Fi 6');
    const at = place(allBut(per('XGS-PON', 'tag') * 20 + 20 * 1.6 + 20));
    expect(at?.text).toBe('XGS-PON');
  });
  it('is left out where not even that fits', () => {
    expect(place(allBut(40))).toBeNull();
  });
  it('hangs its string, not its body, over its own art', () => {
    const at = place([{ x: 0, y: 0, w: 1600, h: 380 }, { x: 0, y: 520, w: 1600, h: 380 }])!;
    expect(at.anchor).toBe('start');
    expect(at.x - 20 * 0.81).toBeGreaterThanOrEqual(n.x + n.size * 0.42);
    expect(at.x - 20 * 1.75).toBeLessThan(n.x + n.size * 0.42);
  });
});

describe('a link\'s name and its badge (#72)', () => {
  const l = { id: 'a-b', p0: { x: 400, y: 450 }, c: { x: 800, y: 450 }, p1: { x: 1200, y: 450 }, label: [0, 50] } as unknown as SLink;
  const badge = badgeBox({ x: 800, y: 450 }, 22);
  const name = (more: Texts['badges'] = []) =>
    placeTexts({ nodes: [], links: [{ l, name: 'Fibre', tag: '', badge }], signs: [], badges: [badge, ...more] }, AUTHORED, per, W, false).links[0].name;
  const box = (at: { x: number; y: number; anchor: 'start' | 'middle' | 'end' }) => boxAt(at, labelReach(per('Fibre', 'label') * 24, 24, at.anchor));
  const apart = (a: ReturnType<typeof boxAt>, b: ReturnType<typeof boxAt>) => a.x >= b.x + b.w || b.x >= a.x + a.w || a.y >= b.y + b.h || b.y >= a.y + a.h;
  it('keeps its authored side of the badge, moved out clear of it', () => {
    const at = name();
    expect(at).toMatchObject({ x: 800, anchor: 'middle' });
    expect(at.y).toBeGreaterThan(450);
    expect(apart(box(at), badge)).toBe(true);
  });
  it('takes the nearest clear side when something covers that one', () => {
    const below = { x: 600, y: 470, w: 400, h: 200 }, at = name([below]);
    expect(apart(box(at), badge)).toBe(true);
    expect(apart(box(at), below)).toBe(true);
    expect(Math.hypot(at.x - 800, at.y - 450)).toBeLessThan(200);
  });
});

describe('path scene text stays inside its world (#90)', () => {
  it('names, link names, signs and tags, everywhere, at rest on any screen', async () => {
    await loadAllPacks();
    const out = new Set<string>(), crossed = new Set<string>();
    for (const lang of Object.keys(packs)) for (const activity of activityIds()) for (const place of Object.keys(content.places)) {
      const r = resolveRoute({ activity, places: [place] });
      const str = (k: string) => firstOf(lang, withEra([k], r.era === nowEra() ? undefined : r.era), 'technical') ?? '';
      for (const o of ['landscape', 'portrait'] as const) for (const s of [AUTHORED, small(o)]) {
        const WO = WORLD_SIZE[o], portrait = o === 'portrait';
        const walk = (path: string[]): void => {
          const ref = sceneRef(r, path, o)!;
          if (ref.kind !== 'path') return;
          const ps = pathScene(r, ref.group, o), root = path.length === 0, at = `${lang} ${place} × ${activity} ${o} ${Math.round(s.name)}px /${path.join('/')}`;
          const name = (n: SNode) => str(`node.${n.node.id}.name`);
          const doors = doorsOf(ps, root, diveRuns(r, ps.group, o).byLink, o, (n) => per(name(n), 'label') * 28);
          const badges = doors.map((d) => badgeBox(d.at, 22 * (s.name / 28)));
          const t: Texts = {
            nodes: ps.nodes.map((n) => ({ n, name: name(n), tag: str(`node.${n.node.id}.tag`) })),
            links: root ? ps.links.map((l) => ({ l, name: str(`tech.${l.link.tech.id}.name`), tag: str(`tech.${l.link.tech.id}.tag`), badge: badges[doors.findIndex((d) => d.links.includes(l.id))] })) : [],
            signs: regionsOf(r, ps).filter((g) => !g.aside).map((g) => ({ at: g.sign, name: str(`owner.${g.owner}.name`) })),
            badges,
          };
          const p = placeTexts(t, s, per, WO, portrait), tags: { what: string; box: ReturnType<typeof boxAt> }[] = [];
          const check = (what: string, q: { x: number; y: number }, e: ReturnType<typeof labelReach>) => { if (!fits(q, e, WO)) out.add(`${at}: ${what}`); };
          const tagged = (what: string, g: (typeof p.nodes)[number]['tag']) => {
            if (!g) return;
            const e = tagReach(per(g.text, 'tag') * s.tag, s.tag, g.anchor);
            check(what, g, e);
            tags.push({ what, box: boxAt(g, e) });
          };
          t.nodes.forEach(({ n, name }, i) => {
            check(`${n.id} name`, p.nodes[i].name, labelReach(per(name, 'label') * s.name, s.name, 'middle'));
            tagged(`${n.id} tag`, p.nodes[i].tag);
          });
          t.links.forEach(({ l, name }, i) => {
            check(`${l.id} name`, p.links[i].name, labelReach(per(name, 'label') * s.link, s.link, p.links[i].name.anchor));
            tagged(`${l.id} tag`, p.links[i].tag);
          });
          t.signs.forEach((g, i) => check(`${g.name} sign`, p.signs[i], signReach(per(g.name, 'label') * s.sign, s.sign)));
          // on a big screen, no two tags cover each other
          if (s === AUTHORED) tags.forEach((a, i) => tags.slice(i + 1).forEach((c) => {
            const [x, y] = [a.box, c.box];
            if (x.x < y.x + y.w && y.x < x.x + x.w && x.y < y.y + y.h && y.y < x.y + x.h) crossed.add(`${at}: ${a.what} × ${c.what}`);
          }));
          for (const c of childrenOf(r, ref, o)) if (c.kind === 'expand') walk([...path, c.step]);
        };
        walk([]);
      }
    }
    expect([...out], 'out of their world').toEqual([]);
    expect([...crossed], 'tags covering tags').toEqual([]);
  });
});
