<svelte:options namespace="svg" />
<script lang="ts">
  import type { PulseProps } from '../../../core/theme-types';
  import { pts } from '../../../core/svg';
  let { head, trail, colour }: PulseProps = $props();
</script>

<polyline points={pts(trail)} fill="none" stroke={colour} stroke-width="14" stroke-linecap="round" stroke-linejoin="round" opacity=".62" />
<circle cx={head.x + 5} cy={head.y + 6} r="12" fill="var(--paper-shadow)" opacity=".28" />
<circle cx={head.x} cy={head.y} r="11" fill="var(--pulse-paper)" stroke={colour} stroke-width="5" />
