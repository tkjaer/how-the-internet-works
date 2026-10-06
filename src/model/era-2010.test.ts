// The 2010 trips (#59, #135): nothing they say belongs to a later internet, from the home (and its other ways online)
// and on the go to the inside of the internet and the data centre, unless it says when it came. Modelled on the 1995
// trip's test (era-1995.test.ts), but it reads everything on the way: the captions, and every label, tag and field a
// dive, a layer or the era shows. And the 2010 data centre (step 8): a rented cage at a colocation centre, built as a
// three-tier tree (the dive's maths), the way through it, and nothing of a later data centre (#135 F15: leaf–spine,
// k8s, NVMe, 100–400G and four-colour optics).
import { beforeAll, describe, expect, it } from 'vitest';
import type { Level } from '../define';
import { WORLD_SIZE, type Pt } from '../engine/geometry';
import { routeWords, scenes } from '../test/era-walk';
import { stubBrowser } from '../test/stub-browser';
import { codeOf, copperSparks, litPairs, mlt3Levels, mlt3Path } from '../../content/scenes/copper-pulses/copper';
import { carrierNat } from '../../content/scenes/ip-post/post';
import { metroTag, modeOf, oneColour } from '../../content/scenes/fibre-light/light';
import type * as Tier from '../../content/scenes/three-tier/tier';
import type { TierLayout } from '../../content/scenes/three-tier/types';
import { sceneKeys } from './describe';
import { activityIds, basePlace, content } from './registry';
import { firstOf, loadAllPacks, packs, withEra } from './strings';
import { resolveRoute, stringSources } from './resolve';
import { formatRate } from './speed';
import { diveSubject } from './tree';

/** Later than 2010: Wi‑Fi 5 and up, 4G and 5G, XGS-PON, G.fast and vectoring, 200G and up, 2.5G/5G copper and
 *  802.3bt, leaf–spine, containers and Kubernetes, NVMe, today's AS count, TLS 1.3, HTTP/2 and 3, QUIC, ECH, WPA3,
 *  VXLAN/EVPN, segment routing, DASH's MPD and its sum of size over time, the CGNAT space of 2012 and TCP's
 *  10-segment start (2013, #180). */
const LATER = new RegExp([
  /802\.11(?:ac|ax|be)|Wi.Fi [5-7]\b|\b[45]G\b|\bLTE\b|\bNR\b|\bgNB\b|\bUPF\b|XGS|G\.fast|[Vv]ector(?:ing|isering)/,
  /\b[2-8]00\s?G|400GBASE|\bFR4\b|CWDM4|802\.3b[tz]|\b(?:2\.5|5)GBASE/,
  /[Ll]eaf|\b(?:in a|i en) container|containers\b|containere|k8s|[Kk]ubernetes|Docker|NVMe|75 000|80 000/,
  /TLS 1\.3|HTTP\/[23]|QUIC|\bECH\b|WPA3|VXLAN|EVPN|SRv6|[Ss]egment [Rr]outing|\bMPD\b|100\.64\.0\.0|RFC 6598/,
  /\bIW10\b|\b10 segment|÷/,
].map((r) => r.source).join('|'));
/** New in 2010 (100G Ethernet and its 25G lanes, coherent optics): fine if it says it was new then. */
const NEW = /\b100\s?G|100GBASE|\b25G\b|[Cc]oherent|[Kk]ohærent|[Kk]ohärent/;
const SAYS_LATER = /today|i dag|nutid|heute|Gegenwart|later|senere|später|\b(?:201[1-9]|20[2-9]\d)\b|2010s|2010’erne|2010er/i;
/** An RFC from after 2010 (RFC 6087 came out that December; #180: RFC 9293's TCP, RFC 9110's HTTP). */
const laterRfc = (s: string) => [...s.matchAll(/\bRFC ?(\d+)/g)].some(([, n]) => Number(n) > 6087);
const SAYS_NEW = /today|i dag|nutid|heute|Gegenwart|later|senere|später|\b20[1-9]\d\b/i;

/** Walked, but never shown on a 2010 trip: the router's light box (ONT) only shows on fibre, and 2010's router
 *  goes out on the phone line (its modem room). */
const UNSHOWN = ['scene.router-inside.ont.line'];

const places = Object.values(content.places).filter((p) => p.era === '2010').map((p) => p.id);
const trips = () => places.flatMap((p) => activityIds().map((activity) => resolveRoute({ activity, places: [p] })));

