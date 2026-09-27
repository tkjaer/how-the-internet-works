<svelte:options namespace="svg" />
<script lang="ts">
  import type { PulseProps } from '../../../core/theme-types';
  import { pts } from '../../../core/svg';
  let { head, trail, colour, channel }: PulseProps = $props();
</script>

<g class="pulse pulse-{channel}">
  <polyline points={pts(trail)} fill="none" stroke="#6b3f2a" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" opacity="0.38" />
  <polyline points={pts(trail)} fill="none" stroke={colour} stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.88" />
  <circle cx={head.x} cy={head.y} r="14" fill="#fff7df" stroke="#6b3f2a" stroke-width="4" />
  <circle cx={head.x} cy={head.y} r="7" fill={colour} />
</g>
