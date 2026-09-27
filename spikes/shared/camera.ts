// Shared camera maths + semantic-zoom rules so every spike behaves identically.
import { interpolateZoom } from 'd3-interpolate';
import { DETAIL_SCALE, OVERVIEW_RECT, SCENES, detailRect, sceneRect, type DetailId, type Rect, type SceneId } from './scene';

/** screen = world * k + (x, y) */
export interface Cam { x: number; y: number; k: number }
/** Viewport in CSS px, with insets reserved for UI chrome. */
export interface Viewport { w: number; h: number; top: number; bottom: number }

export const DETAILS = SCENES.filter((s): s is DetailId => s !== 'overview');

export function viewportFor(el: HTMLElement): Viewport {
  const w = el.clientWidth, h = el.clientHeight;
  const small = w < 700;
  return { w, h, top: small ? 96 : 76, bottom: small ? 150 : 130 };
}

function areaCentre(vp: Viewport) {
  return { x: vp.w / 2, y: vp.top + (vp.h - vp.top - vp.bottom) / 2 };
}

export function fit(r: Rect, vp: Viewport, pad = 0.94): Cam {
  const aw = vp.w, ah = Math.max(100, vp.h - vp.top - vp.bottom);
  const k = Math.min(aw / r.w, ah / r.h) * pad;
  const c = areaCentre(vp);
  return { k, x: c.x - (r.x + r.w / 2) * k, y: c.y - (r.y + r.h / 2) * k };
}
export const fitScene = (s: SceneId, vp: Viewport) => fit(sceneRect(s), vp);

export function clampCam(cam: Cam, vp: Viewport): Cam {
  const k0 = fit(OVERVIEW_RECT, vp).k;
  const k = Math.min(Math.max(cam.k, k0 * 0.7), (k0 / DETAIL_SCALE) * 4);
  if (k === cam.k) return cam;
  // keep the area centre fixed when clamping
  const c = areaCentre(vp);
  const wx = (c.x - cam.x) / cam.k, wy = (c.y - cam.y) / cam.k;
  return { k, x: c.x - wx * k, y: c.y - wy * k };
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** How far we are zoomed "into" a detail (0 = overview fit, 1 = detail fit) and how centred it is. */
export function progress(cam: Cam, vp: Viewport, d: DetailId) {
  const k0 = fit(OVERVIEW_RECT, vp).k, kd = fit(detailRect(d), vp).k;
  const u = Math.log(cam.k / k0) / Math.log(kd / k0);
  const r = detailRect(d), c = areaCentre(vp);
  const sx = (r.x + r.w / 2) * cam.k + cam.x, sy = (r.y + r.h / 2) * cam.k + cam.y;
  const dist = Math.hypot(sx - c.x, sy - c.y) / (Math.min(vp.w, vp.h) / 2);
  const prox = 1 - smooth(0.35, 1.1, dist);
  return { u, prox };
}

/** Opacity of each layer for the current camera – the heart of the semantic zoom cross-fade. */
export function mixes(cam: Cam, vp: Viewport): Record<SceneId, number> {
  const out = { overview: 1 } as Record<SceneId, number>;
  let hide = 0;
  for (const d of DETAILS) {
    const { u, prox } = progress(cam, vp, d);
    out[d] = smooth(0.45, 0.8, u) * prox;
    hide = Math.max(hide, smooth(0.6, 0.92, u) * prox);
  }
  out.overview = 1 - hide;
  return out;
}

/** After a gesture ends: should we semantically enter/leave a scene? */
export function decide(cam: Cam, vp: Viewport, scene: SceneId): SceneId | null {
  if (scene === 'overview') {
    for (const d of DETAILS) {
      const { u, prox } = progress(cam, vp, d);
      if (u > 0.55 && prox > 0.5) return d;
    }
    return null;
  }
  const { u, prox } = progress(cam, vp, scene);
  if (u < 0.85 || prox < 0.25) return 'overview';
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
  return Object.assign(fn, { duration: Math.min(1600, Math.max(700, i.duration * 0.8)) });
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** A minimal camera with animated fly-to. Used by the Svelte, Pixi and Three spikes. */
export class CameraController {
  cam: Cam = { x: 0, y: 0, k: 1 };
  private raf = 0;
  animating = false;
  constructor(public vp: Viewport, private onChange: (cam: Cam) => void) {}

  set(cam: Cam, clamp = true) {
    this.cam = clamp ? clampCam(cam, this.vp) : cam;
    this.onChange(this.cam);
  }
  stop() {
    cancelAnimationFrame(this.raf);
    this.animating = false;
  }
  flyTo(target: Cam, duration?: number): Promise<void> {
    this.stop();
    const f = flyInterpolator(this.cam, target, this.vp);
    const dur = duration ?? f.duration;
    const t0 = performance.now();
    this.animating = true;
    return new Promise((resolve) => {
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        this.set(f(easeInOutCubic(t)), false);
        if (t < 1) this.raf = requestAnimationFrame(step);
        else { this.animating = false; resolve(); }
      };
      this.raf = requestAnimationFrame(step);
    });
  }
  zoomAt(factor: number, sx: number, sy: number) {
    const k = this.cam.k * factor;
    const wx = (sx - this.cam.x) / this.cam.k, wy = (sy - this.cam.y) / this.cam.k;
    this.set({ k, x: sx - wx * k, y: sy - wy * k });
    // if clamped, re-anchor to the pointer
    if (this.cam.k !== k) this.set({ k: this.cam.k, x: sx - wx * this.cam.k, y: sy - wy * this.cam.k });
  }
  panBy(dx: number, dy: number) {
    this.set({ ...this.cam, x: this.cam.x + dx, y: this.cam.y + dy });
  }
  toWorld(sx: number, sy: number) {
    return { x: (sx - this.cam.x) / this.cam.k, y: (sy - this.cam.y) / this.cam.k };
  }
}
