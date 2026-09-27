// Wheel / drag / pinch / tap / flick handling on top of Pointer Events.
export interface Zoomable { stop(): void; zoomAt(factor: number, sx: number, sy: number): void; panBy(dx: number, dy: number): void }
export interface GestureHandlers {
  onTap?: (sx: number, sy: number) => void;
  /** A quick single-finger swipe: dx/dy in px over the flick. Return true if it was used (then no settle). */
  onFlick?: (dx: number, dy: number) => boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

const FLICK_MS = 320, FLICK_PX = 45, FLICK_V = 0.35; // px/ms

export function attachGestures(el: HTMLElement, cam: Zoomable, h: GestureHandlers = {}) {
  el.style.touchAction = 'none';
  const pts = new Map<number, { x: number; y: number }>();
  let down: { x: number; y: number; t: number; moved: boolean; multi: boolean } | null = null;
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
    if ((e.target as Element).closest?.('[data-ui]')) return;
    el.setPointerCapture(e.pointerId);
    const p = local(e);
    pts.set(e.pointerId, p);
    if (pts.size === 1) { down = { ...p, t: performance.now(), moved: false, multi: false }; cam.stop(); h.onStart?.(); }
    else if (down) { down.moved = true; down.multi = true; }
  });

  el.addEventListener('pointermove', (e) => {
    const prev = pts.get(e.pointerId);
    if (!prev) return;
    const p = local(e);
    if (pts.size === 1) {
      if (down && Math.hypot(p.x - down.x, p.y - down.y) > 8) down.moved = true;
      if (down?.moved) cam.panBy(p.x - prev.x, p.y - prev.y);
    } else if (pts.size === 2) {
      const other = [...pts.entries()].find(([id]) => id !== e.pointerId)![1];
      const d0 = Math.hypot(prev.x - other.x, prev.y - other.y);
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
    const dt = down ? performance.now() - down.t : 1e9;
    if (down && !down.moved && dt < 450) h.onTap?.(p.x, p.y);
    else if (down && !down.multi && dt < FLICK_MS) {
      const dx = p.x - down.x, dy = p.y - down.y, d = Math.hypot(dx, dy);
      if (!(d > FLICK_PX && d / dt > FLICK_V && h.onFlick?.(dx, dy))) h.onEnd?.();
    } else h.onEnd?.();
    down = null;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}
