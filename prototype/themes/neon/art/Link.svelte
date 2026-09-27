<svelte:options namespace="svg" />
<script lang="ts">
  import type { LinkProps } from '../../../core/theme-types';
  let { link, d, colour, time, focused }: LinkProps = $props();
  const dash = $derived(link.tech === 'wifi' ? '10 18' : link.dashed ? '22 18' : undefined);
  const offset = $derived(-(time * (focused ? 95 : 55)));
</script>

<g class="link link-{link.tech}" class:focused>
  {#if link.tech === 'wifi'}
    <path {d} fill="none" stroke={colour} stroke-width="24" stroke-linecap="round" stroke-dasharray={dash} stroke-dashoffset={offset} opacity="0.11" />
    <path {d} fill="none" stroke={colour} stroke-width={focused ? 8 : 5} stroke-linecap="round" stroke-dasharray={dash} stroke-dashoffset={offset} opacity={focused ? 1 : 0.78} />
  {:else if link.tech === 'ethernet'}
    <path {d} fill="none" stroke={colour} stroke-width="23" stroke-linecap="round" opacity="0.10" />
    <path {d} fill="none" stroke={colour} stroke-width="4.5" stroke-linecap="round" transform="translate(0 -7)" opacity={focused ? 0.95 : 0.62} />
    <path {d} fill="none" stroke={colour} stroke-width="4.5" stroke-linecap="round" transform="translate(0 7)" opacity={focused ? 0.95 : 0.62} />
    <path {d} fill="none" stroke="#fff6bd" stroke-width="2" stroke-linecap="round" stroke-dasharray="7 18" stroke-dashoffset={offset} opacity={focused ? 0.9 : 0.35} />
  {:else if link.tech === 'fibre'}
    <path {d} fill="none" stroke={colour} stroke-width="28" stroke-linecap="round" opacity="0.10" />
    <path {d} fill="none" stroke={colour} stroke-width={focused ? 10 : 7} stroke-linecap="round" opacity={focused ? 0.95 : 0.72} />
    <path {d} fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-dasharray="52 220" stroke-dashoffset={offset * 1.8} opacity={focused ? 0.95 : 0.48} />
  {:else}
    <path {d} fill="none" stroke={colour} stroke-width="34" stroke-linecap="round" opacity="0.10" />
    <path {d} fill="none" stroke={colour} stroke-width={focused ? 15 : 11} stroke-linecap="round" opacity={focused ? 0.86 : 0.58} stroke-dasharray={link.dashed ? '26 22' : undefined} stroke-dashoffset={offset} />
    <path {d} fill="none" stroke="#caff5a" stroke-width="4" stroke-linecap="butt" stroke-dasharray="18 34" stroke-dashoffset={offset * 1.4} opacity={focused ? 0.9 : 0.42} />
  {/if}
  {#if focused}
    <path {d} fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="80 260" stroke-dashoffset={offset * 2.3} opacity="0.85" />
  {/if}
</g>
