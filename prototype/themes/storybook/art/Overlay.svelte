<svelte:options namespace="svg" />
<script lang="ts">
  import type { OverlayProps } from '../../../core/theme-types';
  let { w, h }: OverlayProps = $props();
</script>

<defs>
  <pattern id="storybook-paper-grain" width="18" height="18" patternUnits="userSpaceOnUse">
    <circle cx="3" cy="4" r="0.8" fill="#6b3f2a" opacity="0.055" />
    <circle cx="14" cy="9" r="0.7" fill="#6b3f2a" opacity="0.045" />
    <circle cx="8" cy="16" r="0.6" fill="#ffffff" opacity="0.16" />
  </pattern>
</defs>
<rect width={w} height={h} fill="url(#storybook-paper-grain)" pointer-events="none" />
