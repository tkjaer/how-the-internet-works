<svelte:options namespace="svg" />
<script lang="ts">
  import type { LinkProps } from '../../../core/theme-types';
  import { bezier, bezierAngle } from '../../../core/scene';
  import Rough from './Rough.svelte';
  import { rpath } from './rough';
  let { link, d, colour, time, focused }: LinkProps = $props();
  const wifiMarks = $derived([0.2, 0.36, 0.52, 0.68, 0.84].map((t, i) => {
    const p = bezier(link, t);
    return { ...p, i, deg: (bezierAngle(link, t) * 180) / Math.PI };
  }));
</script>

<g class="link link-{link.tech}" class:focused>
  {#if focused}
    <Rough opacity={0.55} paths={rpath(`link-focus-${link.id}`, d, time, { stroke: 'var(--highlighter-yellow)', strokeWidth: 22, fill: 'none', roughness: 2.4 })} />
  {/if}
  {#if link.tech === 'wifi'}
    <path {d} fill="none" stroke="var(--highlighter-blue)" stroke-width="13" stroke-linecap="round" stroke-dasharray="1 25" opacity=".42" />
    <path {d} fill="none" stroke={colour} stroke-width="5" stroke-linecap="round" stroke-dasharray="1 19" opacity=".95" />
    {#each wifiMarks as m}
      <g transform="translate({m.x} {m.y}) rotate({m.deg})" opacity={0.72 - Math.abs(m.i - 2) * 0.06}>
        <path d="M-17 -7 Q-7 -17 4 -7 T25 -7" fill="none" stroke={colour} stroke-width="3.2" stroke-linecap="round" />
        <path d="M-11 7 Q-1 -2 10 7 T27 7" fill="none" stroke="var(--pencil)" stroke-width="2" stroke-linecap="round" opacity=".42" />
      </g>
    {/each}
  {:else if link.tech === 'ethernet'}
    <Rough opacity={0.55} paths={rpath(`eth-shadow-${link.id}`, d, time, { stroke: 'var(--shadow)', strokeWidth: 13, fill: 'none' })} />
    <Rough paths={rpath(`eth-${link.id}`, d, time, { stroke: 'var(--pencil)', strokeWidth: 9, fill: 'none', roughness: 1.7 })} />
    <path {d} fill="none" stroke={colour} stroke-width="3" stroke-linecap="round" stroke-dasharray="8 16" opacity=".72" />
  {:else if link.tech === 'fibre'}
    <g opacity=".95">
      <Rough paths={rpath(`fibre-a-${link.id}`, d, time, { stroke: colour, strokeWidth: 5, fill: 'none', roughness: 1.9 })} />
      <g transform="translate(0 8)"><Rough paths={rpath(`fibre-b-${link.id}`, d, time, { stroke: 'var(--highlighter-blue)', strokeWidth: 4, fill: 'none', roughness: 1.9 })} /></g>
      <g transform="translate(0 -8)"><Rough opacity={0.65} paths={rpath(`fibre-c-${link.id}`, d, time, { stroke: 'var(--crayon-green)', strokeWidth: 3, fill: 'none', roughness: 1.9 })} /></g>
    </g>
  {:else}
    <Rough paths={rpath(`backbone-${link.id}`, d, time, { stroke: 'var(--marker)', strokeWidth: 14, fill: 'none', roughness: 1.35, strokeLineDash: link.dashed ? [18, 18] : undefined })} />
    <path {d} fill="none" stroke={colour} stroke-width="4" stroke-linecap="round" stroke-dasharray={link.dashed ? '18 18' : undefined} opacity=".9" />
  {/if}
</g>
