<svelte:options namespace="svg" />
<script lang="ts">
  // Metro: a few colours share one thread, each its own channel (combined at one end, split at the other). A thread
  // with one colour (`one`: a data centre's link or a cross-connect in 2010) has one laser and one detector, and
  // nothing to combine.
  import { TagAt, Text, strings, view } from '$core/api';
  import { DWDM, FIBRE, LONG_HAUL, channelRoute, fibrePulses, laneNumbers, metroTag, trackMatrix } from './light';
  import Fibre from './art/Fibre.svelte';
  import Route from './art/Route.svelte';
  import Emitter from './art/Emitter.svelte';
  import Prism from './art/Prism.svelte';
  import Pulse from './art/Pulse.svelte';
  let { tech, one = false, time }: { tech: string; one?: boolean; time: number } = $props();
  const S = strings('scene.fibre-light');
  const F = FIBRE;
  // fixed-colour: each wavelength's own colour: light, the same by day and by night
  const colours = ['#e85d75', '#ffcf5d', '#55bfa3', '#4aa3cf'];
  const lanes = $derived(one ? LONG_HAUL.lane : DWDM);
  const routes = $derived(lanes.map((c, i) => channelRoute(i, c)));
  const pulses = $derived(fibrePulses(time, routes));
  const o = $derived(view.orient);
  // Label positions per orientation (text stays upright; the track itself turns in portrait).
  const L = $derived(o === 'portrait'
    ? { channels: null, core: { x: 210, y: 900 }, clad: { x: 690, y: 640 }, mux: { x: 690, y: 1440 }, demux: { x: 690, y: 185 }, tag: { x: 450, y: 1180 } }
    : { channels: { x: 800, y: 120 }, core: { x: 600, y: 285 }, clad: { x: 1000, y: 655 }, mux: { x: 230, y: 790 }, demux: { x: 1370, y: 790 }, tag: { x: 800, y: 860 } });
</script>

<g transform={trackMatrix(o)}>
  <Fibre x0={F.x0} x1={F.x1} y={F.y} coreH={F.coreH} cladH={F.cladH} {time} />
  {#each routes as r, i}<Route points={r} channel={i} colour={colours[i]} />{/each}
  {#each lanes as c, i}
    <Emitter x={F.laserX} y={c.y} kind="laser" channel={i} colour={colours[i]} {time} />
    <Emitter x={F.detectorX} y={c.y} kind="detector" channel={i} colour={colours[i]} {time} />
  {/each}
  {#if !one}
    <Prism x={F.muxX} y={F.y} kind="mux" {time} />
    <Prism x={F.demuxX} y={F.y} kind="demux" {time} />
  {/if}
  {#each pulses as p}
    <Pulse head={p.head} trail={p.trail} channel={p.channel} colour={colours[p.channel]} {time} />
  {/each}
</g>
<!-- portrait has no room for the long heading beside the thread; the caption says it instead -->
{#if L.channels && !one}<Text x={L.channels.x} y={L.channels.y} text={S('channels')} size={36} kind="big" />{/if}
<Text x={L.core.x} y={L.core.y} text={S('core')} size={30} kind="big" />
<Text x={L.clad.x} y={L.clad.y} text={S('cladding')} size={30} kind="big" />
{#if !one}
  <Text x={L.mux.x} y={L.mux.y} text={S('mux')} size={28} kind="big" />
  <Text x={L.demux.x} y={L.demux.y} text={S('demux')} size={28} kind="big" />
{/if}
<TagAt x={L.tag.x} y={L.tag.y} text={S(metroTag(tech, one))} size={24} fit />
{#each one ? [] : laneNumbers(lanes, o) as l}<Text x={l.x} y={l.y + 10} text={(view.level === 'technical' ? 'λ' : '') + l.n} size={28} kind="small" />{/each}
