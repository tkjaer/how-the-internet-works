<svelte:options namespace="svg" />
<script lang="ts">
  import type { TagProps } from '../../core/theme-types';
  import { textBox } from '../../core/svg';
  let { x, y, text, size, anchor }: TagProps = $props();
  const b = $derived(textBox(text, size, anchor, 0.6));
</script>

<g class="tag" transform="translate({x} {y})">
  <rect x={b.x - size * 0.5} y={-size * 0.95} width={b.w + size} height={size * 1.5} rx={size * 0.3} fill="var(--tag-bg, #000)" stroke="var(--tag-edge, #fff)" stroke-width={size * 0.08} />
  <text class="tag-text" font-size={size} text-anchor={anchor} fill="var(--tag-ink, #fff)">{text}</text>
</g>
