<svelte:options namespace="svg" />
<script lang="ts">
  import type { PacketProps } from '../../../core/theme-types';
  let { kind, pose, colour, followed }: PacketProps = $props();
  const deg = $derived((pose.angle * 180) / Math.PI + Math.sin(pose.step * 1.7) * 5);
  const flutter = $derived(Math.sin(pose.step * 2.3) * 3);
</script>

<g transform="translate({pose.x} {pose.y})" pointer-events="none">
  {#if followed}
    <circle r="42" fill="var(--spotlight)" opacity=".36" />
    <circle r="35" fill="none" stroke="var(--spot-ring)" stroke-width="7" stroke-dasharray="14 10" />
  {/if}
  {#each pose.trail.slice(0, 5) as p, i}
    <path d={`M${p.x - pose.x - 5} ${p.y - pose.y} l${6 + i * 1.5} ${-4 + (i % 2) * 8} l${-2} ${7} Z`} fill={i % 2 ? 'var(--paper-coral)' : 'var(--paper-mustard)'} opacity={0.5 - i * 0.07} />
  {/each}
  <g transform="rotate({deg}) scale({pose.sx} {pose.sy})">
    <g class="pkt-shadow" transform="translate(6 7) rotate({flutter})">
      {#if kind === 'request'}
        <path d="M-26 -16 L26 -16 L26 16 L-26 16 Z" />
      {:else}
        <path d="M-30 -17 L34 0 L-30 17 L-18 2 Z" />
      {/if}
    </g>
    <g transform="rotate({flutter})">
      {#if kind === 'request'}
        <path d="M-28 -17 L28 -16 L26 17 L-29 15 Z" fill={colour} stroke="var(--packet-edge)" stroke-width="3" stroke-linejoin="round" />
        <path d="M-27 -16 L0 4 L27 -16" fill="none" stroke="var(--packet-fold)" stroke-width="3" stroke-linejoin="round" />
        <path d="M-26 15 L-5 -3 M26 16 L5 -3" fill="none" stroke="var(--packet-fold)" stroke-width="2.5" opacity=".75" />
      {:else}
        <path d="M-33 -18 L38 0 L-33 18 L-17 2 Z" fill={colour} stroke="var(--packet-edge)" stroke-width="3" stroke-linejoin="round" />
        <path d="M-17 2 L38 0 L-8 8" fill="none" stroke="var(--packet-fold)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M-33 -18 L-8 8" fill="none" stroke="var(--packet-fold)" stroke-width="2.5" opacity=".8" />
      {/if}
    </g>
  </g>
</g>

<style>
  .pkt-shadow path { fill: var(--paper-shadow); opacity: .42; }
</style>
