<svelte:options namespace="svg" />
<script lang="ts">
  import type { EmitterProps } from '../../../core/theme-types';
  import Rough from './Rough.svelte';
  import { rcircle, rpath, rrect } from './rough';
  let { x, y, kind, channel, colour, time }: EmitterProps = $props();
</script>

{#if kind === 'laser'}
  <Rough paths={rrect(`laser-${channel}`, x - 44, y - 30, 78, 60, 14, time, { stroke: 'var(--pencil)', strokeWidth: 4, fill: 'var(--device-paper)', fillStyle: 'hachure', hachureGap: 9 })} />
  <Rough opacity={0.55} paths={rpath(`laser-cone-${channel}`, `M${x + 18} ${y - 15} L${x + 52} ${y} L${x + 18} ${y + 15}`, time, { stroke: colour, strokeWidth: 3, fill: colour, fillStyle: 'hachure', hachureGap: 6 })} />
{:else}
  <Rough paths={rrect(`detector-${channel}`, x - 34, y - 31, 80, 62, 14, time, { stroke: 'var(--pencil)', strokeWidth: 4, fill: 'var(--device-paper)', fillStyle: 'hachure', hachureGap: 9 })} />
  <Rough paths={rcircle(`detector-eye-${channel}`, x - 12, y, 15, time, { stroke: colour, strokeWidth: 5, fill: 'none' })} />
{/if}
