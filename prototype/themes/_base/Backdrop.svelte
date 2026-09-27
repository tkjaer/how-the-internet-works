<svelte:options namespace="svg" />
<script lang="ts">
  import type { BackdropProps } from '../../core/theme-types';
  let { scene, w, h }: BackdropProps = $props();
</script>

{#if scene === 'overview' || scene === 'internet'}
  <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="var(--scene-bg, #10163e)" />
{/if}
