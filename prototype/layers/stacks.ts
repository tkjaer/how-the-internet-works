// Envelope layers (issue #5): every layer is its own folder (Layer.svelte + locales) and is reused at every hop
// where it applies. A layer gets context as props and decides for itself what to show: e.g. TCP is sealed at
// transit hops and only opened by the endpoints; the home router's NAT rewrites the IP sender address.
import type { Component, Snippet } from 'svelte';
import type { Level } from '../core/i18n';
import type { DeviceId, PacketKind, SceneLink, Tech } from '../core/scene';

/** What the device that reads the packet next does with it. */
export type Role = 'endpoint' | 'bridge' | 'nat' | 'router';

export interface LayerCtx {
  packet: PacketKind;
  link: SceneLink;
  /** Where the packet comes from / goes next on this link (the next device reads it). */
  from: DeviceId; to: DeviceId;
  role: Role;
  /** Private (behind the home router's NAT) or public side of the path. */
  side: 'private' | 'public';
  level: Level;
}
export type LayerComponent = Component<{ ctx: LayerCtx; depth: number; children?: Snippet }>;

export const roleOf = (d: DeviceId): Role =>
  d === 'phone' || d === 'cdn' ? 'endpoint' : d === 'ap' ? 'bridge' : d === 'router' || d === 'home' ? 'nat' : 'router';

/** Lower (technology-specific) layers per link technology. Upper layers are shared by every technology. */
export const TECH_STACK: Record<Tech, string[]> = {
  wifi: ['wifi'],
  ethernet: ['ethernet'],
  fibre: ['gpon'],
  backbone: ['ethernet', 'mpls'],
};
/** Per-link overrides, e.g. the IXP is a big shared Ethernet switch, and the backhaul carries VLAN-tagged Ethernet. */
const LINK_STACK: Record<string, string[]> = {
  'cabinet-backhaul': ['ethernet'], 'backhaul-bng': ['ethernet'], 'core-ixp': ['ethernet'], 'ixp-cdn': ['ethernet'],
};
export const UPPER = ['ip', 'tcp', 'tls', 'http'];
export const stackFor = (link: SceneLink) => [...(LINK_STACK[link.id] ?? TECH_STACK[link.tech]), ...UPPER];

const PRIVATE_LINKS = new Set(['phone-ap', 'ap-router']);
export function contextFor(packet: PacketKind, link: SceneLink, reverse: boolean, level: Level): LayerCtx {
  const from = reverse ? link.to : link.from, to = reverse ? link.from : link.to;
  return { packet, link, from, to, role: roleOf(to), side: PRIVATE_LINKS.has(link.id) ? 'private' : 'public', level };
}

export const LAYERS = Object.fromEntries(
  Object.entries(import.meta.glob<LayerComponent>('./*/Layer.svelte', { eager: true, import: 'default' }))
    .map(([p, c]) => [p.split('/')[1], c]),
) as Record<string, LayerComponent>;

/** Illustrative addresses (documentation ranges, RFC 5737). */
export const ADDR = { phone: '192.168.1.23', routerLan: '192.168.1.1', public: '203.0.113.7', server: '198.51.100.20' };

/** `layer.<id>.<name>.<level>` with a level-less fallback. */
import { has } from '../core/i18n';
import { tr } from '../state.svelte';
export function lt(key: string, level: Level) {
  const k = `${key}.${level}`;
  return has(k) ? tr(k) : tr(key);
}
/** Device display name for layer notes. */
export const dn = (d: DeviceId) => tr(`node.${d}`);
