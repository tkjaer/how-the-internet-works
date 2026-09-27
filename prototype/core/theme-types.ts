// The contract between the core (scenes, camera, choreography) and a style/theme (art, tokens, motion, sound).
// A theme is a folder: themes/<id>/{meta.json, theme.ts, tokens.css, art/*.svelte, locales/<lang>.json}.
// meta.json ({ order, swatch }) is read eagerly for the style switcher; everything else loads on demand.
// It overrides any subset of the art slots below; everything else falls back to themes/_base.
import type { Component } from 'svelte';
import type { MotionPreset } from './motion';
import type { Pose } from './packets';
import type { ChildId, DeviceId, Orient, PacketKind, Pt, SceneId, SceneLink, Tech } from './scene';
import type { Timbre } from './sound';

/** Everything is in the coordinates of the scene being drawn (overview: 1600×900 or 900×1600). */
export interface BackdropProps { scene: SceneId; orient: Orient; w: number; h: number; time: number }
export interface DeviceProps {
  id: DeviceId; x: number; y: number; size: number; time: number;
  /** 'path' = in the overview / internet path; 'dive' = drawn big inside a dive scene. */
  context: 'path' | 'dive';
  /** The camera is focused on this stop. */
  focused: boolean;
}
export interface LinkProps { link: SceneLink; d: string; colour: string; time: number; focused: boolean }
export interface PacketProps {
  kind: PacketKind; pose: Pose; colour: string; time: number;
  /** The user is following this packet (draw a reticle / highlight). */
  followed: boolean;
  /** "Alive" toggle: when false, draw a calm packet (pose.sx/sy are 1 anyway). */
  alive: boolean;
}
/** Tap affordance: 'dive' = look inside (layers / physical), 'expand' = more hops. */
export interface HintProps { kind: 'dive' | 'expand'; x: number; y: number; time: number }
/** Nerd-mode callout. `size` is the font size in scene units (already clamped to a readable screen size). */
export interface TagProps { x: number; y: number; text: string; size: number; anchor: 'start' | 'middle' | 'end'; time: number }
/** Scene labels. The core computes `size` (clamped to a minimum screen size); themes style via CSS or override. */
export interface LabelProps { x: number; y: number; text: string; size: number; kind: 'node' | 'link' | 'big' | 'small'; colour?: string; anchor?: 'start' | 'middle' | 'end' }
/** Background ('back') and frame ('edge') of a nested child scene (w×h of its own world). */
export interface PanelProps { scene: ChildId; part: 'back' | 'edge'; w: number; h: number; orient: Orient; time: number }

// Wi-Fi dive (upright scene coordinates, except Wave which is in track space – see details.ts)
export interface WaveProps { d: string; points: Pt[]; time: number }
export interface BitProps { x: number; y: number; bit: number; alpha: number; stem: [Pt, Pt]; time: number; colour: string }
export interface RingsProps { cx: number; cy: number; rings: { r: number; alpha: number }[]; time: number }
// Fibre dive (track space: drawn inside a group that is rotated in portrait)
export interface FibreProps { x0: number; x1: number; y: number; coreH: number; cladH: number; time: number }
export interface PulseProps { head: Pt; trail: Pt[]; channel: number; colour: string; time: number }
export interface PrismProps { x: number; y: number; kind: 'mux' | 'demux'; time: number }
export interface EmitterProps { x: number; y: number; kind: 'laser' | 'detector'; channel: number; colour: string; time: number }
export interface RouteProps { points: Pt[]; channel: number; colour: string }

/** Screen-space overlay (outside the camera: rasterised once, not per zoom frame). */
export interface OverlayProps { w: number; h: number; scene: SceneId; time: number }

export interface ArtSlots {
  Defs: Component<Record<string, never>>;
  Backdrop: Component<BackdropProps>;
  Device: Component<DeviceProps>;
  Link: Component<LinkProps>;
  Packet: Component<PacketProps>;
  Hint: Component<HintProps>;
  Tag: Component<TagProps>;
  Label: Component<LabelProps>;
  Panel: Component<PanelProps>;
  Wave: Component<WaveProps>;
  Bit: Component<BitProps>;
  Rings: Component<RingsProps>;
  Fibre: Component<FibreProps>;
  Route: Component<RouteProps>;
  Pulse: Component<PulseProps>;
  Prism: Component<PrismProps>;
  Emitter: Component<EmitterProps>;
  Overlay: Component<OverlayProps>;
}

export interface ThemeColours {
  tech: Record<Tech, string>;
  packet: Record<PacketKind, string>;
  /** Four DWDM channel colours. */
  dwdm: string[];
  /** Bit glyph colours: [zero, one]. */
  bit: [string, string];
}

export interface Theme {
  id: string;
  /** <meta name="theme-color"> and the page background behind the SVG. */
  themeColor: string;
  /** Colour scheme for native UI (scrollbars, form controls). */
  scheme: 'light' | 'dark';
  motion: MotionPreset;
  timbre: Timbre;
  colours: ThemeColours;
  /** Labels never render smaller than this many CSS px on screen. */
  labelMinPx: number;
  art: ArtSlots;
}

export type ThemeInput = Omit<Theme, 'art'> & { art?: Partial<ArtSlots> };