type Box = { x: number; y: number; w: number; h: number };
const inside = (a: Box, b: Box) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
const apart = (a: Box, b: Box) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
const ptInside = (p: Pt, b: Box) => p.x >= b.x && p.y >= b.y && p.x <= b.x + b.w && p.y <= b.y + b.h;
const same = (a: Pt, b: Pt) => Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9;
const ORIENTS = [['landscape', false], ['portrait', false], ['landscape', true]] as const;

describe('the three-tier tree (three-tier)', () => {
  let tier: typeof Tier;
  beforeAll(async () => {
    stubBrowser();
    tier = await import('../../content/scenes/three-tier/tier');
  });
  const boxes = (L: TierLayout) => [
    ...tier.CORES.map((i) => tier.coreBox(L, i)), ...tier.AGGS.map((i) => tier.aggBox(L, i)), L.beforeBox,
    ...tier.RACKS.map((r) => L.rackBoxes[r]), L.sticker,
  ];

  it('lays the tree out inside the world without overlapping in landscape, portrait and compact', () => {
    for (const [o, compact] of ORIENTS) {
      const L = tier.tierLayout(o, compact), W = { x: 0, y: 0, ...WORLD_SIZE[o] }, all = boxes(L);
      for (const b of all) expect(inside(b, W)).toBe(true);
      for (const [i, b] of all.entries()) for (const q of all.slice(i + 1)) expect(apart(b, q)).toBe(true);
      for (const p of [L.inPort, L.outPort, L.tag]) expect(ptInside(p, W)).toBe(true);
      // core above aggregation above access
      expect(Math.max(...L.cores.map((p) => p.y))).toBeLessThan(Math.min(...L.aggs.map((p) => p.y)));
      expect(Math.max(...L.aggs.map((p) => p.y))).toBeLessThan(Math.min(...tier.RACKS.map((r) => L.racks[r].y)));
    }
  });

  it('gives every rack an uplink to both of the pair, and spanning tree blocks the ones to the standby', () => {
    const L = tier.tierLayout('landscape'), ups = tier.uplinks(L);
    expect(ups).toHaveLength(tier.RACKS.length * tier.AGGS.length);
    for (const rack of tier.RACKS) expect(ups.filter((u) => u.rack === rack).map((u) => u.agg).sort()).toEqual([...tier.AGGS]);
    expect(ups.filter((u) => u.blocked).every((u) => u.agg !== tier.ACTIVE)).toBe(true);
    expect(ups.filter((u) => !u.blocked).every((u) => u.agg === tier.ACTIVE)).toBe(true);
    expect(ups.filter((u) => u.yours).map((u) => [u.rack, u.agg])).toEqual([['after', tier.ACTIVE]]);
    // the signs sit on the rack's end of the blocked uplinks
    for (const u of ups.filter((x) => x.blocked)) {
      const b = tier.blockAt(u);
      expect(Math.hypot(b.x - u.a.x, b.y - u.a.y)).toBeLessThan(Math.hypot(b.x - u.b.x, b.y - u.b.y));
    }
    expect(tier.coreLinks(L)).toHaveLength(tier.CORES.length * tier.AGGS.length);
  });

  it('sends your parcel and every other rack’s traffic through this switch, never the standby', () => {
    for (const [o, compact] of ORIENTS) {
      const L = tier.tierLayout(o, compact), W = { x: 0, y: 0, ...WORLD_SIZE[o] };
      const standby = [tier.aggBox(L, 1)], mine = tier.aggBox(L, tier.ACTIVE);
      const trip = tier.tripPath(L);
      expect(trip).toContainEqual(L.aggs[tier.ACTIVE]);
      expect(trip.some((p) => standby.some((b) => ptInside(p, b)))).toBe(false);
      for (const f of tier.OTHER_FLOWS) {
        const path = tier.flowPath(L, f);
        expect(path.slice(1, -1).every((p) => ptInside(p, mine))).toBe(true);
        expect(path.some((p) => standby.some((b) => ptInside(p, b)))).toBe(false);
      }
      for (let i = 0; i < 60; i++) {
        const t = (i / 60) * tier.PERIOD;
        for (const c of [tier.parcelAt(t, false, L), ...tier.OTHER_FLOWS.map((f) => tier.otherFlowAt(t, false, L, f))]) if (c.alpha > 0.02) expect(ptInside(c.p, W)).toBe(true);
      }
    }
    // up to the core, down from it and across between racks
    const ends = tier.OTHER_FLOWS.map((f) => [typeof f.from, typeof f.to].join('>'));
    expect(new Set(ends)).toEqual(new Set(['string>number', 'number>string', 'string>string']));
  });

  it('has a stable still pose: your parcel on its way down to the rack', () => {
    const L = tier.tierLayout('landscape'), a = tier.parcelAt(0, true, L), b = tier.parcelAt(123, true, L);
    expect(same(a.p, b.p)).toBe(true);
    expect(a.alpha).toBe(1);
    const agg = L.aggs[tier.ACTIVE], rack = L.racks.after;
    expect(a.p.y).toBeGreaterThan(agg.y);
    expect(a.p.y).toBeLessThan(rack.y);
    for (const f of tier.OTHER_FLOWS) expect(same(tier.otherFlowAt(0, true, L, f).p, tier.otherFlowAt(99, true, L, f).p)).toBe(true);
    // clear of the no-entry signs, in every orientation
    for (const [o, compact] of ORIENTS) {
      const M = tier.tierLayout(o, compact), p = tier.parcelAt(0, true, M).p;
      for (const u of tier.uplinks(M).filter((x) => x.blocked)) expect(Math.hypot(p.x - tier.blockAt(u).x, p.y - tier.blockAt(u).y)).toBeGreaterThan(80);
    }
  });
});

