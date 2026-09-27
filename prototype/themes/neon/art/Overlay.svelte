<svelte:options namespace="svg" />
<script lang="ts">
  import type { OverlayProps } from '../../../core/theme-types';
  let { w, h }: OverlayProps = $props();
</script>

<g class="neon-overlay" pointer-events="none">
  <rect width={w} height={h} fill="rgba(0,0,0,0)" />
  <rect width={w} height={h} fill="url(#neon-grid-minor)" opacity="0.018" />
  {#each Array.from({ length: Math.ceil(h / 6) }) as _, i}
    <line x1="0" x2={w} y1={i * 6} y2={i * 6} stroke="#001018" stroke-width="2" opacity="0.13" />
  {/each}
  <rect width={w} height={h} fill="none" stroke="#3ef0ff" stroke-width="2" opacity="0.13" />
  <rect x="0" y="0" width={w} height={h} fill="url(#neon-vignette)" />
</g>
