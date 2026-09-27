<svelte:options namespace="svg" />
<script lang="ts">
  import type { BitProps } from '../../../core/theme-types';
  let { x, y, bit, alpha, stem, colour }: BitProps = $props();
</script>

<g opacity={alpha} class="bit">
  <line x1={stem[0].x} y1={stem[0].y} x2={stem[1].x} y2={stem[1].y} stroke={colour} stroke-width="3" stroke-dasharray="4 9" opacity="0.42" />
  <path class="glow" d="M{x} {y - 32}L{x + 32} {y}L{x} {y + 32}L{x - 32} {y}Z" stroke={colour} />
  <path class="chip" d="M{x} {y - 27}L{x + 27} {y}L{x} {y + 27}L{x - 27} {y}Z" stroke={colour} />
  <text class="bit-digit" {x} {y} fill={colour} font-size="34" font-weight="800" text-anchor="middle" dominant-baseline="central">{bit}</text>
</g>

<style>
  .glow { fill: none; stroke-width: 15; opacity: 0.1; stroke-linejoin: round; }
  .chip { fill: rgba(2,8,22,.82); stroke-width: 4; stroke-linejoin: round; }
  .bit-digit { font-family: var(--mono-font); paint-order: stroke; stroke: rgba(0,0,0,.7); stroke-width: 5px; }
</style>
