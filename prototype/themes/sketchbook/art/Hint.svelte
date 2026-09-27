<svelte:options namespace="svg" />
<script lang="ts">
  import type { HintProps } from '../../../core/theme-types';
  import Rough from './Rough.svelte';
  import { boilFrame, rcircle, sketchCircle } from './rough';
  let { kind, x, y, time }: HintProps = $props();
  const f = $derived((time / 1.7) % 1);
  const frame = $derived(boilFrame(time));
</script>

<g class="hint" transform="translate({x} {y})" pointer-events="none">
  <polyline points={sketchCircle(0, 0, 23 + 26 * f, frame, 1.4)} fill="none" stroke="var(--highlighter-blue)" stroke-width="5" opacity={0.45 * (1 - f)} stroke-linecap="round" stroke-linejoin="round" />
  <Rough paths={rcircle(`hint-${kind}`, 0, 0, 26, time, { stroke: 'var(--pencil)', strokeWidth: 4, fill: 'var(--paper)', fillStyle: 'hachure', hachureGap: 11 })} />
  {#if kind === 'dive'}
    <polyline points={sketchCircle(-4, -4, 8, frame, .9, 24)} fill="none" stroke="var(--ink-blue)" stroke-width="4" />
    <path d="M3 3 L13 13" stroke="var(--ink-blue)" stroke-width="5" stroke-linecap="round" />
  {:else}
    <path d="M-15 0 H-4 M-15 0 L-8 -7 M-15 0 L-8 7 M15 0 H4 M15 0 L8 -7 M15 0 L8 7" fill="none" stroke="var(--ink-blue)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
  {/if}
</g>
