// What the caption says for a location: title, simple/technical text, a gesture hint, the doors you can open from here and
// learn-more links (issue #4). Text is
// looked up from the most specific source to the least: the places and segments on the route (they can say something
// about a stop in their context), then the node, technology or scene itself.
import type { LearnMore, Level, Orient } from '../define';
import { isShort } from '../engine/camera';
import { doorsOf } from '../model/doors';
import { describeKeys, layerKeys, sceneKeys } from '../model/describe';
import { eraStops, eraYear } from '../model/era';
import { carriedBy } from '../model/ladder';
import { pickLinks } from '../model/links';
import { pathScene, type PathScene } from '../model/layout';
import { activityKey, type Hop, type Route } from '../model/resolve';
import { formatBytes, formatDuration, formatRate, formatTimes, howLong } from '../model/speed';
import { layerCtx } from '../model/stack';
import { diveRuns, diveSubject, downFrom, nodeDive, parentPath, runOf, sceneRef, type SceneRef } from '../model/tree';
import { formatKm, formatLight, groupKm, kmTo, ownersOf, tripKm } from '../model/trip';
import { fill, loc, nameOf, nameW, reading, routeKeys, tr, trActivity, trFirst, trl, trLinks, view, yours } from '../state.svelte';

/** A door to open from the caption, by verb: look inside a link's technology or a device, open up a group (doors of the path
 *  scene, by id), or in a dive go down from an envelope to the signal that carries it and up again (by path). */
export interface CaptionDoor { kind: 'dive' | 'expand' | 'down' | 'up'; id: string; name: string; path?: string[] }
/** A note under the caption's text: a Technical extra (#31: a scene's `extra`, at the Technical level only). */
export interface CaptionNote { kind: 'extra' | 'takes'; text: string }
/** `tag`: a line under the title, e.g. that a dive stands for a stretch of links ("3 stretches · via …"). `describe`:
 *  what the picture shows, to be heard (#53: the announcer and read aloud say it; empty at a stop along the way). */
export interface CaptionText { title: string; tag?: string; body: string; describe: string; hint: string; doors: CaptionDoor[]; links: LearnMore[]; notes: CaptionNote[] }

/** How the caption folds so the scene keeps the screen (Caption.svelte): a one-line pill on a short landscape screen,
 *  a card cut to its title, two lines and its doors on a narrow one (a portrait phone), else not at all. */
export type CaptionFold = 'pill' | 'card' | null;
export const captionFold = (w: number, h: number): CaptionFold => (isShort(w, h) ? 'pill' : w < 700 ? 'card' : null);

/** The caption's time machine chip (#59), on every overview (when there is somewhere else in time to go): the year
 *  of an older era, or null in the newest ("Travel in time"). None (null) elsewhere. */
export function timeChip(r: Route, path: string[]) {
  const { place, options } = r.slots[0];
  if (path.length || eraStops(place, options, r.content).length < 2) return null;
  return { year: eraYear(r) };
}

/** The doors of a path scene (all of them; at a stop only that stop's own), named. Changing place has its own chip.
 *  Dives of the same technology name share one chip (the first); their badges on the map open the others. */
function captionDoors(r: Route, ps: PathScene, o: Orient, root: boolean, stop: string | null): CaptionDoor[] {
  const out: CaptionDoor[] = [];
  for (const d of doorsOf(ps, root, diveRuns(r, ps.group, o).byLink, o, nameW)) {
    if (d.kind === 'swap' || (stop && d.id !== stop && !d.links.includes(stop))) continue;
    const l = d.kind === 'dive' ? ps.links.find((k) => k.id === d.id) : null;
    const name = l ? tr(`tech.${l.link.tech.id}.name`) : tr(`node.${ps.nodes.find((k) => k.id === d.id)!.node.id}.name`);
    if (out.some((o) => o.kind === d.kind && o.name === name)) continue;
    out.push({ kind: d.kind, id: d.id, name });
  }
  return out;
}

/** What a layer dive's text can fill in: {hop}, {yours}, {layer}, and from the link frame {sender} (who wrote it)
 *  and {next} (the next hop that reads the packet, which a router ARPs for). */
function layerVars(r: Route, ref: SceneRef) {
  const at = ref.at!, c = layerCtx(r, at.link, at.flow, at.kind, at.dir, loc.level);
  const who = (h: Hop | null) => (!h ? '' : h === c.client ? yours(h) : nameOf(h));
  return { hop: nameOf(r.hops[at.hop]), yours: yours(c.client), layer: trl(`layer.${at.layer}.name`), sender: who(c.frame.src), next: who(c.next) };
}

