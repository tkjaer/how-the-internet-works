<svelte:options namespace="svg" />
<script lang="ts">
  import type { WaveProps } from '../../core/theme-types';
  let { d }: WaveProps = $props();
</script>

<path {d} fill="none" stroke="var(--wave, #3ef0ff)" stroke-width="7" stroke-linejoin="round" />
