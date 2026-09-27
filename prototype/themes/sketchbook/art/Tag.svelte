<svelte:options namespace="svg" />
<script lang="ts">
  import type { TagProps } from '../../../core/theme-types';
  import { textBox } from '../../../core/svg';
  import Rough from './Rough.svelte';
  import { rline, rrect } from './rough';
  let { x, y, text, size, anchor, time }: TagProps = $props();
  const b = $derived(textBox(text, size, anchor, 0.6));
  const pad = $derived(size * 0.38);
  const boxX = $derived(b.x - pad);
  const boxY = $derived(-size * 1.08);
  const boxW = $derived(b.w + pad * 2);
  const boxH = $derived(size * 1.5);
  const dir = $derived(anchor === 'start' ? -1 : anchor === 'end' ? 1 : 0);
  const ax = $derived(dir === 0 ? 0 : b.x + (dir < 0 ? 0 : b.w));
  const tx = $derived(ax + (dir || 1) * 54);
</script>

<g class="tag" transform="translate({x} {y})">
  <Rough opacity={0.88} paths={rrect(`tag-${text}-${size}-${anchor}`, boxX, boxY, boxW, boxH, size * 0.12, time, { stroke: 'var(--tape-edge)', strokeWidth: size * 0.055, fill: 'var(--tag-paper)', fillStyle: 'hachure', hachureGap: size * 0.42 })} />
  <text class="tag-text" font-size={size} text-anchor={anchor} fill="var(--tag-ink)" y="0">{text}</text>
  <Rough paths={rline(`tag-arrow-${text}-${size}-${anchor}`, ax, size * 0.28, tx, size * 1.26, time, { stroke: 'var(--pencil)', strokeWidth: size * 0.08 })} />
  <path d="M{tx} {size * 1.26} l{-(dir || 1) * 13} {-size * 0.18} m{(dir || 1) * 13} {size * 0.18} l{-(dir || 1) * 5} {-size * 0.34}" fill="none" stroke="var(--pencil)" stroke-width={size * 0.08} stroke-linecap="round" stroke-linejoin="round" />
</g>
