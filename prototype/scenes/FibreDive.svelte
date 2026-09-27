<svelte:options namespace="svg" />
<script lang="ts">
  // Look inside the fibre link: total internal reflection and DWDM colours.
  import { FIBRE, channelRoute, fibrePulses, trackMatrix } from '../core/details';
  import { themeState, view } from '../state.svelte';
  import Text from './Text.svelte';
  import TagAt from './TagAt.svelte';
  const A = $derived(themeState.current.art);
  const C = $derived(themeState.current.colours);
  const o = $derived(view.orient);
  const F = FIBRE;
  const routes = [0, 1, 2, 3].map((i) => channelRoute(i));
  const pulses = $derived(fibrePulses(view.time));
  // Label positions per orientation (text stays upright; the track itself turns in portrait).
  const L = $derived(o === 'portrait'
    ? { channels: null, core: { x: 210, y: 900 }, clad: { x: 690, y: 640 }, mux: { x: 690, y: 1440 }, demux: { x: 690, y: 185 } }
    : { channels: { x: 800, y: 120 }, core: { x: 600, y: 285 }, clad: { x: 1000, y: 655 }, mux: { x: 230, y: 790 }, demux: { x: 1370, y: 790 } });
</script>

<g transform={trackMatrix(o)}>
  <A.Fibre x0={F.x0} x1={F.x1} y={F.y} coreH={F.coreH} cladH={F.cladH} time={view.time} />
  {#each routes as r, i}<A.Route points={r} channel={i} colour={C.dwdm[i]} />{/each}
  {#each F.channelY as y, i}
    <A.Emitter x={F.laserX} {y} kind="laser" channel={i} colour={C.dwdm[i]} time={view.time} />
    <A.Emitter x={F.detectorX} {y} kind="detector" channel={i} colour={C.dwdm[i]} time={view.time} />
  {/each}
  <A.Prism x={F.muxX} y={F.y} kind="mux" time={view.time} />
  <A.Prism x={F.demuxX} y={F.y} kind="demux" time={view.time} />
  {#each pulses as p}
    <A.Pulse head={p.head} trail={p.trail} channel={p.channel} colour={C.dwdm[p.channel]} time={view.time} />
  {/each}
</g>
<!-- portrait has no room for the long heading beside the thread; the caption says it instead -->
{#if L.channels}<Text x={L.channels.x} y={L.channels.y} k="fibre.channels" size={36} kind="big" />{/if}
<Text x={L.core.x} y={L.core.y} k="fibre.core" size={30} kind="big" />
<Text x={L.clad.x} y={L.clad.y} k="fibre.cladding" size={30} kind="big" />
<Text x={L.mux.x} y={L.mux.y} k="fibre.mux" size={28} kind="big" />
<Text x={L.demux.x} y={L.demux.y} k="fibre.demux" size={28} kind="big" />
<TagAt x={o === 'portrait' ? 690 : 800} y={o === 'portrait' ? 1240 : 860} k="tag.dwdm" size={24} />
