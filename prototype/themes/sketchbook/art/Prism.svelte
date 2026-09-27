<svelte:options namespace="svg" />
<script lang="ts">
  import type { PrismProps } from '../../../core/theme-types';
  import Rough from './Rough.svelte';
  import { rpoly } from './rough';
  let { x, y, kind, time }: PrismProps = $props();
  const s = $derived(kind === 'mux' ? 1 : -1);
</script>

<Rough paths={rpoly(`prism-${kind}`, [[x - 42 * s, y - 92], [x + 34 * s, y], [x - 42 * s, y + 92]], time, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--prism-paper)', fillStyle: 'hachure', hachureGap: 10 })} />
