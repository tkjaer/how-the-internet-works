<svelte:options namespace="svg" />
<script lang="ts">
  // A child scene nested at DETAIL_SCALE inside the overview, framed by the theme's Panel.
  import type { Snippet } from 'svelte';
  import { DETAIL_SCALE, childRect, world, type ChildId } from '../core/scene';
  import { themeState, view } from '../state.svelte';
  import { setScene } from './ctx';
  let { id, opacity, children }: { id: ChildId; opacity: number; children: Snippet } = $props();
  const r = $derived((void view.orient, childRect(id)));
  const W = $derived(world(view.orient));
  const A = $derived(themeState.current.art);
  const clip = $derived(`clip-${id}`);
  setScene({ get id() { return id; }, scale: DETAIL_SCALE });
</script>

<g class="nested nested-{id}" transform="translate({r.x} {r.y}) scale({DETAIL_SCALE})" {opacity}>
  <clipPath id={clip}><rect width={W.w} height={W.h} rx="60" /></clipPath>
  <g clip-path="url(#{clip})">
    <A.Panel scene={id} part="back" w={W.w} h={W.h} orient={view.orient} time={view.time} />
    {@render children()}
  </g>
  <A.Panel scene={id} part="edge" w={W.w} h={W.h} orient={view.orient} time={view.time} />
</g>
