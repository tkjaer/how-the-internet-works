<svelte:options namespace="svg" />
<script lang="ts">
  import type { RingsProps } from '../../../core/theme-types';
  let { cx, cy, rings, time }: RingsProps = $props();
  const rot = $derived(time * 28);
</script>

<g class="radar" transform="translate({cx} {cy})">
  <path d="M0 0L380 0" transform="rotate({rot})" stroke="#3ef0ff" stroke-width="6" stroke-opacity="0.12" stroke-linecap="round" />
  {#each rings as r}
    <circle r={r.r} opacity={r.alpha} fill="none" stroke="#3ef0ff" stroke-width="12" stroke-opacity="0.08" />
    <circle r={r.r} opacity={r.alpha} fill="none" stroke="#3ef0ff" stroke-width="4" stroke-dasharray="18 18" />
  {/each}
</g>
