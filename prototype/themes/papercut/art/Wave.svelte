<svelte:options namespace="svg" />
<script lang="ts">
  import type { WaveProps } from '../../../core/theme-types';
  let { d }: WaveProps = $props();
</script>

<path class="wave-shadow" {d} fill="none" stroke-linejoin="round" stroke-linecap="round" />
<path class="wave-band" {d} fill="none" stroke-linejoin="round" stroke-linecap="round" />
<path class="wave-crease" {d} fill="none" stroke-linejoin="round" stroke-linecap="round" />

<style>
  .wave-shadow { stroke: var(--paper-shadow); stroke-width: 23; transform: translate(8px, 10px); opacity: .36; }
  .wave-band { stroke: var(--wave); stroke-width: 19; }
  .wave-crease { stroke: var(--wave-centre); stroke-width: 5; stroke-dasharray: 22 18; opacity: .55; }
</style>
