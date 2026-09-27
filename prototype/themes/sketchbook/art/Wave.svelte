<svelte:options namespace="svg" />
<script lang="ts">
  import type { WaveProps } from '../../../core/theme-types';
  import { boilFrame, jitterPts } from './rough';
  let { points, time }: WaveProps = $props();
  const frame = $derived(boilFrame(time));
  const ptsA = $derived(jitterPts(points, frame, 2.8));
  const ptsB = $derived(jitterPts(points.filter((_, i) => i % 2 === 0), frame + 1, 1.6));
</script>

<polyline points={ptsA} fill="none" stroke="var(--pencil)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".84" />
<polyline points={ptsB} fill="none" stroke="var(--ink-blue)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".75" />
