<svelte:options namespace="svg" />
<script lang="ts">
  import type { BitProps } from '../../../core/theme-types';
  let { x, y, bit, alpha, stem, colour }: BitProps = $props();
</script>

<g opacity={alpha}>
  <path d={`M${stem[0].x} ${stem[0].y} L${stem[1].x} ${stem[1].y}`} fill="none" stroke="var(--paper-shadow)" stroke-width="7" stroke-dasharray="9 14" stroke-linecap="round" opacity=".25" />
  <path d={`M${stem[0].x} ${stem[0].y} L${stem[1].x} ${stem[1].y}`} fill="none" stroke={colour} stroke-width="4" stroke-dasharray="8 15" stroke-linecap="round" opacity=".55" />
  <circle cx={x + 7} cy={y + 8} r="36" fill="var(--paper-shadow)" opacity=".34" />
  <circle {x} {y} r="34" fill="var(--bit-paper)" stroke={colour} stroke-width="5" />
  <text class="bit-digit" {x} {y} fill={colour} font-size="40" text-anchor="middle" dominant-baseline="central">{bit}</text>
</g>
