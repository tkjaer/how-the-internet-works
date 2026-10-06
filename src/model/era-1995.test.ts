// The 1995 trips (#59, steps 6 and 7; on the go, #147): the maths of their new dives, the way they go, the server room
// at their end, and that nothing they say belongs to a later internet (review panel F14–F16: MPLS, 100–400G, coherent
// optics, leaf–spine and CDNs reached from 1995; on the go: GSM's circuit-switched data, never GPRS or 3G).
import { beforeAll, describe, expect, it } from 'vitest';
import type { Level } from '../define';
import { CELL, PACKET, cellsFor, cellsOnLine, lineBytes, overhead } from '../../content/scenes/atm-cells/atm';
import { FRAME_S, QUARTER, lineCode, lineRate, modeOf, pulsePath, quartersOf, slotsOf, train } from '../../content/scenes/tdm-frames/tdm';
import { FRAME, MODES, ROWS, USERS } from '../../content/scenes/nr-radio/radio';
import { CODES, codeOf, copperSparks, eyePaths, litPairs, manchesterPath } from '../../content/scenes/copper-pulses/copper';
import { WORLD_SIZE, bezier } from '../engine/geometry';
import { stubBrowser } from '../test/stub-browser';
import type * as Server from '../../content/scenes/server-inside/server';
import { bulk } from '../../content/scenes/http-chunk/http';
import { routeWords, scenes } from '../test/era-walk';
import { layerKeys, sceneKeys } from './describe';
import { pathScene, propSpots } from './layout';
import { activityIds, content } from './registry';
import { firstOf, loadAllPacks, packs, withEra } from './strings';
import { resolveRoute } from './resolve';
import { diveSubject } from './tree';

describe('timeslots (tdm-frames)', () => {
  it('frames a PRI, a leased E1 and a T1 as the standards do', () => {
    const pri = slotsOf('pri');
    expect(pri).toHaveLength(32);
    expect(pri[0]).toBe('sync');
    expect(pri[16]).toBe('signal');
    expect(pri.filter((k) => k === 'yours')).toHaveLength(1);
    // 30 B channels: yours, the others and the free ones
    expect(pri.filter((k) => k === 'yours' || k === 'other' || k === 'idle')).toHaveLength(30);
    expect(slotsOf('e1').filter((k) => k === 'pipe')).toHaveLength(31);
    const t1 = slotsOf('t1');
    expect(t1).toHaveLength(25);
    expect(t1.filter((k) => k === 'pipe')).toHaveLength(24);
    expect(lineRate('e1')).toBe(2.048e6);
    expect(lineRate('pri')).toBe(2.048e6);
    expect(lineRate('t1')).toBe(1.544e6);
    expect(FRAME_S).toBeCloseTo(125e-6);
    expect(modeOf('t1')).toBe('t1');
    expect(modeOf('pri')).toBe('pri');
    expect(modeOf('submarine-sdh')).toBe('e1');
  });

  it('frames the GSM network’s E1s (#147): a trunk like a PRI with SS7, the mast’s line in quarter-slots', () => {
    expect(modeOf('trunk')).toBe('trunk');
    expect(modeOf('abis')).toBe('abis');
    const trunk = slotsOf('trunk');
    expect(trunk).toEqual(slotsOf('pri'));
    expect(quartersOf('trunk').every((q) => q === null)).toBe(true);
    const abis = slotsOf('abis');
    expect(abis[0]).toBe('sync');
    // the mast's signalling (LAPD) in slot 1, and slot 16 a slot of calls like any other
    expect(abis[1]).toBe('signal');
    expect(abis.filter((k) => k === 'signal')).toHaveLength(1);
    expect(abis[16]).toBe('other');
    // four 16 kbit/s calls to a slot of calls, one of them yours; whole slots everywhere else
    const q = quartersOf('abis');
    abis.forEach((k, i) => expect(q[i]?.length ?? 0, `slot ${i}`).toBe(k === 'yours' || k === 'other' ? 4 : 0));
    const yours = q.flatMap((s, i) => (s ?? []).map((k, j) => [i, j, k] as const)).filter(([, , k]) => k === 'yours');
    expect(yours).toEqual([[abis.indexOf('yours'), QUARTER, 'yours']]);
    expect(lineRate('abis')).toBe(2.048e6);
  });

  it('keeps a train of frames on its wire, slot 0 leading', () => {
    for (const mode of ['pri', 'e1', 't1'] as const) for (const t of [0, 0.37, 2.5, 11]) for (const dir of [1, -1] as const) {
      const slots = train(t, mode, 100, 900, 12, 30, 80, dir);
      expect(slots.length).toBeGreaterThan(20);
      for (const s of slots) {
        expect(s.x).toBeGreaterThanOrEqual(100);
        expect(s.x + 12).toBeLessThanOrEqual(900 + 1e-9);
        expect(s.i).toBeLessThan(slotsOf(mode).length);
      }
    }
  });

  it('codes the copper: ones alternate, an E1 hides four zeros in a violation, a T1 needs none', () => {
    const e1 = lineCode('e1');
    const v = e1.filter((c) => c.v);
    expect(v).toHaveLength(1);
    const i = e1.indexOf(v[0]);
    const before = e1.slice(0, i).filter((c) => c.level).at(-1)!;
    // a violation has the same sign as the pulse before it
    expect(v[0].level).toBe(before.level);
    expect(e1.slice(i - 3, i).every((c) => c.level === 0)).toBe(true);
    const t1 = lineCode('t1').filter((c) => c.level);
    expect(lineCode('t1').some((c) => c.v)).toBe(false);
    for (let k = 1; k < t1.length; k++) expect(t1[k].level).toBe(-t1[k - 1].level);
    const d = pulsePath(e1, 0, 0, 100, 40);
    expect(d.startsWith('M0 20')).toBe(true);
    expect(d.endsWith('H100')).toBe(true);
  });
});

