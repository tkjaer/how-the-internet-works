<svelte:options namespace="svg" />
<script lang="ts">
  import type { RingsProps } from '../../core/theme-types';
  let { cx, cy, rings }: RingsProps = $props();
</script>

{#each rings as r}<circle {cx} {cy} r={r.r} opacity={r.alpha} fill="none" stroke="var(--wave, #3ef0ff)" stroke-width="5" />{/each}
