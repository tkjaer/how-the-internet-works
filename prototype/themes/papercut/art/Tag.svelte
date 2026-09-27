<svelte:options namespace="svg" />
<script lang="ts">
  import type { TagProps } from '../../../core/theme-types';
  import { textBox } from '../../../core/svg';
  let { x, y, text, size, anchor }: TagProps = $props();
  const b = $derived(textBox(text, size, anchor, 0.6));
  const padX = $derived(size * 0.65);
  const W = $derived(b.w + padX * 2);
  const H = $derived(size * 1.55);
  const X = $derived(b.x - padX);
  const Y = $derived(-size * 1.02);
</script>

<g class="tag" transform="translate({x} {y})">
  <path class="tag-shadow" d={`M${X} ${Y} L${X + W - size*.42} ${Y - size*.06} L${X + W} ${Y + size*.38} L${X + W - size*.08} ${Y + H} L${X + size*.12} ${Y + H + size*.05} L${X - size*.06} ${Y + size*.18} Z`} />
  <path class="tag-paper" d={`M${X} ${Y} L${X + W - size*.42} ${Y - size*.06} L${X + W} ${Y + size*.38} L${X + W - size*.08} ${Y + H} L${X + size*.12} ${Y + H + size*.05} L${X - size*.06} ${Y + size*.18} Z`} />
  <path class="peel" d={`M${X + W - size*.42} ${Y - size*.06} L${X + W} ${Y + size*.38} L${X + W - size*.48} ${Y + size*.45} Z`} />
  <rect class="tape" x={X + W * 0.44} y={Y - size * 0.33} width={size * 1.3} height={size * 0.36} rx={size * .08} transform={`rotate(-5 ${X + W * 0.44} ${Y - size * 0.33})`} />
  <text class="tag-text" font-size={size} text-anchor={anchor} fill="var(--tag-ink)" y={size * .08}>{text}</text>
</g>

<style>
  .tag-shadow { fill: var(--paper-shadow); transform: translate(5px, 6px); opacity: .36; }
  .tag-paper { fill: var(--tag-bg); stroke: var(--tag-edge); stroke-width: 2.5; stroke-linejoin: round; }
  .peel { fill: var(--tag-peel); stroke: var(--tag-edge); stroke-width: 1.6; stroke-linejoin: round; }
  .tape { fill: var(--tape); opacity: .72; }
</style>
