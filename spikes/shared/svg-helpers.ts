import type { Pt } from './scene';

export const pts = (p: Pt[]) => p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');

/** Embed an artist-authored SVG file as a nested <svg> – exactly what a Figma/Inkscape export gives you. */
export const icon = (svg: string, cx: number, cy: number, size: number) =>
  svg.replace('<svg ', `<svg x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" `);
