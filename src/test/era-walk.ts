// What a route of an era of the past says (#59), for the tests that keep later technology out of it
// (era-1995.test.ts, era-2010.test.ts).
import type { Level } from '../define';
import { sceneKeys } from '../model/describe';
import { pickLinks } from '../model/links';
import { peekKeys } from '../model/packet';
import { basePlace, content } from '../model/registry';
import { activityKey, stringSources, type Route } from '../model/resolve';
import { role } from '../model/schema';
import { formatRate, howLong } from '../model/speed';
import { linksOf, lookupLevel, packs, withEra } from '../model/strings';
import { childrenOf, sceneRef, type SceneRef } from '../model/tree';

/** Every reachable scene of a route, in both orientations. */
export function scenes(r: Route): SceneRef[] {
  const out = new Map<string, SceneRef>();
  for (const o of ['landscape', 'portrait'] as const) {
    const walk = (ref: SceneRef): void => {
      out.set(ref.path.join('/'), ref);
      for (const c of childrenOf(r, ref, o)) walk(sceneRef(r, [...ref.path, c.step], o)!);
    };
    walk(sceneRef(r, [], o)!);
  }
  return [...out.values()];
}

const LEVELS: Level[] = ['kid', 'nerd'];
const TEXTS = ['', '.describe', '.extra', '.title'];

/** The captions' keys, each most specific first: every reachable scene's own words, the stops' and links' names,
 *  words and tags, and what the peek says each hop does, both ways. */
function captionKeys(r: Route): string[][] {
  const src = stringSources(r), lists: string[][] = [];
  for (const ref of scenes(r)) for (const keys of sceneKeys(r, ref)) for (const s of TEXTS) lists.push(keys.map((k) => k + s));
  for (const h of Object.values(r.hops)) {
    lists.push([...src.map((s) => `${s}.stop.${h.id}`), `node.${h.node.id}`], [`node.${h.node.id}.name`]);
    lists.push([...src.map((s) => `${s}.tag.${h.id}`), `node.${h.node.id}.tag`]);
    if (h.owner) lists.push([`owner.${h.owner}.name`]);
  }
  for (const l of [...r.links, ...r.asides.map((a) => a.link)]) {
    lists.push([...src.map((s) => `${s}.stop.${l.id}`), `tech.${l.tech.id}`], [`tech.${l.tech.id}.name`]);
    lists.push([...src.map((s) => `${s}.tag.${l.id}`), `tech.${l.tech.id}.tag`]);
  }
  for (const h of r.chain.keys()) for (const dir of ['up', 'down'] as const) lists.push(peekKeys(r, h, dir));
  return lists;
}

/** Everything else the route's content says, one key each (a dive's room titles and tags, a layer's fields, the
 *  era's words): every key of every item on the route (its places, segments, activity, devices, owners, links, layers,
 *  the dives it reaches and its era) that is not a caption's and names no item the route lacks
 *  (`scene.fibre-light.gpon.…` on a route without GPON). */
