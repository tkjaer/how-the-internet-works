<svelte:options namespace="svg" />
<script lang="ts">
  import type { LabelProps } from '../../../core/theme-types';
  let { x, y, text, size, kind, colour, anchor = 'middle' }: LabelProps = $props();
  const fill = $derived(kind === 'link' ? 'var(--link-label-ink)' : (colour ?? undefined));
  const stroke = $derived(kind === 'link' ? 'var(--link-label-halo)' : undefined);
  const strokeWidth = $derived(kind === 'link' ? 'var(--link-label-halo-w)' : undefined);
</script>

<text class="lbl lbl-{kind} paper-label" {x} {y} font-size={size} text-anchor={anchor}
  style:fill={fill} style:stroke={stroke} style:stroke-width={strokeWidth}>{text}</text>
