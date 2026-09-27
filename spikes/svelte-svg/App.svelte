<script lang="ts">
  import { onMount } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicInOut } from 'svelte/easing';
  import { clampCam, decide, fitScene, flyInterpolator, mixes, viewportFor, type Cam } from '../shared/camera';
  import { attachGestures } from '../shared/gestures';
  import { current, go, onRoute, startRouter } from '../shared/router';
  import { hitDetail, type SceneId } from '../shared/scene';
  import Chrome from './components/Chrome.svelte';
  import Defs from './components/Defs.svelte';
  import Overview from './components/Overview.svelte';
  import Detail from './components/Detail.svelte';
  import WifiDetail from './components/WifiDetail.svelte';
  import FibreDetail from './components/FibreDetail.svelte';

  const route = startRouter();
  let scene = $state<SceneId>(route.scene);
  let vp = $state(viewportFor(document.body));
  let time = $state(0);
  let stage: HTMLDivElement;

  // Svelte's Tween with a custom interpolator = van Wijk smooth zoom as a reactive value.
  const cam = new Tween<Cam>(fitScene(route.scene, viewportFor(document.body)), {
    easing: cubicInOut,
    duration: (a, b) => flyInterpolator(a, b, vp).duration,
    interpolate: (a, b) => flyInterpolator(a, b, vp),
  });
  const mix = $derived(mixes(cam.current, vp));
  const transform = $derived(`translate(${cam.current.x} ${cam.current.y}) scale(${cam.current.k})`);

  const setNow = (c: Cam) => cam.set(clampCam(c, vp), { duration: 0 });
  const ctl = {
    stop: () => setNow(cam.current),
    zoomAt(f: number, sx: number, sy: number) {
      const c = cam.current, k = clampCam({ ...c, k: c.k * f }, vp).k;
      const wx = (sx - c.x) / c.k, wy = (sy - c.y) / c.k;
      cam.set({ k, x: sx - wx * k, y: sy - wy * k }, { duration: 0 });
    },
    panBy: (dx: number, dy: number) => setNow({ ...cam.current, x: cam.current.x + dx, y: cam.current.y + dy }),
  };

  onMount(() => {
    let raf = 0;
    const loop = (now: number) => { time = now / 1000; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);

    const offRoute = onRoute((r) => { scene = r.scene; cam.target = fitScene(r.scene, vp); });
    attachGestures(stage, ctl, {
      onTap: (sx, sy) => {
        if (current().scene !== 'overview') return;
        const c = cam.current;
        const d = hitDetail({ x: (sx - c.x) / c.k, y: (sy - c.y) / c.k });
        if (d) go({ scene: d });
      },
      onEnd: () => {
        const next = decide(cam.current, vp, current().scene);
        if (next && next !== current().scene) go({ scene: next });
        else if (current().scene !== 'overview') cam.set(fitScene(current().scene, vp), { duration: 450 });
      },
    });
    const ro = new ResizeObserver(() => { vp = viewportFor(stage); setNow(fitScene(current().scene, vp)); });
    ro.observe(stage);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') go({ scene: 'overview' }); };
    window.addEventListener('keydown', esc);
    Object.assign(window, { __spike: { go, current } });
    return () => { cancelAnimationFrame(raf); offRoute(); ro.disconnect(); window.removeEventListener('keydown', esc); };
  });
</script>

<div id="stage" bind:this={stage}>
  <svg id="svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <Defs />
    <rect width="100%" height="100%" fill="url(#bg)" />
    <g {transform}>
      <Overview {time} opacity={mix.overview} />
      {#if mix.wifi > 0.002}
        <Detail id="wifi" opacity={mix.wifi}><WifiDetail {time} /></Detail>
      {/if}
      {#if mix.fibre > 0.002}
        <Detail id="fibre" opacity={mix.fibre}><FibreDetail {time} /></Detail>
      {/if}
    </g>
  </svg>
</div>
<Chrome {scene} spike="Svelte 5 + SVG" />
