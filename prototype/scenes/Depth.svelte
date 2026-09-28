<svelte:options namespace="svg" />
<script lang="ts">
  // Depth parallax for backdrop layers. Wrap a layer in <Depth d={0.4}>: d < 1 is further away (it moves and
  // zooms less than the camera), d = 1 is the scene plane, d > 1 is foreground. Themes use this in their Backdrop
  // and Panel art; it works for pinch/scroll zoom, pans and camera flights.
  import type { Snippet } from 'svelte';
  import { areaCentre, fitScene } from '../core/camera';
  import { toLocal, world as worldSize } from '../core/scene';
  import { view } from '../state.svelte';
  import { getScene, getWorld } from './ctx';
  let { d, children }: { d: number; children: Snippet } = $props();
  const w = getWorld(), s = getScene();
  const transform = $derived.by(() => {
    if (d === 1) return '';
    const cam = w.cam, vp = view.vp, W = worldSize(view.orient);
    const r = cam.k / fitScene(s.id, vp).k;
    const f = Math.pow(Math.max(r, 0.2), d - 1);
    const c = areaCentre(vp);
    const wc = toLocal(s.id, { x: (c.x - cam.x) / cam.k, y: (c.y - cam.y) / cam.k });
    const wc0 = { x: W.w / 2, y: W.h / 2 };
    const wcd = { x: wc0.x + (wc.x - wc0.x) * d, y: wc0.y + (wc.y - wc0.y) * d };
    return `translate(${(wc.x - wcd.x * f).toFixed(2)} ${(wc.y - wcd.y * f).toFixed(2)}) scale(${f.toFixed(4)})`;
  });
</script>

<g {transform}>{@render children()}</g>
