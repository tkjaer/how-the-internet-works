<svelte:options namespace="svg" />
<script lang="ts">
  import type { BackdropProps } from '../../../core/theme-types';
  let { scene, w, h }: BackdropProps = $props();
  const grid = 48;
  const xs = $derived(Array.from({ length: Math.ceil((w * 3) / grid) + 1 }, (_, i) => -w + i * grid));
  const ys = $derived(Array.from({ length: Math.ceil((h * 3) / grid) + 1 }, (_, i) => -h + i * grid));
</script>

{#if scene === 'overview' || scene === 'internet'}
  <g class="paper-backdrop">
    <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="var(--paper)" />
    {#each xs as x}<line {x} y1={-h} y2={h * 2} class="grid" />{/each}
    {#each ys as y}<line x1={-w} x2={w * 2} {y} class="rule" />{/each}
    {#if scene === 'overview'}<line x1={w * 0.12} x2={w * 0.12} y1={-h} y2={h * 2} class="margin" />{/if}
  </g>
{/if}

<style>
  .grid { stroke: var(--grid); stroke-width: 1; opacity: .24; }
  .rule { stroke: var(--rule); stroke-width: 1; opacity: .18; }
  .margin { stroke: var(--margin-line); stroke-width: 3; opacity: .42; }
</style>
