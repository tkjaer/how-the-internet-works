<svelte:options namespace="svg" />
<script lang="ts">
  import type { BackdropProps } from '../../../core/theme-types';
  import Depth from '../../../scenes/Depth.svelte';
  let { scene, w, h, time }: BackdropProps = $props();
  const xs = $derived(Array.from({ length: Math.ceil(w / 240) + 1 }, (_, i) => i * 240));
  const ys = $derived(Array.from({ length: Math.ceil(h / 240) + 1 }, (_, i) => i * 240));
  const sweep = $derived(((time * 42) % (w + 360)) - 180);
</script>

<rect x={-w} y={-h} width={w * 3} height={h * 3} fill="var(--scene-bg, #020613)" />
<Depth d={0.6}>
  <g opacity="0.42">
    <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="url(#neon-grid-minor)" />
    <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="url(#neon-grid-major)" />
  </g>
</Depth>
<rect x="0" y="0" width={w} height={h} fill="url(#neon-grid-minor)" opacity="0.55" />
<rect x="0" y="0" width={w} height={h} fill="url(#neon-grid-major)" opacity="0.75" />
<line x1={sweep} y1="0" x2={sweep + 210} y2={h} stroke="#51f5ff" stroke-width="3" stroke-opacity="0.08" />

{#each xs as x}
  {#each ys as y}
    <g class="reg" transform="translate({x} {y})">
      <path d="M-18 0H-7M7 0H18M0 -18V-7M0 7V18" />
      <circle r="2.5" />
    </g>
  {/each}
{/each}

<g class="hud-frame" opacity={scene === 'overview' ? 0.85 : 0.62}>
  <path d="M34 104V34H104M{w - 34} 104V34H{w - 104}M34 {h - 104}V{h - 34}H104M{w - 34} {h - 104}V{h - 34}H{w - 104}" />
  <path d="M{w / 2 - 46} 46H{w / 2 + 46}M{w / 2} 22V70M{w / 2 - 46} {h - 46}H{w / 2 + 46}M{w / 2} {h - 22}V{h - 70}" opacity="0.75" />
</g>

<style>
  .reg path { fill: none; stroke: #52f4ff; stroke-width: 1.5; stroke-opacity: 0.18; vector-effect: non-scaling-stroke; }
  .reg circle { fill: #52f4ff; opacity: 0.14; }
  .hud-frame path { fill: none; stroke: #66f6ff; stroke-width: 5; stroke-linecap: square; stroke-linejoin: miter; opacity: 0.45; }
</style>