/** A layer dive's text, most specific first (`layerKeys`), filled in. */
function layerText(r: Route, ref: SceneRef, suffix: string, level?: Level) {
  return fill(trFirst(layerKeys(r, ref).map((k) => (suffix ? `${k}.${suffix}` : k)), level), layerVars(r, ref));
}

/** A scene's spoken description: what its picture shows (the overview's, place after place), filled in like its text. */
function describeOf(r: Route, ref: SceneRef, level: Level) {
  const said = describeKeys(r, ref).map((keys) => trFirst(keys, level)).filter(Boolean).join(' ');
  return ref.kind === 'layer' ? fill(said, layerVars(r, ref)) : said;
}

/** A dive's Technical extra (#31), under the same keys as its text (most specific first), with `.extra`. */
function extraOf(keys: string[], lv: Level, vars: Record<string, string> = {}): CaptionNote[] {
  const text = lv === 'technical' ? trFirst(keys.map((k) => `${k}.extra`), lv) : '';
  return text ? [{ kind: 'extra', text: fill(text, vars) }] : [];
}

/** The overview's line on how long it takes (#59): the activity's words (its era's), filled in with this route's numbers
 *  (rounder at Simple); none if the activity has nothing sized or no words for it. */
function takesOf(r: Route, lv: Level): CaptionNote[] {
  const h = howLong(r), text = h ? trActivity(r.activity, 'takes', lv) : '';
  if (!h || !text) return [];
  const lang = loc.lang, digits = lv === 'simple' ? 1 : 2, time = (secs: number) => formatDuration(secs, lang, digits);
  return [{ kind: 'takes', text: fill(text, {
    time: time(h.secs), size: formatBytes(h.bytes, lang), rate: formatRate(h.bps, lang), link: tr(`tech.${h.link.tech.id}.name`),
    plays: h.plays ? time(h.plays) : '', faster: h.plays ? formatTimes(h.plays / h.secs, lang, digits) : '',
    now: time(h.now.secs), nowSize: formatBytes(h.now.bytes, lang),
  }) }];
}

/** A hint, naming the keys when the last input was a key (#53; and C, which folds the caption away, #168), else the
 *  gestures; a scene may have none for them (the overview: "What can I explore?" says what there is to tap, #122). */
const hint = (key: string) => (view.keys ? `${tr(`${key}.keys`)} ${tr('hint.fold.keys')}` : trFirst([key]));

/** The title of a scene (for the breadcrumb and the caption). */
export function sceneTitle(r: Route, path: string[], o: Orient): string {
  const ref = sceneRef(r, path, o);
  if (!ref || path.length === 0) return trActivity(r.activity, 'title');
  if (ref.kind === 'path') {
    const g = r.hops[ref.group!];
    return trFirst([...routeKeys(`inside.${g.id}.title`), `node.${g.node.id}.inside.title`, `node.${g.node.id}.name`]);
  }
  if (ref.kind === 'layer') return layerText(r, ref, 'title');
  return trFirst([`scene.${ref.dive}.${diveSubject(ref)}.title`, `scene.${ref.dive}.title`]);
}

/** A dive that stands for a stretch of links: how many, the devices on the way, and how long it is. */
function stretchTag(r: Route, ref: SceneRef, o: Orient): string | undefined {
  if (!ref.link) return undefined;
  const links = runOf(r, ref, o);
  if (links.length < 2) return undefined;
  const ps = pathScene(r, sceneRef(r, parentPath(ref.path), o)!.group, o), via = links.slice(0, -1).map((l) => tr(`node.${ps.nodes.find((n) => n.id === l.to)!.node.id}.name`));
  const km = links.reduce((s, l) => s + (l.link.km ?? 0), 0);
  return [fill(tr('dive.stretches'), { n: links.length, via: new Intl.ListFormat(loc.lang, { type: 'conjunction' }).format(via) }),
    km ? formatKm(km, loc.lang) : ''].filter(Boolean).join(' · ');
}

/** The scale of where you are (issue #20), from the links' km and the hops' owners: how far the whole trip goes, how
 *  many companies a group's packets pass through, whose box a stop is and how far from you, how long a link is. */
function scaleTag(r: Route, key: string, km: number, owners: string[] = []): string | undefined {
  if (!km && !owners.length) return undefined;
  const vars = { km: formatKm(km, loc.lang), light: formatLight(km, loc.lang), n: owners.length };
  const parts = key === 'hop' ? owners.map((o) => trl(`owner.${o}.name`)) : [];
  if (km) parts.push(fill(trl(`trip.${key}`), vars));
  return parts.join(' · ') || undefined;
}

