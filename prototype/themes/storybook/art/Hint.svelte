<svelte:options namespace="svg" />
<script lang="ts">
  import type { HintProps } from '../../../core/theme-types';
  let { kind, x, y, time }: HintProps = $props();
  const bob = $derived(Math.sin(time * 2.1 + (kind === 'dive' ? 0 : 1)) * 4);
  const pulse = $derived((time / 1.8) % 1);
</script>

<g class="hint" transform="translate({x} {y + bob})" pointer-events="none">
  <circle r={23 + 18 * pulse} fill="none" stroke="#fff3c6" stroke-width="5" opacity={0.55 * (1 - pulse)} />
  <circle r="24" fill={kind === 'dive' ? '#72b8a5' : '#f28f5b'} stroke="#6b3f2a" stroke-width="5" />
  {#if kind === 'dive'}
    <circle cx="-4" cy="-5" r="8" fill="none" stroke="#fff7df" stroke-width="4" />
    <path d="M3 3 L11 11" stroke="#fff7df" stroke-width="5" stroke-linecap="round" />
  {:else}
    <path d="M-10 -9 H5 A7 7 0 0 1 12 -2 V12 H-10 Z" fill="none" stroke="#fff7df" stroke-width="4" stroke-linejoin="round" />
    <path d="M-2 -2 L-10 -9 M-2 -2 L10 -9 M-2 -2 V11" stroke="#fff7df" stroke-width="3.5" stroke-linecap="round" />
  {/if}
</g>