describe('100BASE-TX (copper-pulses in a 2010 home, #164)', () => {
  it('runs the home’s cables at 100 Mbit/s, as MLT-3 on two pairs, and the data centre’s at gigabit', () => {
    const copper = trips().flatMap((r) => r.links.filter((l) => l.dive === 'copper-pulses'));
    const home = copper.filter((l) => l.tech.id === 'fast-ethernet');
    expect(home.length).toBeGreaterThan(0);
    for (const l of home) expect(codeOf(l.rate.down)).toBe('mlt3');
    const dc = copper.filter((l) => l.tech.id !== 'fast-ethernet');
    expect(dc.length).toBeGreaterThan(0);
    for (const l of dc) expect(codeOf(l.rate.down)).toBe('pam5');
    expect(litPairs('mlt3', false)).toEqual([0, 1]);
  });

  it('steps the line through 0, +1, 0, −1 for each 1 and holds it for a 0', () => {
    expect(mlt3Levels([1, 0, 1, 1, 0, 0, 1, 0])).toEqual([1, 1, 0, -1, -1, -1, 0, 0]);
    // four bits in 40 wide, 10 high: +1 (top), +1, 0 (middle), −1 (bottom)
    expect(mlt3Path(0, 0, 40, 10, [1, 0, 1, 1])).toBe('M0 0.0 H10.0 H20.0 V5.0 H30.0 V10.0 H40.0');
  });

  it('sends both ways at once, one pair each way, never on the others', () => {
    for (let t = 0; t < 12; t += 0.25) {
      const live = copperSparks(t, false, true, 'mlt3').filter((s) => s.alpha > 0.02);
      expect(live.length).toBeGreaterThan(0);
      for (const s of live) expect(s.dir).toBe(s.pair === 0 ? 1 : -1);
    }
    expect(copperSparks(3, false, true, 'mlt3').map((s) => s.dir).sort()).toEqual([-1, 1]);
  });
});

