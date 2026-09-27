<svelte:options namespace="svg" />
<script lang="ts">
  import type { WaveProps } from '../../../core/theme-types';
  let { d, time }: WaveProps = $props();
  const off = $derived(-(time * 90));
</script>

<g class="scope-wave">
  <path {d} fill="none" stroke="#3ef0ff" stroke-width="28" stroke-linejoin="round" stroke-linecap="round" opacity="0.09" />
  <path {d} fill="none" stroke="#3ef0ff" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" opacity="0.88" />
  <path {d} fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="42 120" stroke-dashoffset={off} opacity="0.85" />
</g>
