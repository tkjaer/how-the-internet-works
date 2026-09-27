<svelte:options namespace="svg" />
<script lang="ts">
  import type { RouteProps } from '../../../core/theme-types';
  import { pts } from '../../../core/svg';
  let { points, colour }: RouteProps = $props();
</script>

<polyline points={pts(points)} fill="none" stroke="#6b3f2a" stroke-width="7" opacity="0.20" stroke-linejoin="round" stroke-linecap="round" />
<polyline points={pts(points)} fill="none" stroke={colour} stroke-width="4" opacity="0.35" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="14 14" />
