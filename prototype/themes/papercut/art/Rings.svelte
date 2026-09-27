<svelte:options namespace="svg" />
<script lang="ts">
  import type { RingsProps } from '../../../core/theme-types';
  let { cx, cy, rings }: RingsProps = $props();
</script>

{#each rings as r}
  <circle {cx} {cy} r={r.r} opacity={r.alpha * .65} fill="none" stroke="var(--paper-shadow)" stroke-width="16" transform="translate(9 10)" />
  <circle {cx} {cy} r={r.r} opacity={r.alpha} fill="none" stroke="var(--wave)" stroke-width="12" />
  <circle {cx} {cy} r={Math.max(1, r.r - 9)} opacity={r.alpha * .55} fill="none" stroke="var(--wave-centre)" stroke-width="3" />
{/each}
