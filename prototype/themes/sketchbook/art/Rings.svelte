<svelte:options namespace="svg" />
<script lang="ts">
  import type { RingsProps } from '../../../core/theme-types';
  import { boilFrame, sketchCircle } from './rough';
  let { cx, cy, rings, time }: RingsProps = $props();
  const frame = $derived(boilFrame(time));
</script>

{#each rings as r, i}
  <polyline points={sketchCircle(cx, cy, r.r, frame + i, 3.2, 54)} fill="none" stroke="var(--pencil)" stroke-width="5" opacity={r.alpha * 0.75} stroke-linecap="round" stroke-linejoin="round" />
  <polyline points={sketchCircle(cx, cy, r.r + 4, frame + i + 1, 2.1, 48)} fill="none" stroke="var(--ink-blue)" stroke-width="2" opacity={r.alpha * 0.65} stroke-linecap="round" stroke-linejoin="round" />
{/each}