function labelKeys(r: Route): string[][] {
  const dives = new Set(scenes(r).flatMap((s) => s.dive ?? []));
  const hops = Object.values(r.hops), links = [...r.links, ...r.asides.map((a) => a.link)];
  const layers = new Set([...links.flatMap((l) => l.stack), ...r.activity.flows.flatMap((f) => f.stack)]);
  const items = [
    ...stringSources(r), `era.${r.era}`,
    ...hops.map((h) => `node.${h.node.id}`), ...hops.flatMap((h) => (h.owner ? [`owner.${h.owner}`] : [])),
    ...links.map((l) => `tech.${l.tech.id}`), ...[...layers].map((l) => `layer.${l}`), ...[...dives].map((d) => `scene.${d}`),
  ];
  const places = r.slots.map((s) => s.place);
  const here = new Set([
    ...items.map((i) => i.slice(i.indexOf('.') + 1)), ...places, ...places.map((p) => basePlace(p)), r.activity.id,
    ...r.sources.map((s) => s.id.slice(s.id.indexOf('.') + 1)), ...hops.map((h) => h.id), ...links.map((l) => l.id),
  ]);
  const ids = new Set([...Object.values(content).flatMap((kind) => Object.keys(kind)), ...here]);
  const eras = new Set(Object.keys(content.eras));
  // a caption's key: a scene's words for a layer, device, technology, role or stop (`scene.ip-post.ip.at.core`), or
  // an item's own words, name and tag, its words for a stop and its inside
  const head = new Set(['at', 'role', 'sealed', 'switched', ...role.options]);
  const caption = (item: string, rest: string[]) => {
    const p = TEXTS.includes(`.${rest.at(-1)}`) ? rest.slice(0, -1) : rest;
    if (item.startsWith('scene.')) return p.every((s) => ids.has(s) || head.has(s));
    if (item.startsWith('layer.') || item.startsWith('era.')) return false;
    return p.length === 0 || (p.length === 1 && ['name', 'tag', 'inside'].includes(p[0])) || (p.length === 2 && ['stop', 'tag', 'inside'].includes(p[0]) && ids.has(p[1]));
  };
  const keys = new Set<string>();
  for (const key of Object.keys(packs.en.strings)) {
    const item = items.find((i) => key.startsWith(`${i}.`));
    if (!item) continue;
    const parts = key.slice(item.length + 1).split('.');
    const rest = LEVELS.includes(parts.at(-1) as Level) ? parts.slice(0, -1) : parts;
    // an era's block is read through withEra, in the route's era only
    if (!item.startsWith('era.') && eras.has(rest[0])) continue;
    if (rest.some((s) => ids.has(s) && !here.has(s)) || caption(item, rest)) continue;
    keys.add([item, ...rest].join('.'));
  }
  return [...keys].map((k) => [k]);
}

/** The content items whose learn-more links a route's cards show, as the caption picks from them (caption.ts): each
 *  layer and dive scene's, each stop's and link's, the overview's; and each layer's in the peek's field tree (nerd, two). */
function cards(r: Route): { items: string[]; level?: Level; max?: number }[] {
  const out: { items: string[]; level?: Level; max?: number }[] = [];
  const links = [...r.links, ...r.asides.map((a) => a.link)];
  for (const ref of scenes(r)) {
    if (ref.kind === 'layer') out.push({ items: [`scene.${ref.dive}`, `layer.${ref.at!.layer}`] });
    else if (ref.kind === 'dive') out.push({ items: [`scene.${ref.dive}`, ref.link ? `tech.${ref.link.link.tech.id}` : `node.${ref.node!.node.id}`] });
  }
  for (const h of Object.values(r.hops)) out.push({ items: [`node.${h.node.id}`, ...(!r.groups.includes(h) && h.owner ? [`owner.${h.owner}`] : [])] });
  for (const l of links) out.push({ items: [`tech.${l.tech.id}`] });
  out.push({ items: [activityKey(r.activity), ...r.slots.map((s) => `place.${s.place}`)] });
  const layers = new Set([...links.flatMap((l) => l.stack), ...r.activity.flows.flatMap((f) => f.stack)]);
  for (const id of layers) out.push({ items: [`layer.${id}`], level: 'nerd', max: 2 });
  return out;
}

/** What a route says, as its era says it, in every language and level: `<lang> <level> <key>` → the words, by the
 *  key that says them; `<lang> <level> {link:<url>}` → a learn-more link a card shows, by its title and URL; and
 *  `<lang> <level> {rate}` → the one link rate it shows, its slowest link's in the overview's
 *  line on how long it takes (`howLong`). No other rate is shown, so the 100G of today's backbone, sea cable and
 *  cross-connects, on 2010's routes too, is only ever said where it is the slowest link. */
export function routeWords(r: Route): Map<string, string> {
  const lists = [...captionKeys(r), ...labelKeys(r)], out = new Map<string, string>(), h = howLong(r);
  for (const lang of Object.keys(packs)) for (const level of LEVELS) {
    for (const keys of lists) for (const k of withEra(keys, r.era)) {
      const s = lookupLevel(lang, k, level);
      if (s === undefined) continue;
      out.set(`${lang} ${level} ${k}`, s);
      break;
    }
    if (h) out.set(`${lang} ${level} {rate}`, formatRate(h.bps, lang));
    for (const card of cards(r)) for (const l of pickLinks(linksOf(lang, card.items), r.era, lang, card.level ?? level, card.max)) out.set(`${lang} ${level} {link:${l.url}}`, `${l.title} <${l.url}>`);
  }
  return out;
}
