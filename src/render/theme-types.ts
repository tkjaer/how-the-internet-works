// The contract between the engine and a style/theme (art, tokens, motion, sound). A theme is a folder:
// content/themes/<id>/{meta.json, theme.ts, tokens.css, art/*.svelte, locales/<lang>.json}. meta.json
// ({ order, swatch }) is read eagerly for the style switcher; everything else loads on demand. A theme overrides any
// subset of the art slots below; the rest fall back to src/render/art-base. Slots only draw engine things (sky, links
// by look, packets, hints, labels…): devices, places and dives bring their own art in their content folders.
import type { Component } from 'svelte';
import type { Orient } from '../define';
import type { Curve } from '../engine/geometry';
import type { MotionPreset } from '../engine/motion';
import type { Pose } from '../engine/packets';
import type { Timbre } from '../engine/sound';

/** Everything is in the coordinates of the scene being drawn (1600×900 or 900×1600). */
export interface BackdropProps { kind: 'root' | 'group'; orient: Orient; w: number; h: number; time: number }
/** Inside a group: the way the packets go through it (issue #20), under the links and devices and over the owner
 *  regions: the entry, every hop and the links between as one path. Side branches are off it. */
export interface RoadProps { d: string; orient: Orient; time: number }
/** Props of a place's own backdrop (content/places/<id>/art/Backdrop.svelte), drawn over the theme's root backdrop;
 *  also of a network node's (content/nodes/<id>/art/Backdrop.svelte), drawn over the theme's in its unfolded scene. */
export interface PlaceBackdropProps { orient: Orient; w: number; h: number; time: number }
/** A node's own art (content/nodes/<id>/art/Device.svelte) draws its body in a 200×200 box; the theme's Device
 *  slot places it, adds a face at `face` (if the theme draws faces), a focus ring, a placeholder while the art loads
 *  (`pending`) and a fallback when there's no art. */
export interface DeviceProps {
  id: string; x: number; y: number; size: number; time: number;
  Art: Component<{ time: number }> | null;
  face: [number, number] | null;
  /** The node's art is on its way (it loads with its place, #91): Art is null for now. Draw a small, quiet placeholder
   *  (no face, not the fallback body), in tokens so day and night both look right, so the art can take its place;
   *  fade the art in when it lands after the placeholder showed. */
  pending?: boolean;
  /** 'path' = in a path scene; 'dive' = drawn big inside a dive scene. */
  context: 'path' | 'dive';
  focused: boolean;
  /** Focused from the keyboard (issue #53): draw the engine's focus ring round it, the ink (--focus-ink, else --ink)
   *  over a gap in the page colour (--focus-gap, else --bg) so it shows on anything, in a group with class "kbd";
   *  class the ink's shapes "kbd-ink" and the gap's "kbd-gap" (forced colours repaint them Highlight and Canvas). */
  kbd?: boolean;
}
/** Links are drawn by their technology's look. */
type LinkLook = 'radio' | 'cable' | 'fibre' | 'trunk';
export interface LinkProps {
  look: LinkLook; d: string; curve: Curve; colour: string; dashed: boolean; time: number; focused: boolean;
  /** Focused from the keyboard: the focus ring along it, as for a device. */
  kbd?: boolean;
}
export interface PacketProps {
  kind: string; pose: Pose; colour: string; time: number;
  /** The way it goes: 'up' towards the server (a request), 'down' back (the answer). Give the two different shapes,
   *  not only different colours (WCAG 1.4.1). */
  dir: 'up' | 'down';
  /** The user is following this packet (draw a reticle / highlight). */
  followed: boolean;
  /** The route's era's parcel touch (#59), if it has one: draw it centred on what the courier carries. */
  mark: Component<EraParcelProps> | null;
}
/** An era's props (content/eras/<id>/art/Props.svelte; #59, the era flavour): a few small decorations that make a
 *  place's overview feel like its time. Drawn twice: 'back' over the place's backdrop and under the links and
 *  devices, 'front' over the devices (a sticker on one). Decoration only: the engine keeps them out of the
 *  accessibility tree, and the place's `describe` mentions the ones a reader would notice. */
export interface EraPropsProps {
  layer: 'back' | 'front';
  /** The place's prop spots in this orientation (its layout's `props`): [x, y, w, h], the centre and size of a box to
   *  keep in, by name. Draw only into the spots you know and skip those a place lacks. */
  spots: Record<string, [number, number, number, number]>;
  /** The scene's devices by stop id (centre and size), to draw on or behind one (a loader on its screen): keep inside
   *  its box, and clear of the face the theme may draw. */
  devices: Record<string, { x: number; y: number; size: number }>;
  /** Packets are on the place's first link (out of the start device), each way. */
  traffic: { up: boolean; down: boolean };
  /** Seconds since the place appeared ("while the video starts"); stands still while paused. */
  age: number;
  /** Scene clock, frozen (0) with prefers-reduced-motion: then draw what blinks or turns still (lit, shown). */
  time: number; still: boolean;
}
/** An era's parcel touch (content/eras/<id>/art/Packet.svelte): a small mark inside a circle `size` across, centred
 *  on the origin, that the theme's Packet draws on its parcel and reel. The two keep their own shapes (#53). */
