<svelte:options namespace="svg" />
<script lang="ts">
  import type { FibreProps } from '../../../core/theme-types';
  import Rough from './Rough.svelte';
  import { rrect } from './rough';
  let { x0, x1, y, coreH, cladH, time }: FibreProps = $props();
</script>

<Rough opacity={0.74} paths={rrect('fibre-clad', x0, y - cladH / 2, x1 - x0, cladH, cladH / 2, time, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--fibre-clad)', fillStyle: 'hachure', hachureGap: 14 })} />
<Rough opacity={0.9} paths={rrect('fibre-core', x0, y - coreH / 2, x1 - x0, coreH, coreH / 2, time, { stroke: 'var(--ink-blue)', strokeWidth: 4, fill: 'var(--fibre-core)', fillStyle: 'hachure', hachureAngle: -35, hachureGap: 11 })} />
