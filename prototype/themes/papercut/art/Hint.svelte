<svelte:options namespace="svg" />
<script lang="ts">
  import type { HintProps } from '../../../core/theme-types';
  let { kind, x, y, time }: HintProps = $props();
  const pulse = $derived(1 + Math.sin(time * 2.4) * 0.04);
</script>

<g class="hint" transform="translate({x} {y}) scale({pulse})" pointer-events="none">
  <circle r="28" class="badge-shadow" />
  <path class="badge" d="M-28 -21 C-12 -31 16 -28 30 -9 C30 10 16 27 -4 30 C-23 26 -33 9 -28 -21 Z" />
  {#if kind === 'dive'}
    <circle cx="-5" cy="-5" r="10" fill="none" stroke="var(--hint-ink)" stroke-width="5" />
    <path d="M4 4 L15 15" stroke="var(--hint-ink)" stroke-width="6" stroke-linecap="round" />
    <circle cx="-5" cy="-5" r="4" fill="var(--hint-hole)" />
  {:else}
    <path d="M-17 -11 L-2 -11 L-2 11 L-17 11 Z M-2 -11 L10 -4 L10 18 L-2 11 Z M10 -4 L21 -11 L21 11 L10 18 Z" fill="none" stroke="var(--hint-ink)" stroke-width="4" stroke-linejoin="round" />
    <path d="M-2 -11 L-2 11 M10 -4 L10 18" stroke="var(--hint-fold)" stroke-width="2.5" />
  {/if}
</g>

<style>
  .badge-shadow { fill: var(--paper-shadow); transform: translate(7px, 8px); opacity: .42; }
  .badge { fill: var(--paper-mustard); stroke: var(--paper-cream); stroke-width: 4; stroke-linejoin: round; }
</style>
