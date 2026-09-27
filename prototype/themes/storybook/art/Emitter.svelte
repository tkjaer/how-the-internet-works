<svelte:options namespace="svg" />
<script lang="ts">
  import type { EmitterProps } from '../../../core/theme-types';
  let { x, y, kind, colour, channel }: EmitterProps = $props();
</script>

{#if kind === 'laser'}
  <g class="emitter laser-{channel}">
    <rect x={x - 46} y={y - 35} width="88" height="70" rx="20" fill="#ffd89c" stroke="#6b3f2a" stroke-width="5" />
    <path d={`M${x - 31} ${y - 20} h30`} stroke="#fff7df" stroke-width="6" stroke-linecap="round" opacity="0.7" />
    <circle cx={x + 23} cy={y} r="13" fill={colour} stroke="#6b3f2a" stroke-width="4" />
  </g>
{:else}
  <g class="detector detector-{channel}">
    <path d={`M${x - 42} ${y - 32} H${x + 42} V${y + 18} Q${x + 36} ${y + 34} ${x + 20} ${y + 34} H${x - 22} Q${x - 38} ${y + 34} ${x - 42} ${y + 18} Z`} fill="#72b8a5" stroke="#6b3f2a" stroke-width="5" />
    <circle cx={x - 15} cy={y - 3} r="13" fill="#fff7df" stroke={colour} stroke-width="6" />
  </g>
{/if}
