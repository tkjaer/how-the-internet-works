<svelte:options namespace="svg" />
<script lang="ts">
  // A scene label: text from the locale pack, size clamped so it never gets smaller than the theme's
  // labelMinPx on screen (this is what makes the portrait phone layout readable).
  import type { LabelProps } from '../core/theme-types';
  import { themeState, tr } from '../state.svelte';
  import { getScene, getWorld } from './ctx';
  let { x, y, k: key, size, kind = 'node', colour, anchor = 'middle', raw = false }: Omit<LabelProps, 'text' | 'kind'> & { k: string; kind?: LabelProps['kind']; raw?: boolean } = $props();
  const world = getWorld(), scene = getScene();
  const px = $derived(Math.max(size, themeState.current.labelMinPx / (world.cam.k * scene.scale)));
  const Label = $derived(themeState.current.art.Label);
</script>

<Label {x} {y} text={raw ? key : tr(key)} size={px} {kind} {colour} {anchor} />
