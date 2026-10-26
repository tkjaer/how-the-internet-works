<svelte:options namespace="svg" />
<script lang="ts">
  // Under the sea (#39): the same trunk, in a cable lying on the sea floor between two landing stations. Repeaters
  // along it make the light bright again, powered through the cable's copper from the shore; a slice shows what is
  // inside, a counter follows the first colour across (#42), and at Simple a shark swims by.
  import { TagAt, Text, fill, legibleSize, strings, view, type LinkSubject } from '$core/api';
  import { boostersOf, fadeAt, kmAt, oneColour, stretchKm, wordsOf } from './light';
  import { CABLE_W, SEA, cable, cablePulses, ground, seaHaul, shark, sparks, water } from './sea';
  import Sea from './art/Sea.svelte';
  import Cable from './art/Cable.svelte';
  import Station from './art/Station.svelte';
  import Repeater from './art/Repeater.svelte';
  import Slice from './art/Slice.svelte';
  import Shark from './art/Shark.svelte';
  import Pulse from './art/Pulse.svelte';
  let { subject, time }: { subject: LinkSubject; time: number } = $props();
  const S = strings('scene.fibre-light');
  // fixed-colour: each wavelength's own colour: light, the same by day and by night
  const FOUR = ['#e85d75', '#ffcf5d', '#55bfa3', '#4aa3cf'];
  // before DWDM (CANTAT-3, 1994): one colour per fibre, made bright again by regenerators; its own words
  const colours = $derived(oneColour(subject.link.tech.id) ? FOUR.slice(0, 1) : FOUR);
  const words = $derived(wordsOf(subject.link.tech.id, 'submarine'));
  const o = $derived(view.orient);
  const portrait = $derived(o === 'portrait');
  const compact = $derived(o === 'landscape' && view.vp.h < 470);
  const sea = $derived(SEA[o]);
  const route = $derived(cable(sea));
  const haul = $derived(seaHaul(sea, stretchKm(subject.run)));
  const repeaters = $derived(boostersOf(haul));
  const pulses = $derived(cablePulses(time, route, colours.length));
  const power = $derived(sparks(time, route));
  const simple = $derived(view.level === 'simple');
  const legible = legibleSize();
  /** A long cable's boosters stand closer than their names are wide: every other name goes up a line (down on a phone,
   *  where they always take turns), and where even that is too close only the middle one is named. Their pills narrow
   *  to fit between them (#136: 1995's five on a phone). */
  const gap = $derived(repeaters.length > 1 ? repeaters[1] - repeaters[0] : Infinity);
  const nameW = $derived(S(`${words}.repeater`).length * 0.55 * legible(26) + 16);
  const crowded = $derived(gap < nameW);
  const named = $derived(2 * gap < nameW ? [Math.floor(repeaters.length / 2)] : repeaters.map((_, i) => i));
  const fish = $derived(portrait ? shark(time, 240, 660, 570) : shark(time, 310, 600, 345));
  /** The counter rides in the sand under the first colour's leading flash. */
  const lead = $derived(pulses[0].head.x);
  const counter = $derived({ x: Math.min(haul.b, Math.max(haul.a, lead)), km: Math.round(kmAt(haul, lead)) });
  // label spots (all upright): stations' names by the stations, the boosters' by them (in turn lower on a phone,
  // where they stand close), the slice's title over it and its parts either side
  const L = $derived(portrait
    ? { stations: [{ x: 40, y: 360, anchor: 'start' }, { x: 860, y: 300, anchor: 'end' }] as const, repeater: sea.floor + 75, stagger: 55, counter: 1400, tag: 1480,
        title: 710, parts: { y: 1040, copper: { x: 420, anchor: 'end' }, glass: { x: 480, anchor: 'start' } } as const, slice: sea.slice }
    : { stations: [{ x: 190, y: 190, anchor: 'start' }, { x: 1410, y: 190, anchor: 'end' }] as const, repeater: sea.floor - 80, stagger: crowded ? -44 : 0, counter: 800, tag: 862,
        title: 322, parts: { y: 455, copper: { x: sea.slice.x - sea.slice.r - 20, anchor: 'end' }, glass: { x: sea.slice.x + sea.slice.r + 20, anchor: 'start' } } as const, slice: sea.slice });
</script>

<Sea water={water(sea)} ground={ground(sea)} land={sea.land} shore={sea.shore} surface={sea.surface} w={sea.w} {time} />
{#if simple}<Shark x={fish.x} y={fish.y} left={fish.left} {time} />{/if}
<!-- the slice is cut from the cable just below it -->
<line x1={L.slice.x} y1={L.slice.y + L.slice.r} x2={L.slice.x} y2={sea.floor - CABLE_W} stroke="var(--line)" stroke-width="5" stroke-dasharray="4 14" stroke-linecap="round" />
<Slice x={L.slice.x} y={L.slice.y} r={L.slice.r} {colours} />
<Cable points={route} w={CABLE_W} />
{#each power as p}<circle cx={p.x} cy={p.y} r="6" fill="var(--sun)" stroke="var(--face)" stroke-width="3" />{/each}
{#each pulses as p}
  <Pulse head={p.head} trail={p.trail} channel={p.channel} colour={colours[p.channel]} {time} fade={fadeAt(haul, p.head.x)} size={0.55} />
{/each}
{#each repeaters as x}<Repeater {x} y={sea.floor - CABLE_W / 2} w={Math.min(124, gap - 10)} {time} />{/each}
{#each sea.stations as st}<Station x={st.x} y={st.y} size={sea.stationSize} {time} />{/each}

{#each L.stations as s}<Text x={s.x} y={s.y} text={S(`${words}.landing`)} size={28} kind="big" anchor={s.anchor} fit />{/each}
{#each named as i}<Text x={repeaters[i]} y={L.repeater + (named.length > 1 ? i % 2 : 0) * L.stagger} text={S(`${words}.repeater`)} size={26} kind="big" />{/each}
{#if !compact}
  <Text x={L.slice.x} y={L.title} text={S(`${words}.inside`)} size={28} kind="big" />
  <Text x={L.parts.copper.x} y={L.parts.y} text={S(`${words}.copper`)} size={24} kind="small" anchor={L.parts.copper.anchor} />
  <Text x={L.parts.glass.x} y={L.parts.y} text={S(`${words}.glass`)} size={24} kind="small" anchor={L.parts.glass.anchor} />
{/if}
{#if haul.km}<Text x={counter.x} y={L.counter} text={`${counter.km} km`} size={30} kind="big" colour={colours[0]} />{/if}
<TagAt x={sea.w / 2} y={L.tag} text={fill(S(`tag.${words}`), { span: Math.round(haul.km / (repeaters.length + 1)) })} size={24} fit />
