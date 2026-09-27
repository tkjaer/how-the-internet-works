<svelte:options namespace="svg" />
<script lang="ts">
  import type { OverlayProps } from '../../../core/theme-types';
  let { w, h }: OverlayProps = $props();
</script>

<g pointer-events="none" aria-hidden="true">
  <rect width={w} height={h} fill="url(#sketch-grain)" opacity="0.75" />
  <rect width={w} height={h} fill="none" stroke="rgba(77,67,55,.18)" stroke-width="2" />
</g>
