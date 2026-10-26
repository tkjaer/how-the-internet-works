// The packet model (issue #17). For a flow travelling one way along a route, what the packet is made of on every link:
// each layer's header fields with real example values. Nothing is written per hop. The values come from the layers'
// header schemas (content/layers/<id>/layer.ts) and from a few facts the route implies: addresses after each NAT, the
// TTL after each router, MAC addresses per link-layer stretch, tunnel ends and lengths. So each hop *applies* its
// effects just by being what it is (a NAT, a router, a bridge, a tunnel end), and a new layer or hop needs no code.
// hopView() compares the packet as a hop receives it with the packet as it sends it on, and marks what the hop uses
// and what changed.
import type { FlowDef, LayerDef, Role } from '../define';
import { nowEra, type WithId } from './registry';
import type { Hop, Link, Route } from './resolve';

export type Dir = 'up' | 'down';

/** A resolved value: its text; the hop it names (an address or MAC belongs to someone: the Simple level shows its name); or a
 *  string key (a simple value written "@key" in the schema is the string layer.<id>.value.<key>). */
export interface Val { text: string; who?: Hop; key?: string }
/** simple: what the Simple level shows (null: not shown there). */
export interface FieldVal { id: string; bits?: number; value: Val; simple: Val | null }
/** bytes: the size of this layer's own header (and trailer). */
export interface LayerVal { id: string; fields: FieldVal[]; bytes: number }

/** The facts header templates can use, as {name} (documented in docs/authoring.md). */
export const FACTS = [
  'src', 'dst', 'sport', 'dport', 'ttl', 'mac.src', 'mac.dst', 'mac.tx', 'mac.rx', 'tunnel.src', 'tunnel.dst',
  'len', 'payload', 'sum', 'crc', 'label', 'ack',
] as const;
const INNER = 'inner.';
/** {fact}, {inner.<code>}, or a size with an offset: {payload+8}. */
export const FACT = /\{([\w.]+(?:[+-]\d+)?)\}/;

/** A stable, made-up MAC address for an instance (locally administered range). */
export function fakeMac(id: string): string {
  let h = 2166136261;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const b = [0x02, (h >>> 24) & 255, (h >>> 16) & 255, (h >>> 8) & 255, h & 255, id.length * 37 & 255];
  return b.map((x) => x.toString(16).padStart(2, '0')).join(':');
}

