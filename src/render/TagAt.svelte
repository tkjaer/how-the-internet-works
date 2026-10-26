<svelte:options namespace="svg" />
<script lang="ts">
  // Technical-level callout, drawn by the theme's Tag slot with a clamped size. Only shown at the Technical level. With `fit` it
  // keeps inside its panel's frame, as Text does (#136).
  import { WORLD_SIZE } from '../engine/geometry';
  import { perPx } from '../engine/svg';
  import { keepIn, tagReach } from '../model/labels';
  import { loc, themeState, view } from '../state.svelte';
  import { getScene, tagSize } from './ctx';
  let { x, y, text, size = 20, anchor = 'middle', fit = false }: { x: number; y: number; text: string; size?: number; anchor?: 'start' | 'middle' | 'end'; fit?: boolean } = $props();
  const tagPx = tagSize(), scene = getScene();
  const px = $derived(tagPx(size));
  const at = $derived(fit ? keepIn({ x, y }, tagReach(perPx(text, '--tag-font') * px, px, anchor), WORLD_SIZE[view.orient]) : { x, y });
  const Tag = $derived(themeState.current.art.Tag);
</script>

{#if loc.level === 'technical' && text}
  <!-- callouts are technical (Latin, numbers): keep them LTR so "5 GHz" doesn't get reordered in RTL -->
  <g class="tag" direction="ltr"><Tag x={at.x} y={at.y} {text} size={px} {anchor} time={scene.time} /></g>
{/if}
