<svelte:options namespace="svg" />
<script lang="ts">
  import type { RouteProps } from '../../../core/theme-types';
  import { jitterPts } from './rough';
  let { points, colour, channel }: RouteProps = $props();
</script>

<polyline points={jitterPts(points, channel + 2, 1.2)} fill="none" stroke={colour} stroke-width="4" opacity=".28" stroke-linejoin="round" stroke-linecap="round" />
