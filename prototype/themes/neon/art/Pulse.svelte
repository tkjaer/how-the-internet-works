<svelte:options namespace="svg" />
<script lang="ts">
  import type { PulseProps } from '../../../core/theme-types';
  import { pts } from '../../../core/svg';
  let { head, trail, colour }: PulseProps = $props();
</script>

<polyline points={pts(trail)} fill="none" stroke={colour} stroke-width="24" stroke-linecap="round" stroke-linejoin="round" opacity="0.11" />
<polyline points={pts(trail)} fill="none" stroke={colour} stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.78" />
<circle cx={head.x} cy={head.y} r="15" fill={colour} opacity="0.95" />
<circle cx={head.x} cy={head.y} r="5" fill="#fff" />