export interface EraParcelProps { dir: 'up' | 'down'; size: number }
/** Tap affordances ("doors"), each with its own mark: 'dive' = look inside, 'expand' = open up (more stops inside),
 *  'swap' = change where you are / what you do. Drawn in two parts: 'glow' under the devices (a breathing outline
 *  around the thing it opens) and 'badge' over them. */
export interface HintProps {
  kind: 'dive' | 'expand' | 'swap';
  part: 'glow' | 'badge';
  /** The mark's centre; a labelled 'expand' pill is centred here instead. (The engine may nudge a labelled badge up or
   *  down, off its spot, so a label covers no other label and no text of the scene.) */
  x: number; y: number;
  /** A labelled pill runs back from the mark, its label ending there, rather than on from it (not for 'expand'): the
   *  engine's way round a name on the side it would run to. */
  flip: boolean;
  /** The verb in the reader's language ("Look inside", "Open up", "Change"), and its width at `size` in --label-font. */
  label: string; labelW: number;
  /** Show the label in a pill running on from the mark (centred on the spot for 'expand'): on every door while "What
   *  can I explore?" is on, or when hot. Keep the pill within about label width + 3.2·size by 2.4·size (the engine's tap target). */
  labelled: boolean;
  /** Label font size in scene units, clamped to a readable screen size; draw the badge in proportion to it. */
  size: number;
  /** Pointed at (mouse over it, or its caption chip focused); for the 'glow' part, also lit by "What can I explore?"
   *  (lit badges are labelled but plain, so they glow over no text). Hot, a badge grows at most 1.12× round its mark,
   *  its glow at most 0.35·size round it; any badge bobs at most 0.18·size: the engine keeps that much clear of text
   *  and of other badges (model/doors.ts). */
  hot: boolean;
  /** What it opens: a node (a group, or a device to look inside; centre and size) or a link (its path). */
  target: { x: number; y: number; size: number } | { d: string };
  /** Scene clock. Frozen with prefers-reduced-motion, so the badges and outlines stand still. */
  time: number;
}
/** An owner region (issue #20): the part of a path scene one network runs (your internet company, an exchange…).
 *  Drawn in two parts: 'area' under the road and the devices, and 'sign' (its name) over them. */
export interface RegionProps {
  part: 'area' | 'sign';
  /** Its outline, a closed path round its devices. */
  d: string;
  /** Its colour slot: the owner's place along the route (0 = the first), the same in every scene; cycle your own
   *  colours. Neighbouring networks get different tones; tell them apart by more than colour too (an edge
   *  pattern per tone, say: WCAG 1.4.1). */
  tone: number;
  /** Only side branches (a way the packets don't take): draw it fainter. */
  aside: boolean;
  /** The sign's centre, its text (the owner's name, levelled) and font size in scene units (clamped to a readable
   *  screen size). */
  x: number; y: number; label: string; size: number;
}
/** Technical-level callout. `size` is the font size in scene units (already clamped to a readable screen size). */
export interface TagProps { x: number; y: number; text: string; size: number; anchor: 'start' | 'middle' | 'end'; time: number }
/** Scene labels. The engine computes `size` (clamped to a minimum screen size); themes style via CSS or override.
 *  `on` is the body a label is printed on (a lit row, a sign), if not the scene: its halo takes that colour, so ink
 *  on a bright body (colour var(--face)) stays crisp instead of smudging into a dark halo by night. */
export interface LabelProps { x: number; y: number; text: string; size: number; kind: 'node' | 'link' | 'big' | 'small'; colour?: string; on?: string; anchor?: 'start' | 'middle' | 'end' }
/** Background ('back') and frame ('edge') of a nested scene (w×h of its own world): a group's path scene, a link dive
 *  or a layer dive (which the peek panel draws as an envelope; `sealed` when the hop can't open that layer). */
export interface PanelProps { part: 'back' | 'edge'; kind: 'path' | 'dive' | 'layer'; sealed: boolean; w: number; h: number; orient: Orient; time: number }
/** Screen-space overlay (outside the camera: rasterised once, not per zoom frame). */
export interface OverlayProps { w: number; h: number; time: number }

export interface ArtSlots {
  Defs: Component<Record<string, never>>;
  Backdrop: Component<BackdropProps>;
  Road: Component<RoadProps>;
  Device: Component<DeviceProps>;
  Link: Component<LinkProps>;
  Packet: Component<PacketProps>;
  Hint: Component<HintProps>;
  Region: Component<RegionProps>;
  Tag: Component<TagProps>;
  Label: Component<LabelProps>;
  Panel: Component<PanelProps>;
  Overlay: Component<OverlayProps>;
}

export interface Theme {
  id: string;
  /** <meta name="theme-color"> and the page background behind the SVG. */
  themeColor: string;
  /** Colour scheme for native UI (scrollbars, form controls). */
  scheme: 'light' | 'dark';
  /** The theme has a night mode: its tokens.css sets night tokens under `:root[data-mode='night']`, and
   *  these replace `themeColor` and `scheme` at night. Without it the theme is always day and the ☀/🌙 toggle hides. */
  night?: { themeColor: string; scheme: 'light' | 'dark' };
  motion: MotionPreset;
  timbre: Timbre;
  /** Labels never render smaller than this many CSS px on screen. */
  labelMinPx: number;
  art: ArtSlots;
}

export type ThemeInput = Omit<Theme, 'art'> & { art?: Partial<ArtSlots> };
