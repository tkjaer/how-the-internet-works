<svelte:options namespace="svg" />
<script lang="ts">
  // Long haul (backbone): many thinner colours on a thread as long as the stretch really is (#42). The light fades
  // through each span and a booster makes every colour bright again at once; a counter follows the first colour's
  // flash and counts the kilometres.
  import { TagAt, Text, strings, view, type LinkSubject } from '$core/api';
  import { FIBRE, LONG_HAUL, boostersOf, breaksOf, channelRoute, fadeAt, fibrePulses, haulOf, kmAt, laneNumbers, oneColour, stretchKm, toScene, trackMatrix, wordsOf } from './light';
  import Fibre from './art/Fibre.svelte';
  import Route from './art/Route.svelte';
  import Emitter from './art/Emitter.svelte';
  import Prism from './art/Prism.svelte';
  import Pulse from './art/Pulse.svelte';
  import Amplifier from './art/Amplifier.svelte';
  import Break from './art/Break.svelte';
  let { subject, time }: { subject: LinkSubject; time: number } = $props();
  const S = strings('scene.fibre-light');
  const F = FIBRE, H = LONG_HAUL;
  // fixed-colour: each wavelength's own colour: light, the same by day and by night
  const RAINBOW = ['#e85d75', '#f08a4b', '#ffcf5d', '#a8c957', '#55bfa3', '#4aa3cf', '#7f7fd5', '#c77dbb'];
  // before DWDM: one colour, no prisms to mix and split them, and regenerators instead of amplifiers (its words say so)
  const one = $derived(oneColour(subject.link.tech.id));
  const words = $derived(wordsOf(subject.link.tech.id, 'backbone'));
  const lanes = $derived(one ? H.lane : H.lanes);
  const colours = $derived(one ? RAINBOW.slice(0, 1) : RAINBOW);
  const routes = $derived(lanes.map((c, i) => channelRoute(i, c)));
  const haul = $derived(haulOf(stretchKm(subject.run), H.spanKm, F.x0, F.x1));
  const amps = $derived(boostersOf(haul));
  const pulses = $derived(fibrePulses(time, routes, 2));
  const o = $derived(view.orient);
  const portrait = $derived(o === 'portrait');
  /** Booster labels beside the thread (upright, in scene coordinates). */
  const boosters = $derived(amps.map((x) => toScene({ x, y: portrait ? 190 : 300 }, o)));
  /** The counter rides under the first colour's leading flash, between the thread's ends. */
  const lead = $derived(pulses[0].head.x);
  const counter = $derived({ ...toScene({ x: Math.min(F.x1, Math.max(F.x0, lead)), y: portrait ? 760 : 625 }, o), km: Math.round(kmAt(haul, lead)) });
  // portrait: across the thread (callouts are wider than the space beside it on a phone)
  const tag = $derived(portrait ? { x: 450, y: 1190 } : { x: 800, y: 862 });
</script>

<g transform={trackMatrix(o)}>
  <Fibre x0={F.x0} x1={F.x1} y={F.y} coreH={F.coreH} cladH={F.cladH} {time} />
  {#each breaksOf(haul) as x}<Break {x} y={F.y} h={F.cladH} />{/each}
  {#each routes as r, i}<Route points={r} channel={i} colour={colours[i]} size={0.6} />{/each}
  {#each lanes as c, i}
    <Emitter x={F.laserX} y={c.y} kind="laser" channel={i} colour={colours[i]} {time} size={0.62} />
    <Emitter x={F.detectorX} y={c.y} kind="detector" channel={i} colour={colours[i]} {time} size={0.62} />
  {/each}
  {#if !one}
    <Prism x={F.muxX} y={F.y} kind="mux" {time} />
    <Prism x={F.demuxX} y={F.y} kind="demux" {time} />
  {/if}
  {#each pulses as p}
    <Pulse head={p.head} trail={p.trail} channel={p.channel} colour={colours[p.channel]} {time} fade={fadeAt(haul, p.head.x)} size={0.65} />
  {/each}
  <!-- over the light: it goes in faint and comes out bright -->
  {#each amps as x}<Amplifier {x} y={F.y} {time} />{/each}
</g>
{#each boosters as b}<Text x={b.x} y={b.y} text={S(`${words}.booster`)} size={28} kind="big" />{/each}
{#if haul.km}<Text x={counter.x} y={counter.y} text={`${counter.km} km`} size={30} kind="big" colour={colours[0]} />{/if}
<TagAt x={tag.x} y={tag.y} text={S(`tag.${words}`)} size={24} fit />
{#each one ? [] : laneNumbers(lanes, o, 0.62) as l}<Text x={l.x} y={l.y + 7} text={(view.level === 'technical' ? 'λ' : '') + l.n} size={20} kind="small" />{/each}
