<svelte:options namespace="svg" />
<script lang="ts">
  import type { BitProps } from '../../../core/theme-types';
  import { boilFrame, sketchCircle } from './rough';
  let { x, y, bit, alpha, stem, time, colour }: BitProps = $props();
  const frame = $derived(boilFrame(time));
</script>

<g opacity={alpha}>
  <line x1={stem[0].x} y1={stem[0].y} x2={stem[1].x} y2={stem[1].y} stroke="var(--pencil)" stroke-width="3" stroke-dasharray="5 9" opacity=".45" />
  <polyline points={sketchCircle(x, y, 32, frame, 2)} fill="var(--paper-panel)" stroke={colour} stroke-width="5" stroke-linejoin="round" />
  <polyline points={sketchCircle(x + 1, y - 1, 27, frame + 1, 1.4)} fill="none" stroke="var(--pencil)" stroke-width="2" opacity=".42" />
  <text class="bit-digit" {x} {y} fill="var(--pencil)" font-size="42" text-anchor="middle" dominant-baseline="central">{bit}</text>
</g>
