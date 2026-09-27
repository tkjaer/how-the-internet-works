<svelte:options namespace="svg" />
<script lang="ts">
  import type { LinkProps } from '../../core/theme-types';
  let { link, d, colour, focused }: LinkProps = $props();
</script>

<g class="link link-{link.tech}" class:focused>
  <path {d} fill="none" stroke={colour} stroke-width={link.tech === 'wifi' ? 8 : 10} stroke-linecap="round"
    stroke-dasharray={link.tech === 'wifi' ? '2 18' : link.dashed ? '14 14' : undefined} />
</g>
