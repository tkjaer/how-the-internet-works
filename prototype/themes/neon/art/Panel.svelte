<svelte:options namespace="svg" />
<script lang="ts">
  import type { PanelProps } from '../../../core/theme-types';
  let { part, w, h, time }: PanelProps = $props();
  const scan = $derived((time * 95) % (w + 260) - 130);
</script>

{#if part === 'back'}
  <rect width={w} height={h} fill="var(--panel-bg, #030816)" />
  <rect width={w} height={h} fill="url(#neon-panel-grid)" opacity="0.9" />
  <line x1={scan} y1="0" x2={scan + 180} y2={h} stroke="#3ef0ff" stroke-opacity="0.09" stroke-width="5" />
  <g class="scope" opacity="0.18">
    <path d="M{w / 2 - 70} {h / 2}H{w / 2 + 70}M{w / 2} {h / 2 - 70}V{h / 2 + 70}" />
    <circle cx={w / 2} cy={h / 2} r="96" />
  </g>
{:else}
  <rect x="9" y="9" width={w - 18} height={h - 18} rx="54" fill="none" stroke="#163e6f" stroke-width="18" opacity="0.35" />
  <rect x="10" y="10" width={w - 20} height={h - 20} rx="54" fill="none" stroke="var(--panel-edge, #3ef0ff)" stroke-width="5" opacity="0.72" />
  <g class="notches">
    <path d="M48 118V48H118M{w - 48} 118V48H{w - 118}M48 {h - 118}V{h - 48}H118M{w - 48} {h - 118}V{h - 48}H{w - 118}" />
    <path d="M{w / 2 - 42} 28H{w / 2 + 42}M{w / 2} 18V42M{w / 2 - 42} {h - 28}H{w / 2 + 42}M{w / 2} {h - 18}V{h - 42}" opacity="0.65" />
  </g>
{/if}

<style>
  .scope path, .scope circle { fill: none; stroke: #51f5ff; stroke-width: 3; }
  .notches path { fill: none; stroke: #8ffbff; stroke-width: 8; stroke-linecap: square; stroke-linejoin: miter; opacity: 0.68; }
</style>
