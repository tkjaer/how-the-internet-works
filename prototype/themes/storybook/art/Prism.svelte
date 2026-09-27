<svelte:options namespace="svg" />
<script lang="ts">
  import type { PrismProps } from '../../../core/theme-types';
  let { x, y, kind, time }: PrismProps = $props();
  const s = $derived(kind === 'mux' ? 1 : -1);
  const bob = $derived(Math.sin(time * 1.2 + x * 0.01) * 3);
</script>

<g transform="translate(0 {bob})">
  <path d={`M${x - 42 * s} ${y - 92} L${x + 34 * s} ${y} L${x - 42 * s} ${y + 92} Z`} fill="#d7f0ee" stroke="#6b3f2a" stroke-width="6" stroke-linejoin="round" />
  <path d={`M${x - 20 * s} ${y - 48} L${x + 16 * s} ${y} L${x - 20 * s} ${y + 48}`} fill="none" stroke="#fff7df" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.78" />
  <circle cx={x - 24 * s} cy={y - 45} r="6" fill="#ffcf5d" />
</g>
