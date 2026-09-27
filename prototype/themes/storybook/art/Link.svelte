<svelte:options namespace="svg" />
<script lang="ts">
  import type { LinkProps } from '../../../core/theme-types';
  let { link, d, colour, time, focused }: LinkProps = $props();
  const dash = $derived((-time * 34).toFixed(1));
</script>

<g class="storybook-link link-{link.tech}" class:focused>
  {#if focused}<path {d} fill="none" stroke="#fff4c5" stroke-width={link.tech === 'backbone' ? 38 : 24} stroke-linecap="round" stroke-linejoin="round" opacity="0.8" />{/if}
  {#if link.tech === 'wifi'}
    <path {d} fill="none" stroke="#6b3f2a" stroke-width="18" stroke-linecap="round" stroke-dasharray="1 25" stroke-dashoffset={dash} />
    <path {d} fill="none" stroke="#f28f5b" stroke-width="12" stroke-linecap="round" stroke-dasharray="1 25" stroke-dashoffset={dash} />
    <path {d} fill="none" stroke="#72b8a5" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 25" stroke-dashoffset={Number(dash) - 11} />
    <path {d} fill="none" stroke="#ffcf5d" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 25" stroke-dashoffset={Number(dash) - 22} />
  {:else if link.tech === 'ethernet'}
    <path {d} fill="none" stroke="#6b3f2a" stroke-width="19" stroke-linecap="round" />
    <path {d} fill="none" stroke="#e78d44" stroke-width="13" stroke-linecap="round" />
    <path {d} fill="none" stroke="#ffd89c" stroke-width="4" stroke-linecap="round" opacity="0.65" />
    <circle cx={link.p0.x} cy={link.p0.y} r="13" fill="#ffd89c" stroke="#6b3f2a" stroke-width="5" />
    <circle cx={link.p1.x} cy={link.p1.y} r="13" fill="#ffd89c" stroke="#6b3f2a" stroke-width="5" />
  {:else if link.tech === 'fibre'}
    <path {d} fill="none" stroke="#6b3f2a" stroke-width="14" stroke-linecap="round" />
    <path {d} fill="none" stroke={colour} stroke-width="8" stroke-linecap="round" />
    <path {d} fill="none" stroke="#fff7df" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="28 18" stroke-dashoffset={-time * 55} opacity="0.9" />
  {:else}
    <path {d} fill="none" stroke="#6b3f2a" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" />
    <path {d} fill="none" stroke="#dcb071" stroke-width="21" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray={link.dashed ? '28 18' : undefined} />
    <path {d} fill="none" stroke="#fff7df" stroke-width="4" stroke-linecap="round" stroke-dasharray="24 22" opacity="0.85" />
  {/if}
</g>