function hash(parts: string[]): number {
  let h = 2166136261;
  for (const p of parts) for (const ch of p) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
/** A stable, made-up MPLS label: the one the receiving hop asked for, per direction (16–15 999 are reserved or
 *  static in real networks; these land in 16 000–31 999). */
export const fakeLabel = (rx: string, dir: Dir) => String(16000 + (hash([rx, dir]) % 16000));
const hex = (n: number, digits: number) => `0x${(n >>> 0).toString(16).padStart(8, '0').slice(-digits)}`;

/** Travel order: the hop after chain hop `h` for a packet going `dir`. */
export const nextHop = (h: number, dir: Dir) => (dir === 'up' ? h + 1 : h - 1);
/** Stepping a caught packet `d` hops along its way (−1 = back where it came from); null past either end. */
/** Stepping a caught packet is spatial, like every ◀ ▶ (look-and-feel): path scenes lay the chain out left → right
 *  (portrait: bottom → top), so a request (up) moves along it on screen and a response against it. `s` is a screen
 *  direction (+1 = right/up: a button, arrow key or swipe); returns the hop step (+1 = on) for `stepHop`. */
export const hopStepFor = (dir: Dir, s: -1 | 1): -1 | 1 => (dir === 'up' ? s : s > 0 ? -1 : 1);
export function stepHop(r: Route, h: number, dir: Dir, d: -1 | 1): number | null {
  const n = d > 0 ? nextHop(h, dir) : nextHop(h, dir === 'up' ? 'down' : 'up');
  return n >= 0 && n < r.chain.length ? n : null;
}
/** Where a packet going `dir` enters a view: the first hop on its way (from its sender) that the view draws
 *  (`drawn`). Path scenes lay the chain out left → right, so a request enters on the left (portrait: the bottom) and a
 *  response on the right (the top). Null if the view draws none. */
export function entryHop(r: Route, dir: Dir, drawn: (h: number) => boolean): number | null {
  let h: number | null = dir === 'up' ? 0 : r.chain.length - 1;
  while (h !== null && !drawn(h)) h = stepHop(r, h, dir, 1);
  return h;
}
/** Where a packet caught on chain link `i` is shown: the hop it's heading to, or the one it just left if only that
 *  one is drawn (`drawn`). */
export function hopAhead(i: number, dir: Dir, drawn: (h: number) => boolean): number {
  const ahead = dir === 'up' ? i + 1 : i, behind = dir === 'up' ? i : i + 1;
  return drawn(ahead) || !drawn(behind) ? ahead : behind;
}
const linkBetween = (r: Route, a: number, b: number): Link | null => (a < 0 || b < 0 ? null : r.links[Math.min(a, b)] ?? null);

/** The client's address and port as seen on chain link `i` (after every NAT on the way), and who owns that address. */
export function clientAt(r: Route, i: number, flow?: FlowDef): { addr: Val; port?: number } {
  let addr: Val = { text: r.chain[0].addr ?? '', who: r.chain[0] }, port = flow?.ports?.client;
  for (let k = 1; k <= i && k < r.chain.length; k++) {
    const h = r.chain[k];
    if (!h.natTo) continue;
    addr = { text: h.natTo, who: h };
    if (h.natPort) port = h.natPort;
  }
  return { addr, port };
}

const forwards = (h: Hop) => h.role === 'router' || h.role === 'nat';
const switchedOn = (r: Route, l: Link | undefined) => l?.stack.filter((id) => r.content.layers[id]?.switched) ?? [];
/** Whether chain hop `h` forwards on a label alone (an MPLS core router): it routes, and the links either side carry
 *  the same label-switched layer, so it swaps the label without reading the packet inside. */
export function labelSwitched(r: Route, h: number): boolean {
  const a = switchedOn(r, r.links[h - 1]), b = switchedOn(r, r.links[h]);
  return a.some((id) => b.includes(id)) && forwards(r.chain[h]);
}
/** What the peek says chain hop `h` does (#17), its keys most specific first: the device's own words (this way, then
 *  both), then its role's, in an era of the past the era's first (`era.1995.peek.role.router`: no ECMP in 1995). */
export function peekKeys(r: Route, h: number, dir: Dir): string[] {
  const at = r.chain[h], last = r.chain.length - 1;
  const role = h === (dir === 'up' ? 0 : last) ? 'start' : h === (dir === 'up' ? last : 0) ? 'end' : at.natTo ? `nat.${dir}` : labelSwitched(r, h) ? 'switched' : at.role;
  return [`node.${at.node.id}.peek.${dir}`, `node.${at.node.id}.peek`, ...(r.era === nowEra() ? [] : [`era.${r.era}.peek.role.${role}`]), `peek.role.${role}`];
}
/** TTL on chain link `i`: 64 at the sender, minus one per router passed. That is a label-switched layer's own TTL
 *  (`label`); the packet's own skips the routers that only switched its label on the run of labelled links it is
 *  still on, and catches up when the label comes off (its TTL is copied back: RFC 3443's uniform model). */
export function ttlAt(r: Route, i: number, dir: Dir, label = false): number {
  const passed = dir === 'up' ? r.chain.slice(1, i + 1) : r.chain.slice(i + 1, -1);
  let ttl = 64 - passed.filter(forwards).length;
  const back = dir === 'up' ? -1 : 1;
  if (!label) for (let h = dir === 'up' ? i : i + 1; labelSwitched(r, h); h += back) ttl++;
  return ttl;
}

const isTunnel = (r: Route, id: string) => !!r.content.layers[id]?.tunnel;
/** Where link frames end: at any hop that isn't a bridge or passive, and at the ends of a tunnel (they are hosts on the
 *  network that carries the tunnel). A bridge (an access point, a switch) passes the frame's addresses on, and a
 *  passive hop (a splitter) doesn't even see them. */
function l2End(r: Route, h: number): boolean {
  const hop = r.chain[h];
  if (hop.role !== 'bridge' && hop.role !== 'passive') return true;
  const a = r.links[h - 1]?.stack.filter((l) => isTunnel(r, l)) ?? [], b = r.links[h]?.stack.filter((l) => isTunnel(r, l)) ?? [];
  return a.join() !== b.join();
}
function walkTo(r: Route, from: number, step: number, stop: (h: number) => boolean): Hop {
  let h = from;
  while (h + step >= 0 && h + step < r.chain.length && !stop(h)) h += step;
  return r.chain[h];
}
/** The hops where a tunnel layer on link `i` starts and ends (the run of links that carry it). */
function tunnelEnds(r: Route, i: number, layer: string): [Hop, Hop] {
  let lo = i, hi = i;
  while (r.links[lo - 1]?.stack.includes(layer)) lo--;
  while (r.links[hi + 1]?.stack.includes(layer)) hi++;
  return [r.chain[lo], r.chain[hi + 1]];
}

/** The link frame on chain link `i` going `dir`: the hops whose MAC addresses it carries, where it was written (src)
 *  and where it ends (dst). Bridges pass frames on, so these can lie beyond the link's own two hops. */
export function frameEnds(r: Route, i: number, dir: Dir): { src: Hop; dst: Hop } {
  const tx = r.chain[dir === 'up' ? i : i + 1], rx = r.chain[dir === 'up' ? i + 1 : i];
  const back = dir === 'up' ? -1 : 1;
  return { src: walkTo(r, tx.index, back, (h) => l2End(r, h)), dst: walkTo(r, rx.index, -back, (h) => l2End(r, h)) };
}

const pick = (v: string | { up: string; down: string }, dir: Dir) => (typeof v === 'string' ? v : v[dir]);
/** A field's size on the wire in an era, in bits. */
const bitsIn = (f: LayerDef['fields'][number], era: string) => f.bitsIn?.[era] ?? f.bits;
/** The size of a layer's own header (and trailer) going `dir`, in bytes. */
const ownBytes = (def: LayerDef, dir: Dir, era: string) => Math.ceil(def.fields.reduce((s, f) => s + (bitsIn(f, era) ?? 0), 0) / 8) + (def.bytes?.[dir] ?? 0);
/** Whether a link's frames carry MAC addresses (a layer on it has a mac.* field; a phone line's PPP has none). */
export const carriesMac = (r: Route, l: Link) =>
  l.stack.some((id) => r.content.layers[id]?.fields.some((f) => (['up', 'down'] as const).some((d) => pick(f.value, d).includes('{mac.'))));
const macOf = (h: Hop): Val => ({ text: fakeMac(h.id), who: h });

/** The layers on chain link `i` (outermost first), as a packet of `flow` travelling `dir` has them. */
export function packetOn(r: Route, flow: FlowDef, i: number, dir: Dir): LayerVal[] {
  const link = r.links[i];
  const ids = [...link.stack, ...flow.stack];
  const defs = ids.map((id) => r.content.layers[id]);
  const client = clientAt(r, i, flow), server = r.chain[r.chain.length - 1];
  const srv = { addr: { text: server.addr ?? '', who: server } as Val, port: flow.ports?.server };
  const [me, them] = dir === 'up' ? [client, srv] : [srv, client];
  const tx = r.chain[dir === 'up' ? i : i + 1], rx = r.chain[dir === 'up' ? i + 1 : i];
  const frame = frameEnds(r, i, dir);
  const port = (p?: number): Val => ({ text: p === undefined ? '' : String(p) });
  const base: Record<string, Val> = {
    src: me.addr, dst: them.addr, sport: port(me.port), dport: port(them.port), ttl: { text: String(ttlAt(r, i, dir)) },
    'mac.tx': macOf(tx), 'mac.rx': macOf(rx), label: { text: fakeLabel(rx.id, dir) },
    'mac.src': macOf(frame.src), 'mac.dst': macOf(frame.dst),
  };

  // inside out: lengths and checksums cover what is inside
  const out: LayerVal[] = [];
  let inner = 0;
  const innerTexts: string[] = [];
  const other: Dir = dir === 'up' ? 'down' : 'up';
  for (let k = ids.length - 1; k >= 0; k--) {
    const def = defs[k], id = ids[k];
    const own = ownBytes(def, dir, r.era);
    const facts: Record<string, Val> = { ...base, len: { text: String(own + inner) }, payload: { text: String(inner) } };
    if (def.switched) facts.ttl = { text: String(ttlAt(r, i, dir, true)) };
    const seq = def.fields.find((f) => f.id === 'seq');
    if (seq) facts.ack = { text: String(Number(pick(seq.value, other)) + defs.slice(k + 1).reduce((s, d) => s + ownBytes(d, other, r.era), 0)) };
    if (def.tunnel) {
      const [a, b] = tunnelEnds(r, i, id), [s, d] = dir === 'up' ? [a, b] : [b, a];
      facts['tunnel.src'] = { text: s.addr ?? '', who: s };
      facts['tunnel.dst'] = { text: d.addr ?? '', who: d };
    }
    const next = defs[k + 1];
    const look = (name: string): Val => {
      if (name.startsWith(INNER)) return { text: next?.code?.[name.slice(INNER.length)] ?? '' };
      const [, fact, add] = /^(.*?)([+-]\d+)?$/.exec(name)!;
      const v = facts[fact] ?? { text: '' };
      return add ? { text: String(Number(v.text) + Number(add)) } : v;
    };
    const fill = (tpl: string): Val => {
      if (tpl.startsWith('@')) return { text: '', key: `layer.${id}.value.${tpl.slice(1)}` };
      const whole = FACT.exec(tpl);
      if (whole?.[0] === tpl) return look(whole[1]);
      return { text: tpl.replace(new RegExp(FACT, 'g'), (_, name: string) => look(name).text) };
    };
    const fields: FieldVal[] = [];
    for (const f of def.fields) {
      const tpl = pick(f.value, dir);
      if (!tpl) continue;
      const value = fill(tpl);
      fields.push({ id: f.id, bits: bitsIn(f, r.era), value, simple: f.simple === undefined ? null : f.simple === true ? value : fill(pick(f.simple, dir)) });
    }
    // checksums last: over this layer's other fields (+ the addresses, like TCP's pseudo-header); a frame check
    // sequence over everything inside too
    const texts = fields.map((f) => f.value.text);
    for (const [fi, f] of fields.entries()) {
      const tpl = pick(def.fields.find((d) => d.id === f.id)!.value, dir);
      if (tpl === '{sum}') f.value = { text: hex(hash([...texts, base.src.text, base.dst.text]) & 0xffff, 4) };
      else if (tpl === '{crc}') f.value = { text: hex(hash([...texts, ...innerTexts]), Math.min(8, (f.bits ?? 32) / 4)) };
      texts[fi] = f.value.text;
    }
    innerTexts.push(...texts);
    inner += own;
    out.unshift({ id, fields, bytes: own });
  }
  return out;
}

// ------------------------------------------------------------------ one hop: as received → used / changed → as sent

/** open: this hop reads the layer; closed: it could, but doesn't open it; sealed: it is encrypted for this hop. */
export type LayerState = 'open' | 'closed' | 'sealed';
export interface FieldView extends FieldVal {
  /** The hop acts on it. */
  used: boolean;
  /** Its value as received, when the hop changed it. */
  before: Val | null;
}
export interface LayerView {
  id: string;
  state: LayerState;
  /** kept: received and sent on (maybe changed); added: put on here; removed: taken off here. */
  change: 'kept' | 'added' | 'removed';
  fields: FieldView[];
}
export interface HopView {
  hop: Hop;
  dir: Dir;
  /** The links it arrives on and leaves on (null at the start and at the end). */
  arrive: Link | null;
  leave: Link | null;
  layers: LayerView[];
}

/** Align two stacks by layer id (longest common subsequence): kept layers, and what was taken off or put on. */
function align(a: string[], b: string[]): { id: string; ai: number; bi: number }[] {
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out: { id: string; ai: number; bi: number }[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) out.push({ id: a[i], ai: i++, bi: j++ });
    else if (i < n && (j >= m || L[i + 1][j] >= L[i][j + 1])) out.push({ id: a[i], ai: i++, bi: -1 });
    else out.push({ id: b[j], ai: -1, bi: j++ });
  }
  return out;
}