export function captionFor(r: Route, path: string[], stop: string | null, o: Orient): CaptionText {
  const ref = sceneRef(r, path, o);
  const lv = loc.level;
  if (!ref) return { title: '', body: '', describe: '', hint: '', doors: [], links: [], notes: [] };
  if (ref.kind === 'layer') {
    const down = downFrom(r, ref);
    return {
      title: sceneTitle(r, path, o),
      body: layerText(r, ref, '', lv),
      describe: describeOf(r, ref, lv),
      hint: hint('hint.layer'),
      doors: down ? [{ kind: 'down', id: down.join('/'), name: sceneTitle(r, down, o), path: down }] : [],
      links: learnMore(r.era, [`scene.${ref.dive}`, `layer.${ref.at!.layer}`]),
      notes: extraOf(layerKeys(r, ref), lv, layerVars(r, ref)),
    };
  }
  if (ref.kind === 'dive') {
    return {
      title: sceneTitle(r, path, o),
      tag: stretchTag(r, ref, o),
      body: trFirst(sceneKeys(r, ref)[0], lv),
      describe: describeOf(r, ref, lv),
      hint: hint('hint.zoomOut'),
      doors: carriedBy(r, ref, o).map((u) => ({ kind: 'up', id: u.path.join('/'), name: trl(`layer.${u.layer}.name`), path: u.path })),
      links: learnMore(r.era, [`scene.${ref.dive}`, ref.link ? `tech.${ref.link.link.tech.id}` : `node.${ref.node!.node.id}`]),
      notes: extraOf(sceneKeys(r, ref)[0], lv),
    };
  }
  const ps = pathScene(r, ref.group, o);
  const n = stop ? ps.nodes.find((k) => k.id === stop) : null;
  const l = stop && !n ? ps.links.find((k) => k.id === stop) : null;
  const doors = captionDoors(r, ps, o, path.length === 0, n || l ? stop : null);
  if (n) return {
    title: tr(`node.${n.node.id}.name`),
    tag: n.kind === 'group' ? undefined : scaleTag(r, 'hop', kmTo(r, n.hop.index), n.hop.owner ? [n.hop.owner] : []),
    body: trFirst([...routeKeys(`stop.${n.id}`), `node.${n.node.id}`], lv),
    describe: '',
    hint: hint(n.kind === 'group' ? 'hint.expand' : nodeDive(n) ? 'hint.dive' : 'hint.step'),
    doors,
    links: learnMore(r.era, [`node.${n.node.id}`, ...(n.kind !== 'group' && n.hop.owner ? [`owner.${n.hop.owner}`] : [])]),
    notes: [],
  };
  if (l) return {
    title: tr(`tech.${l.link.tech.id}.name`),
    tag: scaleTag(r, 'link', l.link.km ?? 0),
    body: trFirst([...routeKeys(`stop.${l.id}`), `tech.${l.link.tech.id}`], lv),
    describe: '',
    hint: hint(l.dive ? 'hint.dive' : 'hint.step'),
    doors,
    links: learnMore(r.era, [`tech.${l.link.tech.id}`]),
    notes: [],
  };
  if (ref.group) {
    const g = r.hops[ref.group];
    const owners = ownersOf(r, false, g.id);
    return {
      title: sceneTitle(r, path, o),
      tag: owners.length > 1 ? scaleTag(r, 'group', groupKm(r, g.id), owners) : undefined,
      body: trFirst(sceneKeys(r, ref)[0], lv),
      describe: describeOf(r, ref, lv),
      // tapping a box reads it out only with read aloud on (#90)
      hint: hint(reading() && !view.keys ? 'hint.group.speech' : 'hint.group'),
      doors,
      links: learnMore(r.era, [`node.${g.node.id}`]),
      notes: [],
    };
  }
  return {
    title: sceneTitle(r, [], o),
    tag: scaleTag(r, 'trip', tripKm(r)),
    body: [trActivity(r.activity, lv), ...sceneKeys(r, ref).map((keys) => trFirst(keys, lv))].filter(Boolean).join(' '),
    describe: describeOf(r, ref, lv),
    hint: hint('hint.overview'),
    doors,
    links: learnMore(r.era, [activityKey(r.activity), ...r.slots.map((s) => `place.${s.place}`)]),
    notes: takesOf(r, lv),
  };
}

/** The links a card about some content items ("scene.tcp-pieces", "layer.tcp") shows in the route's era, at the
 *  reader's language and level (model/links.ts). */
export const learnMore = (era: string, items: string[], lang = loc.lang, level = loc.level, max = 3) => pickLinks(trLinks(items, lang), era, lang, level, max);
