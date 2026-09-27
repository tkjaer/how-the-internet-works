<svelte:options namespace="svg" />
<script lang="ts">
  import type { FibreProps } from '../../../core/theme-types';
  let { x0, x1, y, coreH, cladH, time }: FibreProps = $props();
  const off = $derived(-(time * 180));
</script>

<rect x={x0} y={y - cladH / 2} width={x1 - x0} height={cladH} rx={cladH / 2} fill="rgba(4,12,32,.62)" stroke="#2d7ca0" stroke-width="5" opacity="0.82" />
<rect x={x0} y={y - cladH / 2} width={x1 - x0} height={cladH} rx={cladH / 2} fill="url(#neon-panel-grid)" opacity="0.28" />
<rect x={x0} y={y - coreH / 2} width={x1 - x0} height={coreH} rx={coreH / 2} fill="url(#neon-fibre-core)" stroke="#3ef0ff" stroke-width="4" opacity="0.88" />
<line x1={x0 + 20} y1={y} x2={x1 - 20} y2={y} stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-dasharray="80 180" stroke-dashoffset={off} opacity="0.52" />
<line x1={x0 + 20} y1={y - coreH / 2 + 13} x2={x1 - 20} y2={y - coreH / 2 + 13} stroke="#93fbff" stroke-width="2" opacity="0.35" />
<line x1={x0 + 20} y1={y + coreH / 2 - 13} x2={x1 - 20} y2={y + coreH / 2 - 13} stroke="#93fbff" stroke-width="2" opacity="0.35" />