describe('ATM cells (atm-cells)', () => {
  it('cuts a full-size packet into 32 cells of 53 bytes', () => {
    expect(CELL).toBe(53);
    expect(cellsFor(PACKET)).toBe(32);
    expect(lineBytes(PACKET)).toBe(1696);
    expect(overhead(PACKET)).toBeCloseTo(0.116, 3);
    // a bare TCP ack (40 bytes) plus AAL5's 16 needs a second cell
    expect(cellsFor(40)).toBe(2);
    expect(cellsFor(32)).toBe(1);
  });

  it('keeps the cells on the line, in order, swapped past the switch', () => {
    for (const t of [0, 1.3, 7.9]) {
      const cells = cellsOnLine(t, 100, 1500, 800, 40, 70, 120);
      expect(cells.length).toBeGreaterThan(10);
      for (const c of cells) {
        expect(c.x).toBeGreaterThanOrEqual(100);
        expect(c.x + 40).toBeLessThanOrEqual(1500);
        expect(c.swapped).toBe(c.x + 20 > 800);
      }
      for (let k = 1; k < cells.length; k++) expect(cells[k].n).toBe(cells[k - 1].n - 1);
    }
  });
});

describe('10BASE-T (copper-pulses in 1995)', () => {
  it('draws 10 Mbit/s as Manchester code on two pairs, anything faster as PAM-5', () => {
    expect(codeOf(10e6)).toBe('manchester');
    expect(codeOf(1e9)).toBe('pam5');
    expect(litPairs('manchester', false)).toEqual([0, 1]);
    expect(litPairs('pam5', true)).toEqual([0, 1, 2, 3]);
    expect(CODES.manchester.labels).toHaveLength(2);
    expect(CODES.pam5.labels).toHaveLength(5);
    expect(eyePaths([0.08, 0.92], 6)).toHaveLength(6);
    expect(CODES.pam5.eye).toHaveLength(12);
  });

  it('flips the line in the middle of every bit, low to high for a one', () => {
    // two bits in 40 wide, 10 high: 1 (low, high) then 0 (high, low)
    expect(manchesterPath(0, 0, 40, 10, [1, 0])).toBe('M0 10.0 H10.0 V0.0 H20.0 H30.0 V10.0 H40.0');
    const bits = [1, 1, 0, 1, 0, 0];
    const d = manchesterPath(0, 0, 120, 10, bits);
    // a flip in the middle of every bit
    for (let i = 0; i < bits.length; i++) expect(d).toContain(`H${(i * 20 + 10).toFixed(1)} V`);
  });

  it('takes turns on its two pairs: one way at a time, never on the others', () => {
    for (let t = 0; t < 12; t += 0.25) {
      const live = copperSparks(t, false, true, 'manchester').filter((s) => s.alpha > 0.02);
      expect(live.length).toBeLessThanOrEqual(1);
      for (const s of live) expect(s.dir).toBe(s.pair === 0 ? 1 : -1);
    }
    expect(copperSparks(0, false, true).length).toBe(8);
  });
});

