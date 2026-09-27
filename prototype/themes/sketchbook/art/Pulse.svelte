<svelte:options namespace="svg" />
<script lang="ts">
  import type { PulseProps } from '../../../core/theme-types';
  import { boilFrame, jitterPts, sketchCircle } from './rough';
  let { head, trail, channel, colour, time }: PulseProps = $props();
  const frame = $derived(boilFrame(time) + channel);
</script>

<polyline points={jitterPts(trail, frame, 1.5)} fill="none" stroke={colour} stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity=".78" />
<polyline points={jitterPts(trail.filter((_, i) => i % 2 === 0), frame + 2, .9)} fill="none" stroke="var(--paper)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".55" />
<polyline points={sketchCircle(head.x, head.y, 11, frame, 1.1, 22)} fill={colour} stroke="var(--pencil)" stroke-width="2" />
