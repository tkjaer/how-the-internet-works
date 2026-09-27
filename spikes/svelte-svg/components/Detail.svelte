<svelte:options namespace="svg" />
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DETAIL_SCALE, WORLD, detailRect, type DetailId } from '../../shared/scene';
  let { id, opacity, children }: { id: DetailId; opacity: number; children: Snippet } = $props();
  const r = $derived(detailRect(id));
</script>

<g class="detail" transform="translate({r.x} {r.y}) scale({DETAIL_SCALE})" {opacity}>
  <g clip-path="url(#panel-clip)">
    <rect class="panel" width={WORLD.w} height={WORLD.h} />
    {@render children()}
  </g>
  <rect class="panel-edge" width={WORLD.w} height={WORLD.h} rx="60" />
</g>
