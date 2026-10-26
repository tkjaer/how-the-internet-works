// Per-render contexts: the World (its camera) and the scene being drawn (its place in the scene tree and its frame in
// root coordinates), so text can clamp to a readable on-screen size and backdrop layers can do depth parallax.
import { getContext, setContext } from 'svelte';
import type { Cam } from '../engine/camera';
import type { SLink, SNode } from '../model/layout';
import type { Hop, Link, Route } from '../model/resolve';
import type { LayerCtx } from '../model/stack';
import type { Frame } from '../model/tree';
import { themeState } from '../state.svelte';

/** A scene of the tree that is drawn this frame (key = its path joined by "/"). During a slide between rungs of a stack
 *  (#62) the two scenes share one panel on screen: `cam` puts this one's there (else the World's), its back and content
 *  move down by `shift` panel heights inside it, and only the scene sliding in draws the panel's `edge`. */
export interface Mounted { key: string; path: string[]; alpha: number; slide?: { cam?: Cam; shift: number; edge: boolean } }

export interface WorldCtx { readonly cam: Cam }
export interface SceneCtx {
  readonly path: string[];
  /** Local point p → root (x + p.x·s, y + p.y·s). */
  readonly frame: Frame;
  /** The camera zoom (in root units) at which this scene fills the screen. */
  readonly fitK: number;
  /** The scene's clock: view.time while it is drawn, held while it is hidden (as its World's camera is), so a mounted
   *  scene nobody sees doesn't redraw its art every frame (#181). */
  readonly time: number;
}
/** What a link dive explains: the link it was opened from, as drawn in its parent and in the route. Scenes use it to
 *  adapt (e.g. the fibre dive shows GPON's up/down colours on the access fibre). */
export interface LinkSubject {
  kind: 'link';
  /** The underlying route link (its technology, stack, ends). */
  link: Link;
  /** The link as drawn in the parent scene (for a collapsed group this is the link entering it). */
  sceneLink: SLink;
  /** The route links this dive stands for, in route order: a stretch of same-technology links is one dive (#34). */
  run: Link[];
  route: Route;
}
/** What a device dive explains: the hop it was opened at, as drawn in its parent, and the links either side (null at
 *  the ends of the route). Scenes use them to adapt, e.g. the home router lights the port its cable arrives on, or its
 *  Wi‑Fi radio when the phone is on Wi‑Fi. */
export interface NodeSubject {
  kind: 'node';
  /** The hop (its node definition, role and addresses). */
  hop: Hop;
  /** The device as drawn in the parent scene. */
  sceneNode: SNode;
  /** The link it arrives on and the one it leaves on, towards the server. */
  in: Link | null;
  out: Link | null;
  route: Route;
}
/** What a layer dive explains: one layer as one hop sees it (`ctx.to`, with its `role`), e.g. IP at a NAT or TCP
 *  sealed at a router. The same context the layer's envelope gets in the peek panel. */
export interface LayerSubject {
  kind: 'layer';
  layer: string;
  ctx: LayerCtx;
  /** Whether this hop opens the layer (else it only sees it sealed). */
  open: boolean;
  route: Route;
}
export type Subject = LinkSubject | NodeSubject | LayerSubject;

export const setWorld = (w: WorldCtx) => setContext('world', w);
export const getWorld = () => getContext<WorldCtx>('world');
export const setScene = (s: SceneCtx) => setContext('scene', s);
export const getScene = () => getContext<SceneCtx>('scene');

/** Clamp for text a scene draws itself (Text does the same): `const legible = legibleSize()` while the component
 *  initialises, then `font-size={legible(24)}` never gets smaller than the theme's labelMinPx on screen. */
export function legibleSize() {
  const world = getWorld(), scene = getScene();
  return (size: number) => Math.max(size, themeState.current.labelMinPx / (world.cam.k * scene.frame.s));
}
/** The same for technical tags (TagAt): a little smaller than labels, `tagSize()(20)`. */
export function tagSize() {
  const world = getWorld(), scene = getScene();
  return (size: number) => Math.max(size, (themeState.current.labelMinPx * 0.85) / (world.cam.k * scene.frame.s));
}
