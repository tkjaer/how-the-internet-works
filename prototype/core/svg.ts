import type { Pt } from './scene';

export const pts = (p: Pt[]) => p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();
/** Width of `text` at `size` in the current theme's tag/label font (canvas measureText; cached). */
export function measure(text: string, size: number, fontVar = '--tag-font', weight = 700): number {
  const fam = getComputedStyle(document.documentElement).getPropertyValue(fontVar).trim() ||
    getComputedStyle(document.documentElement).getPropertyValue('--font').trim() || 'sans-serif';
  const key = `${fam}|${weight}|${size}|${text}`;
  let w = cache.get(key);
  if (w === undefined) {
    ctx ??= document.createElement('canvas').getContext('2d');
    if (!ctx) return text.length * size * 0.6;
    ctx.font = `${weight} ${size}px ${fam}`;
    w = ctx.measureText(text).width;
    cache.set(key, w);
  }
  return w;
}
export const clearMeasureCache = () => cache.clear();

/** Horizontal box of a text run for a given text-anchor: { x (left edge relative to anchor point), w }. */
export function textBox(text: string, size: number, anchor: 'start' | 'middle' | 'end', _fallback = 0.6, fontVar = '--tag-font') {
  const w = measure(text, size, fontVar);
  const x = anchor === 'start' ? 0 : anchor === 'middle' ? -w / 2 : -w;
  return { x, w };
}

/** Deterministic pseudo-random in [0,1) from an integer seed (for hand-drawn jitter that doesn't flicker). */
export function rand(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
