<svelte:options namespace="svg" />
<script lang="ts">
  import type { EmitterProps } from '../../core/theme-types';
  let { x, y, kind, colour }: EmitterProps = $props();
</script>

{#if kind === 'laser'}
  <rect x={x - 40} y={y - 32} width="80" height="64" rx="16" fill="var(--box, #1c2466)" stroke="var(--box-edge, #a9b8ff)" stroke-width="4" />
  <circle cx={x + 22} cy={y} r="12" fill={colour} />
{:else}
  <rect x={x - 34} y={y - 32} width="80" height="64" rx="16" fill="var(--box, #1c2466)" stroke="var(--box-edge, #a9b8ff)" stroke-width="4" />
  <circle cx={x - 14} cy={y} r="14" fill="none" stroke={colour} stroke-width="6" />
{/if}
