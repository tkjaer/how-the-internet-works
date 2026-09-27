<svelte:options namespace="svg" />
<script lang="ts">
  import type { LabelProps } from '../../../core/theme-types';
  let { x, y, text, size, kind, colour, anchor = 'middle' }: LabelProps = $props();
</script>

<text class="lbl lbl-{kind}" class:linkish={kind === 'link'} {x} {y} font-size={size} text-anchor={anchor} style:fill={colour}>{text}</text>
