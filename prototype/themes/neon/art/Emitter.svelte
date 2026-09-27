<svelte:options namespace="svg" />
<script lang="ts">
  import type { EmitterProps } from '../../../core/theme-types';
  let { x, y, kind, colour, time }: EmitterProps = $props();
  const blink = $derived(0.45 + 0.55 * Math.sin(time * 5 + y * 0.01) ** 2);
</script>

<g class="emitter">
  <rect class="glow" x={x - 44} y={y - 36} width="88" height="72" rx="14" stroke={colour} />
  <rect class="box" x={x - 40} y={y - 32} width="80" height="64" rx="12" />
  <path class="vents" d="M{x - 24} {y - 14}H{x + 8}M{x - 24} {y}H{x + 3}M{x - 24} {y + 14}H{x + 12}" />
  {#if kind === 'laser'}
    <circle cx={x + 24} cy={y} r="14" fill={colour} opacity={blink} />
    <path class="beam" d="M{x + 38} {y}H{x + 68}" stroke={colour} opacity={blink} />
  {:else}
    <circle cx={x - 18} cy={y} r="16" fill="none" stroke={colour} stroke-width="5" opacity={blink} />
    <circle cx={x - 18} cy={y} r="5" fill="#fff" opacity={blink} />
  {/if}
</g>

<style>
  .glow { fill: none; stroke-width: 14; opacity: .08; }
  .box { fill: url(#neon-glass); stroke: var(--box-edge, #87f8ff); stroke-width: 4; }
  .vents { fill: none; stroke: #87f8ff; stroke-width: 3; stroke-linecap: round; opacity: .58; }
  .beam { stroke-width: 7; stroke-linecap: round; }
</style>