describe('the 2010 data centre', () => {
  beforeAll(loadAllPacks);

  it('is a rented cage at a colocation centre: core router, load balancer, aggregation, access and the cache', () => {
    for (const r of trips()) {
      expect(r.era).toBe('2010');
      expect(r.groups.find((g) => g.id === 'datacentre')?.node.id).toBe('colocation');
      const hall = r.chain.filter((h) => h.group === 'datacentre');
      expect(hall.map((h) => `${h.id}:${h.node.id}`)).toEqual(['dc-router:dc-router', 'load-balancer:load-balancer', 'spine:aggregation', 'rack-switch:rack-switch', 'cdn:cdn']);
      // layer 2 ends at the aggregation switch
      expect(r.hops['rack-switch'].role).toBe('bridge');
      const inHall = r.links.filter((l) => r.hops[l.from].group === 'datacentre');
      expect(inHall.map((l) => `${l.tech.id}@${l.rate.down / 1e9}G`)).toEqual(['dc-fibre@10G', 'dc-fibre@10G', 'dc-fibre@10G', 'ethernet@1G']);
      // a cache: a miss still goes back to the origin
      expect(r.asides.filter((a) => a.hop.group === 'datacentre').map((a) => a.hop.id)).toEqual(['origin']);
      const dives = new Set(scenes(r).filter((s) => s.path[1] === 'datacentre').map((s) => s.dive));
      for (const d of ['three-tier', 'fibre-light', 'copper-pulses', 'server-inside']) expect(dives).toContain(d);
      expect(dives).not.toContain('leaf-spine');
    }
  });

  it('draws its fibre as one colour, 10GBASE-SR, and today’s with four', () => {
    expect([oneColour('dc-fibre', '2010'), oneColour('dc-fibre', 'today'), oneColour('dc-fibre'), oneColour('backbone', '2010')]).toEqual([true, false, false, false]);
    expect([metroTag('dc-fibre', true), metroTag('dc-fibre')]).toEqual(['tag.dc-fibre', 'tag.cwdm4']);
    for (const lang of Object.keys(packs)) expect(firstOf(lang, withEra(['scene.fibre-light.tag.dc-fibre'], '2010'))).toMatch(/10GBASE-SR/);
  });

  it('says nothing of a later data centre, unless it says when (#135 F15)', () => {
    const LATER = /\bleaf|\bspine|ECMP|[1-8]00\s?G|25\s?G\b|400GBASE|FR4|CWDM|k8s|Kubernetes|container|NVMe|Maglev|consistent hash|konsistent hash/i;
    const CLOS = /\bClos\b/;
    // the exchange's cross-connect into the hall is the internet's: its drawing's 100GBASE-LR4 was new in 2010, which
    // the trips' test below allows when the words say so
    const EXCHANGE = /^scene\.fibre-light\.cross-connect/;
    const SAYS_WHEN = /today|i dag|nutid|heute|Gegenwart|\b20(1[1-9]|2\d)\b|2010s|2010’erne|2010er/i;
    const bad = new Set<string>();
    for (const r of trips()) {
      const src = stringSources(r);
      const lists: string[][] = [];
      for (const ref of scenes(r).filter((s) => s.path[1] === 'datacentre')) {
        for (const keys of sceneKeys(r, ref)) for (const s of ['', '.describe', '.extra', '.title']) lists.push(keys.map((k) => k + s));
        if (ref.kind === 'dive') lists.push(...['kid', 'nerd', 'title'].map((k) => [`scene.${ref.dive}.${diveSubject(ref)}.${k}`]));
      }
      // the server's rooms: today's say NIC 2×100G, k8s pods and NVMe
      for (const room of ['nic', 'compute', 'memory', 'ssd']) for (const part of ['title', 'line']) lists.push([`scene.server-inside.${room}.${part}`]);
      for (const h of Object.values(r.hops).filter((x) => x.group === 'datacentre')) {
        lists.push([...src.map((s) => `${s}.stop.${h.id}`), `node.${h.node.id}`], [`node.${h.node.id}.name`]);
        lists.push([...src.map((s) => `${s}.tag.${h.id}`), `node.${h.node.id}.tag`]);
      }
      for (const l of r.links.filter((x) => r.hops[x.from].group === 'datacentre')) {
        lists.push([...src.map((s) => `${s}.stop.${l.id}`), `tech.${l.tech.id}`], [`tech.${l.tech.id}.name`]);
        lists.push([...src.map((s) => `${s}.tag.${l.id}`), `tech.${l.tech.id}.tag`]);
      }
      const group = r.groups.find((g) => g.id === 'datacentre')!.node.id;
      lists.push([`node.${group}`], [`node.${group}.tag`], [`node.${group}.inside`], [`node.${group}.inside.describe`]);
      for (const keys of lists) for (const lang of Object.keys(packs)) for (const level of ['kid', 'nerd'] as Level[]) {
        const s = EXCHANGE.test(keys[0]) ? undefined : firstOf(lang, withEra(keys, r.era), level);
        if (s && (LATER.test(s) || CLOS.test(s)) && !SAYS_WHEN.test(s)) bad.add(`${lang} ${level} ${keys[0]}: ${s}`);
      }
    }
    expect([...bad]).toEqual([]);
  });

  it('keeps a dive’s 2010 words for a device to the devices a 2010 route reaches', () => {
    const reached = new Set(trips().flatMap((r) => Object.values(r.hops).map((h) => h.node.id)));
    const at = Object.keys(packs.en.strings).flatMap((k) => k.match(/^scene\.[^.]+\.2010\.(?:[^.]+\.)?at\.([^.]+)\./)?.[1] ?? []);
    expect(at.length).toBeGreaterThan(0);
    expect([...new Set(at)].filter((n) => !reached.has(n))).toEqual([]);
  });
});

