<svelte:options namespace="svg" />
<script lang="ts">
  import type { BitProps } from '../../../core/theme-types';
  let { x, y, bit, alpha, stem, colour, time }: BitProps = $props();
  const bob = $derived(Math.sin(time * 3 + x * 0.01) * 2);
</script>

<g opacity={alpha} transform="translate(0 {bob})">
  <line x1={stem[0].x} y1={stem[0].y} x2={stem[1].x} y2={stem[1].y} stroke="#6b3f2a" stroke-width="4" stroke-dasharray="4 9" opacity="0.35" />
  <circle cx={x + 4} cy={y + 5} r="33" fill="#d9a66b" opacity="0.3" />
  <circle {x} {y} r="33" fill="#fff7df" stroke="#6b3f2a" stroke-width="5" />
  <circle {x} {y} r="25" fill={colour} opacity="0.88" />
  <path d={`M${x - 11} ${y - 17} Q${x} ${y - 28} ${x + 13} ${y - 17}`} stroke="#fff7df" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.75" />
  <text class="bit-digit" {x} y={y + 1} fill="#6b3f2a" font-size="36" font-weight="800" text-anchor="middle" dominant-baseline="central">{bit}</text>
</g>
