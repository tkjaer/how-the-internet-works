<svelte:options namespace="svg" />
<script lang="ts">
  import type { FibreProps } from '../../../core/theme-types';
  let { x0, x1, y, coreH, cladH, time }: FibreProps = $props();
  const twinkle = $derived((time * 70) % 120);
</script>

<rect x={x0} y={y - cladH / 2} width={x1 - x0} height={cladH} rx={cladH / 2} fill="#d9f0e9" stroke="#6b3f2a" stroke-width="6" />
<rect x={x0 + 12} y={y - coreH / 2} width={x1 - x0 - 24} height={coreH} rx={coreH / 2} fill="#fff7df" stroke="#72b8a5" stroke-width="5" />
<path d={`M${x0 + 34} ${y - coreH * 0.22} H${x1 - 34}`} stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.72" />
{#each [0,1,2,3,4] as i}
  <path d={`M${x0 + 120 + i * 260 + twinkle} ${y - coreH * 0.52} l10 10 l-10 10 l-10 -10 Z`} fill="#ffcf5d" stroke="#6b3f2a" stroke-width="2" opacity="0.72" />
{/each}
