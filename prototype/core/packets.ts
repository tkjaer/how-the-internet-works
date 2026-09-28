// Packet schedule + kinematics, shared by every style. A theme's Packet art receives a `Pose` and decides how to
// draw it (rotate along the path or stay upright, face the direction of travel…).
import { bezier, bezierAngle, type PacketKind, type PacketSpec, type SceneLink } from './scene';

export interface Pose {
  x: number; y: number;
  /** Direction of travel (radians, screen-y down). */
  angle: number;
  /** The link it is on, its index in the route, and whether it travels the link backwards. */
  link: SceneLink; seg: number; reverse: boolean;
}

export interface LivePacket { id: string; kind: PacketKind; age: number; spec: PacketSpec; pose: Pose }

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function pose(spec: PacketSpec, links: SceneLink[], age: number): Pose | null {
  const f = age / spec.duration;
  if (f < 0 || f >= 1) return null;
  const n = spec.route.length;
  const seg = Math.min(n - 1, Math.floor(f * n));
  const u = f * n - seg;
  const link = links.find((k) => k.id === spec.route[seg])!;
  const reverse = spec.kind === 'video';
  // glide along each link: mostly eased, with a little constant speed so packets never quite stop at a node
  const s = u * 0.35 + easeInOutCubic(u) * 0.65;
  const t = reverse ? 1 - s : s;
  const p = bezier(link, t);
  return { x: p.x, y: p.y, angle: bezierAngle(link, t) + (reverse ? Math.PI : 0), link, seg, reverse };
}

/** All packets on their way at `time` for a path scene, with poses. */
export function livePackets(specs: PacketSpec[], links: SceneLink[], time: number, prefix: string): LivePacket[] {
  const out: LivePacket[] = [];
  for (const [si, spec] of specs.entries()) {
    const k0 = Math.floor((time - spec.offset - spec.duration) / spec.every);
    const k1 = Math.floor((time - spec.offset) / spec.every);
    for (let k = Math.max(0, k0); k <= k1; k++) {
      const age = time - spec.offset - k * spec.every;
      const p = age >= 0 && age < spec.duration ? pose(spec, links, age) : null;
      if (p) out.push({ id: `${prefix}:${si}-${k}`, kind: spec.kind, age, spec, pose: p });
    }
  }
  return out;
}