describe('a GSM data call on the air (nr-radio in 1995, #147)', () => {
  it('keeps each call’s seat in every 8-slot frame, sent or not, and gives it nobody else', () => {
    const { gsm } = MODES;
    expect(gsm.beams).toBe(false);
    const seats = (u: number) => {
      const out: [number, number][] = [];
      for (let slot = 0; slot < FRAME * 4; slot++) for (let row = 0; row < ROWS; row++) if (gsm.owner(slot, row) === u) out.push([row, slot]);
      return out;
    };
    for (let u = 0; u < USERS; u++) {
      const s = seats(u);
      // once a frame, on one carrier, in the same slot of every frame
      expect(s).toHaveLength(4);
      expect(new Set(s.map(([r]) => r)).size).toBe(1);
      expect(new Set(s.map(([, t]) => t % FRAME)).size).toBe(1);
      for (let k = 1; k < s.length; k++) expect(s[k][1] - s[k - 1][1]).toBe(FRAME);
    }
    // you (user 0) talk in slot 3 on the middle carrier; the rest of the grid is free (-1)
    expect(seats(0)[0]).toEqual([2, 3]);
    expect(gsm.owner(-5, 2)).toBe(0);
    let free = 0;
    for (let slot = 0; slot < FRAME; slot++) for (let row = 0; row < ROWS; row++) if (gsm.owner(slot, row) < 0) free++;
    expect(free).toBe(FRAME * ROWS - USERS);
  });
});

describe('inside the 1995 web server (server-inside, tower mode)', () => {
  let server: typeof Server;
  beforeAll(async () => {
    stubBrowser();
    server = await import('../../content/scenes/server-inside/server');
  });
  type Box = { x: number; y: number; w: number; h: number };
  const inside = (a: Box, b: Box) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
  const apart = (a: Box, b: Box) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
  const at = (p: { x: number; y: number }, b: Box) => p.x >= b.x && p.y >= b.y && p.x <= b.x + b.w && p.y <= b.y + b.h;

  it('draws the web server as a tower and every other server as a cache', () => {
    expect(server.modeOf('web-server')).toBe('tower');
    expect(server.modeOf('cdn')).toBe('cache');
  });

  it('lays out a network card, the computer and a disk in the case, and the hub outside it', () => {
    for (const [o, compact] of [['landscape', false], ['portrait', false], ['landscape', true]] as const) {
      const L = server.towerLayout(o, compact), W = { x: 0, y: 0, ...WORLD_SIZE[o] }, rooms = Object.values(L.rooms);
      expect(Object.keys(L.rooms).sort()).toEqual(['compute', 'disk', 'nic']);
      expect(inside(L.case, W)).toBe(true);
      expect(at(L.inNode, W) && !at(L.inNode, L.case)).toBe(true);
      expect(at(L.statusTag, W)).toBe(true);
      for (const [i, r] of rooms.entries()) {
        expect(inside(r, L.case)).toBe(true);
        for (const q of rooms.slice(i + 1)) expect(apart(r, q)).toBe(true);
      }
    }
  });

  it('asks the disk through the card and the program, and sends the page, then its picture, back the same way', () => {
    const L = server.towerLayout('landscape');
    expect(server.askPath(L)).toEqual([...server.filePath(L)].reverse());
    expect(server.askPath(L).slice(-3)).toEqual([server.centre(L.rooms.nic), server.programPoint(L), server.diskPoint(L)]);
    const moment = (t: number) => server.towerAt(t * server.PERIOD, false, L);
    expect([moment(0.2).file, moment(1.2).file, moment(2.2).file]).toEqual(['page', 'picture', 'page']);
    expect(moment(0.1).request.stage).toBe('in');
    expect(moment(0.45)).toMatchObject({ reading: 1 });
    expect(moment(0.7).reply).toMatchObject({ stage: 'out', alpha: 1 });
    // the card is up only while the file goes back
    expect([moment(0.3).statusAlpha, moment(0.75).statusAlpha, moment(0.995).statusAlpha]).toEqual([0, 1, 0]);
    for (const [o, compact] of [['landscape', false], ['portrait', false], ['landscape', true]] as const) {
      const L = server.towerLayout(o, compact), W = { x: 0, y: 0, ...WORLD_SIZE[o] };
      for (let i = 0; i < 120; i++) {
        const s = server.towerAt((i / 60) * server.PERIOD, false, L);
        for (const c of [s.request, s.reply]) if (c.alpha > 0.02) expect(at(c.p, W)).toBe(true);
      }
    }
    // held still: the page on its way out, its card up
    expect(server.towerAt(42, true, L)).toMatchObject({ file: 'page', reply: { stage: 'out', alpha: 1 }, statusAlpha: 1 });
  });
});

