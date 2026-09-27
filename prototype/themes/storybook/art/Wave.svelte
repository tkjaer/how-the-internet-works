<svelte:options namespace="svg" />
<script lang="ts">
  import type { WaveProps } from '../../../core/theme-types';
  let { d, time }: WaveProps = $props();
</script>

<g class="storybook-wave">
  <path {d} fill="none" stroke="#6b3f2a" stroke-width="23" stroke-linecap="round" stroke-linejoin="round" />
  <path {d} fill="none" stroke="#f28f5b" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" />
  <path {d} fill="none" stroke="#72b8a5" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="36 22" stroke-dashoffset={-time * 42} />
  <path {d} fill="none" stroke="#fff7df" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
</g>
