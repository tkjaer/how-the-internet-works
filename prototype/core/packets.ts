// Packet schedule + kinematics, shared by every style. A theme's Packet art receives a `Pose` and decides how to
// use it (rotate along the path or stay upright, squash, run-cycle legs, trails…).
import { bezier, bezierAngle, linkLength, type PacketKind, type PacketSpec, type Pt, type SceneLink } from './scene';

export interface Pose {
  x: number; y: number;
  /** Direction of travel (radians, screen-y down). */
  angle: number;
  /** Squash/stretch along (sx) and across (sy) the direction of travel; 1 = rest. */
  sx: number; sy: number;
  /** 0..1 normalised speed. */
  speed: number;
  /** 'wait' = winding up at a node, 'go' = travelling, 'land' = arriving at a node. */
  phase: 'wait' | 'go' | 'land';
  /** A continuously increasing value for run cycles / wobble (≈ distance travelled / 40). */
  step: number;
  /** Recent positions, newest first (for trails). */
  trail: Pt[];
  /** The link it is on, its index in the route, and whether it travels the link backwards. */
  link: SceneLink; seg: number; reverse: boolean;
}

export interface LivePacket { id: string; kind: PacketKind; age: number; spec: PacketSpec; pose: Pose }

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const WIND = 0.16, LAND = 0.12;

interface SegState { s: number; v: number; sx: number; sy: number; phase: Pose['phase'] }

/** Progress along one link for segment-local time u ∈ [0,1). */
function segment(u: number, alive: boolean): SegState {
  if (!alive) {
    const s = u * 0.35 + easeInOutCubic(u) * 0.65;
    return { s, v: 1, sx: 1, sy: 1, phase: 'go' };
  }
  if (u < WIND) {
    // anticipation: crouch and lean back a touch before leaving
    const w = Math.sin((Math.PI * u) / WIND);
    return { s: -0.025 * w, v: 0, sx: 1 - 0.18 * w, sy: 1 + 0.12 * w, phase: 'wait' };
  }
  if (u > 1 - LAND) {
    // landing squash
    const w = Math.sin((Math.PI * (u - (1 - LAND))) / LAND);
    return { s: 1, v: 0, sx: 1 + 0.2 * w, sy: 1 - 0.22 * w, phase: 'land' };
  }
  const v0 = (u - WIND) / (1 - WIND - LAND);
  const s = easeInOutCubic(v0);
  const v = v0 < 0.5 ? 12 * v0 * v0 : 12 * (1 - v0) * (1 - v0); // derivative of easeInOutCubic, peaks at 3
  const n = v / 3;
  return { s, v: n, sx: 1 + 0.42 * n, sy: 1 - 0.24 * n, phase: 'go' };
}

function position(spec: PacketSpec, links: SceneLink[], age: number, alive: boolean) {
  const f = age / spec.duration;
  if (f < 0 || f >= 1) return null;
  const n = spec.route.length;
  const seg = Math.min(n - 1, Math.floor(f * n));
  const u = f * n - seg;
  const link = links.find((k) => k.id === spec.route[seg])!;
  const reverse = spec.kind === 'video';
  const st = segment(u, alive);
  const t = reverse ? 1 - st.s : st.s;
  const tc = Math.min(1, Math.max(0, t));
  const p = bezier(link, tc);
  const angle = bezierAngle(link, tc) + (reverse ? Math.PI : 0);
  // allow the tiny wind-up "lean back" to leave the curve along its tangent
  if (t !== tc) { const over = (t - tc) * linkLength(link); const a = bezierAngle(link, tc); p.x += Math.cos(a) * over; p.y += Math.sin(a) * over; }
  return { p, angle, st, link, seg, reverse, dist: (seg + Math.min(1, Math.max(0, st.s))) * linkLength(link) };
}

/** All packets alive at `time` for a path scene, with poses. */
export function livePackets(specs: PacketSpec[], links: SceneLink[], time: number, prefix: string, alive: boolean, trailN = 7, trailDt = 0.035): LivePacket[] {
  const out: LivePacket[] = [];
  for (const [si, spec] of specs.entries()) {
    const k0 = Math.floor((time - spec.offset - spec.duration) / spec.every);
    const k1 = Math.floor((time - spec.offset) / spec.every);
    for (let k = Math.max(0, k0); k <= k1; k++) {
      const age = time - spec.offset - k * spec.every;
      if (age < 0 || age >= spec.duration) continue;
      const pos = position(spec, links, age, alive);
      if (!pos) continue;
      const trail: Pt[] = [];
      for (let j = 1; j <= trailN; j++) {
        const q = position(spec, links, Math.max(0, age - j * trailDt), alive);
        if (q && q.seg === pos.seg) trail.push(q.p);
      }
      out.push({
        id: `${prefix}:${si}-${k}`, kind: spec.kind, age, spec,
        pose: { x: pos.p.x, y: pos.p.y, angle: pos.angle, sx: pos.st.sx, sy: pos.st.sy, speed: pos.st.v, phase: pos.st.phase,
          step: pos.dist / 40, trail, link: pos.link, seg: pos.seg, reverse: pos.reverse },
      });
    }
  }
  return out;
}
