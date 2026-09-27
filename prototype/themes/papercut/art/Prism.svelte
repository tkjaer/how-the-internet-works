<svelte:options namespace="svg" />
<script lang="ts">
  import type { PrismProps } from '../../../core/theme-types';
  let { x, y, kind }: PrismProps = $props();
  const s = $derived(kind === 'mux' ? 1 : -1);
</script>

<path d={`M${x - 44 * s} ${y - 94} L${x + 34 * s} ${y - 2} L${x - 38 * s} ${y + 92} Z`} fill="var(--paper-shadow)" opacity=".35" transform="translate(8 10)" />
<path d={`M${x - 44 * s} ${y - 94} L${x + 34 * s} ${y - 2} L${x - 38 * s} ${y + 92} Z`} fill="var(--prism)" stroke="var(--prism-edge)" stroke-width="5" stroke-linejoin="round" />
<path d={`M${x - 37 * s} ${y - 74} L${x + 12 * s} ${y - 2} L${x - 35 * s} ${y + 68} Z`} fill="var(--prism-fold)" opacity=".45" />
