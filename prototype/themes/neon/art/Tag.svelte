<svelte:options namespace="svg" />
<script lang="ts">
  import type { TagProps } from '../../../core/theme-types';
  import { textBox } from '../../../core/svg';
  let { x, y, text, size, anchor }: TagProps = $props();
  const b = $derived(textBox(text, size, anchor, 0.6));
  const padX = $derived(size * 0.72);
  const w = $derived(b.w + padX * 2);
  const h = $derived(size * 1.62);
  const bx = $derived(b.x - padX);
  const by = $derived(-size * 1.12);
  const lead = $derived(anchor === 'start' ? -1 : anchor === 'end' ? 1 : 0);
</script>

<g class="tag" transform="translate({x} {y})">
  {#if lead !== 0}<path class="leader" d="M{lead * -10} {-size * 0.28}H{lead * -34}L{lead * -52} {-size * 0.78}" />{/if}
  <rect class="glow" x={bx} y={by} width={w} height={h} />
  <path class="box" d="M{bx + 9} {by}H{bx + w - 9}L{bx + w} {by + 9}V{by + h - 9}L{bx + w - 9} {by + h}H{bx + 9}L{bx} {by + h - 9}V{by + 9}Z" />
  <path class="notch" d="M{bx - size * 0.22} {by + h * 0.5}H{bx + size * 0.16}M{bx + w - size * 0.16} {by + h * 0.5}H{bx + w + size * 0.22}" />
  <text class="tag-text" font-size={size} text-anchor={anchor} fill="var(--tag-ink, #79fbff)">{text}</text>
</g>

<style>
  .glow { fill: none; stroke: var(--tag-edge, #3ef0ff); stroke-width: 0.45em; opacity: 0.08; }
  .box { fill: var(--tag-bg, rgba(2,8,22,.88)); stroke: var(--tag-edge, #3ef0ff); stroke-width: 0.09em; stroke-linejoin: miter; }
  .leader, .notch { fill: none; stroke: var(--tag-edge, #3ef0ff); stroke-width: 0.08em; stroke-linecap: square; opacity: 0.72; }
</style>
