<svelte:options namespace="svg" />
<script lang="ts">
  import type { PacketProps } from '../../../core/theme-types';
  import Rough from './Rough.svelte';
  import { boilFrame, rcircle, rline, rpath, rrect } from './rough';
  let { kind, pose, colour, time, followed }: PacketProps = $props();
  const deg = $derived((pose.angle * 180) / Math.PI);
  const frame = $derived(boilFrame(time));
  const relTrail = $derived(pose.trail.slice(0, 5).map((p, i) => ({ x: p.x - pose.x, y: p.y - pose.y, i })));
</script>

<g class="packet packet-{kind}" transform="translate({pose.x} {pose.y})">
  {#if followed}
    <Rough opacity={0.95} paths={rcircle(`packet-follow-${kind}`, 0, 0, 38, time, { stroke: 'var(--crayon-pink)', strokeWidth: 4, fill: 'none', roughness: 2.2 })} />
    <Rough opacity={0.7} paths={rcircle(`packet-follow-b-${kind}`, 1, -1, 31, time + 0.2, { stroke: 'var(--ink-blue)', strokeWidth: 2.5, fill: 'none', roughness: 2 })} />
  {/if}
  {#each relTrail as p}
    <path d="M{p.x.toFixed(1)} {p.y.toFixed(1)} l{(-Math.cos(pose.angle) * (18 + p.i * 3)).toFixed(1)} {(-Math.sin(pose.angle) * (18 + p.i * 3)).toFixed(1)}" stroke="var(--pencil)" stroke-width={Math.max(1.5, 4 - p.i * 0.45)} stroke-linecap="round" opacity={0.34 - p.i * 0.045} />
  {/each}
  <g transform="rotate({deg}) scale({pose.sx} {pose.sy})">
    <Rough opacity={0.22} paths={rrect(`packet-shadow-${kind}`, -17, -8, 38, 25, 5, time, { stroke: 'var(--shadow)', strokeWidth: 4, fill: 'var(--shadow)', fillStyle: 'hachure', hachureGap: 7 })} />
    <Rough paths={rrect(`packet-body-${kind}-${colour}`, -19, -14, 38, 28, 5, time, { stroke: 'var(--pencil)', strokeWidth: 3.2, fill: colour, fillStyle: 'hachure', hachureGap: 6 })} />
    <Rough paths={rpath(`packet-flap-${kind}`, 'M-17 -11 L0 2 L17 -11 M-17 12 L-3 0 M17 12 L3 0', time, { stroke: 'var(--pencil)', strokeWidth: 2.1, fill: 'none', roughness: 1.9 })} />
    {#if kind === 'video'}
      <path d="M-3 -6 L-3 6 L8 0 Z" fill="var(--paper)" stroke="var(--pencil)" stroke-width="1.7" stroke-linejoin="round" />
    {/if}
    {#each [-1, 0, 1] as lane}
      <Rough opacity={0.5 - Math.abs(lane) * 0.11} paths={rline(`packet-speed-${kind}-${lane}-${frame}`, -26, lane * 9, -52 - lane * 2, lane * 12, time, { stroke: 'var(--pencil)', strokeWidth: 2 })} />
    {/each}
  </g>
</g>
