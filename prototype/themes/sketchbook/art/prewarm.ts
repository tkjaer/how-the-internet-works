import { linkPath, pathScene } from '../../../core/scene';
import { rcircle, rellipse, rline, rpath, rpoly, rrect } from './rough';

let warmed = false;
function warm() {
  if (warmed) return;
  warmed = true;
  const t = 0;
  for (const [w, h] of [[1600, 900], [900, 1600]]) {
    rrect(`panel-${w}-${h}`, 8, 8, w - 16, h - 16, 56, t, { stroke: 'var(--pencil)', strokeWidth: 8, fill: 'none' });
    rrect(`tape-a-${w}`, 42, -12, 170, 42, 8, t, { stroke: 'var(--tape-edge)', strokeWidth: 2, fill: 'var(--tape)', fillStyle: 'hachure', hachureGap: 9 });
    rrect(`tape-b-${w}-${h}`, w - 222, h - 30, 180, 44, 8, t, { stroke: 'var(--tape-edge)', strokeWidth: 2, fill: 'var(--tape)', fillStyle: 'hachure', hachureGap: 9 });
  }
  for (const orient of ['landscape', 'portrait'] as const) {
    for (const scene of ['overview', 'internet'] as const) {
      for (const link of pathScene(scene, orient).links) {
        const d = linkPath(link);
        if (link.tech === 'wifi') continue;
        else if (link.tech === 'ethernet') {
          rpath(`eth-shadow-${link.id}`, d, t, { stroke: 'var(--shadow)', strokeWidth: 13, fill: 'none' });
          rpath(`eth-${link.id}`, d, t, { stroke: 'var(--pencil)', strokeWidth: 9, fill: 'none', roughness: 1.7 });
        } else if (link.tech === 'fibre') {
          const colour = '#d9558c';
          rpath(`fibre-a-${link.id}`, d, t, { stroke: colour, strokeWidth: 5, fill: 'none', roughness: 1.9 });
          rpath(`fibre-b-${link.id}`, d, t, { stroke: 'var(--highlighter-blue)', strokeWidth: 4, fill: 'none', roughness: 1.9 });
          rpath(`fibre-c-${link.id}`, d, t, { stroke: 'var(--crayon-green)', strokeWidth: 3, fill: 'none', roughness: 1.9 });
        } else {
          rpath(`backbone-${link.id}`, d, t, { stroke: 'var(--marker)', strokeWidth: 14, fill: 'none', roughness: 1.35, strokeLineDash: link.dashed ? [18, 18] : undefined });
        }
      }
    }
  }
  rrect('fibre-clad', 330, 450 - 210 / 2, 940, 210, 105, t, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--fibre-clad)', fillStyle: 'hachure', hachureGap: 14 });
  rrect('fibre-core', 330, 450 - 90 / 2, 940, 90, 45, t, { stroke: 'var(--ink-blue)', strokeWidth: 4, fill: 'var(--fibre-core)', fillStyle: 'hachure', hachureAngle: -35, hachureGap: 11 });
  rpoly('prism-mux', [[250 - 42, 450 - 92], [250 + 34, 450], [250 - 42, 450 + 92]], t, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--prism-paper)', fillStyle: 'hachure', hachureGap: 10 });
  rpoly('prism-demux', [[1350 + 42, 450 - 92], [1350 - 34, 450], [1350 + 42, 450 + 92]], t, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--prism-paper)', fillStyle: 'hachure', hachureGap: 10 });
  const channelY = [270, 390, 510, 630];
  const dwdm = ['#e9476e', '#f1bb31', '#45a86f', '#4b8ed8'];
  for (let channel = 0; channel < 4; channel++) {
    const y = channelY[channel], colour = dwdm[channel];
    rrect(`laser-${channel}`, 70 - 44, y - 30, 78, 60, 14, t, { stroke: 'var(--pencil)', strokeWidth: 4, fill: 'var(--device-paper)', fillStyle: 'hachure', hachureGap: 9 });
    rpath(`laser-cone-${channel}`, `M${70 + 18} ${y - 15} L${70 + 52} ${y} L${70 + 18} ${y + 15}`, t, { stroke: colour, strokeWidth: 3, fill: colour, fillStyle: 'hachure', hachureGap: 6 });
    rrect(`detector-${channel}`, 1530 - 34, y - 31, 80, 62, 14, t, { stroke: 'var(--pencil)', strokeWidth: 4, fill: 'var(--device-paper)', fillStyle: 'hachure', hachureGap: 9 });
    rcircle(`detector-eye-${channel}`, 1530 - 12, y, 15, t, { stroke: colour, strokeWidth: 5, fill: 'none' });
  }
  rellipse('focus-internet', 100, 108, 188, 142, t, { stroke: 'var(--highlighter-yellow)', strokeWidth: 16, fill: 'none', roughness: 2.2 });
  rline('tag-arrow-warm', 0, 0, 40, 30, t, { stroke: 'var(--pencil)', strokeWidth: 2 });
}

if (typeof window !== 'undefined') {
  const idle = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 180));
  idle(() => warm(), { timeout: 700 });
}
