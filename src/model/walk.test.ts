// Walking the whole trip with ◀ ▶ (#169): from the sender, ▶ goes along every path scene, into each group and out
// again, to the server, and ◀ walks it back exactly; only the two ends bump. Every place (so every era) × activity ×
// orientation.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Orient } from '../engine/geometry';
import { pathScene } from './layout';
import { activityIds, content } from './registry';
import { resolveRoute, type Route } from './resolve';
import { loadAllPacks, lookupLevel, packs, withEra } from './strings';
import { childrenOf, sceneRef, walkStep, type WalkTo } from './tree';

type At = { path: string[]; stop: string | null };
const key = (a: At) => `${a.path.join('/')}@${a.stop}`;
const routes = Object.keys(content.places).flatMap((place) => activityIds().map((activity) => ({ what: `${place} × ${activity}`, r: resolveRoute({ activity, places: [place] }) })));
const ORIENTS: Orient[] = ['landscape', 'portrait'];

/** The stops in route order, each group's own in its place (the group itself is not one). */
function expected(r: Route, o: Orient, path: string[] = []): At[] {
  const ref = sceneRef(r, path, o)!, groups = new Set(childrenOf(r, ref, o).filter((c) => c.kind === 'expand').map((c) => c.step));
  return pathScene(r, ref.group, o).stops.flatMap((stop) => (groups.has(stop) ? expected(r, o, [...path, stop]) : [{ path, stop }]));
}

function walk(r: Route, from: At, d: -1 | 1, o: Orient): WalkTo[] {
  const out: WalkTo[] = [];
  for (let at: At = from, to; (to = walkStep(r, at.path, at.stop, d, o)); at = to) {
    out.push(to);
    if (out.length > 500) throw new Error('the walk never ends');
  }
  return out;
}

beforeAll(() => loadAllPacks());

describe('walkStep (#169)', () => {
  it('walks from the sender to the server through every group, and back exactly', () => {
    for (const { what, r } of routes) for (const o of ORIENTS) {
      const all = expected(r, o), where = `${what} ${o}`;
      expect(all[0], where).toEqual({ path: [], stop: r.chain[0].id });
      // on from the overview: every stop of every scene once, in order, then a bump
      const on = walk(r, { path: [], stop: null }, 1, o);
      expect(on.map(key), where).toEqual(all.map(key));
      // it ends at the server (or a side branch drawn after it)
      const end = on.findIndex((t) => t.stop === r.chain.at(-1)!.id);
      expect(end, where).toBeGreaterThan(0);
      for (const t of on.slice(end + 1)) expect(r.asides.some((a) => a.hop.id === t.stop), `${where} ${key(t)}`).toBe(true);
      // every group is walked through
      for (const g of r.groups) expect(on.some((t) => t.path.at(-1) === g.id), `${where} ${g.id}`).toBe(true);
      // back from the end: the same stops the other way, then the overview, then a bump
      const back = walk(r, on.at(-1)!, -1, o);
      expect(back.map(key), where).toEqual([...all.slice(0, -1).reverse(), { path: [], stop: null }].map(key));
    }
  });

  it('names each crossing: the group it goes into, or where you came from on the way back out', () => {
    for (const { what, r } of routes) for (const o of ORIENTS) {
      let at: At = { path: [], stop: r.chain[0].id };
      for (const d of [1, -1] as const)
        for (const to of walk(r, at, d, o)) {
          const where = `${what} ${o} ${key(at)} → ${key(to)}`, deeper = to.path.length > at.path.length;
          if (to.path.join('/') === at.path.join('/')) expect(to.cross, where).toBeNull();
          else if (deeper) expect(to.cross, where).toEqual({ kind: 'in', node: expect.objectContaining({ id: to.path[at.path.length], kind: 'group' }) });
          else expect(to.cross, where).toEqual({ kind: 'out', node: expect.objectContaining({ kind: d < 0 ? 'entry' : 'exit' }) });
          // it says so in every language and level
          if (to.cross) for (const lang of Object.keys(packs)) for (const level of ['kid', 'nerd'] as const)
            expect(withEra([`node.${to.cross.node.node.id}.name`], r.era).map((k) => lookupLevel(lang, k, level)).find(Boolean), `${where} ${lang} ${level}`).toBeTruthy();
          at = to;
        }
    }
  });

  it('goes into a group from its stop, or from its scene as a whole, and back out to the stop before it', () => {
    for (const { what, r } of routes) for (const o of ORIENTS) {
      const all = expected(r, o);
      for (const g of r.groups) {
        const i = all.findIndex((a) => a.path.at(-1) === g.id), inside = all[i].path, parent = inside.slice(0, -1);
        const before = i ? all[i - 1] : { path: [], stop: null };
        for (const from of [{ path: parent, stop: g.id }, { path: inside, stop: null }]) {
          const where = `${what} ${o} ${key(from)}`;
          expect(key(walkStep(r, from.path, from.stop, 1, o)!), where).toBe(key(all[i]));
          expect(key(walkStep(r, from.path, from.stop, -1, o)!), where).toBe(key(before));
        }
      }
    }
  });

  it('crosses at the ends of the internet at home', () => {
    const r = resolveRoute({ activity: 'watch-video', places: ['home'] });
    const into = walkStep(r, [], 'router-internet', 1, 'landscape')!;
    expect(into).toMatchObject({ path: ['internet'], stop: 'home-cabinet', cross: { kind: 'in', node: { id: 'internet' } } });
    expect(walkStep(r, ['internet'], 'home-cabinet', -1, 'landscape')).toMatchObject({ path: [], stop: 'router-internet', cross: { kind: 'out', node: { id: 'home' } } });
    expect(walkStep(r, ['internet'], 'ixp-datacentre', 1, 'landscape')).toMatchObject({ path: ['internet', 'datacentre'], stop: 'ixp-dc-router' });
    expect(walkStep(r, [], 'phone', -1, 'landscape')).toEqual({ path: [], stop: null, cross: null });
    expect(walkStep(r, [], null, -1, 'landscape')).toBeNull();
    expect(walkStep(r, ['internet', 'datacentre'], 'origin', 1, 'landscape')).toBeNull();
  });
});