const usedBy = (def: WithId<LayerDef>, fid: string, role: Role) => {
  const u = def.fields.find((f) => f.id === fid)?.use;
  return u === true ? role !== 'passive' : !!u?.includes(role);
};

/** Whether a hop with this role opens a layer. A passive hop opens none unless the layer names it. */
export const opensLayer = (def: LayerDef | undefined, role: Role) => (def?.openAt ? def.openAt.includes(role) : role !== 'passive');

/** The packet of `flow` going `dir`, at chain hop `h`: what arrives, what the hop uses and changes, what leaves. */
export function hopView(r: Route, flowId: string, dir: Dir, h: number): HopView {
  const flow = r.activity.flows.find((f) => f.id === flowId) ?? r.activity.flows[0];
  const hop = r.chain[h], role = hop.role;
  const arrive = linkBetween(r, h, nextHop(h, dir === 'up' ? 'down' : 'up'));
  const leave = linkBetween(r, h, nextHop(h, dir));
  const got = arrive ? packetOn(r, flow, arrive.index, dir) : null;
  const sent = leave ? packetOn(r, flow, leave.index, dir) : null;
  const a = got ?? [], b = sent ?? got ?? [];
  const rows = got && sent ? align(a.map((l) => l.id), b.map((l) => l.id)) : b.map((l, k) => ({ id: l.id, ai: got ? k : -1, bi: k }));
  let seal = false;
  // a label-switching router reads only the label: nothing inside it is its business
  let under = false;
  const lsr = labelSwitched(r, h);
  const layers: LayerView[] = [];
  for (const row of rows) {
    const def = r.content.layers[row.id];
    const inL = row.ai >= 0 ? a[row.ai] : null, outL = row.bi >= 0 ? b[row.bi] : null;
    const open = opensLayer(def, role);
    const state: LayerState = seal ? 'sealed' : open ? 'open' : 'closed';
    const change = inL && outL ? 'kept' : outL ? 'added' : 'removed';
    const shown = (outL ?? inL)!;
    const fields = shown.fields.map((f): FieldView => {
      const was = inL?.fields.find((x) => x.id === f.id)?.value;
      const before = change === 'kept' && was && was.text !== f.value.text ? was : null;
      return { ...f, used: state !== 'sealed' && !under && !!inL && usedBy(def, f.id, role), before };
    });
    layers.push({ id: row.id, state, change, fields });
    if (def.seals && !open && change !== 'removed') seal = true;
    if (lsr && def.switched && change === 'kept') under = true;
  }
  return { hop, dir, arrive: got ? arrive : null, leave: sent ? leave : null, layers };
}
