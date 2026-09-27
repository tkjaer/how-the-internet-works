<svelte:options namespace="svg" />
<script lang="ts">
  import type { FibreProps } from '../../../core/theme-types';
  let { x0, x1, y, coreH, cladH }: FibreProps = $props();
</script>

<rect x={x0 + 10} y={y - cladH / 2 + 12} width={x1 - x0} height={cladH} rx={cladH / 2} fill="var(--paper-shadow)" opacity=".34" />
<rect x={x0} y={y - cladH / 2} width={x1 - x0} height={cladH} rx={cladH / 2} fill="var(--cladding)" stroke="var(--cladding-edge)" stroke-width="5" />
<path d={`M${x0 + 36} ${y - cladH * .23} C${x0 + 260} ${y - cladH*.34} ${x1 - 320} ${y - cladH*.1} ${x1 - 40} ${y - cladH*.22}`} fill="none" stroke="var(--clad-highlight)" stroke-width="8" opacity=".55" />
<rect x={x0 + 20} y={y - coreH / 2} width={x1 - x0 - 40} height={coreH} rx={coreH / 2} fill="var(--core)" stroke="var(--core-edge)" stroke-width="4" />
<rect x={x0 + 42} y={y - coreH / 2 + coreH * .36} width={x1 - x0 - 84} height={coreH * .18} rx={coreH * .09} fill="var(--core-centre)" opacity=".75" />
