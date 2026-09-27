<svelte:options namespace="svg" />
<script lang="ts">
  import type { PrismProps } from '../../core/theme-types';
  let { x, y, kind }: PrismProps = $props();
  const s = $derived(kind === 'mux' ? 1 : -1);
</script>

<path d="M{x - 40 * s} {y - 90} L{x + 30 * s} {y} L{x - 40 * s} {y + 90} Z" fill="var(--prism, rgba(169,184,255,.18))" stroke="var(--prism-edge, #eef1ff)" stroke-width="5" stroke-linejoin="round" />
