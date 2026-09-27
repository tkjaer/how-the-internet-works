<svelte:options namespace="svg" />
<script lang="ts">
  import type { PrismProps } from '../../../core/theme-types';
  let { x, y, kind, time }: PrismProps = $props();
  const s = $derived(kind === 'mux' ? 1 : -1);
  const tick = $derived(0.35 + 0.25 * Math.sin(time * 3));
</script>

<g class="prism">
  <path class="glow" d="M{x - 45 * s} {y - 96} L{x + 36 * s} {y} L{x - 45 * s} {y + 96} Z" />
  <path class="face" d="M{x - 40 * s} {y - 90} L{x + 30 * s} {y} L{x - 40 * s} {y + 90} Z" />
  <path class="wire" d="M{x - 28 * s} {y - 58}L{x + 16 * s} {y}L{x - 28 * s} {y + 58}M{x - 40 * s} {y - 90}L{x - 28 * s} {y - 58}M{x - 40 * s} {y + 90}L{x - 28 * s} {y + 58}" opacity={tick} />
</g>

<style>
  .glow { fill: none; stroke: #ff4fe9; stroke-width: 18; stroke-linejoin: round; opacity: .08; }
  .face { fill: rgba(255,255,255,.035); stroke: #e9fbff; stroke-width: 5; stroke-linejoin: round; }
  .wire { fill: none; stroke: #3ef0ff; stroke-width: 2.8; stroke-linejoin: round; }
</style>
