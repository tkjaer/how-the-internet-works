<svelte:options namespace="svg" />
<script lang="ts">
  import type { PanelProps } from '../../core/theme-types';
  let { part, w, h }: PanelProps = $props();
</script>

{#if part === 'back'}
  <rect width={w} height={h} fill="var(--panel-bg, #0b1140)" />
{:else}
  <rect width={w} height={h} rx="60" fill="none" stroke="var(--panel-edge, #3a47a8)" stroke-width="6" />
{/if}
