<svelte:options namespace="svg" />
<script lang="ts">
  import type { PulseProps } from '../../core/theme-types';
  import { pts } from '../../core/svg';
  let { head, trail, colour }: PulseProps = $props();
</script>

<polyline points={pts(trail)} fill="none" stroke={colour} stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity=".85" />
<circle cx={head.x} cy={head.y} r="10" fill="#fff" />