describe('the 2010 trips', () => {
  beforeAll(loadAllPacks);

  it('are the home’s ways online and on the go', () => {
    expect(new Set(places.map((p) => basePlace(p)))).toEqual(new Set(['home', 'on-the-go']));
    expect(places.length).toBeGreaterThan(2);
    for (const r of trips()) expect(r.era).toBe('2010');
  });

  it('say nothing of a later internet, unless they say when (#135)', () => {
    const leaks = new Map<string, string>();
    for (const r of trips()) for (const [key, s] of routeWords(r)) {
      const later = (LATER.test(s) || laterRfc(s)) && !SAYS_LATER.test(s), early = NEW.test(s) && !SAYS_NEW.test(s);
      if (later || early) leaks.set(key, s);
    }
    const keyOf = (k: string) => k.split(' ')[2];
    const leaked = new Set([...leaks.keys()].map(keyOf));
    const excused = new Set(UNSHOWN);
    expect([...leaks].filter(([k]) => !excused.has(keyOf(k))).map(([k, s]) => `${k}: ${s}`)).toEqual([]);
    // each excuse still holds: drop an entry once it no longer leaks
    expect([...excused].filter((k) => !leaked.has(k)), 'no longer leaks: take it off UNSHOWN').toEqual([]);
  });

  it('fetch the video in plain HTTP: they name TLS only to say there was none (#180)', () => {
    const NONE = /\b(?:no|without|ingen|uden|ikke|kein|keine|keinen|ohne|nicht)\b/i, bad = new Map<string, string>();
    for (const r of trips()) for (const [key, s] of routeWords(r)) if (/\bTLS\b/.test(s) && !NONE.test(s)) bad.set(key, s);
    expect([...bad].map(([k, s]) => `${k}: ${s}`)).toEqual([]);
  });

  it('fetch one file, the size of the video: then, skipped ahead, the rest of it from there (#180)', () => {
    const r = trips()[0], video = r.activity.flows[0].packets[1];
    for (const lang of Object.keys(packs)) {
      const size = (q: string) => {
        const [, n, unit] = firstOf(lang, withEra([`scene.http-chunk.size.${q}`], r.era), 'nerd')!.match(/^([\d.,]+) (kB|MB)$/)!;
        return Number(n.replace(',', '.')) * (unit === 'MB' ? 1e6 : 1e3);
      };
      expect(size('med')).toBe(video.size);
      expect(size('low')).toBeLessThan(size('med'));
      expect(firstOf(lang, withEra(['scene.http-chunk.status.guess'], r.era), 'nerd')).toMatch(/\b206\b/);
    }
  });

  it('show one rate, their slowest link’s: never today’s 100G of the core they share (#164)', () => {
    for (const r of trips()) {
      const rates = [...routeWords(r)].filter(([k]) => k.endsWith(' {rate}')).map(([, s]) => s);
      expect(rates.length).toBe(Object.keys(packs).length * 2);
    }
    // the walk above reads it: today's core would be caught
    for (const lang of Object.keys(packs)) expect(NEW.test(formatRate(100e9, lang))).toBe(true);
  });

  it('draw a few colours on one fibre only where 2010 did: metro DWDM, long haul and the sea (#135)', () => {
    const many = new Set<string>();
    for (const r of trips()) for (const s of scenes(r)) {
      const tech = s.dive === 'fibre-light' ? s.link?.link.tech.id : undefined;
      if (tech && !oneColour(tech, r.era)) many.add(`${modeOf(tech)}:${tech}`);
    }
    expect([...many].sort()).toEqual(['long-haul:backbone', 'metro:metro-fibre', 'submarine:submarine']);
    // the exchange's cross-connects: one 1310 nm colour, not today's four-lane 100GBASE-LR4
    expect(metroTag('cross-connect', oneColour('cross-connect', '2010'))).toBe('tag.cross-connect');
    for (const lang of Object.keys(packs)) expect(firstOf(lang, withEra(['scene.fibre-light.tag.cross-connect'], '2010'))).toMatch(/^10GBASE-LR · 1310 nm/);
  });

  it('draw the GGSN’s NAT as a carrier’s: phones had private 10/8 addresses before the shared space of 2012', () => {
    expect(carrierNat('10.152.33.7')).toBe(true);
    expect(carrierNat('100.64.12.7')).toBe(true);
    expect(carrierNat('192.168.1.23')).toBe(false);
    const r = resolveRoute({ activity: 'watch-video', places: ['on-the-go-2010'] });
    expect(carrierNat(r.hops.phone.addr!)).toBe(true);
  });
});
