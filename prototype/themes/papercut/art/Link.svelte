<svelte:options namespace="svg" />
<script lang="ts">
  import type { LinkProps } from '../../../core/theme-types';
  let { link, d, colour, focused }: LinkProps = $props();
  const width = $derived(link.tech === 'wifi' ? 15 : link.tech === 'fibre' ? 11 : link.tech === 'backbone' ? 30 : 20);
  const dash = $derived(link.tech === 'wifi' ? '4 26' : link.dashed ? '34 24' : undefined);
</script>

<g class="link link-{link.tech}" class:focused>
  <path class="paper-shadow" {d} fill="none" stroke-width={width + (focused ? 8 : 4)} stroke-linecap="round" stroke-linejoin="round" stroke-dasharray={dash} />
  <path class="paper-strip" {d} fill="none" stroke={colour} stroke-width={width} stroke-linecap="round" stroke-linejoin="round" stroke-dasharray={dash} />
  {#if link.tech === 'fibre'}
    <path {d} fill="none" stroke="var(--fibre-core)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".9" />
  {:else if link.tech === 'backbone'}
    <path {d} fill="none" stroke="var(--road-centre)" stroke-width="4" stroke-linecap="round" stroke-dasharray="22 24" opacity=".7" />
  {:else if link.tech === 'ethernet'}
    <path {d} fill="none" stroke="var(--ethernet-stitch)" stroke-width="3" stroke-linecap="round" stroke-dasharray="16 16" opacity=".55" />
  {/if}
</g>

<style>
  .paper-shadow { stroke: var(--paper-shadow); transform: translate(8px, 9px); opacity: .38; }
  .paper-strip { vector-effect: non-scaling-stroke; }
  .focused .paper-shadow { transform: translate(14px, 17px); opacity: .5; }
  .focused .paper-strip { stroke: var(--link-focus); }
</style>
