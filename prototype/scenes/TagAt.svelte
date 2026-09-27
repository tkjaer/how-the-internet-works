<svelte:options namespace="svg" />
<script lang="ts">
  // Nerd-mode callout, drawn by the theme's Tag slot with a clamped size.
  import { loc, themeState, tr, view } from '../state.svelte';
  import { getScene, getWorld } from './ctx';
  let { x, y, k: key, size = 20, anchor = 'middle' }: { x: number; y: number; k: string; size?: number; anchor?: 'start' | 'middle' | 'end' } = $props();
  const world = getWorld(), scene = getScene();
  const px = $derived(Math.max(size, (themeState.current.labelMinPx * 0.85) / (world.cam.k * scene.scale)));
  const Tag = $derived(themeState.current.art.Tag);
</script>

{#if loc.level === 'nerd'}
  <!-- callouts are technical (Latin, numbers): keep them LTR so "5 GHz" doesn't get reordered in RTL -->
  <g direction="ltr"><Tag {x} {y} text={tr(key)} size={px} {anchor} time={view.time} /></g>
{/if}
