<svelte:options namespace="svg" />
<script lang="ts">
  import type { EmitterProps } from '../../../core/theme-types';
  let { x, y, kind, colour }: EmitterProps = $props();
</script>

<g>
  <path class="box-shadow" d={`M${x - 43} ${y - 34} L${x + 43} ${y - 31} L${x + 39} ${y + 35} L${x - 39} ${y + 32} Z`} />
  <path class="box" d={`M${x - 43} ${y - 34} L${x + 43} ${y - 31} L${x + 39} ${y + 35} L${x - 39} ${y + 32} Z`} />
  {#if kind === 'laser'}
    <circle cx={x + 22} cy={y} r="14" fill="var(--pulse-paper)" stroke={colour} stroke-width="5" />
    <path d={`M${x - 28} ${y - 10} L${x + 4} ${y - 9}`} stroke="var(--box-line)" stroke-width="4" stroke-linecap="round" />
  {:else}
    <circle cx={x - 14} cy={y} r="15" fill="none" stroke={colour} stroke-width="6" />
    <path d={`M${x + 10} ${y - 14} L${x + 28} ${y - 14} M${x + 10} ${y} L${x + 28} ${y} M${x + 10} ${y + 14} L${x + 28} ${y + 14}`} stroke="var(--box-line)" stroke-width="4" stroke-linecap="round" />
  {/if}
</g>

<style>
  .box-shadow { fill: var(--paper-shadow); transform: translate(7px, 8px); opacity: .35; }
  .box { fill: var(--box); stroke: var(--box-edge); stroke-width: 4; stroke-linejoin: round; }
</style>
