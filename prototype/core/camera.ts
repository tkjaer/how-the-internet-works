// Camera maths + semantic-zoom rules (renderer- and style-independent).
import { interpolateZoom } from 'd3-interpolate';
import { CHILDREN, DETAIL_SCALE, fitRect, overviewRect, sceneRect, type ChildId, type Rect, type SceneId } from './scene';

/** screen = world * k + (x, y) */
export interface Cam { x: number; y: number; k: number }
/** Viewport in CSS px, with insets reserved for UI chrome. */
export interface Viewport { w: number; h: number; top: number; bottom: number }

/** Viewport for the stage; the insets come from the measured chrome (top bar, caption) when it is on screen. */
export function viewportFor(el: HTMLElement, chrome?: { top?: number; bottom?: number }): Viewport {
  const w = el.clientWidth, h = el.clientHeight;
  const small = w < 700;
  return { w, h, top: Math.max(small ? 64 : 72, chrome?.top ?? 0), bottom: Math.max(small ? 136 : 132, chrome?.bottom ?? 0) };
}

export function areaCentre(vp: Viewport) {
  return { x: vp.w / 2, y: vp.top + (vp.h - vp.top - vp.bottom) / 2 };
}

export function fit(r: Rect, vp: Viewport, pad = 0.94): Cam {
  const aw = vp.w, ah = Math.max(100, vp.h - vp.top - vp.bottom);
  const k = Math.min(aw / r.w, ah / r.h) * pad;
  const c = areaCentre(vp);
  return { k, x: c.x - (r.x + r.w / 2) * k, y: c.y - (r.y + r.h / 2) * k };
}
export const fitScene = (s: SceneId, vp: Viewport) => fit(fitRect(s), vp);

export function clampCam(cam: Cam, vp: Viewport): Cam {
  const k0 = fit(overviewRect(), vp).k;
  const k = Math.min(Math.max(cam.k, k0 * 0.6), (k0 / DETAIL_SCALE) * 5);
  if (k === cam.k) return cam;
  const c = areaCentre(vp);
  const wx = (c.x - cam.x) / cam.k, wy = (c.y - cam.y) / cam.k;
  return { k, x: c.x - wx * k, y: c.y - wy * k };
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** How far we are zoomed "into" a child (0 = overview fit, 1 = child fit) and how centred it is. */
export function progress(cam: Cam, vp: Viewport, d: ChildId) {
  const k0 = fitScene('overview', vp).k, kd = fitScene(d, vp).k;
  const u = Math.log(cam.k / k0) / Math.log(kd / k0);
  // distance from the view centre to the child's rect (0 when inside it), so a zoomed-in look at one corner of a
  // child scene still counts as being "in" it
  const r = sceneRect(d), c = areaCentre(vp);
  const x0 = r.x * cam.k + cam.x, y0 = r.y * cam.k + cam.y, x1 = x0 + r.w * cam.k, y1 = y0 + r.h * cam.k;
  const dx = Math.max(x0 - c.x, 0, c.x - x1), dy = Math.max(y0 - c.y, 0, c.y - y1);
  const dist = Math.hypot(dx, dy) / (Math.min(vp.w, vp.h) / 2);
  const prox = 1 - smoothstep(0.35, 1.1, dist);
  return { u, prox };
}

/** Opacity of each scene for the current camera – the heart of the semantic-zoom cross-fade. */
export function mixes(cam: Cam, vp: Viewport): Record<SceneId, number> {
  const out = { overview: 1 } as Record<SceneId, number>;
  let hide = 0;
  for (const d of CHILDREN) {
    const { u, prox } = progress(cam, vp, d);
    out[d] = smoothstep(0.45, 0.8, u) * prox;
    hide = Math.max(hide, smoothstep(0.6, 0.92, u) * prox);
  }
  out.overview = 1 - hide;
  return out;
}

/** After a gesture ends: should we semantically enter/leave a scene? */
export function decide(cam: Cam, vp: Viewport, scene: SceneId): SceneId | null {
  if (scene === 'overview') {
    for (const d of CHILDREN) {
      const { u, prox } = progress(cam, vp, d);
      if (u > 0.55 && prox > 0.5) return d;
    }
    return null;
  }
  const { u, prox } = progress(cam, vp, scene as ChildId);
  if (u < 0.8 || prox < 0.25) return 'overview';
  return null;
}

/** van Wijk & Nuij "smooth zoom" – zooms out a little, pans, then zooms in, like Google Maps. */
export function flyInterpolator(a: Cam, b: Cam, vp: Viewport) {
  const c = areaCentre(vp);
  const view = (m: Cam): [number, number, number] => [(c.x - m.x) / m.k, (c.y - m.y) / m.k, vp.w / m.k];
  const i = (interpolateZoom as typeof interpolateZoom & { rho(r: number): typeof interpolateZoom }).rho(1.2)(view(a), view(b));
  const fn = (t: number): Cam => {
    const [cx, cy, w] = i(t);
    const k = vp.w / w;
    return { k, x: c.x - cx * k, y: c.y - cy * k };
  };
  return Object.assign(fn, { duration: Math.min(1600, Math.max(650, i.duration * 0.8)) });
}

/** Scale a camera about a screen point. */
export function zoomAbout(cam: Cam, f: number, sx: number, sy: number): Cam {
  const k = cam.k * f;
  const wx = (sx - cam.x) / cam.k, wy = (sy - cam.y) / cam.k;
  return { k, x: sx - wx * k, y: sy - wy * k };
}
export const toScreen = (cam: Cam, p: { x: number; y: number }) => ({ x: p.x * cam.k + cam.x, y: p.y * cam.k + cam.y });
export const toWorldPt = (cam: Cam, sx: number, sy: number) => ({ x: (sx - cam.x) / cam.k, y: (sy - cam.y) / cam.k });
