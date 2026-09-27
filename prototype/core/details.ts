// Shared maths for the two dive scenes (style-agnostic). Coordinates are in a landscape 1600×900 "track space";
// portrait layouts rotate the track (see trackMatrix) and place upright things with toScene().
import type { Orient, Pt } from './scene';

/** SVG transform that maps track space into the scene: identity in landscape, a 90° turn in portrait
 *  (track x → up the screen), so the physical flow runs bottom → top like the portrait overview. */
export const trackMatrix = (o: Orient) => (o === 'portrait' ? 'matrix(0 -1 1 0 0 1600)' : '');
/** Track point → scene point (for things that must stay upright: devices, digits, labels). */
export const toScene = (p: Pt, o: Orient): Pt => (o === 'portrait' ? { x: p.y, y: 1600 - p.x } : p);

// ---------- Wi-Fi: bits riding a radio wave (amplitude-shift keying, simplified) ----------
export const WIFI = {
  apX: 1360, phoneX: 250, y: 470,
  x0: 400, x1: 1230, // wave extent: from AP antenna (right) to phone (left)
  bitW: 150, lambda: 75, speed: 150, // px / s, waves travel right→left
  ampOne: 115, ampZero: 34,
  bits: [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0],
  bitsY: 270,
};

const smooth = (t: number) => t * t * (3 - 2 * t);

function bitAt(c: number) {
  const n = WIFI.bits.length;
  const idx = Math.floor(c / WIFI.bitW);
  return WIFI.bits[((idx % n) + n) % n];
}

/** Sampled wave at time t (seconds). Content coordinate c = x + v t moves leftwards. */
export function wifiWave(t: number, samples = 220): Pt[] {
  const { x0, x1, y, lambda, speed, bitW, ampOne, ampZero } = WIFI;
  const pts: Pt[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = x0 + ((x1 - x0) * i) / samples;
    const c = x + speed * t;
    // amplitude eases between bits over 25% of a bit width
    const frac = ((c % bitW) + bitW) % bitW / bitW;
    const a = bitAt(c) ? ampOne : ampZero;
    const edge = 0.25;
    let amp = a;
    if (frac < edge) {
      const prev = bitAt(c - bitW) ? ampOne : ampZero;
      amp = prev + (a - prev) * smooth(0.5 + frac / edge / 2);
    } else if (frac > 1 - edge) {
      const next = bitAt(c + bitW) ? ampOne : ampZero;
      amp = a + (next - a) * smooth((frac - (1 - edge)) / edge / 2);
    }
    // fade in at the antenna and out at the phone
    const env = smooth(Math.min(1, (x1 - x) / 90)) * smooth(Math.min(1, (x - x0) / 90));
    pts.push({ x, y: y - amp * env * Math.sin((2 * Math.PI * c) / lambda) });
  }
  return pts;
}

/** Bit glyphs currently on the wave: position, value and opacity. */
export function wifiBits(t: number) {
  const { x0, x1, bitW, speed, bits } = WIFI;
  const out: { x: number; bit: number; alpha: number; key: number }[] = [];
  const cMin = x0 + speed * t, cMax = x1 + speed * t;
  for (let idx = Math.floor(cMin / bitW) - 1; idx <= Math.ceil(cMax / bitW); idx++) {
    const x = (idx + 0.5) * bitW - speed * t;
    if (x < x0 - 40 || x > x1 + 40) continue;
    const edgeDist = Math.min(x - x0, x1 - x);
    out.push({ x, bit: bits[((idx % bits.length) + bits.length) % bits.length], alpha: smooth(Math.max(0, Math.min(1, edgeDist / 110))), key: idx });
  }
  return out;
}

/** Expanding radio rings around the AP antenna: radius + opacity. */
export function wifiRings(t: number, count = 4, period = 2.4, maxR = 420) {
  return Array.from({ length: count }, (_, i) => {
    const f = ((t / period + i / count) % 1 + 1) % 1;
    return { r: 40 + f * maxR, alpha: (1 - f) * 0.5 };
  });
}

// ---------- Fibre: total internal reflection + DWDM ----------
export const FIBRE = {
  x0: 330, x1: 1270, y: 450,
  coreH: 90, cladH: 210,
  muxX: 250, demuxX: 1350,
  laserX: 70, detectorX: 1530,
  channelY: [270, 390, 510, 630],
  channels: 4,
  speed: 380,
};

/** Zig-zag polyline inside the core for channel i (different bounce angles per colour). */
export function fibrePath(i: number): Pt[] {
  const { x0, x1, y, coreH } = FIBRE;
  const period = [210, 260, 170, 300][i % 4];
  const phase = [0, 0.35, 0.6, 0.15][i % 4] * period;
  const h = coreH / 2 - 6;
  const pts: Pt[] = [{ x: FIBRE.muxX + 18, y }];
  for (let x = x0 - phase; x <= x1 + period; x += period / 2) {
    const k = Math.round((x - (x0 - phase)) / (period / 2));
    const xx = Math.min(Math.max(x, x0), x1);
    if (x >= x0 && x <= x1) pts.push({ x: xx, y: y + (k % 2 ? h : -h) });
  }
  pts.push({ x: FIBRE.demuxX - 18, y });
  return pts;
}

/** Full light route for channel i: laser → mux → zig-zag → demux → detector. */
export function channelRoute(i: number): Pt[] {
  const y = FIBRE.channelY[i];
  return [{ x: FIBRE.laserX + 40, y }, ...fibrePath(i), { x: FIBRE.detectorX - 34, y }];
}

export function polyLength(pts: Pt[]) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return L;
}
export function pointAt(pts: Pt[], s: number): Pt {
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (s <= d) {
      const f = d ? s / d : 0;
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f };
    }
    s -= d;
  }
  return pts[pts.length - 1];
}

/** Light pulses for all channels at time t: each pulse = head position + short trail. */
export function fibrePulses(t: number, perChannel = 3, trail = 70, trailSamples = 6) {
  const out: { channel: number; head: Pt; trail: Pt[] }[] = [];
  for (let i = 0; i < FIBRE.channelY.length; i++) {
    const route = channelRoute(i);
    const L = polyLength(route);
    for (let p = 0; p < perChannel; p++) {
      const s = ((t * FIBRE.speed + (p * L) / perChannel + i * 97) % L + L) % L;
      const tr: Pt[] = [];
      for (let k = 0; k <= trailSamples; k++) tr.push(pointAt(route, Math.max(0, s - (trail * k) / trailSamples)));
      out.push({ channel: i, head: tr[0], trail: tr });
    }
  }
  return out;
}
