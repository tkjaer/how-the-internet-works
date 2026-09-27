<svelte:options namespace="svg" />
<script lang="ts">
  import type { RouteProps } from '../../../core/theme-types';
  import { pts } from '../../../core/svg';
  let { points, colour }: RouteProps = $props();
</script>

<polyline points={pts(points)} fill="none" stroke="var(--paper-shadow)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".18" transform="translate(5 6)" />
<polyline points={pts(points)} fill="none" stroke={colour} stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".45" />
