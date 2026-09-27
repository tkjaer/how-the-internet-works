<svelte:options namespace="svg" />
<script lang="ts">
  import type { PanelProps } from '../../../core/theme-types';
  import Rough from './Rough.svelte';
  import { rrect } from './rough';
  let { part, w, h, time }: PanelProps = $props();
  const grid = 52;
  const xs = $derived(Array.from({ length: Math.ceil(w / grid) + 1 }, (_, i) => i * grid));
  const ys = $derived(Array.from({ length: Math.ceil(h / grid) + 1 }, (_, i) => i * grid));
</script>

{#if part === 'back'}
  <rect width={w} height={h} fill="var(--paper-panel)" />
  {#each xs as x}<line {x} y1="0" y2={h} class="grid" />{/each}
  {#each ys as y}<line x1="0" x2={w} {y} class="rule" />{/each}
{:else}
  <g class="panel-edge">
    <Rough paths={rrect(`panel-${w}-${h}`, 8, 8, w - 16, h - 16, 56, time, { stroke: 'var(--pencil)', strokeWidth: 8, fill: 'none' })} />
    <Rough opacity={0.78} paths={rrect(`tape-a-${w}`, 42, -12, 170, 42, 8, time, { stroke: 'var(--tape-edge)', strokeWidth: 2, fill: 'var(--tape)', fillStyle: 'hachure', hachureGap: 9 })} />
    <Rough opacity={0.78} paths={rrect(`tape-b-${w}-${h}`, w - 222, h - 30, 180, 44, 8, time, { stroke: 'var(--tape-edge)', strokeWidth: 2, fill: 'var(--tape)', fillStyle: 'hachure', hachureGap: 9 })} />
  </g>
{/if}

<style>
  .grid { stroke: var(--grid); stroke-width: 1; opacity: .22; }
  .rule { stroke: var(--rule); stroke-width: 1; opacity: .16; }
</style>
