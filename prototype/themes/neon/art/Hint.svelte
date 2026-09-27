<svelte:options namespace="svg" />
<script lang="ts">
  import type { HintProps } from '../../../core/theme-types';
  let { kind, x, y, time }: HintProps = $props();
  const pulse = $derived((time / 1.25) % 1);
  const rot = $derived(time * 65);
</script>

<g class="hint hint-{kind}" transform="translate({x} {y})" pointer-events="none">
  <circle r={26 + pulse * 28} fill="none" stroke="var(--hint, #3ef0ff)" stroke-width="3" opacity={0.35 * (1 - pulse)} />
  <circle r="28" fill="var(--hint-bg, rgba(2,8,22,.84))" stroke="var(--hint, #3ef0ff)" stroke-width="3.5" opacity="0.96" />
  {#if kind === 'dive'}
    <g transform="rotate({rot})">
      {#each Array.from({ length: 12 }) as _, i}
        <line x1="0" y1="-22" x2="0" y2="-18" transform="rotate({i * 30})" />
      {/each}
    </g>
    <circle r="10" cx="-4" cy="-4" fill="none" stroke="var(--hint-hot, #fff6a8)" stroke-width="3" />
    <path d="M3 3L13 13" stroke="var(--hint-hot, #fff6a8)" stroke-width="4" stroke-linecap="round" />
  {:else}
    <path d="M-7 -16H-18V-5M7 -16H18V-5M18 5V16H7M-7 16H-18V5" />
    <path d="M-6 -6L-17 -17M6 -6L17 -17M6 6L17 17M-6 6L-17 17" />
  {/if}
</g>

<style>
  .hint line, .hint path { fill: none; stroke: var(--hint, #3ef0ff); stroke-width: 3.5; stroke-linecap: square; stroke-linejoin: miter; }
  .hint-expand path { stroke: var(--hint-expand, #caff5a); }
</style>
