<svelte:options namespace="svg" />
<script lang="ts">
  import type { FibreProps } from '../../core/theme-types';
  let { x0, x1, y, coreH, cladH }: FibreProps = $props();
</script>

<rect x={x0} y={y - cladH / 2} width={x1 - x0} height={cladH} rx={cladH / 2} fill="var(--cladding, rgba(169,184,255,.1))" stroke="var(--cladding-edge, rgba(169,184,255,.45))" stroke-width="4" />
<rect x={x0} y={y - coreH / 2} width={x1 - x0} height={coreH} rx={coreH / 2} fill="var(--core, rgba(255,255,255,.06))" stroke="var(--core-edge, rgba(255,255,255,.4))" stroke-width="3" />