describe('the 1995 trip', () => {
  beforeAll(loadAllPacks);
  // every 1995 place (the PC at home, and on the go a laptop on a GSM call, #147), for every activity
  const places = () => Object.keys(content.places).filter((p) => content.places[p].era === '1995');
  const trips = () => places().flatMap((place) => activityIds().map((activity) => resolveRoute({ activity, places: [place] })));
  /** How each 1995 place reaches the ISP's modem bank. */
  const CALL: Record<string, string[]> = {
    'home-dialup': ['dialup/ppp', 'pri/ppp'],
    'on-the-go-1995': ['gsm/ppp', 'abis/ppp', 'abis/ppp', 'trunk/ppp', 'pri/ppp'],
  };

  it('dials, then rides timeslots, a sea cable and ATM to the server room', () => {
    expect(places().sort()).toEqual(Object.keys(CALL).sort());
    for (const r of trips()) {
      expect(r.era).toBe('1995');
      const way = r.links.map((l) => `${l.tech.id}/${l.stack.join('+')}`), call = CALL[r.slots[0].place];
      expect(way.slice(0, call.length + 5)).toEqual([...call, 'ethernet/ethernet', 'e1/hdlc', 'submarine-sdh/hdlc', 'atm/atm', 't1/hdlc']);
      expect(r.asides.map((a) => `${a.link.id}/${a.link.tech.id}`)).toContain('core-ixp/e1');
      const steps = scenes(r).map((s) => s.path.at(-1));
      // the layers' own dives: HDLC at the ISP's router, ATM at the backbone's
      expect(steps).toContain('core~hdlc');
      expect(steps.some((s) => s?.endsWith('~atm'))).toBe(true);
      expect(scenes(r).some((s) => s.dive === 'tdm-frames')).toBe(true);
    }
  });

  it('ends in a small server room: its router, a 10 Mbit/s hub and one web server, no data centre (step 7)', () => {
    for (const r of trips()) {
      expect(r.groups.find((g) => g.id === 'datacentre')?.node.id).toBe('server-room');
      const room = r.chain.filter((h) => h.group === 'datacentre');
      expect(room.map((h) => `${h.id}:${h.node.id}`)).toEqual(['dc-router:dc-router', 'hub:hub', 'cdn:web-server']);
      expect(r.hops.hub.role).toBe('passive');
      const inRoom = r.links.filter((l) => r.hops[l.to].group === 'datacentre');
      expect(inRoom.map((l) => l.tech.id)).toEqual(['t1', 'ethernet', 'ethernet']);
      expect(inRoom.filter((l) => l.tech.id === 'ethernet').every((l) => l.rate.down === 10e6 && l.rate.up === 10e6)).toBe(true);
      // no cache's way back to an origin
      expect(r.asides.filter((a) => a.hop.group === 'datacentre')).toEqual([]);
      const dives = scenes(r).filter((s) => s.path[1] === 'datacentre').map((s) => s.dive);
      expect(dives).toContain('server-inside');
      expect(dives).not.toContain('leaf-spine');
    }
  });

  it('is a phone call all the way to the ISP’s modems: nothing on the way has an address or reads IP (#147)', () => {
    for (const r of trips()) {
      const upTo = r.chain.findIndex((h) => h.node.id === 'modem-bank');
      expect(upTo).toBeGreaterThan(0);
      // the PC's or the laptop's address comes from the ISP over PPP; every device between is a bridge for the call
      for (const h of r.chain.slice(1, upTo)) {
        expect(h.addr, `${r.slots[0].place} ${h.id}`).toBeUndefined();
        expect(h.role, `${r.slots[0].place} ${h.id}`).toBe('bridge');
      }
      expect(r.links.slice(0, upTo).every((l) => l.stack.join('+') === 'ppp')).toBe(true);
    }
    const gsm = resolveRoute({ activity: 'watch-video', places: ['on-the-go-1995'] });
    expect(gsm.chain.slice(0, 6).map((h) => `${h.id}:${h.node.id}`)).toEqual(['phone:laptop-gsm', 'cell-tower:bts', 'bsc:bsc', 'mobile-core:msc', 'exchange:exchange', 'bng:modem-bank']);
    // 9.6 kbit/s each way on the air: a third of the PC's modem at home
    expect(gsm.links[0].rate).toEqual({ down: 9600, up: 9600 });
    expect(scenes(gsm).find((s) => s.path.join('/') === 'phone-cell-tower')?.dive).toBe('nr-radio');
    expect(scenes(gsm).filter((s) => s.dive === 'tdm-frames').map((s) => s.path.at(-1))).toEqual(expect.arrayContaining(['cell-tower-bsc', 'mobile-core-exchange', 'exchange-bng']));
  });

  it('reaches the exchange from the mobile network on the go, not on a copper loop (#180)', () => {
    const words = (place: string) => [...routeWords(resolveRoute({ activity: 'watch-video', places: [place] }))].filter(([k]) => / node\.exchange$|\.stop\.exchange$/.test(k));
    expect(words('home-dialup').some(([, s]) => /copper loop|kobberlinje|Kupferleitung/.test(s))).toBe(true);
    expect(words('on-the-go-1995').filter(([, s]) => /copper|kobber|Kupfer/.test(s))).toEqual([]);
    expect(words('on-the-go-1995').length).toBeGreaterThan(0);
  });

  it('speaks HTTP/1.0 in the clear: it names TLS and Host only to say there were none (#180)', () => {
    const NAMES = /\bTLS\b|\bHost\b/, NONE = /\b(?:no|without|ingen|uden|ikke|kein|keine|keinen|ohne|nicht)\b/i;
    const bad = new Map<string, string>();
    for (const r of trips()) for (const [key, s] of routeWords(r)) if (NAMES.test(s) && !NONE.test(s)) bad.set(key, s);
    expect([...bad].map(([k, s]) => `${k}: ${s}`)).toEqual([]);
  });

  it('says a phone network’s switch carries the page’s HTTP unread, never that a router forwards it (#180)', () => {
    let seen = 0;
    for (const r of trips()) for (const ref of scenes(r)) {
      if (ref.kind !== 'layer' || ref.at!.layer !== 'http' || r.hops[ref.at!.hop].role !== 'bridge') continue;
      for (const lang of Object.keys(packs)) for (const level of ['kid', 'nerd'] as Level[]) {
        expect(firstOf(lang, withEra(layerKeys(r, ref), r.era), level), `${lang} ${level} ${ref.path.join('/')}`).not.toMatch(/router/i);
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('sizes the page and its picture as it draws them: the page the smaller, 40 kB in all (#180)', () => {
    const r = trips()[0], page = r.activity.flows[0].packets.find((p) => p.kind === 'page')!;
    for (const lang of Object.keys(packs)) {
      const size = (q: string) => {
        const [, n, unit] = firstOf(lang, withEra([`scene.http-chunk.size.${q}`], r.era), 'nerd')!.match(/^([\d.,]+) (B|kB)$/)!;
        return Number(n.replace(',', '.')) * (unit === 'kB' ? 1000 : 1);
      };
      expect(size('ask')).toBeLessThan(1000);
      // the first answer is the page, the second its picture
      expect(size('med')).toBeLessThan(size('low'));
      expect(size('med') + size('low')).toBeLessThanOrEqual(page.size!);
      expect(size('med') + size('low')).toBeGreaterThan(page.size! * 0.75);
    }
    expect(bulk({ kind: 'chunk', quality: 'med' }, true)).toBeLessThan(bulk({ kind: 'chunk', quality: 'low' }, true));
  });

  it('runs the phone line from the PC through the modem to the socket on the wall, then out (#137)', () => {
    const r = resolveRoute({ activity: 'watch-video', places: ['home-dialup'] });
    for (const o of ['landscape', 'portrait'] as const) {
      const line = pathScene(r, null, o).links.find((l) => l.from === 'pc')!, spots = propSpots(content.places['home-dialup'], o);
      // where along the line (0 at the PC, 1 at the internet) each one is, and how far off it
      const on = ([x, y]: number[]) => {
        let best = { t: 0, d: Infinity };
        for (let i = 0; i <= 400; i++) { const p = bezier(line, i / 400), d = Math.hypot(p.x - x, p.y - y); if (d < best.d) best = { t: i / 400, d }; }
        return best;
      };
      const modem = on(spots.modem), socket = on(spots.socket);
      expect(modem.d, `${o}: the line goes through the modem`).toBeLessThan(6);
      expect(socket.d, `${o}: the line goes into the socket`).toBeLessThan(6);
      expect(modem.t).toBeLessThan(socket.t);
    }
  });

  it('says nothing of a later internet, unless it says when (review panel F14–F16, #164, #174)', () => {
    // DiffServ's DSCP came in 1998 and ECN in 2001: 1995's IP header has a type-of-service byte (#174)
    // TCP's later 10-segment start (IW10), ECN's CWR and ECE flags, DASH's sum of size over time, CGNAT and the systems
    // of later phones and Macs (#180); and any RFC from after 1995 (RFC 1883 came out that December)
    const LATER = /MPLS|coherent|DWDM|leaf|CDN|[1-8]00\s?G|400GBASE|k8s|Kubernetes|75 000|80 000|NVMe|SSD|container|VLAN|802\.1Q|1000BASE|gigabit|\bDSCP\b|\bECN\b|DiffServ|ECMP|\bIW10\b|\b10 segment|\bCWR\b|\bECE\b|÷|bitrate|bithastighed|Carrier-grade|Android|\biOS\b|macOS/i;
    const laterRfc = (s: string) => [...s.matchAll(/\bRFC ?(\d+)/g)].some(([, n]) => Number(n) > 1883);
    // and on the go (#147): GSM's circuit-switched data only, no packet radio
    const MOBILE = /\b(GPRS|EDGE|HSCSD|HSPA|SGSN|GGSN|GTP|UMTS|[345]G|LTE|NR)\b/;
    const SAYS_WHEN = /today|i dag|nutid|heute|Gegenwart|\b(199[6-9]|20\d\d)\b/i;
    // walked, but never shown in 1995: the cache's rooms (1995's server is drawn as a tower: a card, the computer and
    // a disk) and gigabit's PAM-5 card (1995's copper is 10BASE-T's Manchester)
    const UNSHOWN = ['scene.server-inside.ssd.title', 'scene.copper-pulses.tag.speedShort'];
    const bad = new Map<string, string>();
    for (const r of trips()) for (const [key, s] of routeWords(r)) if ((LATER.test(s) || MOBILE.test(s) || laterRfc(s)) && !SAYS_WHEN.test(s)) bad.set(key, s);
    const keyOf = (k: string) => k.split(' ')[2];
    expect([...bad].filter(([k]) => !UNSHOWN.includes(keyOf(k))).map(([k, s]) => `${k}: ${s}`)).toEqual([]);
    // each excuse still holds: drop an entry once it no longer leaks
    expect(UNSHOWN.filter((k) => ![...bad.keys()].some((b) => keyOf(b) === k)), 'no longer leaks: take it off UNSHOWN').toEqual([]);
  });

  it('keeps a dive’s 1995 words for a device to the devices a 1995 route reaches', () => {
    const reached = new Set(trips().flatMap((r) => Object.values(r.hops).map((h) => h.node.id)));
    const at = Object.keys(packs.en.strings).flatMap((k) => k.match(/^scene\.[^.]+\.1995\.(?:[^.]+\.)?at\.([^.]+)\./)?.[1] ?? []);
    expect(at.length).toBeGreaterThan(0);
    expect([...new Set(at)].filter((n) => !reached.has(n))).toEqual([]);
  });

  it('draws the server room as it was: nothing on the way says it is drawn as today (step 7)', () => {
    const TODAY = /drawn as today|tegnet som i dag|gezeichnet wie heute/i;
    const bad = new Set<string>();
    for (const r of trips()) {
      const room = scenes(r).filter((s) => s.path[1] === 'datacentre');
      const keys = room.flatMap((ref) => [
        ...sceneKeys(r, ref).flatMap((k) => ['', '.describe', '.extra', '.title'].map((x) => k.map((y) => y + x))),
        ...(ref.kind === 'dive' ? ['kid', 'nerd', 'title'].map((k) => [`scene.${ref.dive}.${diveSubject(ref)}.${k}`]) : []),
      ]);
      for (const k of keys) for (const lang of Object.keys(packs)) for (const level of ['kid', 'nerd'] as Level[]) {
        const s = firstOf(lang, withEra(k, r.era), level);
        if (s && TODAY.test(s)) bad.add(`${lang} ${level} ${k[0]}: ${s}`);
      }
    }
    expect([...bad]).toEqual([]);
  });

  it('counts the networks of its own time', () => {
    const nerd = (era: string | undefined) => firstOf('en', withEra(['node.internet'], era), 'nerd')!;
    expect(nerd(undefined)).toMatch(/80 000/);
    expect(nerd('2010')).toMatch(/35 000/);
    expect(nerd('1995')).toMatch(/1 700/);
    expect(Object.keys(content.eras)).toEqual(expect.arrayContaining(['1995', '2010']));
  });
});
