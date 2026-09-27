<svelte:options namespace="svg" />
<script lang="ts">
  import type { RouteProps } from '../../../core/theme-types';
  import { pts } from '../../../core/svg';
  let { points, colour }: RouteProps = $props();
</script>

<polyline points={pts(points)} fill="none" stroke={colour} stroke-width="13" opacity="0.08" stroke-linejoin="round" stroke-linecap="round" />
<polyline points={pts(points)} fill="none" stroke={colour} stroke-width="3.5" opacity="0.5" stroke-linejoin="round" stroke-linecap="round" />
