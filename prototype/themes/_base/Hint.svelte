<svelte:options namespace="svg" />
<script lang="ts">
  import type { HintProps } from '../../core/theme-types';
  let { kind, x, y, time }: HintProps = $props();
  const f = $derived((time / 1.6) % 1);
</script>

<g class="hint" transform="translate({x} {y})" pointer-events="none">
  <circle r={22 + 30 * f} fill="none" stroke="var(--hint, #fff)" stroke-width="3" opacity={0.8 * (1 - f)} />
  <circle r="20" fill="var(--hint-bg, rgba(0,0,0,.5))" stroke="var(--hint, #fff)" stroke-width="4" />
  {#if kind === 'dive'}
    <circle r="8" cx="-3" cy="-3" fill="none" stroke="var(--hint, #fff)" stroke-width="3.5" /><path d="M3 3 L10 10" stroke="var(--hint, #fff)" stroke-width="4" stroke-linecap="round" />
  {:else}
    <path d="M-10 -3 L-10 -10 L-3 -10 M3 10 L10 10 L10 3 M-9 -9 L9 9" fill="none" stroke="var(--hint, #fff)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
  {/if}
</g>
