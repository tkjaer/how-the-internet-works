<svelte:options namespace="svg" />
<script lang="ts">
  import type { TagProps } from '../../../core/theme-types';
  import { textBox } from '../../../core/svg';
  let { x, y, text, size, anchor }: TagProps = $props();
  const b = $derived(textBox(text, size, anchor, 0.6));
  const pad = $derived(size * 0.65);
  const x0 = $derived(b.x - pad * 1.25);
  const y0 = $derived(-size * 1.02);
  const bw = $derived(b.w + pad * 2.2);
  const bh = $derived(size * 1.55);
</script>

<g class="storybook-tag" transform="translate({x} {y})">
  <path d={`M${x0 + size * 0.38} ${y0} H${x0 + bw - size * 0.2} Q${x0 + bw} ${y0} ${x0 + bw} ${y0 + size * 0.28} V${y0 + bh - size * 0.28} Q${x0 + bw} ${y0 + bh} ${x0 + bw - size * 0.28} ${y0 + bh} H${x0 + size * 0.38} L${x0} ${y0 + bh / 2} Z`} fill="var(--tag-bg)" stroke="var(--tag-edge)" stroke-width={Math.max(2, size * 0.11)} stroke-linejoin="round" />
  <circle cx={x0 + size * 0.45} cy={y0 + bh / 2} r={size * 0.16} fill="#fff7df" stroke="var(--tag-edge)" stroke-width={Math.max(1.5, size * 0.06)} />
  <path d={`M${x0 + size * 0.44} ${y0 + bh / 2} q${-size * 0.8} ${-size * 0.5} ${-size * 1.3} ${-size * 0.05}`} fill="none" stroke="#6b3f2a" stroke-width={Math.max(1.4, size * 0.06)} stroke-linecap="round" />
  <text class="tag-text" font-size={size} text-anchor={anchor} fill="var(--tag-ink)" dominant-baseline="central">{text}</text>
</g>
