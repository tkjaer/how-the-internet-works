<svelte:options namespace="svg" />
<script lang="ts">
  import type { OverlayProps } from '../../../core/theme-types';
  let { w, h }: OverlayProps = $props();
</script>

<defs>
  <pattern id="papercut-fibre" width="18" height="18" patternUnits="userSpaceOnUse">
    <path d="M1 3 H8 M11 15 H17 M4 11 H6" stroke="var(--grain)" stroke-width="1" opacity=".42" />
    <circle cx="14" cy="5" r=".8" fill="var(--grain)" opacity=".25" />
  </pattern>
  <radialGradient id="papercut-vignette" cx="50%" cy="45%" r="72%">
    <stop offset="55%" stop-color="#fff6db" stop-opacity="0" />
    <stop offset="100%" stop-color="#412f20" stop-opacity=".14" />
  </radialGradient>
</defs>
<rect width={w} height={h} fill="url(#papercut-fibre)" opacity=".28" pointer-events="none" />
<rect width={w} height={h} fill="url(#papercut-vignette)" pointer-events="none" />
