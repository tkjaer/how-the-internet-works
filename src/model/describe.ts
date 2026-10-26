// The string keys a scene's own text is looked up by, most specific first, and so its spoken description (#53): what
// the picture shows and what moves, under the same keys plus `.describe` ({ simple, technical }), so a variant for one
// technology, device, hop or role needs no new engine concept. Pure, so the coverage test walks it for every scene.
import { labelSwitched } from './packet';
import { stringSources, type Route } from './resolve';
import { opens } from './stack';
import { diveSubject, type SceneRef } from './tree';

/** A layer dive's keys: at this kind of node, for its role (a router that only switches a label first as
 *  `switched`), sealed (when it can't open the layer), then the scene's own; each first for this layer (a scene may
 *  serve several layers), then for any. */
export function layerKeys(r: Route, ref: SceneRef): string[] {
  const at = ref.at!, hop = r.hops[at.hop], base = `scene.${ref.dive}`;
  const roles = labelSwitched(r, hop.index) ? ['switched', hop.role] : [hop.role];
  const chain = (b: string) => [`${b}.at.${hop.node.id}`, ...roles.map((role) => `${b}.role.${role}`), ...(opens(r, at.layer, hop.role) ? [] : [`${b}.sealed`]), b];
  return [...chain(`${base}.${at.layer}`), ...chain(base)];
}

/** A scene's keys, most specific first: a dive's for its technology or device, then its own; a group's from the
 *  route (the places, the segments, the activity: `inside.<group>`), then the group node's; the overview's, one list
 *  per place on the route (said one after the other). */
export function sceneKeys(r: Route, ref: SceneRef): string[][] {
  if (ref.kind === 'layer') return [layerKeys(r, ref)];
  if (ref.kind === 'dive') return [[`scene.${ref.dive}.${diveSubject(ref)}`, `scene.${ref.dive}`]];
  if (ref.group) {
    const g = r.hops[ref.group];
    return [[...stringSources(r).map((s) => `${s}.inside.${g.id}`), `node.${g.node.id}.inside`]];
  }
  return r.slots.map((s) => [`place.${s.place}`]);
}

/** Where a scene's description is looked up: `sceneKeys` with `.describe`. */
export const describeKeys = (r: Route, ref: SceneRef) => sceneKeys(r, ref).map((keys) => keys.map((k) => `${k}.describe`));
