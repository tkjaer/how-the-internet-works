// @ts-ignore roughjs ships the ESM bundle next to rough.d.ts.
import rough from 'roughjs/bundled/rough.esm.js';
import type { Options, PathInfo } from 'roughjs/bin/core';
import type { Pt } from '../../../core/scene';

const generator = rough.generator();
const seeds = [11, 47, 103];
const cache = new Map<string, PathInfo[][]>();

export const boilFrame = (time: number, n = 3) => Math.floor(time * 8) % n;

function withSeed(options: Options, seed: number): Options {
  return { roughness: 1.55, bowing: 1.2, fixedDecimalPlaceDigits: 1, ...options, seed };
}

function variants(key: string, make: (seed: number) => PathInfo[], n = 3) {
  let got = cache.get(key);
  if (!got) {
    got = seeds.slice(0, n).map(make);
    cache.set(key, got);
  }
  return got;
}

export function pick(key: string, time: number, make: (seed: number) => PathInfo[], n = 3) {
  const v = variants(key, make, n);
  return v[boilFrame(time, n)];
}

export function roundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  return `M${x + rr} ${y} H${x + w - rr} Q${x + w} ${y} ${x + w} ${y + rr} V${y + h - rr} Q${x + w} ${y + h} ${x + w - rr} ${y + h} H${x + rr} Q${x} ${y + h} ${x} ${y + h - rr} V${y + rr} Q${x} ${y} ${x + rr} ${y} Z`;
}

export function rpath(key: string, d: string, time: number, options: Options, n = 3) {
  return pick(`p|${key}|${d}|${JSON.stringify(options)}`, time, (seed) => generator.toPaths(generator.path(d, withSeed(options, seed))), n);
}

export function rrect(key: string, x: number, y: number, w: number, h: number, rx: number, time: number, options: Options, n = 3) {
  return rpath(`rr|${key}|${x}|${y}|${w}|${h}|${rx}`, roundedRectPath(x, y, w, h, rx), time, options, n);
}

export function rellipse(key: string, cx: number, cy: number, w: number, h: number, time: number, options: Options, n = 3) {
  return pick(`e|${key}|${cx}|${cy}|${w}|${h}|${JSON.stringify(options)}`, time, (seed) => generator.toPaths(generator.ellipse(cx, cy, w, h, withSeed(options, seed))), n);
}

export function rcircle(key: string, cx: number, cy: number, r: number, time: number, options: Options, n = 3) {
  return rellipse(key, cx, cy, r * 2, r * 2, time, options, n);
}

export function rline(key: string, x1: number, y1: number, x2: number, y2: number, time: number, options: Options, n = 3) {
  return pick(`l|${key}|${x1}|${y1}|${x2}|${y2}|${JSON.stringify(options)}`, time, (seed) => generator.toPaths(generator.line(x1, y1, x2, y2, withSeed(options, seed))), n);
}

export function rpoly(key: string, points: [number, number][], time: number, options: Options, n = 3) {
  return pick(`poly|${key}|${points.flat().join(',')}|${JSON.stringify(options)}`, time, (seed) => generator.toPaths(generator.polygon(points, withSeed(options, seed))), n);
}

export function jitter(seed: number, frame: number, amp: number) {
  return Math.sin(seed * 12.9898 + frame * 2.173) * amp + Math.sin(seed * 4.141 + frame * 5.91) * amp * 0.45;
}

export function jitterPts(points: Pt[], frame: number, amp = 2) {
  return points.map((p, i) => `${(p.x + jitter(i + 3, frame, amp)).toFixed(1)},${(p.y + jitter(i + 19, frame, amp)).toFixed(1)}`).join(' ');
}

export function sketchCircle(cx: number, cy: number, r: number, frame: number, amp = 1.8, points = 40) {
  const out: string[] = [];
  for (let i = 0; i <= points; i++) {
    const a = (Math.PI * 2 * i) / points;
    const rr = r + jitter(i + 31, frame, amp);
    out.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return out.join(' ');
}
