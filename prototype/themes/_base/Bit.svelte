<svelte:options namespace="svg" />
<script lang="ts">
  import type { BitProps } from '../../core/theme-types';
  let { x, y, bit, alpha, stem, colour }: BitProps = $props();
</script>

<g opacity={alpha}>
  <line x1={stem[0].x} y1={stem[0].y} x2={stem[1].x} y2={stem[1].y} stroke={colour} stroke-width="3" stroke-dasharray="4 8" opacity=".6" />
  <circle cx={x} cy={y} r="34" fill="var(--panel-bg, #0b1140)" stroke={colour} stroke-width="5" />
  <text class="bit-digit" {x} {y} fill={colour} font-size="40" text-anchor="middle" dominant-baseline="central">{bit}</text>
</g>
