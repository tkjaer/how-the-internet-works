<svelte:options namespace="svg" />
<script lang="ts">
  import type { PathInfo } from 'roughjs/bin/core';
  let { paths, opacity = 1 }: { paths: PathInfo[]; opacity?: number } = $props();
</script>

<g {opacity}>
  {#each paths as p}
    <path d={p.d} fill={p.fill ?? 'none'} stroke={p.stroke} stroke-width={p.strokeWidth} stroke-linecap="round" stroke-linejoin="round" />
  {/each}
</g>
