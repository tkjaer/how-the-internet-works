// Glue: router <-> camera <-> gestures. Shared by the Svelte, Pixi and Three spikes.
import { CameraController, decide, fitScene, viewportFor, type Cam, type Viewport } from './camera';
import { attachGestures } from './gestures';
import { current, go, onRoute, startRouter } from './router';
import { hitDetail, type Pt } from './scene';

export interface NavOptions { /** Screen → world mapping for taps (e.g. a raycast in 3D). Defaults to the 2D camera. */ toWorld?: (sx: number, sy: number) => Pt | null }

export function createNav(el: HTMLElement, onCamera: (cam: Cam, vp: Viewport) => void, opts: NavOptions = {}) {
  startRouter();
  const cam: CameraController = new CameraController(viewportFor(el), (c) => onCamera(c, cam.vp));
  cam.set(fitScene(current().scene, cam.vp));

  /** Hooks: gesture started / camera came to rest (e.g. to re-rasterise text at the new zoom). */
  const onStart = new Set<() => void>();
  const onSettle = new Set<() => void>();
  const settled = () => onSettle.forEach((f) => f());

  onRoute((r) => cam.flyTo(fitScene(r.scene, cam.vp)).then(settled));

  const settle = () => {
    const next = decide(cam.cam, cam.vp, current().scene);
    if (next && next !== current().scene) go({ scene: next });
    else if (current().scene !== 'overview') cam.flyTo(fitScene(current().scene, cam.vp), 500).then(settled);
  };

  attachGestures(el, cam, {
    onStart: () => onStart.forEach((f) => f()),
    onTap: (sx, sy) => {
      if (current().scene !== 'overview') return;
      const p = opts.toWorld ? opts.toWorld(sx, sy) : cam.toWorld(sx, sy);
      const d = p && hitDetail(p);
      if (d) go({ scene: d });
    },
    onEnd: () => { settle(); settled(); },
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current().scene !== 'overview') go({ scene: 'overview' });
  });

  new ResizeObserver(() => {
    cam.vp = viewportFor(el);
    cam.set(fitScene(current().scene, cam.vp));
    settled();
  }).observe(el);

  return { cam, onStart, onSettle };
}
