// Minimal wheel / drag / pinch / tap handling on top of Pointer Events.
import type { CameraController } from './camera';

export interface GestureHandlers { onTap?: (sx: number, sy: number) => void; onStart?: () => void; onEnd?: () => void }

export type Zoomable = Pick<CameraController, 'stop' | 'zoomAt' | 'panBy'>;

export function attachGestures(el: HTMLElement, cam: Zoomable, h: GestureHandlers = {}) {
  el.style.touchAction = 'none';
  const pts = new Map<number, { x: number; y: number }>();
  let down: { x: number; y: number; t: number; moved: boolean } | null = null;
  let wheelTimer = 0;
  const local = (e: { clientX: number; clientY: number }) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!wheelTimer) { cam.stop(); h.onStart?.(); }
    const p = local(e);
    const scale = e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 400 : 1;
    const factor = Math.exp(-e.deltaY * scale * (e.ctrlKey ? 0.01 : 0.002));
    cam.zoomAt(factor, p.x, p.y);
    clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => { wheelTimer = 0; h.onEnd?.(); }, 160);
  }, { passive: false });

  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    const p = local(e);
    pts.set(e.pointerId, p);
    if (pts.size === 1) { down = { ...p, t: performance.now(), moved: false }; cam.stop(); h.onStart?.(); }
    else if (down) down.moved = true;
  });

  el.addEventListener('pointermove', (e) => {
    const prev = pts.get(e.pointerId);
    if (!prev) return;
    const p = local(e);
    if (pts.size === 1) {
      if (down && Math.hypot(p.x - down.x, p.y - down.y) > 8) down.moved = true;
      if (down?.moved) cam.panBy(p.x - prev.x, p.y - prev.y);
    } else if (pts.size === 2) {
      const [a, b] = [...pts.entries()].map(([id, q]) => (id === e.pointerId ? prev : q));
      const other = [...pts.entries()].find(([id]) => id !== e.pointerId)![1];
      const d0 = Math.hypot(a.x - b.x, a.y - b.y);
      const d1 = Math.hypot(p.x - other.x, p.y - other.y);
      const m0 = { x: (prev.x + other.x) / 2, y: (prev.y + other.y) / 2 };
      const m1 = { x: (p.x + other.x) / 2, y: (p.y + other.y) / 2 };
      cam.panBy(m1.x - m0.x, m1.y - m0.y);
      if (d0 > 0) cam.zoomAt(d1 / d0, m1.x, m1.y);
    }
    pts.set(e.pointerId, p);
  });

  const up = (e: PointerEvent) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size > 0) return;
    const p = local(e);
    if (down && !down.moved && performance.now() - down.t < 450) h.onTap?.(p.x, p.y);
    else h.onEnd?.();
    down = null;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}
