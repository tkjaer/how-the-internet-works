<svelte:options namespace="svg" />
<script lang="ts">
  import type { PacketProps } from '../../../core/theme-types';
  let { kind, pose, colour, time, followed, alive }: PacketProps = $props();
  const deg = $derived((pose.angle * 180) / Math.PI);
  const flicker = $derived(pose.phase === 'wait' && alive ? 0.55 + 0.45 * Math.sin(time * 42) ** 2 : 1);
  const land = $derived(pose.phase === 'land' && alive ? 1 - Math.abs(Math.sin(time * 18)) : 0);
  const ret = $derived((time * 55) % 360);
</script>

<g class="packet-trail">
  {#each pose.trail as p, i}
    {@const a = i === 0 ? { x: pose.x, y: pose.y } : pose.trail[i - 1]}
    <line x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={colour} stroke-width={Math.max(2, 16 - i * 2.1)} stroke-linecap="round" opacity={0.2 * (1 - i / Math.max(1, pose.trail.length))} />
    <line x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke="#fff" stroke-width={Math.max(1, 5 - i * 0.6)} stroke-linecap="round" opacity={0.28 * (1 - i / Math.max(1, pose.trail.length))} />
  {/each}
</g>

<g transform="translate({pose.x} {pose.y})">
  {#if followed}
    <g class="reticle" transform="rotate({ret})">
      <circle r="46" />
      <path d="M-54 -28V-54H-28M28 -54H54V-28M54 28V54H28M-28 54H-54V28" />
    </g>
    <g class="readout" transform="translate(0 63)">
      <path d="M-34 0H22L34 -9M-20 8H20" />
      <circle cx="-42" cy="0" r="3" />
    </g>
  {/if}
  {#if land > 0.03}<circle r={22 + 34 * land} fill="none" stroke={colour} stroke-width="3" opacity={0.45 * (1 - land)} />{/if}
  <g transform="rotate({deg}) scale({pose.sx} {pose.sy})" opacity={flicker}>
    <path class="glow" d="M0 -20 L28 0 L0 20 L-28 0 Z" stroke={colour} />
    <path class="body" d="M0 -17 L25 0 L0 17 L-25 0 Z" fill={kind === 'request' ? 'rgba(255,181,71,.18)' : 'rgba(255,79,216,.16)'} stroke={colour} />
    <path class="core" d={kind === 'video' ? 'M-7 -8 L9 0 L-7 8 Z' : 'M-10 0H10M2 -8L12 0L2 8'} />
  </g>
</g>

<style>
  .glow { fill: none; stroke-width: 16; stroke-linejoin: round; opacity: 0.16; }
  .body { stroke-width: 4; stroke-linejoin: round; }
  .core { fill: none; stroke: #fffbea; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; opacity: 0.92; }
  .reticle circle { fill: none; stroke: #77f8ff; stroke-width: 3; stroke-dasharray: 12 12; opacity: 0.72; }
  .reticle path, .readout path { fill: none; stroke: #77f8ff; stroke-width: 4; stroke-linecap: square; stroke-linejoin: miter; opacity: 0.86; }
  .readout circle { fill: #77f8ff; opacity: 0.9; }
</style>
