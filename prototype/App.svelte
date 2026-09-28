<script lang="ts">
  // Orchestration: one rAF loop drives the scene clock, packets, the camera and its eased zoom flights.
  // Scenes and art only render what this computes.
  import { onMount, untrack } from 'svelte';
  import { areaCentre, clampCam, decide, fit, fitScene, flyInterpolator, mixes, toScreen, toWorldPt, viewportFor, zoomAbout, type Cam } from './core/camera';
  import { attachGestures } from './core/gestures';
  import { easeInOutCubic } from './core/motion';
  import { livePackets, type LivePacket } from './core/packets';
  import { go, onRoute, startRouter, type Route } from './core/router';
  import {
    bezier, isPathScene, pathScene, sceneRect, setOrient, stopRectWorld, stopsFor, toLocal, toWorld,
    type Orient, type PathSceneId, type SceneId,
  } from './core/scene';
  import { sfx } from './core/sound';
  import World from './scenes/World.svelte';
  import { loadTheme, loc, settings, themeState, tr, view } from './state.svelte';
  import Caption from './ui/Caption.svelte';
  import Chrome from './ui/Chrome.svelte';
  import PeekPanel from './ui/PeekPanel.svelte';
  import StepButtons from './ui/StepButtons.svelte';

  let route = $state<Route>(startRouter());
  let stage: HTMLDivElement;
  const A = $derived(themeState.current.art);

  // ------------------------------------------------------------------ camera + flights
  interface Trans { a: Cam; b: Cam; t0: number; dur: number; fly: (t: number) => Cam; premount: SceneId }
  let cam = $state.raw<Cam>({ x: 0, y: 0, k: 1 });
  let trans: Trans | null = null;
  let premount = $state<SceneId | null>(null);
  let gestureNav = false;

  const targetCam = (r: Route): Cam => {
    const st = r.stop ? stopsFor(r.scene).find((s) => s.id === r.stop) : null;
    return st ? fit(stopRectWorld(st), view.vp, 0.9) : fitScene(r.scene, view.vp);
  };

  /** Fly the camera to `b` (van Wijk zoom-pan, eased). `to` is mounted from the start so it's ready on arrival. */
  function startTrans(to: SceneId, b: Cam, durMs?: number) {
    const fly = flyInterpolator(cam, b, view.vp);
    const dur = durMs ?? fly.duration * themeState.current.motion.speed;
    trans = { a: cam, b, t0: performance.now(), dur, fly, premount: to };
    return dur;
  }
  function frameTrans(now: number) {
    const T = trans!;
    const t = Math.min(1, (now - T.t0) / T.dur);
    cam = T.fly(easeInOutCubic(t));
    premount = T.premount;
    if (t >= 1) finishTrans();
  }
  function finishTrans() {
    cam = trans!.b;
    trans = null;
    premount = null;
    showCaption = true;
  }

  // ------------------------------------------------------------------ navigation
  function onNavigate(r: Route, prev: Route) {
    route = r;
    if (r.scene === prev.scene && r.stop === prev.stop) return;
    if (follow) endFollow(false, true);
    if (trans) { const T = trans; frameTrans(T.t0 + T.dur); }
    const b = targetCam(r);
    const quick = gestureNav;
    gestureNav = false;
    const dur = startTrans(r.scene, b, quick ? 480 : undefined);
    showCaption = false;
    if (r.scene !== prev.scene) sfx.whoosh(r.scene !== 'overview' && prev.scene === 'overview', dur);
    else sfx.swish();
  }

  function settle() {
    const b = targetCam(route), vp = view.vp;
    const r = route.stop ? stopRectWorld(stopsFor(route.scene).find((s) => s.id === route.stop)!) : sceneRect(route.scene);
    const x0 = Math.max(0, r.x * cam.k + cam.x), x1 = Math.min(vp.w, (r.x + r.w) * cam.k + cam.x);
    const y0 = Math.max(0, r.y * cam.k + cam.y), y1 = Math.min(vp.h, (r.y + r.h) * cam.k + cam.y);
    const visible = (Math.max(0, x1 - x0) * Math.max(0, y1 - y0)) / Math.min(vp.w * vp.h, r.w * r.h * cam.k * cam.k);
    if (cam.k < b.k * 0.97 || visible < 0.45) startTrans(route.scene, b, 450);
  }

  // Sideways stepping: stops at the current level (path scenes: nodes + links; dive level: the dives themselves).
  let nudge = $state({ dir: 0, n: 0 });
  const stepInfo = $derived.by(() => {
    void view.orient;
    const stops = stopsFor(route.scene);
    if (!isPathScene(route.scene)) {
      const i = stops.findIndex((s) => s.id === route.scene);
      return { stops, i, min: 0 };
    }
    return { stops, i: route.stop ? stops.findIndex((s) => s.id === route.stop) : -1, min: -1 };
  });
  function step(d: -1 | 1) {
    if (follow) endFollow(false);
    const { stops, i, min } = stepInfo, ni = i + d;
    if (ni < min || ni >= stops.length) { sfx.bump(); nudge = { dir: d, n: nudge.n + 1 }; return; }
    if (!isPathScene(route.scene)) go({ scene: stops[ni].id as SceneId });
    else go({ stop: ni < 0 ? null : stops[ni].id }, true);
  }
  function up() {
    if (follow) return endFollow(false);
    if (route.stop) return go({ stop: null }, true);
    if (route.scene !== 'overview') go({ scene: 'overview' });
  }

  // ------------------------------------------------------------------ packets + follow
  let packets = $state<Record<PathSceneId, LivePacket[]>>({ overview: [], internet: [] });
  let prevIds: Record<PathSceneId, Map<string, LivePacket>> = { overview: new Map(), internet: new Map() };
  let follow = $state<{ id: string; scene: PathSceneId } | null>(null);
  let followed = $state<LivePacket | null>(null);
  let timeScale = 1, clock = 0;
  const FOLLOW_SCALE = 0.3;

  function startFollow(p: LivePacket, scene: PathSceneId) {
    follow = { id: p.id, scene };
    view.followId = p.id;
    followed = p;
    trans = null;
    premount = null;
    sfx.pop();
  }
  function endFollow(arrived: boolean, silent = false) {
    if (!follow) return;
    if (arrived && followed) sfx.blip(true, followed.kind);
    follow = null; followed = null; view.followId = null;
    if (!silent) startTrans(route.scene, targetCam(route), 800);
  }

  // ------------------------------------------------------------------ tap hit-testing
  function nearLink(l: { p0: { x: number; y: number }; c: { x: number; y: number }; p1: { x: number; y: number } }, p: { x: number; y: number }) {
    let best = Infinity;
    for (let i = 0; i <= 24; i++) { const b = bezier(l, i / 24); best = Math.min(best, Math.hypot(b.x - p.x, b.y - p.y)); }
    return best;
  }
  function onTap(sx: number, sy: number) {
    // 1. packets (a generous ≥ 30 px screen radius, for small fingers)
    let hit: { p: LivePacket; s: PathSceneId; d: number } | null = null;
    for (const s of ['overview', 'internet'] as const) {
      if (!(s === 'overview' ? route.scene === 'overview' : route.scene === 'internet')) continue;
      for (const p of packets[s]) {
        const w = toWorld(s, p.pose), sc = toScreen(cam, w), d = Math.hypot(sc.x - sx, sc.y - sy);
        if (d < 32 && (!hit || d < hit.d)) hit = { p, s, d };
      }
    }
    if (hit) return startFollow(hit.p, hit.s);
    if (follow) return endFollow(false);
    if (!isPathScene(route.scene)) return;
    const scene = route.scene, data = pathScene(scene), sk = cam.k * (scene === 'overview' ? 1 : 0.1);
    const w = toLocal(scene, toWorldPt(cam, sx, sy)), minR = 30 / sk;
    if (scene === 'overview') {
      for (const l of data.links) if (l.dive && nearLink(l, w) < Math.max(46, minR)) { sfx.pop(); return go({ scene: l.dive }); }
    }
    for (const n of data.nodes) {
      if (Math.hypot(n.x - w.x, n.y - w.y) > Math.max(n.size * 0.55, minR)) continue;
      sfx.pop();
      if (n.expand) return go({ scene: n.expand });
      if (n.id === 'home') return go({ scene: 'overview', stop: 'router' });
      if (data.stops.includes(n.id)) return go({ stop: route.stop === n.id ? null : n.id }, true);
    }
    for (const l of data.links) {
      if (data.stops.includes(l.id) && nearLink(l, w) < Math.max(40, minR)) { sfx.pop(); return go({ stop: l.id }, true); }
    }
    if (route.stop) go({ stop: null }, true);
  }

  function onFlick(dx: number, dy: number) {
    const portrait = view.orient === 'portrait';
    if (Math.abs(dx) > Math.abs(dy) * 1.2) { step(dx < 0 ? 1 : -1); return true; }
    if (portrait && Math.abs(dy) > Math.abs(dx) * 1.2) { step(dy > 0 ? 1 : -1); return true; }
    return false;
  }

  // ------------------------------------------------------------------ caption
  let showCaption = $state(true);
  let captionEl = $state<HTMLElement>();
  let captionH = $state(150);
  const caption = $derived.by(() => {
    void loc.lang;
    const lv = loc.level, s = route.scene;
    const stop = route.stop ? stopsFor(s).find((x) => x.id === route.stop) : null;
    const title = stop ? tr(stop.title) : tr(`${s}.title`);
    const body = stop ? tr(`stop.${stop.id}.${lv}`) : tr(`${s}.${lv}`);
    let hint = '';
    if (s === 'overview') {
      const l = stop && pathScene('overview').links.find((k) => k.id === stop.id);
      const n = stop && pathScene('overview').nodes.find((k) => k.id === stop.id);
      hint = l?.dive ? tr('hint.dive') : n?.expand ? tr('hint.expand') : stop ? tr('hint.step') : tr('hint.overview');
    } else if (s === 'internet') hint = stop ? tr('hint.step') : tr('hint.internet');
    else hint = tr('hint.zoomOut');
    return { title, body, hint };
  });

  // ------------------------------------------------------------------ frame loop, gestures, resize
  const orientFor = (w: number, h: number): Orient => (h > w * 1.1 ? 'portrait' : 'landscape');
  /** Keep the followed packet in the part of the screen the peek panel doesn't cover. */
  function followCentre() {
    const c = areaCentre(view.vp), r = document.querySelector('.peek')?.getBoundingClientRect();
    if (!r) return c;
    if (view.orient === 'portrait') return { x: c.x, y: (view.vp.top + r.top) / 2 };
    return { x: r.left > view.vp.w / 2 ? r.left / 2 : (r.right + view.vp.w) / 2, y: c.y };
  }

  function resize() {
    const bar = document.querySelector('.chrome .controls')?.getBoundingClientRect();
    view.vp = viewportFor(stage, { top: bar ? bar.bottom + 8 : 0, bottom: captionEl ? captionEl.offsetHeight + 22 : 0 });
    const o = orientFor(view.vp.w, view.vp.h);
    if (o !== view.orient) { setOrient(o); view.orient = o; prevIds = { overview: new Map(), internet: new Map() }; }
    if (follow) endFollow(false, true);
    trans = null;
    premount = null;
    cam = targetCam(route);
  }
  $effect(() => { const id = settings.style; untrack(() => { if (id !== themeState.current.id) void loadTheme(id).then(resize); }); });

  onMount(() => {
    onRoute(onNavigate);
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      timeScale += ((follow ? FOLLOW_SCALE : 1) - timeScale) * Math.min(1, dt * 5);
      clock += dt * timeScale;
      view.real = now / 1000;
      view.time = clock;

      // packets, arrivals, follow
      const next = {} as Record<PathSceneId, LivePacket[]>;
      for (const s of ['overview', 'internet'] as const) {
        const d = pathScene(s);
        const list = livePackets(d.packets, d.links, view.time, s);
        const ids = new Map(list.map((p) => [p.id, p]));
        for (const [id, p] of prevIds[s]) {
          if (ids.has(id)) continue;
          if (follow?.id === id) endFollow(true);
          else if (s === route.scene && p.age > p.spec.duration * 0.85) sfx.blip(false, p.kind);
        }
        prevIds[s] = ids;
        next[s] = list;
      }
      packets = next;
      if (follow) {
        const p = next[follow.scene].find((k) => k.id === follow!.id);
        if (p) {
          followed = p;
          const w = toWorld(follow.scene, p.pose), k = fitScene(follow.scene, view.vp).k * (view.orient === 'portrait' ? 1.6 : 1.8);
          const c = followCentre(), a = 1 - Math.exp(-dt * 4);
          const tk = cam.k * Math.pow(k / cam.k, a);
          const cur = toWorldPt(cam, c.x, c.y);
          const wc = { x: cur.x + (w.x - cur.x) * a, y: cur.y + (w.y - cur.y) * a };
          cam = { k: tk, x: c.x - wc.x * tk, y: c.y - wc.y * tk };
        }
      }
      if (trans) frameTrans(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const ctl = {
      stop() {
        trans = null;
        premount = null;
      },
      zoomAt(f: number, sx: number, sy: number) {
        if (follow) endFollow(false, true);
        const k = clampCam({ ...cam, k: cam.k * f }, view.vp).k;
        cam = zoomAbout(cam, k / cam.k, sx, sy);
      },
      panBy(dx: number, dy: number) {
        if (follow) endFollow(false, true);
        cam = { ...cam, x: cam.x + dx, y: cam.y + dy };
      },
    };
    attachGestures(stage, ctl, {
      onTap, onFlick,
      onEnd() {
        const nextScene = decide(cam, view.vp, route.scene);
        if (nextScene && nextScene !== route.scene) { gestureNav = true; go({ scene: nextScene }); }
        else settle();
      },
    });
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    const keys = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.key === 'Escape') up();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') step(1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') step(-1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', keys);
    // Test/screenshot hook (scripts/evaluate.mjs).
    Object.assign(window, {
      __proto: {
        go, route: () => route, busy: () => !!trans,
        follow(kind = 'video') { const s = isPathScene(route.scene) ? route.scene : 'overview'; const p = packets[s].filter((k) => k.kind === kind).sort((x, y) => x.age / x.spec.duration - y.age / y.spec.duration)[0] ?? packets[s][0]; if (p) startFollow(p, s); return !!p; },
        setClock(t: number) { clock = t; },
      },
    });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', keys); };
  });

  $effect(() => {
    const el = captionEl;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      captionH = el.offsetHeight;
      // the caption grew past the reserved inset (first measure, longer text): refit while idle
      if (!trans && !follow && Math.abs(view.vp.bottom - (captionH + 22)) > 30) resize();
    });
    ro.observe(el);
    return () => ro.disconnect();
  });
  $effect(() => { document.documentElement.style.setProperty('--cap-h', `${captionH}px`); });
  const portrait = $derived(view.orient === 'portrait');
  const small = $derived(view.vp.w < 700);
  const peekOpen = $derived(!!followed);
</script>

<div id="stage" bind:this={stage} class={portrait ? 'port' : 'land'}>
  <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <A.Defs />
    <World {cam} mix={mixes(cam, view.vp)} {packets} focus={{ scene: route.scene, stop: route.stop }} {premount} />
    <A.Overlay w={view.vp.w} h={view.vp.h} scene={route.scene} time={view.time} />
  </svg>
</div>
<div class={portrait ? 'port' : 'land'}>
  <Chrome {route} {small} />
  {#if followed}
    <PeekPanel packet={followed} onclose={() => endFollow(false)} />
  {/if}
  <Caption scene={route.scene} title={caption.title} body={caption.body} hint={caption.hint} hidden={!showCaption || (peekOpen && portrait)} bind:el={captionEl} />
  {#if !(peekOpen && portrait)}
    <StepButtons {portrait} canPrev={stepInfo.i > stepInfo.min} canNext={stepInfo.i < stepInfo.stops.length - 1} onstep={step} {nudge} />
  {/if}
</div>
