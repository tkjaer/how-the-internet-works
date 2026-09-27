<svelte:options namespace="svg" />
<script lang="ts">
  import type { RouteProps } from '../../core/theme-types';
  import { pts } from '../../core/svg';
  let { points, colour }: RouteProps = $props();
</script>

<polyline points={pts(points)} fill="none" stroke={colour} stroke-width="3" opacity=".2" stroke-linejoin="round" />
